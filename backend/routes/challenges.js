import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { Op } from 'sequelize'
import { Challenge, TestCase, UserChallengeProgress } from '../models/index.js'
import { authenticateToken } from '../middleware/authenticateToken.js'

const router = Router()

// All student challenge routes require auth
router.use(authenticateToken)

// GET /api/challenges — list active challenges with user progress
router.get('/', async (req, res) => {
  try {
    const challenges = await Challenge.findAll({
      where: { isActive: true },
      order: [['display_order', 'ASC']],
      include: [{ model: TestCase, where: { isHidden: false }, required: false }],
    })

    // Fetch this user's progress
    const progressRows = await UserChallengeProgress.findAll({
      where: { userId: req.user.userId },
    })
    const progressMap = {}
    for (const p of progressRows) progressMap[p.challengeId] = p.status

    const list = challenges.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      displayOrder: c.displayOrder,
      status: progressMap[c.id] || 'not_started',
    }))

    const total = list.length
    const not_started = list.filter(c => c.status === 'not_started').length
    const in_progress = list.filter(c => c.status === 'in_progress').length
    const complete = list.filter(c => c.status === 'complete').length
    const percent_complete = total > 0 ? Math.round((complete / total) * 100) : 0

    res.json({ summary: { total, not_started, in_progress, complete, percent_complete }, challenges: list })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/challenges/:id — single challenge with visible test cases
router.get('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      where: { id: req.params.id, isActive: true },
      include: [{ model: TestCase, where: { isHidden: false }, required: false, order: [['display_order', 'ASC']] }],
    })
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' })

    // Get user's current code
    const progress = await UserChallengeProgress.findOne({
      where: { userId: req.user.userId, challengeId: challenge.id },
    })

    res.json({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      starterCode: challenge.starterCode,
      displayOrder: challenge.displayOrder,
      testCases: challenge.TestCases.map(tc => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        displayOrder: tc.displayOrder,
      })),
      progress: progress ? {
        status: progress.status,
        currentCode: progress.currentCode,
        attempts: progress.attempts,
        completedAt: progress.completedAt,
      } : null,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/challenges/:id/run — record attempt, save current code
router.post('/:id/run', [
  body('code').notEmpty().withMessage('Code is required'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() })

  try {
    const challenge = await Challenge.findOne({ where: { id: req.params.id, isActive: true } })
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' })

    const { code } = req.body
    const [progress] = await UserChallengeProgress.findOrCreate({
      where: { userId: req.user.userId, challengeId: challenge.id },
      defaults: { status: 'in_progress', currentCode: code, attempts: 1 },
    })

    if (progress.status !== 'complete') {
      await progress.update({
        status: 'in_progress',
        currentCode: code,
        attempts: progress.attempts + 1,
      })
    } else {
      // Already complete — just save current code
      await progress.update({ currentCode: code })
    }

    res.json({ recorded: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/challenges/:id/submit
// TODO v2: Add proper sandboxed server-side code verification (Docker/VM)
router.post('/:id/submit', [
  body('code').notEmpty().withMessage('Code is required'),
  body('allTestsPassed').isBoolean().withMessage('allTestsPassed must be boolean'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() })

  try {
    const challenge = await Challenge.findOne({ where: { id: req.params.id, isActive: true } })
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' })

    if (!req.body.allTestsPassed) {
      return res.status(400).json({ error: 'All test cases must pass before submitting' })
    }

    const [progress] = await UserChallengeProgress.findOrCreate({
      where: { userId: req.user.userId, challengeId: challenge.id },
      defaults: {
        status: 'complete',
        submittedCode: req.body.code,
        currentCode: req.body.code,
        completedAt: new Date(),
        attempts: 1,
      },
    })

    if (progress.status === 'complete') {
      return res.json({ success: true, message: 'Already completed!', alreadyComplete: true })
    }

    await progress.update({
      status: 'complete',
      submittedCode: req.body.code,
      currentCode: req.body.code,
      completedAt: new Date(),
    })

    res.json({ success: true, message: 'Challenge complete!' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/progress — current user's progress across all challenges
router.get('/me/progress', async (req, res) => {
  try {
    const progress = await UserChallengeProgress.findAll({
      where: { userId: req.user.userId },
      include: [{ model: Challenge, attributes: ['id', 'title', 'displayOrder'] }],
    })
    res.json(progress)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
