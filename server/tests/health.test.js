process.env.NODE_ENV = 'test';

import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';
import { setMockQueryHandler, resetMockQueryHandler, closePool } from '../config/db.js';

describe('Health Check API & Database Readiness', () => {
  after(async () => {
    await closePool();
  });

  beforeEach(() => {
    resetMockQueryHandler();
  });

  it('GET /api/health returns 200 and connected status when database is responsive', async () => {
    setMockQueryHandler(async (text) => {
      if (text.includes('SELECT 1')) {
        return { rows: [{ '?column?': 1 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.database.status, 'connected');
    assert.ok(res.body.message.includes('running'));
  });

  it('GET /api/health returns 503 and degraded status when database is disconnected', async () => {
    setMockQueryHandler(async (text) => {
      if (text.includes('SELECT 1')) {
        const error = new Error('password authentication failed for user "postgres"');
        error.code = '28P01';
        throw error;
      }
      return { rows: [], rowCount: 0 };
    });

    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.body.status, 'degraded');
    assert.strictEqual(res.body.database.status, 'disconnected');
    assert.strictEqual(res.body.database.code, '28P01');
    assert.ok(res.body.database.reason.includes('Authentication failed'));
  });
});

