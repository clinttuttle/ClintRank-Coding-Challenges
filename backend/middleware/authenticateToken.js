import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

export async function authenticateToken(req, res, next) {
  // Check Authorization header first, then cookie
  const authHeader = req.headers.authorization
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) token = req.cookies?.token || null

  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Re-fetch role from DB to prevent stale role escalation
    const user = await User.findByPk(payload.userId, {
      attributes: ['id', 'username', 'email', 'role'],
    })
    if (!user) return res.status(401).json({ error: 'User not found' })

    req.user = { userId: user.id, username: user.username, email: user.email, role: user.role }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
