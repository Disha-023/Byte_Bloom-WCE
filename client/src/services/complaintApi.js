/**
 * API Service Layer for Citizen Complaints.
 * Orchestrates communication between the React frontend and Express backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Submits a new citizen complaint to the Express backend.
 * @param {FormData} formData - Multipart form data containing issue fields and optional image
 * @returns {Promise<object>} Backend response containing the persisted complaint and AI triage
 */
export const createComplaint = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: 'POST',
    body: formData
    // Note: Do not set Content-Type header manually; fetch will automatically set it with boundary
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.errors ? data.errors.join(' ') : data.message || 'Failed to submit complaint';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Retrieves all citizen complaints from the backend.
 * @returns {Promise<Array<object>>} List of complaints
 */
export const getComplaints = async () => {
  const response = await fetch(`${API_BASE_URL}/complaints`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch complaints');
  }

  return data.complaints || data.complaint || [];
};

/**
 * Retrieves a single complaint by its unique business complaint ID.
 * @param {string} complaintId - e.g. CIV-102431
 * @returns {Promise<object>} Complaint record
 */
export const getComplaint = async (complaintId) => {
  const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(complaintId)}`);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Complaint not found');
    error.status = response.status;
    throw error;
  }

  return data.complaint;
};

export default {
  createComplaint,
  getComplaints,
  getComplaint
};
