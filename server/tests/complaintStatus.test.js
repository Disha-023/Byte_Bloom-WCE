process.env.NODE_ENV = 'test';

import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';
import { setMockQueryHandler, resetMockQueryHandler, closePool } from '../config/db.js';

describe('Central Complaint Status Update API (PATCH /api/complaints/:complaintId/status)', () => {
  let mockComplaints = [];

  after(async () => {
    await closePool();
  });

  beforeEach(() => {
    resetMockQueryHandler();
    mockComplaints = [
      {
        id: 1,
        complaint_id: 'CIV-1001',
        title: 'Pothole on Main St',
        description: 'Dangerous pothole on the road',
        category: 'Road & Potholes',
        citizen_severity: 'high',
        status: 'Pending',
        created_at: new Date('2026-09-20T10:00:00Z').toISOString(),
        updated_at: new Date('2026-09-20T10:00:00Z').toISOString()
      },
      {
        id: 2,
        complaint_id: 'CIV-1002',
        title: 'Water Leak',
        description: 'Water leaking from pipe',
        category: 'Water Supply',
        citizen_severity: 'medium',
        status: 'In Progress',
        created_at: new Date('2026-09-20T11:00:00Z').toISOString(),
        updated_at: new Date('2026-09-20T11:00:00Z').toISOString()
      }
    ];

    setMockQueryHandler(async (text, params = []) => {
      const normalizedSql = text.replace(/\s+/g, ' ').trim().toUpperCase();

      // SELECT 1 (for health check / existence checks)
      if (normalizedSql === 'SELECT 1') {
        return { rows: [{ '?column?': 1 }], rowCount: 1 };
      }

      // SELECT * FROM complaints WHERE complaint_id = $1
      if (normalizedSql.startsWith('SELECT * FROM COMPLAINTS WHERE COMPLAINT_ID = $1')) {
        const id = params[0];
        const row = mockComplaints.find((c) => c.complaint_id === id);
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }

      // UPDATE complaints SET status = $1, updated_at = NOW() WHERE complaint_id = $2 RETURNING *;
      if (normalizedSql.includes('UPDATE COMPLAINTS SET STATUS = $1')) {
        const newStatus = params[0];
        const id = params[1];
        const row = mockComplaints.find((c) => c.complaint_id === id);
        if (row) {
          row.status = newStatus;
          row.updated_at = new Date().toISOString();
          return { rows: [row], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      return { rows: [], rowCount: 0 };
    });
  });

  it('updates status to In Progress and returns updated complaint', async () => {
    const res = await request(app)
      .patch('/api/complaints/CIV-1001/status')
      .send({ status: 'In Progress' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.complaint.complaint_id, 'CIV-1001');
    assert.strictEqual(res.body.complaint.status, 'In Progress');
  });

  it('normalizes status casing (e.g. escalated -> Escalated)', async () => {
    const res = await request(app)
      .patch('/api/complaints/CIV-1001/status')
      .send({ status: 'escalated' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.complaint.status, 'Escalated');
  });

  it('updates status to Resolved', async () => {
    const res = await request(app)
      .patch('/api/complaints/CIV-1002/status')
      .send({ status: 'Resolved' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.complaint.status, 'Resolved');
  });

  it('returns 400 when status is missing or empty', async () => {
    const res = await request(app)
      .patch('/api/complaints/CIV-1001/status')
      .send({});

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Status is required'));
  });

  it('returns 400 when an invalid status is supplied', async () => {
    const res = await request(app)
      .patch('/api/complaints/CIV-1001/status')
      .send({ status: 'SuperUrgentUnknown' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Invalid status'));
    assert.ok(res.body.message.includes('Escalated'));
  });

  it('returns 404 when complaintId does not exist', async () => {
    const res = await request(app)
      .patch('/api/complaints/CIV-NONEXISTENT/status')
      .send({ status: 'Escalated' });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('not found'));
  });

  it('GET /api/complaints/:complaintId immediately returns the updated status', async () => {
    // 1. Update status
    await request(app)
      .patch('/api/complaints/CIV-1001/status')
      .send({ status: 'Escalated' });

    // 2. Query single complaint
    const getRes = await request(app)
      .get('/api/complaints/CIV-1001');

    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.complaint.status, 'Escalated');
  });
});
