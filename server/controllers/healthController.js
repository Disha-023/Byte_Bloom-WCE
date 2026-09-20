/**
 * Health check controller
 * Returns status indicating the server is alive and operational.
 */
export const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Smart Civic Issue Resolution Agent API is running',
    timestamp: new Date().toISOString()
  });
};
