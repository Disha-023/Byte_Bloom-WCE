import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Civic Issue Resolution Agent Backend API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`[Smart Civic Server] Server running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`[Smart Civic Server] Health check available at: http://localhost:${config.port}/api/health`);
});

export default app;
