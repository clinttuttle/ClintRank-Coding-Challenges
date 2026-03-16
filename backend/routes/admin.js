import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { User, Challenge, TestCase, UserChallengeProgress } from '../models/index.js'
import { authenticateToken } from '../middleware/authenticateToken.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()
router.use(authenticateToken)
router.use(requireRole('faculty'))

// ── Students ───────────────────────────────────────────────────────────────

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'username', 'email', 'lastLogin', 'createdAt'],
      order: [['username', 'ASC']],
    })
    res.json(students)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/admin/students/:id/progress
router.get('/students/:id/progress', async (req, res) => {
  try {
    const student = await User.findOne({
      where: { id: req.params.id, role: 'student' },
      attributes: ['id', 'username', 'email'],
    })
    if (!student) return res.status(404).json({ error: 'Student not found' })

    const totalChallenges = await Challenge.count({ where: { isActive: true } })
    const progressRows = await UserChallengeProgress.findAll({
      where: { userId: student.id },
      include: [{ model: Challenge, attributes: ['id', 'title', 'displayOrder'] }],
    })

    const not_started = totalChallenges - progressRows.length
    const in_progress = progressRows.filter(p => p.status === 'in_progress').length
    const complete = progressRows.filter(p => p.status === 'complete').length
    const percent_complete = totalChallenges > 0 ? Math.round((complete / totalChallenges) * 100) : 0

    res.json({
      student,
      summary: { total: totalChallenges, not_started, in_progress, complete, percent_complete },
      challenges: progressRows,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Dashboard ──────────────────────────────────────────────────────────────

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const total_students = await User.count({ where: { role: 'student' } })
    const total_challenges = await Challenge.count({ where: { isActive: true } })

    const allProgress = await UserChallengeProgress.findAll()
    const overall_in_progress = allProgress.filter(p => p.status === 'in_progress').length
    const overall_complete = allProgress.filter(p => p.status === 'complete').length
    const overall_not_started = (total_students * total_challenges) - allProgress.length

    res.json({
      total_students,
      total_challenges,
      overall_not_started: Math.max(0, overall_not_started),
      overall_in_progress,
      overall_complete,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Challenge Management ───────────────────────────────────────────────────

// GET /api/admin/challenges — list all (including inactive)
router.get('/challenges', async (req, res) => {
  try {
    const challenges = await Challenge.findAll({
      order: [['display_order', 'ASC']],
      include: [{ model: TestCase, attributes: ['id'] }],
    })
    res.json(challenges.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      starterCode: c.starterCode,
      displayOrder: c.displayOrder,
      isActive: c.isActive,
      testCaseCount: c.TestCases.length,
      createdAt: c.createdAt,
    })))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const challengeValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('starterCode').notEmpty().withMessage('Starter code is required'),
]

// POST /api/admin/challenges
router.post('/challenges', challengeValidators, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() })

  try {
    const { title, description, starterCode, displayOrder, isActive } = req.body
    const challenge = await Challenge.create({ title, description, starterCode, displayOrder: displayOrder ?? 0, isActive: isActive ?? true })
    res.status(201).json(challenge)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/admin/challenges/:id
router.put('/challenges/:id', challengeValidators, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() })

  try {
    const challenge = await Challenge.findByPk(req.params.id)
    if (!challenge) return res.status(404).json({ error: 'Not found' })
    const { title, description, starterCode, displayOrder, isActive } = req.body
    await challenge.update({ title, description, starterCode, displayOrder, isActive })
    res.json(challenge)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/admin/challenges/:id — soft delete
router.delete('/challenges/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findByPk(req.params.id)
    if (!challenge) return res.status(404).json({ error: 'Not found' })
    await challenge.update({ isActive: false })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Test Cases ─────────────────────────────────────────────────────────────

// GET /api/admin/challenges/:id/tests
router.get('/challenges/:id/tests', async (req, res) => {
  try {
    const tests = await TestCase.findAll({
      where: { challengeId: req.params.id },
      order: [['display_order', 'ASC']],
    })
    res.json(tests)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const testCaseValidators = [
  body('input').notEmpty().withMessage('Input is required'),
  body('expectedOutput').notEmpty().withMessage('Expected output is required'),
]

// POST /api/admin/challenges/:id/tests
router.post('/challenges/:id/tests', testCaseValidators, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() })

  try {
    const { input, expectedOutput, displayOrder, isHidden } = req.body
    const tc = await TestCase.create({
      challengeId: req.params.id,
      input,
      expectedOutput,
      displayOrder: displayOrder ?? 0,
      isHidden: isHidden ?? false,
    })
    res.status(201).json(tc)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/admin/challenges/:id/tests/:tid
router.put('/challenges/:id/tests/:tid', testCaseValidators, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() })

  try {
    const tc = await TestCase.findOne({ where: { id: req.params.tid, challengeId: req.params.id } })
    if (!tc) return res.status(404).json({ error: 'Not found' })
    const { input, expectedOutput, displayOrder, isHidden } = req.body
    await tc.update({ input, expectedOutput, displayOrder, isHidden })
    res.json(tc)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/admin/challenges/:id/tests/:tid
router.delete('/challenges/:id/tests/:tid', async (req, res) => {
  try {
    const tc = await TestCase.findOne({ where: { id: req.params.tid, challengeId: req.params.id } })
    if (!tc) return res.status(404).json({ error: 'Not found' })
    await tc.destroy()
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
