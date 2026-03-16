import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.ENUM('student', 'faculty'),
    allowNull: false,
    defaultValue: 'student',
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login',
  },
}, {
  tableName: 'users',
  timestamps: true,
})

// Never return passwordHash in JSON responses
User.prototype.toJSON = function () {
  const values = { ...this.get() }
  delete values.passwordHash
  delete values.password_hash
  return values
}

export default User
