import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { initDb } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration supporting development Vite client
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded complaint images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/complaints', complaintRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Civic Issue Resolution Agent Backend API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      complaints: '/api/complaints'
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
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Initialize database schema and start server when not in test mode
const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  Boolean(process.env.NODE_TEST_CONTEXT) ||
  Boolean(process.env.NODE_TEST) ||
  process.argv.some((arg) => arg.includes('test'));

if (!isTestEnv) {
  initDb()
    .then(() => {
      console.log('[PostgreSQL] Database readiness verified successfully.');
    })
    .catch((err) => {
      console.error('[PostgreSQL CRITICAL] Database initialization failed. Backend server will run in degraded mode.');
      console.error(`[PostgreSQL CRITICAL] Cause: ${err.message}`);
    });

  app.listen(config.port, () => {
    console.log(`[Smart Civic Server] Server running in ${config.nodeEnv} mode on port ${config.port}`);
    console.log(`[Smart Civic Server] Health check: http://localhost:${config.port}/api/health`);
    console.log(`[Smart Civic Server] Complaints API: http://localhost:${config.port}/api/complaints`);
  });
}


export default app;
