import sequelize from '../config/database.js'
import User from './User.js'
import Challenge from './Challenge.js'
import TestCase from './TestCase.js'
import UserChallengeProgress from './UserChallengeProgress.js'

// Associations
User.hasMany(UserChallengeProgress, { foreignKey: 'user_id' })
Challenge.hasMany(UserChallengeProgress, { foreignKey: 'challenge_id' })
Challenge.hasMany(TestCase, { foreignKey: 'challenge_id', onDelete: 'CASCADE' })
UserChallengeProgress.belongsTo(User, { foreignKey: 'user_id' })
UserChallengeProgress.belongsTo(Challenge, { foreignKey: 'challenge_id' })
TestCase.belongsTo(Challenge, { foreignKey: 'challenge_id' })

export { sequelize, User, Challenge, TestCase, UserChallengeProgress }
