import { Sequelize } from 'sequelize'
import 'dotenv/config'

const sequelize = new Sequelize(
  process.env.DB_NAME || process.env.PGDATABASE || 'postgres',
  process.env.DB_USER || process.env.PGUSER || 'postgres',
  process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  {
    host:     process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port:     Number(process.env.DB_PORT || process.env.PGPORT || 5432),
    dialect:  'postgres',
    logging:  process.env.NODE_ENV === 'development' ? false : false,
    define: {
      schema: process.env.DB_SCHEMA || 'codecraftapp',
      underscored: false,
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' || process.env.PGHOST
        ? { rejectUnauthorized: false }
        : false,
      options: `-c search_path=${process.env.DB_SCHEMA || 'codecraftapp'}`,
    },
  }
)

export async function connectDB() {
  try {
    await sequelize.authenticate()
    console.log('Database connection established.')

    // Warn if JWT_SECRET is too short
    const secret = process.env.JWT_SECRET || ''
    if (secret.length < 32) {
      console.warn('WARNING: JWT_SECRET is less than 32 characters — use a longer secret in production!')
    }
  } catch (err) {
    console.error('Unable to connect to the database:', err.message)
  }
}

export default sequelize
