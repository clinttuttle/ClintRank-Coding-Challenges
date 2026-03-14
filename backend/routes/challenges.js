import { Router } from 'express'
import pool from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, difficulty, language, max_score, success_rate, created_at FROM challenges ORDER BY created_at DESC'
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM challenges WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    const row = rows[0]
    res.json({ ...row, description: JSON.parse(row.description), test_cases: JSON.parse(row.test_cases) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, difficulty, language, description, function_name, starter_code, test_cases, max_score, success_rate } = req.body
    const { rows } = await pool.query(
      `INSERT INTO challenges (title, difficulty, language, description, function_name, starter_code, test_cases, max_score, success_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, difficulty, language, JSON.stringify(description), function_name, starter_code, JSON.stringify(test_cases), max_score ?? 100, success_rate ?? 0]
    )
    const created = rows[0]
    res.status(201).json({ ...created, description: JSON.parse(created.description), test_cases: JSON.parse(created.test_cases) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { title, difficulty, language, description, function_name, starter_code, test_cases, max_score, success_rate } = req.body
    const { rows: existing } = await pool.query('SELECT id FROM challenges WHERE id = $1', [req.params.id])
    if (!existing[0]) return res.status(404).json({ error: 'Not found' })
    const { rows } = await pool.query(
      `UPDATE challenges SET title=$1, difficulty=$2, language=$3, description=$4, function_name=$5,
       starter_code=$6, test_cases=$7, max_score=$8, success_rate=$9 WHERE id=$10 RETURNING *`,
      [title, difficulty, language, JSON.stringify(description), function_name, starter_code, JSON.stringify(test_cases), max_score, success_rate, req.params.id]
    )
    const updated = rows[0]
    res.json({ ...updated, description: JSON.parse(updated.description), test_cases: JSON.parse(updated.test_cases) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM challenges WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    await pool.query('DELETE FROM challenges WHERE id = $1', [req.params.id])
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
