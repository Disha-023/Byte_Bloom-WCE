/**
 * Complaint Data Mapping Layer.
 * 
 * Maps raw backend PostgreSQL complaint objects into the unified shape
 * expected by the Authority Dashboard UI components.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:5000/api';

const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Capitalizes first letter of a string.
 */
export const capitalize = (str) => {
  if (!str) return '';
  const s = String(str).trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

/**
 * Formats snake_case or raw issue types into human-readable Title Case.
 */
export const formatIssueType = (issueType) => {
  if (!issueType) return '';
  return issueType
    .split(/[_\s]+/)
    .map((word) => capitalize(word))
    .join(' ');
};

/**
 * Formats ISO timestamp to human-readable date and time (e.g. "2026-09-20 10:30 AM").
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Formats ISO timestamp to date only (e.g. "2026-09-20").
 */
export const formatDateOnly = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).split('T')[0] || String(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return String(dateStr);
  }
};

/**
 * Resolves relative image URLs to full accessible URLs.
 */
export const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${SERVER_ORIGIN}${cleanPath}`;
};

/**
 * Maps a single backend complaint record from PostgreSQL into the Authority Dashboard model.
 * @param {object} raw - Backend complaint object
 * @returns {object} Formatted complaint object
 */
export const mapBackendComplaintToAuthority = (raw) => {
  if (!raw) return null;

  const id = raw.complaint_id || (raw.id ? `CIV-${raw.id}` : 'CIV-UNKNOWN');
  const title = raw.title || 'Untitled Complaint';
  const description = raw.description || '';
  const category = raw.category || 'Other';
  const issueType = raw.issue_type ? formatIssueType(raw.issue_type) : category;

  // Department normalization
  const department = raw.department || 'Unassigned';

  // Location string combining address and additional location
  const locationParts = [];
  if (raw.address && raw.address.trim()) locationParts.push(raw.address.trim());
  if (raw.additional_location && raw.additional_location.trim()) locationParts.push(raw.additional_location.trim());
  const location = locationParts.join(', ') || 'Location not specified';

  // Coordinates
  const hasLat = raw.latitude !== null && raw.latitude !== undefined && raw.latitude !== '';
  const hasLng = raw.longitude !== null && raw.longitude !== undefined && raw.longitude !== '';
  const coordinates = hasLat && hasLng
    ? `${Number(raw.latitude).toFixed(4)}, ${Number(raw.longitude).toFixed(4)}`
    : (hasLat ? String(raw.latitude) : null);

  // Status & Escalation
  const status = raw.status || 'Pending';
  const isEscalated = status === 'Escalated';

  // Severity & Priority: Normalize to Capitalized for UI badge styling ('Critical', 'High', 'Medium', 'Low')
  const rawSeverity = raw.ai_severity || raw.citizen_severity || 'Medium';
  const severity = capitalize(rawSeverity) || 'Medium';
  const rawPriority = raw.priority || 'Medium';
  const priority = capitalize(rawPriority) || 'Medium';

  // Timestamps
  const createdDate = formatDateTime(raw.created_at);
  const reportedDate = formatDateOnly(raw.created_at);
  const updatedDate = formatDateTime(raw.updated_at || raw.created_at);

  // Image URL
  const imageUrl = resolveImageUrl(raw.image_url);

  // SLA Hours & Remaining calculation
  const slaHours = raw.sla_hours !== null && raw.sla_hours !== undefined ? Number(raw.sla_hours) : null;
  let slaHoursRemaining = null;
  if (slaHours !== null && raw.created_at) {
    const elapsedHours = (Date.now() - new Date(raw.created_at).getTime()) / (1000 * 60 * 60);
    slaHoursRemaining = Math.max(0, Math.round(slaHours - elapsedHours));
  }

  // Citizen Evidence block
  const citizenEvidence = {
    hasImage: Boolean(raw.image_url),
    imageUrl,
    imageDescription: raw.evidence_summary || (raw.image_url ? 'Citizen photograph attached to grievance.' : 'No photograph attached.'),
    submittedNotes: raw.additional_location || raw.description
  };

  // AI Triage Analysis block
  const hasAi = raw.ai_analysis_status === 'completed' || Boolean(raw.issue_type) || Boolean(raw.ai_severity);
  const aiAnalysis = hasAi ? {
    issue: raw.issue_type || raw.category || 'civic_hazard',
    severity: (raw.ai_severity || raw.citizen_severity || 'medium').toLowerCase(),
    priority: (raw.priority || 'medium').toLowerCase(),
    department: raw.department || 'Unassigned',
    sla_hours: slaHours || 48,
    action: raw.suggested_action || 'inspect_and_triage',
    confidence: raw.ai_confidence !== null && raw.ai_confidence !== undefined ? Number(raw.ai_confidence) : 0.90,
    reason: raw.ai_reason || 'Automated AI triage based on citizen complaint details.',
    evidence_summary: raw.evidence_summary,
    image_analyzed: Boolean(raw.image_analyzed)
  } : null;

  // Dynamic Audit Trail / Timeline
  const timeline = [
    {
      id: `t-${id}-recv`,
      title: 'Complaint received',
      type: 'received',
      timestamp: createdDate,
      actor: 'Citizen Intake',
      description: `Complaint registered via citizen interface${coordinates ? ` with GPS coordinates (${coordinates})` : ''}.`
    }
  ];

  if (raw.ai_analysis_status === 'completed') {
    timeline.push({
      id: `t-${id}-ai`,
      title: 'AI analysis completed',
      type: 'ai',
      timestamp: createdDate,
      actor: 'Civic AI Engine (Gemini)',
      description: `Categorized as "${issueType}". Assessed severity: ${severity}${raw.ai_confidence ? ` (${Math.round(Number(raw.ai_confidence) * 100)}% confidence)` : ''}. Recommended SLA: ${slaHours || 48}h.`
    });
  }

  if (department && department !== 'Unassigned') {
    timeline.push({
      id: `t-${id}-dept`,
      title: 'Department assigned',
      type: 'assigned',
      timestamp: createdDate,
      actor: 'Automated Routing',
      description: `Routed to ${department}.`
    });
  }

  if (status && status !== 'Pending') {
    timeline.push({
      id: `t-${id}-status`,
      title: 'Status changed',
      type: 'status',
      timestamp: updatedDate || createdDate,
      actor: 'Department Authority',
      description: `Operational status moved to "${status}".`
    });
  }

  return {
    id,
    numericId: raw.id,
    title,
    description,
    category,
    issueType,
    department,
    location,
    coordinates,
    latitude: raw.latitude !== null && raw.latitude !== undefined ? Number(raw.latitude) : null,
    longitude: raw.longitude !== null && raw.longitude !== undefined ? Number(raw.longitude) : null,
    status,
    isEscalated,
    severity,
    priority,
    citizenSeverity: raw.citizen_severity,
    aiSeverity: raw.ai_severity,
    assignedOfficer: raw.assigned_officer || 'Unassigned',
    eta: slaHours ? `${slaHours} Hours SLA` : 'Pending Schedule',
    slaHours,
    slaHoursRemaining,
    createdDate,
    reportedDate,
    updatedDate,
    imageUrl,
    citizenName: 'Verified Citizen',
    citizenContact: null,
    citizenEvidence,
    aiAnalysis,
    timeline,
    authorityNotes: []
  };
};

/**
 * Maps an array of backend complaint records.
 * @param {Array} list - Raw backend complaints
 * @returns {Array} Mapped complaint objects
 */
export const mapBackendComplaints = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(mapBackendComplaintToAuthority).filter(Boolean);
};

export default {
  mapBackendComplaintToAuthority,
  mapBackendComplaints,
  capitalize,
  formatIssueType,
  formatDateTime,
  formatDateOnly,
  resolveImageUrl
};
