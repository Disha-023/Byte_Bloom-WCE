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

  // Step 1: Explicit connectivity test
  try {
    await query('SELECT 1');
  } catch (err) {
    const maskedUrl = getMaskedDatabaseUrl();
    if (err.code === '28P01') {
      console.error(`[PostgreSQL Auth Error] Code 28P01: Password authentication failed for user at ${maskedUrl}.`);
      console.error(`[PostgreSQL Action] Please configure the correct PostgreSQL credentials in server/.env using DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>.`);
    } else if (err.code === '3D000') {
      console.error(`[PostgreSQL Config Error] Code 3D000: Target database does not exist at ${maskedUrl}.`);
      console.error(`[PostgreSQL Action] Please create the database or verify the database name in server/.env DATABASE_URL.`);
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`[PostgreSQL Network Error] Connection refused at ${maskedUrl}.`);
      console.error(`[PostgreSQL Action] Please verify that the PostgreSQL service is running on the configured host and port.`);
    } else {
      console.error(`[PostgreSQL Connection Error] ${err.message} (Target: ${maskedUrl})`);
    }
    throw err;
  }

  // Step 2: Schema initialization
  try {
    await query(createTableQuery);
    console.log('[PostgreSQL] Complaints table and indexes verified.');
  } catch (err) {
    console.error('[PostgreSQL Schema Error] Failed to initialize complaints table or indexes:', err.message);
    throw err;
  }
};

/**
 * Returns a database connection URL with the password masked for safe logging.
 * @param {string} [url]
 * @returns {string}
 */
export const getMaskedDatabaseUrl = (url = config.databaseUrl) => {
  try {
    const cleanUrl = url.replace(/^postgresql\+psycopg:\/\//, 'postgresql://');
    const parsed = new URL(cleanUrl);
    if (parsed.password) {
      parsed.password = '******';
    }
    return parsed.toString();
  } catch {
    return 'postgresql://***@***/***';
  }
};

/**
 * Checks PostgreSQL connection status and returns structured diagnostic information.
 * @returns {Promise<{ connected: boolean, code?: string, reason?: string, message?: string }>}
 */
export const checkDbHealth = async () => {
  try {
    await query('SELECT 1');
    return { connected: true, error: null };
  } catch (err) {
    let reason = 'Connection error';
    if (err.code === '28P01') {
      reason = 'Authentication failed (verify username and password in server/.env)';
    } else if (err.code === '3D000') {
      reason = 'Database does not exist (verify target database name in server/.env)';
    } else if (err.code === 'ECONNREFUSED') {
      reason = 'Connection refused (verify PostgreSQL service is running on the configured port)';
    } else if (err.code === 'ENOTFOUND') {
      reason = 'Host not found (verify host in server/.env)';
    }
    return {
      connected: false,
      code: err.code || null,
      reason,
      message: err.message || 'Database unavailable'
    };
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
  checkDbHealth,
  getMaskedDatabaseUrl,
  setMockQueryHandler,
  resetMockQueryHandler,
  closePool
};

