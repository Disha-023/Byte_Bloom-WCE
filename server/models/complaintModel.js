import { query } from '../config/db.js';

/**
 * Creates an initial complaint record in PostgreSQL with status 'Pending' and ai_analysis_status 'pending'.
 * @param {object} data
 * @returns {Promise<object>} The newly created complaint row
 */
export const createComplaint = async (data) => {
  const sql = `
    INSERT INTO complaints (
      complaint_id,
      title,
      description,
      category,
      citizen_severity,
      address,
      additional_location,
      latitude,
      longitude,
      image_url,
      status,
      ai_analysis_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending', 'pending')
    RETURNING *;
  `;

  const values = [
    data.complaint_id,
    data.title,
    data.description,
    data.category,
    data.citizen_severity,
    data.address,
    data.additional_location || null,
    data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
    data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
    data.image_url || null
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Updates a complaint record with AI analysis results and sets ai_analysis_status to 'completed'.
 * @param {string} complaintId
 * @param {object} aiData
 * @returns {Promise<object>} The updated complaint row
 */
export const updateComplaintWithAi = async (complaintId, aiData) => {
  const sql = `
    UPDATE complaints
    SET
      issue_type = $1,
      ai_severity = $2,
      priority = $3,
      department = $4,
      sla_hours = $5,
      ai_confidence = $6,
      evidence_summary = $7,
      suggested_action = $8,
      ai_reason = $9,
      image_analyzed = $10,
      ai_analysis_status = 'completed',
      updated_at = NOW()
    WHERE complaint_id = $11
    RETURNING *;
  `;

  const values = [
    aiData.issue_type || null,
    aiData.severity || null,
    aiData.priority || null,
    aiData.department || null,
    aiData.sla_hours !== undefined ? Number(aiData.sla_hours) : null,
    aiData.confidence !== undefined ? Number(aiData.confidence) : null,
    aiData.evidence_summary || null,
    aiData.suggested_action || null,
    aiData.reason || null,
    Boolean(aiData.image_analyzed),
    complaintId
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Updates a complaint record to reflect failed AI analysis while preserving the complaint.
 * @param {string} complaintId
 * @returns {Promise<object>} The updated complaint row
 */
export const updateComplaintAiFailed = async (complaintId) => {
  const sql = `
    UPDATE complaints
    SET
      ai_analysis_status = 'failed',
      updated_at = NOW()
    WHERE complaint_id = $1
    RETURNING *;
  `;

  const result = await query(sql, [complaintId]);
  return result.rows[0];
};

/**
 * Fetches a single complaint by its unique business complaint_id (e.g. CIV-102431).
 * @param {string} complaintId
 * @returns {Promise<object|null>}
 */
export const getComplaintById = async (complaintId) => {
  const sql = `
    SELECT * FROM complaints
    WHERE complaint_id = $1;
  `;
  const result = await query(sql, [complaintId]);
  return result.rows[0] || null;
};

/**
 * Fetches all complaints ordered newest first.
 * @returns {Promise<Array<object>>}
 */
export const getAllComplaints = async () => {
  const sql = `
    SELECT * FROM complaints
    ORDER BY created_at DESC;
  `;
  const result = await query(sql);
  return result.rows;
};

/**
 * Checks whether a complaint_id already exists in the database.
 * @param {string} complaintId
 * @returns {Promise<boolean>}
 */
export const checkComplaintIdExists = async (complaintId) => {
  const sql = `
    SELECT 1 FROM complaints
    WHERE complaint_id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [complaintId]);
  return result.rowCount > 0;
};

export default {
  createComplaint,
  updateComplaintWithAi,
  updateComplaintAiFailed,
  getComplaintById,
  getAllComplaints,
  checkComplaintIdExists
};
