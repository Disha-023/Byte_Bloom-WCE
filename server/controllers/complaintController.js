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
      longitude,
      mockCoordinates
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

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Location normalization:
    // NOTE: Real browser geolocation will be integrated in a future phase.
    // The coordinates (e.g. 16.8524, 74.5815) are preserved as development/demo coordinates.
    let parsedLat = latitude !== undefined && latitude !== '' ? parseFloat(latitude) : null;
    let parsedLng = longitude !== undefined && longitude !== '' ? parseFloat(longitude) : null;

    if ((parsedLat === null || isNaN(parsedLat)) && mockCoordinates) {
      const parts = mockCoordinates.split(',').map((p) => p.trim());
      if (parts.length === 2) {
        const latCandidate = parseFloat(parts[0]);
        const lngCandidate = parseFloat(parts[1]);
        if (!isNaN(latCandidate) && !isNaN(lngCandidate)) {
          parsedLat = latCandidate;
          parsedLng = lngCandidate;
        }
      }
    }

    const complaintData = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      citizen_severity: inputSeverity || 'medium',
      address: address.trim(),
      additional_location: (additional_location || additionalLocation || '').trim() || null,
      latitude: !isNaN(parsedLat) ? parsedLat : null,
      longitude: !isNaN(parsedLng) ? parsedLng : null
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

export default {
  submitComplaint,
  getComplaints,
  getComplaintById
};
