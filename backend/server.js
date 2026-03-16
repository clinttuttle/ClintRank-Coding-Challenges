import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { connectDB } from './config/database.js'
import { sequelize } from './models/index.js'
import { runSeeders } from './seeders/index.js'
import authRouter from './routes/auth.js'
import challengesRouter from './routes/challenges.js'
import adminRouter from './routes/admin.js'

const app = express()

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}))

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL].filter(Boolean)

app.use(cors()); 

// app.use(cors({
//   origin: (origin, cb) => {
//     if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
//     cb(new Error('Not allowed by CORS'))
//   },
//   credentials: true,
// }))

// ── Rate limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false })
const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

app.use(globalLimiter)

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }))
app.use(cookieParser())

// ── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'))

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ClintRank backend is running' })
})

app.get('/health', (req, res) => res.status(200).send('ok'))

app.use('/api/auth', authLimiter, authRouter)
app.use('/api/challenges', challengesRouter)
app.use('/api/challenges/:id/submit', submitLimiter)
app.use('/api/admin', adminRouter)

// TODO: Password reset flow (out of scope for MVP — requires nodemailer)

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' })
  } else {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001

async function start() {
  await connectDB()

  // Sync models in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      await sequelize.sync({ alter: true })
      console.log('Database schema synced.')
    } catch (e) {
      console.error('Schema sync error:', e.message)
    }
  }

  try {
    await runSeeders()
  } catch (e) {
    console.error('Seeder error:', e.message)
  }

  app.listen(PORT, () => {
    console.log(`ClintRank backend running on http://localhost:${PORT}`)
  })
}

start()
