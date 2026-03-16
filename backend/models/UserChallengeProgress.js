import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const UserChallengeProgress = sequelize.define('UserChallengeProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  challengeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'challenge_id',
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'complete'),
    defaultValue: 'not_started',
  },
  currentCode: {
    type: DataTypes.TEXT,
    field: 'current_code',
  },
  submittedCode: {
    type: DataTypes.TEXT,
    field: 'submitted_code',
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at',
  },
}, {
  tableName: 'cr_user_challenge_progress',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['user_id', 'challenge_id'] },
  ],
})

export default UserChallengeProgress
