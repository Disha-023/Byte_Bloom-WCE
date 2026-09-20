process.env.NODE_ENV = 'test';

import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';
import { setMockQueryHandler, closePool } from '../config/db.js';

// Import mapper functions to verify contract
import {
  mapBackendComplaintToAuthority,
  mapBackendComplaints,
  capitalize,
  formatIssueType,
  formatDateTime,
  formatDateOnly,
  resolveImageUrl
} from '../../client/src/utils/complaintMapper.js';

describe('Authority Dashboard Integration & Central Complaint Backend', () => {
  let mockComplaints = [];

  after(async () => {
    await closePool();
  });

  beforeEach(() => {
    mockComplaints = [];

    setMockQueryHandler(async (text, params = []) => {
      const normalizedSql = text.replace(/\s+/g, ' ').trim().toUpperCase();

      // SELECT * FROM complaints ORDER BY created_at DESC
      if (normalizedSql.includes('SELECT * FROM COMPLAINTS ORDER BY CREATED_AT DESC')) {
        return { rows: [...mockComplaints], rowCount: mockComplaints.length };
      }

      // SELECT * FROM complaints WHERE complaint_id = $1
      if (normalizedSql.includes('SELECT * FROM COMPLAINTS WHERE COMPLAINT_ID = $1')) {
        const id = params[0];
        const row = mockComplaints.find((c) => c.complaint_id === id);
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }

      return { rows: [], rowCount: 0 };
    });
  });

  it('GET /api/complaints returns empty list when no complaints exist (does not inject mock data)', async () => {
    const res = await request(app).get('/api/complaints');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.count, 0);
    assert.deepStrictEqual(res.body.complaint, []);

    // Verify mapper also preserves empty list
    const mapped = mapBackendComplaints(res.body.complaint);
    assert.strictEqual(mapped.length, 0);
  });

  it('GET /api/complaints returns real complaints created via backend and maps correctly', async () => {
    mockComplaints.push({
      id: 1,
      complaint_id: 'CIV-990011',
      title: 'Water pipe rupture on MG Road',
      description: 'Major potable water pipeline burst causing road flooding.',
      category: 'Water Supply',
      citizen_severity: 'critical',
      address: 'MG Road, Near Bus Station',
      additional_location: 'Opposite State Bank',
      latitude: '16.852400',
      longitude: '74.581500',
      image_url: '/uploads/complaints/water_burst.jpg',
      status: 'Pending',
      ai_analysis_status: 'completed',
      issue_type: 'water_main_rupture',
      ai_severity: 'critical',
      priority: 'critical',
      department: 'Water Supply & Sewerage',
      sla_hours: 4,
      ai_confidence: '0.97',
      evidence_summary: 'Pressurized water stream gushing across carriage lane.',
      suggested_action: 'emergency_valve_shutoff',
      ai_reason: 'Major municipal water loss and foundation erosion hazard.',
      image_analyzed: true,
      created_at: '2026-09-20T10:00:00.000Z',
      updated_at: '2026-09-20T10:05:00.000Z'
    });

    const res = await request(app).get('/api/complaints');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.count, 1);

    const raw = res.body.complaint[0];
    const mapped = mapBackendComplaintToAuthority(raw);

    // Verify field mapping
    assert.strictEqual(mapped.id, 'CIV-990011');
    assert.strictEqual(mapped.title, 'Water pipe rupture on MG Road');
    assert.strictEqual(mapped.department, 'Water Supply & Sewerage');
    assert.strictEqual(mapped.severity, 'Critical');
    assert.strictEqual(mapped.priority, 'Critical');
    assert.strictEqual(mapped.status, 'Pending');
    assert.strictEqual(mapped.location, 'MG Road, Near Bus Station, Opposite State Bank');
    assert.strictEqual(mapped.coordinates, '16.8524, 74.5815');
    assert.strictEqual(mapped.slaHours, 4);

    // Verify AI analysis block
    assert.ok(mapped.aiAnalysis);
    assert.strictEqual(mapped.aiAnalysis.issue, 'water_main_rupture');
    assert.strictEqual(mapped.aiAnalysis.severity, 'critical');
    assert.strictEqual(mapped.aiAnalysis.priority, 'critical');
    assert.strictEqual(mapped.aiAnalysis.confidence, 0.97);
    assert.strictEqual(mapped.aiAnalysis.action, 'emergency_valve_shutoff');

    // Verify evidence block
    assert.strictEqual(mapped.citizenEvidence.hasImage, true);
    assert.ok(mapped.citizenEvidence.imageUrl.includes('/uploads/complaints/water_burst.jpg'));
    assert.strictEqual(mapped.citizenEvidence.imageDescription, 'Pressurized water stream gushing across carriage lane.');

    // Verify timeline
    assert.ok(mapped.timeline.length >= 3);
    assert.strictEqual(mapped.timeline[0].type, 'received');
    assert.strictEqual(mapped.timeline[1].type, 'ai');
    assert.strictEqual(mapped.timeline[2].type, 'assigned');
  });

  it('GET /api/complaints/:complaintId retrieves single real complaint', async () => {
    mockComplaints.push({
      id: 2,
      complaint_id: 'CIV-774411',
      title: 'Broken solar streetlight',
      description: 'Streetlight dark for three nights outside girls high school.',
      category: 'Streetlight',
      citizen_severity: 'high',
      address: 'School Road, Sector 4',
      additional_location: null,
      latitude: null,
      longitude: null,
      image_url: null,
      status: 'Assigned',
      ai_analysis_status: 'completed',
      issue_type: 'street_lighting_failure',
      ai_severity: 'high',
      priority: 'high',
      department: 'Electrical & Street Lighting',
      sla_hours: 48,
      ai_confidence: '0.91',
      evidence_summary: null,
      suggested_action: 'replace_luminaire',
      ai_reason: 'Night corridor darkness outside educational facility.',
      image_analyzed: false,
      created_at: '2026-09-19T18:00:00.000Z',
      updated_at: '2026-09-20T08:00:00.000Z'
    });

    const res = await request(app).get('/api/complaints/CIV-774411');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.complaint.complaint_id, 'CIV-774411');

    const mapped = mapBackendComplaintToAuthority(res.body.complaint);
    assert.strictEqual(mapped.id, 'CIV-774411');
    assert.strictEqual(mapped.department, 'Electrical & Street Lighting');
    assert.strictEqual(mapped.coordinates, null);
    assert.strictEqual(mapped.citizenEvidence.hasImage, false);
    assert.strictEqual(mapped.status, 'Assigned');
  });

  it('GET /api/complaints/:complaintId returns 404 for non-existent complaint', async () => {
    const res = await request(app).get('/api/complaints/CIV-NONEXISTENT');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });

  it('Dynamic analytics calculation accurately aggregates real complaint records', () => {
    const testComplaints = [
      {
        complaint_id: 'CIV-1',
        department: 'Roads & Infrastructure',
        status: 'Pending',
        severity: 'Critical',
        priority: 'Critical',
        issue_type: 'pothole',
        category: 'Road & Potholes'
      },
      {
        complaint_id: 'CIV-2',
        department: 'Roads & Infrastructure',
        status: 'Resolved',
        severity: 'High',
        priority: 'High',
        issue_type: 'pothole',
        category: 'Road & Potholes'
      },
      {
        complaint_id: 'CIV-3',
        department: 'Solid Waste Management',
        status: 'In Progress',
        severity: 'Medium',
        priority: 'Medium',
        issue_type: 'garbage_dump',
        category: 'Garbage & Waste'
      }
    ];

    const mapped = mapBackendComplaints(testComplaints);
    assert.strictEqual(mapped.length, 3);

    const total = mapped.length;
    const resolved = mapped.filter((c) => c.status === 'Resolved').length;
    const pending = mapped.filter((c) => c.status === 'Pending').length;
    const inProgress = mapped.filter((c) => c.status === 'In Progress').length;
    const critical = mapped.filter((c) => c.severity === 'Critical' || c.priority === 'Critical').length;
    const resolutionRate = Math.round((resolved / total) * 100);

    assert.strictEqual(total, 3);
    assert.strictEqual(resolved, 1);
    assert.strictEqual(pending, 1);
    assert.strictEqual(inProgress, 1);
    assert.strictEqual(critical, 1);
    assert.strictEqual(resolutionRate, 33);
  });
});
