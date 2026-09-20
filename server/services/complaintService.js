import { config } from '../config/index.js';
import complaintModel from '../models/complaintModel.js';

/**
 * Generates a unique, human-readable complaint identifier (e.g. CIV-102431).
 * @returns {Promise<string>}
 */
export const generateComplaintId = async () => {
  let unique = false;
  let candidate = '';
  let attempts = 0;

  while (!unique && attempts < 10) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    candidate = `CIV-${randomNum}`;
    const exists = await complaintModel.checkComplaintIdExists(candidate);
    if (!exists) {
      unique = true;
    }
    attempts += 1;
  }

  if (!unique) {
    // Fallback using timestamp if random collisions happen
    candidate = `CIV-${Date.now().toString().slice(-6)}`;
  }

  return candidate;
};

/**
 * Submits a new citizen complaint, persists it to PostgreSQL, and calls the AI Engine for triage.
 * @param {object} complaintData - Sanitized complaint fields
 * @param {object|null} file - Uploaded Multer file object if present
 * @returns {Promise<object>} Fully structured complaint record
 */
export const submitComplaint = async (complaintData, file = null) => {
  // Step 1: Generate authoritative backend complaint ID
  const complaintId = await generateComplaintId();

  // Step 2: Determine image paths
  let imageUrl = null;
  let aiImageReference = null;

  if (file) {
    // Relative URL path for frontend access via Express static middleware
    imageUrl = `/uploads/complaints/${file.filename}`;
    // Absolute filesystem path for AI Engine (which checks os.path.exists first)
    aiImageReference = file.path;
  }

  // Step 3: Create initial complaint in PostgreSQL
  const initialData = {
    complaint_id: complaintId,
    title: complaintData.title,
    description: complaintData.description,
    category: complaintData.category,
    citizen_severity: complaintData.citizen_severity || complaintData.severity || 'medium',
    address: complaintData.address,
    additional_location: complaintData.additional_location || complaintData.additionalLocation || null,
    latitude: complaintData.latitude,
    longitude: complaintData.longitude,
    image_url: imageUrl
  };

  const initialRecord = await complaintModel.createComplaint(initialData);

  // Step 4: Call AI Engine /api/v1/analyze
  try {
    const aiPayload = {
      complaint_id: complaintId,
      description: complaintData.description,
      latitude: complaintData.latitude !== undefined && complaintData.latitude !== null ? Number(complaintData.latitude) : null,
      longitude: complaintData.longitude !== undefined && complaintData.longitude !== null ? Number(complaintData.longitude) : null,
      address: complaintData.address || null,
      image_url: aiImageReference
    };

    const aiEndpoint = `${config.aiEngineUrl}/api/v1/analyze`;
    const response = await fetch(aiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiPayload)
    });

    if (!response.ok) {
      throw new Error(`AI Engine returned status ${response.status}: ${response.statusText}`);
    }

    const aiResult = await response.json();

    // Step 5: Persist AI analysis into the complaint record
    const updatedRecord = await complaintModel.updateComplaintWithAi(complaintId, aiResult);
    return updatedRecord;
  } catch (err) {
    // Step 6: Handle AI failure gracefully without deleting the citizen's complaint
    console.warn(`[ComplaintService] AI analysis failed for ${complaintId}:`, err.message);
    const failedRecord = await complaintModel.updateComplaintAiFailed(complaintId);
    return failedRecord || initialRecord;
  }
};

/**
 * Retrieves all complaints ordered newest first.
 * @returns {Promise<Array<object>>}
 */
export const getComplaints = async () => {
  return complaintModel.getAllComplaints();
};

/**
 * Retrieves a single complaint by complaint_id.
 * @param {string} complaintId
 * @returns {Promise<object|null>}
 */
export const getComplaintById = async (complaintId) => {
  return complaintModel.getComplaintById(complaintId);
};

export default {
  generateComplaintId,
  submitComplaint,
  getComplaints,
  getComplaintById
};
