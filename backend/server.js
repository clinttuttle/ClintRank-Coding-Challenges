import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import challengesRouter from './routes/challenges.js'
import { seed } from './db.js'

const app = express()
app.use(cors());
// app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CodeCraft backend is running',
    endpoints: ['/api/auth/login', '/api/challenges', '/health'],
  })
})

app.get('/health', (req, res) => {
  res.status(200).send('ok')
})

app.use('/api/auth', authRouter)
app.use('/api/challenges', challengesRouter)

const PORT = process.env.PORT || 3001

app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`)
  try {
    await seed()
  } catch (e) {
    console.error('Seed error:', e.message)
  }
})
