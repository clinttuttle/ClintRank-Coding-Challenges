import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { User } from '../models/index.js'

const router = Router()

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
}

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )
}

// POST /api/auth/register
router.post('/register', [
  body('username')
    .trim()
    .matches(/^[a-zA-Z0-9_]{3,30}$/)
    .withMessage('Username must be 3–30 alphanumeric characters or underscores'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() })

  const { username, email, password } = req.body
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ username, email, passwordHash, role: 'student' })
    const token = signToken(user)
    res.cookie('token', token, COOKIE_OPTS)
    res.status(201).json({ token, user })
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Username or email already taken' })
    }
    res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() })

  const { email, password } = req.body
  try {
    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    await user.update({ lastLogin: new Date() })
    const token = signToken(user)
    res.cookie('token', token, COOKIE_OPTS)
    res.json({ token, user })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' })
  res.json({ success: true })
})

// GET /api/auth/me — validate cookie/token and return user
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) token = req.cookies?.token || null
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(payload.userId, {
      attributes: ['id', 'username', 'email', 'role', 'lastLogin', 'createdAt'],
    })
    if (!user) return res.status(401).json({ error: 'User not found' })
    res.json({ user, token })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
