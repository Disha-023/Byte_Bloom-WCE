import pg from 'pg';
import { config } from './index.js';

// Sanitize connection string in case it starts with SQLAlchemy psycopg format
const sanitizedUrl = config.databaseUrl.replace(/^postgresql\+psycopg:\/\//, 'postgresql://');

export const pool = new pg.Pool({
  connectionString: sanitizedUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

// Mock query runner hook for isolated unit/integration testing
let mockQueryHandler = null;

export const setMockQueryHandler = (handler) => {
  mockQueryHandler = handler;
};

export const resetMockQueryHandler = () => {
  mockQueryHandler = null;
};

/**
 * Executes a SQL query with parameter binding.
 * @param {string} text - SQL statement
 * @param {Array} [params] - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params) => {
  if (mockQueryHandler) {
    return mockQueryHandler(text, params);
  }
  return pool.query(text, params);
};

/**
 * Initializes database schema by creating the complaints table and indexes if not exists.
 */
export const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      complaint_id VARCHAR(32) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      citizen_severity VARCHAR(50) NOT NULL,
      address TEXT NOT NULL,
      additional_location TEXT,
      latitude NUMERIC(10, 6),
      longitude NUMERIC(10, 6),
      image_url TEXT,
      status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
      ai_analysis_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
      issue_type VARCHAR(100),
      ai_severity VARCHAR(50),
      priority VARCHAR(50),
      department VARCHAR(100),
      sla_hours INTEGER,
      ai_confidence NUMERIC(4, 2),
      evidence_summary TEXT,
      suggested_action VARCHAR(100),
      ai_reason TEXT,
      image_analyzed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_complaint_id ON complaints(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
  `;

  try {
    await query(createTableQuery);
    console.log('[PostgreSQL] Complaints table and indexes verified.');
  } catch (err) {
    console.warn('[PostgreSQL] Table initialization warning (verify DATABASE_URL):', err.message);
  }
};

export const closePool = async () => {
  try {
    await pool.end();
  } catch (err) {
    // Ignore if already closed
  }
};

export default {
  pool,
  query,
  initDb,
  setMockQueryHandler,
  resetMockQueryHandler,
  closePool
};
