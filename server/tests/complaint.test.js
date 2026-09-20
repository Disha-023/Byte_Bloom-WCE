process.env.NODE_ENV = 'test';

import { describe, it, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';
import { setMockQueryHandler, resetMockQueryHandler, closePool } from '../config/db.js';
import { generateComplaintId } from '../services/complaintService.js';

describe('Smart Civic Issue Resolution - Complaint API & AI Triage Integration', () => {
  // In-memory complaint store to simulate PostgreSQL database layer
  let mockComplaints = [];
  let originalFetch = null;

  after(async () => {
    await closePool();
  });

  beforeEach(() => {
    mockComplaints = [];
    originalFetch = global.fetch;

    // Provide an in-memory SQL mock query handler that simulates PostgreSQL queries
    setMockQueryHandler(async (text, params = []) => {
      const normalizedSql = text.replace(/\s+/g, ' ').trim().toUpperCase();

      // INSERT INTO complaints
      if (normalizedSql.startsWith('INSERT INTO COMPLAINTS')) {
        const row = {
          id: mockComplaints.length + 1,
          complaint_id: params[0],
          title: params[1],
          description: params[2],
          category: params[3],
          citizen_severity: params[4],
          address: params[5],
          additional_location: params[6],
          latitude: params[7],
          longitude: params[8],
          image_url: params[9],
          status: 'Pending',
          ai_analysis_status: 'pending',
          issue_type: null,
          ai_severity: null,
          priority: null,
          department: null,
          sla_hours: null,
          ai_confidence: null,
          evidence_summary: null,
          suggested_action: null,
          ai_reason: null,
          image_analyzed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockComplaints.push(row);
        return { rows: [row], rowCount: 1 };
      }

      // UPDATE complaints SET issue_type = ...
      if (normalizedSql.startsWith('UPDATE COMPLAINTS SET ISSUE_TYPE =')) {
        const complaintId = params[10];
        const row = mockComplaints.find((c) => c.complaint_id === complaintId);
        if (row) {
          row.issue_type = params[0];
          row.ai_severity = params[1];
          row.priority = params[2];
          row.department = params[3];
          row.sla_hours = params[4];
          row.ai_confidence = params[5];
          row.evidence_summary = params[6];
          row.suggested_action = params[7];
          row.ai_reason = params[8];
          row.image_analyzed = params[9];
          row.ai_analysis_status = 'completed';
          row.updated_at = new Date().toISOString();
          return { rows: [row], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      // UPDATE complaints SET ai_analysis_status = 'failed'
      if (normalizedSql.startsWith('UPDATE COMPLAINTS SET AI_ANALYSIS_STATUS = \'FAILED\'')) {
        const complaintId = params[0];
        const row = mockComplaints.find((c) => c.complaint_id === complaintId);
        if (row) {
          row.ai_analysis_status = 'failed';
          row.updated_at = new Date().toISOString();
          return { rows: [row], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      // SELECT 1 FROM complaints WHERE complaint_id = $1
      if (normalizedSql.includes('SELECT 1 FROM COMPLAINTS WHERE COMPLAINT_ID = $1')) {
        const complaintId = params[0];
        const exists = mockComplaints.some((c) => c.complaint_id === complaintId);
        return { rows: exists ? [{ '?column?': 1 }] : [], rowCount: exists ? 1 : 0 };
      }

      // SELECT * FROM complaints WHERE complaint_id = $1
      if (normalizedSql.startsWith('SELECT * FROM COMPLAINTS WHERE COMPLAINT_ID = $1')) {
        const complaintId = params[0];
        const row = mockComplaints.find((c) => c.complaint_id === complaintId);
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }

      // SELECT * FROM complaints ORDER BY created_at DESC
      if (normalizedSql.startsWith('SELECT * FROM COMPLAINTS ORDER BY CREATED_AT DESC')) {
        const sorted = [...mockComplaints].reverse();
        return { rows: sorted, rowCount: sorted.length };
      }

      // Table creation / index verification queries
      return { rows: [], rowCount: 0 };
    });
  });

  afterEach(() => {
    resetMockQueryHandler();
    global.fetch = originalFetch;
  });

  // Test 1: Validation Failures
  describe('POST /api/complaints - Validation', () => {
    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .send({});

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(Array.isArray(res.body.errors));
      assert.ok(res.body.errors.some((e) => e.includes('Title is required')));
      assert.ok(res.body.errors.some((e) => e.includes('Description is required')));
      assert.ok(res.body.errors.some((e) => e.includes('Category is required')));
      assert.ok(res.body.errors.some((e) => e.includes('Address / Location is required')));
    });

    it('should return 400 when description is shorter than 10 characters', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .send({
          title: 'Road pothole',
          description: 'Too short',
          category: 'Road & Potholes',
          address: 'Main street'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.errors.some((e) => e.includes('at least 10 characters long')));
    });

    it('should return 400 when an invalid severity level is supplied', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .send({
          title: 'Road pothole',
          description: 'Large pothole on the street causing hazards',
          category: 'Road & Potholes',
          severity: 'super-urgent-invalid',
          address: 'Main street'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.errors.some((e) => e.includes('Invalid severity level')));
    });
  });

  // Test 2: Successful Submission & AI Analysis Persistence
  describe('POST /api/complaints - Successful Submission Flow', () => {
    it('should create complaint in PostgreSQL, call AI Engine, persist AI results, and return structured complaint', async () => {
      // Mock AI engine /api/v1/analyze response
      let aiCallMade = false;
      let aiPayload = null;

      global.fetch = async (url, options) => {
        if (url.includes('/api/v1/analyze')) {
          aiCallMade = true;
          aiPayload = JSON.parse(options.body);

          return {
            ok: true,
            status: 200,
            json: async () => ({
              complaint_id: aiPayload.complaint_id,
              issue_type: 'pothole',
              severity: 'high',
              priority: 'high',
              department: 'road_public_works',
              sla_hours: 48,
              confidence: 0.94,
              evidence_summary: 'The complaint describes a road surface depression consistent with a pothole.',
              suggested_action: 'inspect_and_repair',
              reason: 'Deep road depression creates vehicle and pedestrian risk.',
              image_analyzed: false
            })
          };
        }
        return { ok: false, status: 404 };
      };

      const payload = {
        title: 'Large pothole near college gate',
        description: 'Large pothole causing dangerous conditions near the college entrance.',
        category: 'Road & Potholes',
        severity: 'high',
        address: 'Near Central Civic Square',
        additionalLocation: 'Opposite to campus gate 2',
        mockCoordinates: '16.8524, 74.5815'
      };

      const res = await request(app)
        .post('/api/complaints')
        .send(payload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);

      const complaint = res.body.complaint;
      assert.ok(complaint);

      // Verify backend-generated complaint ID
      assert.match(complaint.complaint_id, /^CIV-\d{6}$/);

      // Verify initial fields
      assert.strictEqual(complaint.title, 'Large pothole near college gate');
      assert.strictEqual(complaint.category, 'Road & Potholes');
      assert.strictEqual(complaint.citizen_severity, 'high');
      assert.strictEqual(complaint.address, 'Near Central Civic Square');
      assert.strictEqual(complaint.additional_location, 'Opposite to campus gate 2');
      assert.strictEqual(complaint.status, 'Pending');
      assert.strictEqual(complaint.latitude, 16.8524);
      assert.strictEqual(complaint.longitude, 74.5815);

      // Verify AI engine call and persisted fields
      assert.strictEqual(aiCallMade, true);
      assert.strictEqual(aiPayload.complaint_id, complaint.complaint_id);
      assert.strictEqual(complaint.ai_analysis_status, 'completed');
      assert.strictEqual(complaint.issue_type, 'pothole');
      assert.strictEqual(complaint.ai_severity, 'high');
      assert.strictEqual(complaint.priority, 'high');
      assert.strictEqual(complaint.department, 'road_public_works');
      assert.strictEqual(complaint.sla_hours, 48);
      assert.strictEqual(complaint.ai_confidence, 0.94);
      assert.strictEqual(complaint.suggested_action, 'inspect_and_repair');
      assert.ok(complaint.evidence_summary.includes('pothole'));
    });

    it('should handle AI engine failure gracefully without deleting the complaint', async () => {
      // Mock AI engine throwing an error
      global.fetch = async () => {
        throw new Error('AI engine connection refused');
      };

      const payload = {
        title: 'Broken streetlight on 5th avenue',
        description: 'The street light has been completely dark for 3 days.',
        category: 'Streetlight',
        severity: 'medium',
        address: '5th Avenue, Ward 4'
      };

      const res = await request(app)
        .post('/api/complaints')
        .send(payload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);

      const complaint = res.body.complaint;
      assert.ok(complaint);
      assert.match(complaint.complaint_id, /^CIV-\d{6}$/);

      // Verify complaint is preserved with status 'Pending' and ai_analysis_status 'failed'
      assert.strictEqual(complaint.status, 'Pending');
      assert.strictEqual(complaint.ai_analysis_status, 'failed');
      assert.strictEqual(complaint.title, 'Broken streetlight on 5th avenue');

      // Verify it exists in the database
      assert.strictEqual(mockComplaints.length, 1);
      assert.strictEqual(mockComplaints[0].complaint_id, complaint.complaint_id);
      assert.strictEqual(mockComplaints[0].ai_analysis_status, 'failed');
    });
  });

  // Test 3: GET /api/complaints and GET /api/complaints/:complaintId
  describe('GET Endpoints', () => {
    beforeEach(() => {
      // Pre-populate mock complaints
      mockComplaints.push(
        {
          id: 1,
          complaint_id: 'CIV-100001',
          title: 'First complaint',
          description: 'Description of the first issue reported',
          category: 'Garbage & Waste',
          citizen_severity: 'medium',
          address: 'Civic Lane 1',
          status: 'Pending',
          ai_analysis_status: 'completed',
          issue_type: 'garbage',
          ai_severity: 'medium',
          priority: 'medium',
          department: 'sanitation',
          sla_hours: 24,
          created_at: new Date('2026-09-20T10:00:00Z').toISOString()
        },
        {
          id: 2,
          complaint_id: 'CIV-100002',
          title: 'Second complaint',
          description: 'Description of the second issue reported',
          category: 'Water Supply',
          citizen_severity: 'high',
          address: 'Water Works Road',
          status: 'Pending',
          ai_analysis_status: 'completed',
          issue_type: 'water_leakage',
          ai_severity: 'high',
          priority: 'high',
          department: 'water_department',
          sla_hours: 12,
          created_at: new Date('2026-09-20T11:00:00Z').toISOString()
        }
      );
    });

    it('GET /api/complaints should return all complaints ordered newest first', async () => {
      const res = await request(app).get('/api/complaints');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 2);
      assert.strictEqual(res.body.complaint[0].complaint_id, 'CIV-100002');
      assert.strictEqual(res.body.complaint[1].complaint_id, 'CIV-100001');
    });

    it('GET /api/complaints/:complaintId should return matching complaint', async () => {
      const res = await request(app).get('/api/complaints/CIV-100001');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.complaint.complaint_id, 'CIV-100001');
      assert.strictEqual(res.body.complaint.title, 'First complaint');
    });

    it('GET /api/complaints/:complaintId should return 404 for unknown complaint', async () => {
      const res = await request(app).get('/api/complaints/CIV-999999');

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('not found'));
    });
  });

  // Test 4: Uniqueness of Complaint ID
  describe('Complaint ID Generation', () => {
    it('should generate a unique complaint ID format CIV-XXXXXX and handle collisions', async () => {
      const id1 = await generateComplaintId();
      assert.match(id1, /^CIV-\d{6}$/);

      // Pre-seed an existing ID to test collision avoidance
      mockComplaints.push({ complaint_id: id1 });
      const id2 = await generateComplaintId();
      assert.match(id2, /^CIV-\d{6}$/);
      assert.notStrictEqual(id1, id2);
    });
  });
});
