import complaintService from '../services/complaintService.js';

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

/**
 * Controller to handle citizen complaint submission.
 * Validates incoming fields, normalizes location and severity,
 * and passes to the complaint service.
 */
export const submitComplaint = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      citizen_severity,
      address,
      additionalLocation,
      additional_location,
      latitude,
      longitude
    } = req.body;

    const errors = [];

    // Validation rules
    if (!title || !title.trim()) {
      errors.push('Title is required.');
    } else if (title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long.');
    }

    if (!description || !description.trim()) {
      errors.push('Description is required.');
    } else if (description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long.');
    }

    if (!category || !category.trim()) {
      errors.push('Category is required.');
    }

    if (!address || !address.trim()) {
      errors.push('Address / Location is required.');
    }

    const inputSeverity = (citizen_severity || severity || '').trim().toLowerCase();
    if (inputSeverity && !VALID_SEVERITIES.includes(inputSeverity)) {
      errors.push(`Invalid severity level '${inputSeverity}'. Must be one of: ${VALID_SEVERITIES.join(', ')}.`);
    }

    // Coordinate validation & normalization
    const hasLat = latitude !== undefined && latitude !== null && String(latitude).trim() !== '';
    const hasLng = longitude !== undefined && longitude !== null && String(longitude).trim() !== '';

    let parsedLat = null;
    let parsedLng = null;

    if (hasLat && !hasLng) {
      errors.push('Both latitude and longitude must be provided together.');
    } else if (!hasLat && hasLng) {
      errors.push('Both latitude and longitude must be provided together.');
    } else if (hasLat && hasLng) {
      const numLat = Number(latitude);
      const numLng = Number(longitude);

      if (isNaN(numLat)) {
        errors.push('Latitude must be a valid number.');
      } else if (numLat < -90 || numLat > 90) {
        errors.push('Latitude must be between -90 and 90.');
      } else {
        parsedLat = numLat;
      }

      if (isNaN(numLng)) {
        errors.push('Longitude must be a valid number.');
      } else if (numLng < -180 || numLng > 180) {
        errors.push('Longitude must be between -180 and 180.');
      } else {
        parsedLng = numLng;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const complaintData = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      citizen_severity: inputSeverity || 'medium',
      address: address.trim(),
      additional_location: (additional_location || additionalLocation || '').trim() || null,
      latitude: parsedLat,
      longitude: parsedLng
    };

    const file = req.file || null;
    const complaint = await complaintService.submitComplaint(complaintData, file);

    return res.status(201).json({
      success: true,
      complaint
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch all complaints ordered newest first.
 */
export const getComplaints = async (req, res, next) => {
  try {
    const complaints = await complaintService.getComplaints();
    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaint: complaints
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch a single complaint by business complaint_id.
 */
export const getComplaintById = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const complaint = await complaintService.getComplaintById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint with ID '${complaintId}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      complaint
    });
  } catch (err) {
    next(err);
  }
};

const VALID_STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Escalated'];

/**
 * Controller to update the operational status of a complaint.
 * Validates the status against application conventions and updates PostgreSQL.
 */
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body || {};

    if (!status || typeof status !== 'string' || !status.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Status is required and must be a non-empty string.'
      });
    }

    // Match case-insensitively and normalize to canonical casing
    const normalizedInput = status.trim().toLowerCase();
    const canonicalStatus = VALID_STATUSES.find(
      (s) => s.toLowerCase() === normalizedInput
    );

    if (!canonicalStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed statuses are: ${VALID_STATUSES.join(', ')}.`
      });
    }

    const updatedComplaint = await complaintService.updateComplaintStatus(complaintId, canonicalStatus);

    if (!updatedComplaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint with ID '${complaintId}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      complaint: updatedComplaint
    });
  } catch (err) {
    next(err);
  }
};

export default {
  submitComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus
};

