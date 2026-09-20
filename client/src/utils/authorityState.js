/**
 * Isolated state and data layer for Authority / Department Dashboard.
 * 
 * Member 3: Authority Foundation
 * Note: Does NOT modify or overwrite citizen mockIssues.js.
 * This file provides mock authority operational records and helper
 * query functions ready to connect to real backend API endpoints in future phases.
 */

export const DEPARTMENTS = [
  'All Departments',
  'Roads & Infrastructure',
  'Water Supply & Sewerage',
  'Solid Waste Management',
  'Electrical & Street Lighting',
  'Traffic Management',
  'Stormwater Drainage'
];

export const AUTHORITY_OFFICER = {
  name: 'Er. Rajesh Kulkarni',
  designation: 'Municipal Operations Commissioner',
  department: 'Central Municipal Administration',
  jurisdiction: 'Sangli-Miraj-Kupwad Municipal Corporation',
  officerId: 'MNC-OFF-4091',
  shift: 'Day Operations (08:00 - 18:00)',
  status: 'On Duty'
};

export const MOCK_AUTHORITY_COMPLAINTS = [
  {
    id: 'CIV-1001',
    title: 'Deep Pothole on Market Main Road',
    description: 'A dangerous 2-foot wide pothole has formed near the vegetable market intersection, causing severe vehicle slowdowns and two-wheeler accidents.',
    department: 'Roads & Infrastructure',
    category: 'Road & Potholes',
    location: 'Market Main Road, Opposite City Hospital, Ward 4',
    coordinates: '16.8524, 74.5815',
    severity: 'High',
    status: 'Resolved',
    isEscalated: false,
    reportedDate: '2026-09-15',
    resolutionDate: '2026-09-19',
    assignedOfficer: 'Officer S. Kulkarni (Crew #3)',
    slaHoursRemaining: 0,
    citizenName: 'Aarav Sharma'
  },
  {
    id: 'CIV-1002',
    title: 'Overflowing Community Garbage Bin',
    description: 'Public waste container overflowing for the past 4 days. Stray animals are scattering trash across the residential sidewalk.',
    department: 'Solid Waste Management',
    category: 'Garbage & Waste',
    location: 'Corner of 7th Cross, Green Park Extension, Ward 6',
    coordinates: '16.8560, 74.5890',
    severity: 'Medium',
    status: 'In Progress',
    isEscalated: false,
    reportedDate: '2026-09-17',
    resolutionDate: 'Expected Today',
    assignedOfficer: 'Sanitation Lead R. Jadhav',
    slaHoursRemaining: 6,
    citizenName: 'Priya Patel'
  },
  {
    id: 'CIV-1003',
    title: 'Non-Functional Streetlights on School Road',
    description: 'Three consecutive solar streetlights are dark after sunset. Poses a serious safety hazard for children and evening pedestrians.',
    department: 'Electrical & Street Lighting',
    category: 'Streetlight',
    location: 'Shivaji High School Approach Road, Sector 3',
    coordinates: '16.8480, 74.5760',
    severity: 'High',
    status: 'Assigned',
    isEscalated: false,
    reportedDate: '2026-09-18',
    resolutionDate: '2026-09-22',
    assignedOfficer: 'Junior Engineer V. Patil',
    slaHoursRemaining: 18,
    citizenName: 'Manoj Deshmukh'
  },
  {
    id: 'CIV-1004',
    title: 'Drinking Water Pipeline Major Leakage',
    description: 'Clean drinking water gushing from underground pipeline joint near water tanker stand, flooding the road.',
    department: 'Water Supply & Sewerage',
    category: 'Water Supply',
    location: 'Near Old Water Tank, Ward No. 12',
    coordinates: '16.8610, 74.5950',
    severity: 'Critical',
    status: 'Under Review',
    isEscalated: true,
    reportedDate: '2026-09-19',
    resolutionDate: 'Immediate Priority',
    assignedOfficer: 'Triage Pending',
    slaHoursRemaining: 2,
    citizenName: 'Anjali Shinde'
  },
  {
    id: 'CIV-1005',
    title: 'Broken Traffic Signal Timer at Junction',
    description: 'Traffic light stuck on blinking amber since yesterday morning, leading to major bottleneck during peak office hours.',
    department: 'Traffic Management',
    category: 'Traffic & Signals',
    location: 'Station Road & Bypass Junction, Ward 1',
    coordinates: '16.8505, 74.5720',
    severity: 'Medium',
    status: 'Submitted',
    isEscalated: false,
    reportedDate: '2026-09-20',
    resolutionDate: 'Pending Assignment',
    assignedOfficer: 'Unassigned',
    slaHoursRemaining: 24,
    citizenName: 'Rahul Verma'
  },
  {
    id: 'CIV-1006',
    title: 'Blocked Storm Drain Causing Waterlogging',
    description: 'Monsoon drain blocked by construction debris, causing foul-smelling stagnant water outside residential apartments.',
    department: 'Stormwater Drainage',
    category: 'Drainage & Sewage',
    location: 'Behind Sunshine Towers, Lotus Colony, Ward 8',
    coordinates: '16.8580, 74.5840',
    severity: 'High',
    status: 'In Progress',
    isEscalated: false,
    reportedDate: '2026-09-17',
    resolutionDate: '2026-09-21',
    assignedOfficer: 'Drainage Inspector K. Naik',
    slaHoursRemaining: 14,
    citizenName: 'Sneha Joshi'
  },
  {
    id: 'CIV-1007',
    title: 'Hazardous Open Manhole Without Safety Barricade',
    description: 'Cast-iron sewer manhole cover broken by heavy vehicle. Unprotected gap in road center posing immediate fatal danger.',
    department: 'Water Supply & Sewerage',
    category: 'Drainage & Sewage',
    location: 'College Road, Opp Commerce College Gate',
    coordinates: '16.8540, 74.5790',
    severity: 'Critical',
    status: 'Assigned',
    isEscalated: true,
    reportedDate: '2026-09-20',
    resolutionDate: 'Urgent 4h SLA',
    assignedOfficer: 'Emergency Squad #1',
    slaHoursRemaining: 1,
    citizenName: 'Kunal Patil'
  },
  {
    id: 'CIV-1008',
    title: 'Uncollected Industrial Garbage Dump',
    description: 'Unauthorized commercial dumping of packaging plastic and rotting market organic matter creating health risk.',
    department: 'Solid Waste Management',
    category: 'Garbage & Waste',
    location: 'Industrial Estate Lane 2, Kupwad Road',
    coordinates: '16.8650, 74.6100',
    severity: 'Medium',
    status: 'Submitted',
    isEscalated: false,
    reportedDate: '2026-09-20',
    resolutionDate: 'Pending Review',
    assignedOfficer: 'Unassigned',
    slaHoursRemaining: 30,
    citizenName: 'Sanjay More'
  }
];

