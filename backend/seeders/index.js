import bcrypt from 'bcryptjs'
import { User, Challenge, TestCase } from '../models/index.js'

export async function runSeeders() {
  // Seed faculty admin account
  const existing = await User.findOne({ where: { email: 'admin@clintrank.com' } })
  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin1234!', 12)
    await User.create({
      username: 'admin',
      email: 'admin@clintrank.com',
      passwordHash,
      role: 'faculty',
    })
    console.log('Seeded admin faculty account: admin@clintrank.com / Admin1234!')
  }

  // Seed sample challenges
  const challengeCount = await Challenge.count()
  if (challengeCount === 0) {
    const c1 = await Challenge.create({
      title: 'Return the Sum',
      description: 'Write a function called `add` that takes two numbers as arguments and returns their sum.\n\nExample: add(2, 3) → 5',
      starterCode: 'function add(a, b) {\n  // Write your solution here\n}',
      displayOrder: 1,
      isActive: true,
    })
    await TestCase.bulkCreate([
      { challengeId: c1.id, input: '[2, 3]', expectedOutput: '5', displayOrder: 0, isHidden: false },
      { challengeId: c1.id, input: '[0, 0]', expectedOutput: '0', displayOrder: 1, isHidden: false },
      { challengeId: c1.id, input: '[-1, 5]', expectedOutput: '4', displayOrder: 2, isHidden: true },
    ])

    const c2 = await Challenge.create({
      title: 'Reverse a String',
      description: 'Write a function called `reverseString` that takes a string as an argument and returns the string reversed.\n\nExample: reverseString("hello") → "olleh"',
      starterCode: 'function reverseString(str) {\n  // Write your solution here\n}',
      displayOrder: 2,
      isActive: true,
    })
    await TestCase.bulkCreate([
      { challengeId: c2.id, input: '"hello"', expectedOutput: '"olleh"', displayOrder: 0, isHidden: false },
      { challengeId: c2.id, input: '"JavaScript"', expectedOutput: '"tpircSavaJ"', displayOrder: 1, isHidden: false },
      { challengeId: c2.id, input: '""', expectedOutput: '""', displayOrder: 2, isHidden: true },
    ])

    console.log('Seeded 2 sample challenges.')
  }
}
