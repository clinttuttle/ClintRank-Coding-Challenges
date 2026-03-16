import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const TestCase = sequelize.define('TestCase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  challengeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'challenge_id',
  },
  input: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expectedOutput: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'expected_output',
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'display_order',
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_hidden',
  },
}, {
  tableName: 'cr_test_cases',
  timestamps: false,
})

export default TestCase