/**
 * Calculates operational metrics for a given department.
 * @param {string} department - Selected department or 'All Departments'
 * @returns {object} Calculated KPI counts
 */
export const calculateDepartmentMetrics = (department = 'All Departments') => {
  const filtered = department === 'All Departments'
    ? MOCK_AUTHORITY_COMPLAINTS
    : MOCK_AUTHORITY_COMPLAINTS.filter((c) => c.department === department);

  const total = filtered.length;
  const pending = filtered.filter(
    (c) => c.status === 'Submitted' || c.status === 'Under Review'
  ).length;
  const inProgress = filtered.filter(
    (c) => c.status === 'Assigned' || c.status === 'In Progress'
  ).length;
  const resolved = filtered.filter((c) => c.status === 'Resolved').length;
  const escalated = filtered.filter((c) => c.isEscalated || c.status === 'Escalated').length;
  const critical = filtered.filter((c) => c.severity === 'Critical').length;

  return {
    totalComplaints: total,
    pending,
    inProgress,
    resolved,
    escalated,
    criticalIssues: critical
  };
};

/**
 * Retrieves recent complaints filtered by department.
 * @param {string} department - Selected department or 'All Departments'
 * @param {number} limit - Maximum number of items
 * @returns {Array} List of complaints
 */
export const getRecentDepartmentComplaints = (department = 'All Departments', limit = 6) => {
  const list = department === 'All Departments'
    ? MOCK_AUTHORITY_COMPLAINTS
    : MOCK_AUTHORITY_COMPLAINTS.filter((c) => c.department === department);

  return list.slice(0, limit);
};
