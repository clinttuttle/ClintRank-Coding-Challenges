import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  host:     process.env.PGHOST,
  user:     process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'postgres',
  port:     Number(process.env.PGPORT) || 5432,
  ssl:      { rejectUnauthorized: false },
  options:  '-c search_path=codecraftapp',
})

function fizzBuzzExpected(n) {
  return Array.from({ length: n }, (_, i) => {
    const v = i + 1
    return v % 15 === 0 ? 'FizzBuzz' : v % 3 === 0 ? 'Fizz' : v % 5 === 0 ? 'Buzz' : String(v)
  })
}

export async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*) AS n FROM challenges')
  if (Number(rows[0].n) === 0) {
    await pool.query(
      `INSERT INTO challenges (title, difficulty, language, description, function_name, starter_code, test_cases, max_score, success_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        'FizzBuzz',
        'Easy',
        'JavaScript',
        JSON.stringify({
          statement: 'Given a number n, for each integer i in the range from 1 to n inclusive, print one value per line:\n- If i is a multiple of both 3 and 5, print FizzBuzz.\n- If i is a multiple of 3 (but not 5), print Fizz.\n- If i is a multiple of 5 (but not 3), print Buzz.\n- Otherwise, print the value of i.',
          functionDescription: 'Complete the fizzBuzz function. It has the following parameter:\n- int n — the upper bound of the range to test\n\nUse console.log() to print each output value on its own line.',
          constraints: ['1 ≤ n ≤ 2 × 10⁵'],
        }),
        'fizzBuzz',
        `function fizzBuzz(n) {\n  // Write your solution here\n  // Use console.log() to print each value\n\n}`,
        JSON.stringify([
          { input: 15, label: 'Sample Test Case 0', sample: true,  expected: fizzBuzzExpected(15) },
          { input: 5,  label: 'Sample Test Case 1', sample: true,  expected: fizzBuzzExpected(5)  },
          { input: 20, label: 'Hidden Test Case 0', sample: false, expected: fizzBuzzExpected(20) },
          { input: 1,  label: 'Hidden Test Case 1', sample: false, expected: fizzBuzzExpected(1)  },
        ]),
        20,
        97.3,
      ]
    )
    console.log('Seeded FizzBuzz challenge.')
  }
}

export default pool
