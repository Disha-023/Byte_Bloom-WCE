import { checkDbHealth } from '../config/db.js';

/**
 * Health check controller
 * Accurately reports server and database operational readiness.
 */
export const getHealthStatus = async (req, res) => {
  const dbHealth = await checkDbHealth();

  if (!dbHealth.connected) {
    return res.status(503).json({
      status: 'degraded',
      message: 'Smart Civic Server is running but database is disconnected',
      database: {
        status: 'disconnected',
        code: dbHealth.code,
        reason: dbHealth.reason
      },
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json({
    status: 'ok',
    message: 'Smart Civic Issue Resolution Agent API is running and database is connected',
    database: {
      status: 'connected'
    },
    timestamp: new Date().toISOString()
  });
};

