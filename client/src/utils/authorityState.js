/**
 * Isolated state and data layer for Authority / Department Dashboard.
 * 
 * Member 3: Authority Foundation & Complaint Management Workflow
 * Note: Does NOT modify or overwrite citizen mockIssues.js.
 * This file provides mock authority operational records, AI triage analysis,
 * and state mutation helper functions ready to connect to real backend API endpoints.
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

export const STATUS_OPTIONS = [
  'Pending',
  'Assigned',
  'In Progress',
  'Resolved',
  'Escalated'
];

export const SEVERITY_OPTIONS = [
  'Critical',
  'High',
  'Medium',
  'Low'
];

export const PRIORITY_OPTIONS = [
  'Critical',
  'High',
  'Medium',
  'Low'
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

export const AVAILABLE_OFFICERS = [
  { id: 'OFF-101', name: 'Officer S. Kulkarni', department: 'Roads & Infrastructure', role: 'Field Crew Lead #3' },
  { id: 'OFF-102', name: 'Sanitation Lead R. Jadhav', department: 'Solid Waste Management', role: 'Zonal Inspector' },
  { id: 'OFF-103', name: 'Junior Engineer V. Patil', department: 'Electrical & Street Lighting', role: 'Grid Specialist' },
  { id: 'OFF-104', name: 'Assistant Engineer M. Shinde', department: 'Water Supply & Sewerage', role: 'Emergency Response Lead' },
  { id: 'OFF-105', name: 'Inspector A. Bhosale', department: 'Traffic Management', role: 'Signal & Corridor Tech' },
  { id: 'OFF-106', name: 'Drainage Inspector K. Naik', department: 'Stormwater Drainage', role: 'Culvert & Drain Supervisor' },
  { id: 'OFF-107', name: 'Emergency Squad #1', department: 'Water Supply & Sewerage', role: 'Rapid Intervention Team' },
  { id: 'OFF-108', name: 'Zonal Squad Lead D. Pawar', department: 'Roads & Infrastructure', role: 'Asphalt & Paving Unit' }
];

export const INITIAL_AUTHORITY_COMPLAINTS = [
  {
    id: 'CIV-1001',
    title: 'Deep Pothole on Market Main Road',
    description: 'A dangerous 2-foot wide pothole has formed near the vegetable market intersection, causing severe vehicle slowdowns and two-wheeler accidents.',
    department: 'Roads & Infrastructure',
    issueType: 'Road & Potholes',
    category: 'Road & Potholes',
    location: 'Market Main Road, Opposite City Hospital, Ward 4',
    coordinates: '16.8524, 74.5815',
    severity: 'High',
    priority: 'High',
    status: 'Resolved',
    isEscalated: false,
    createdDate: '2026-09-15 09:30 AM',
    updatedDate: '2026-09-19 04:30 PM',
    reportedDate: '2026-09-15',
    resolutionDate: '2026-09-19',
    assignedOfficer: 'Officer S. Kulkarni (Crew #3)',
    eta: 'Completed on 2026-09-19',
    citizenName: 'Aarav Sharma',
    citizenContact: '+91 98220 44102',
    citizenEvidence: {
      hasImage: true,
      imageDescription: 'Citizen photograph showing 2-ft crater on road center with visible asphalt breakage.',
      submittedNotes: 'Dangerous for evening motorcyclists and school vans.'
    },
    aiAnalysis: {
      issue: 'pothole',
      severity: 'high',
      priority: 'high',
      department: 'Roads & Infrastructure',
      sla_hours: 48,
      action: 'inspect_and_repair',
      confidence: 0.94,
      reason: 'Deep road cavity in high-density transit sector with elevated hazard index for two-wheelers.'
    },
    authorityNotes: [
      { date: '2026-09-16 09:00 AM', officer: 'Er. Rajesh Kulkarni', text: 'Triaged and routed to Ward 4 road maintenance squad.' },
      { date: '2026-09-17 10:30 AM', officer: 'Officer S. Kulkarni', text: 'Bitumen and gravel materials dispatched to site.' },
      { date: '2026-09-19 04:30 PM', officer: 'Officer S. Kulkarni', text: 'Asphalt compaction verified. Road surface leveled.' }
    ],
    timeline: [
      { id: 't1', title: 'Complaint received', type: 'received', timestamp: '2026-09-15 09:30 AM', actor: 'Citizen Aarav Sharma', description: 'Complaint registered via citizen mobile interface with GPS location.' },
      { id: 't2', title: 'AI analysis completed', type: 'ai', timestamp: '2026-09-15 09:32 AM', actor: 'Civic AI Engine (Gemini)', description: 'Categorized as Road Hazard. Severity marked High (0.94 confidence).' },
      { id: 't3', title: 'Department assigned', type: 'assigned', timestamp: '2026-09-16 08:45 AM', actor: 'Municipal Operations Commissioner', description: 'Routed to Roads & Infrastructure Department - Zone 2.' },
      { id: 't4', title: 'Authority reviewed', type: 'review', timestamp: '2026-09-17 10:00 AM', actor: 'Officer S. Kulkarni', description: 'Field crew #3 inspection confirmed severity; dispatch initiated.' },
      { id: 't5', title: 'Status changed', type: 'status', timestamp: '2026-09-19 04:30 PM', actor: 'Officer S. Kulkarni', description: 'Status moved to Resolved following road leveling.' }
    ]
  },
  {
    id: 'CIV-1002',
    title: 'Overflowing Community Garbage Bin',
    description: 'Public waste container overflowing for the past 4 days. Stray animals are scattering trash across the residential sidewalk.',
    department: 'Solid Waste Management',
    issueType: 'Garbage & Waste',
    category: 'Garbage & Waste',
    location: 'Corner of 7th Cross, Green Park Extension, Ward 6',
    coordinates: '16.8560, 74.5890',
    severity: 'Medium',
    priority: 'Medium',
    status: 'In Progress',
    isEscalated: false,
    createdDate: '2026-09-17 08:10 AM',
    updatedDate: '2026-09-18 07:30 AM',
    reportedDate: '2026-09-17',
    resolutionDate: 'Expected Today',
    assignedOfficer: 'Sanitation Lead R. Jadhav',
    eta: '2026-09-20 18:00',
    citizenName: 'Priya Patel',
    citizenContact: '+91 98223 88190',
    citizenEvidence: {
      hasImage: true,
      imageDescription: 'Citizen upload showing metal waste bin overflowing onto pedestrian walkway.',
      submittedNotes: 'Foul odor affecting adjacent residential units for 4 consecutive days.'
    },
    aiAnalysis: {
      issue: 'garbage_overflow',
      severity: 'medium',
      priority: 'medium',
      department: 'Solid Waste Management',
      sla_hours: 24,
      action: 'dispatch_compactor_and_sanitize',
      confidence: 0.91,
      reason: 'Accumulation of decomposing municipal solid waste near residential zone.'
    },
    authorityNotes: [
      { date: '2026-09-17 09:40 AM', officer: 'Er. Rajesh Kulkarni', text: 'Verified against ward sanitation roster. Added to high-priority compactor route.' },
      { date: '2026-09-18 07:30 AM', officer: 'Sanitation Lead R. Jadhav', text: 'Refuse vehicle 04 en route with bleaching powder disinfectant team.' }
    ],
    timeline: [
      { id: 't1', title: 'Complaint received', type: 'received', timestamp: '2026-09-17 08:10 AM', actor: 'Citizen Priya Patel', description: 'Photo of overflowing dump container submitted.' },
      { id: 't2', title: 'AI analysis completed', type: 'ai', timestamp: '2026-09-17 08:12 AM', actor: 'Civic AI Engine (Gemini)', description: 'Classification: Sanitation Hazard. Recommended SLA 24h.' },
      { id: 't3', title: 'Department assigned', type: 'assigned', timestamp: '2026-09-17 02:00 PM', actor: 'Municipal Operations Desk', description: 'Assigned to Solid Waste Management Division - Ward 6.' },
      { id: 't4', title: 'Authority reviewed', type: 'review', timestamp: '2026-09-18 07:00 AM', actor: 'Sanitation Lead R. Jadhav', description: 'Route planned for heavy compactor clearance.' },
      { id: 't5', title: 'Status changed', type: 'status', timestamp: '2026-09-18 07:30 AM', actor: 'Sanitation Lead R. Jadhav', description: 'Status updated to In Progress. Field crew deployed.' }
    ]
  },
  {
    id: 'CIV-1003',
    title: 'Non-Functional Streetlights on School Road',
    description: 'Three consecutive solar streetlights are dark after sunset. Poses a serious safety hazard for children and evening pedestrians.',
    department: 'Electrical & Street Lighting',
    issueType: 'Streetlight',
    category: 'Streetlight',
    location: 'Shivaji High School Approach Road, Sector 3',
    coordinates: '16.8480, 74.5760',
    severity: 'High',
    priority: 'High',
    status: 'Assigned',
    isEscalated: false,
    createdDate: '2026-09-18 07:45 PM',
    updatedDate: '2026-09-19 01:15 PM',
    reportedDate: '2026-09-18',
    resolutionDate: '2026-09-22',
    assignedOfficer: 'Junior Engineer V. Patil',
    eta: '2026-09-22 14:00',
    citizenName: 'Manoj Deshmukh',
    citizenContact: '+91 97632 11984',
    citizenEvidence: {
      hasImage: false,
      imageDescription: 'Citizen reported night-time darkness along 150m school corridor.',
      submittedNotes: 'Students returning from tuition after 7 PM face pitch dark stretch.'
    },
    aiAnalysis: {
      issue: 'street_lighting_failure',
      severity: 'high',
      priority: 'high',
      department: 'Electrical & Street Lighting',
      sla_hours: 48,
      action: 'inspect_luminaire_and_battery',
      confidence: 0.88,
      reason: 'Critical night corridor outside educational institution lacking illumination.'
    },
    authorityNotes: [
      { date: '2026-09-19 01:15 PM', officer: 'Junior Engineer V. Patil', text: 'Pole numbers SL-88 to SL-90 identified. Replacement solar inverter ordered.' }
    ],
    timeline: [
      { id: 't1', title: 'Complaint received', type: 'received', timestamp: '2026-09-18 07:45 PM', actor: 'Citizen Manoj Deshmukh', description: 'Complaint lodged regarding dark street corridor.' },
      { id: 't2', title: 'AI analysis completed', type: 'ai', timestamp: '2026-09-18 07:47 PM', actor: 'Civic AI Engine (Gemini)', description: 'Public Safety & Electrical tag applied. Priority High.' },
      { id: 't3', title: 'Department assigned', type: 'assigned', timestamp: '2026-09-19 08:30 AM', actor: 'Central Municipal Administration', description: 'Transferred to Electrical Engineering & Street Lighting.' },
      { id: 't4', title: 'Authority reviewed', type: 'review', timestamp: '2026-09-19 01:15 PM', actor: 'Junior Engineer V. Patil', description: 'Physical inspection scheduled with electrical maintenance contractor.' }
    ]
  },
  {
    id: 'CIV-1004',
    title: 'Drinking Water Pipeline Major Leakage',
    description: 'Clean drinking water gushing from underground pipeline joint near water tanker stand, flooding the road.',
    department: 'Water Supply & Sewerage',
    issueType: 'Water Supply',
    category: 'Water Supply',
    location: 'Near Old Water Tank, Ward No. 12',
    coordinates: '16.8610, 74.5950',
    severity: 'Critical',
    priority: 'Critical',
    status: 'Pending',
    isEscalated: true,
    createdDate: '2026-09-19 06:20 AM',
    updatedDate: '2026-09-19 07:00 AM',
    reportedDate: '2026-09-19',
    resolutionDate: 'Immediate Priority',
    assignedOfficer: 'Assistant Engineer M. Shinde',
    eta: '2026-09-20 12:00',
    citizenName: 'Anjali Shinde',
    citizenContact: '+91 94224 55091',
    citizenEvidence: {
      hasImage: true,
      imageDescription: 'Citizen video snapshot showing pressurized water geyser emerging through macadam pavement.',
      submittedNotes: 'High volume potable water waste; water pressure dropping in entire ward.'
    },
    aiAnalysis: {
      issue: 'water_main_rupture',
      severity: 'critical',
      priority: 'critical',
      department: 'Water Supply & Sewerage',
      sla_hours: 4,
      action: 'emergency_valve_shutoff_and_excavation',
      confidence: 0.97,
      reason: 'Pressurized distribution pipe rupture causing resource wastage and road foundation erosion.'
    },
    authorityNotes: [
      { date: '2026-09-19 07:00 AM', officer: 'Er. Rajesh Kulkarni', text: 'Escalated to Emergency Valve Control Room. Pressure throttling requested.' }
    ],
    timeline: [
      { id: 't1', title: 'Complaint received', type: 'received', timestamp: '2026-09-19 06:20 AM', actor: 'Citizen Anjali Shinde', description: 'Urgent leak reported with geotagged coordinates.' },
      { id: 't2', title: 'AI analysis completed', type: 'ai', timestamp: '2026-09-19 06:22 AM', actor: 'Civic AI Engine (Gemini)', description: 'Critical utility rupture detected. Auto-escalated to Level-1 Priority.' },
      { id: 't3', title: 'Authority reviewed', type: 'review', timestamp: '2026-09-19 07:00 AM', actor: 'Er. Rajesh Kulkarni', description: 'Marked Escalated. Dispatched notification to Water Board.' }
    ]
  },
  {
    id: 'CIV-1005',
    title: 'Broken Traffic Signal Timer at Junction',
    description: 'Traffic light stuck on blinking amber since yesterday morning, leading to major bottleneck during peak office hours.',
    department: 'Traffic Management',
    issueType: 'Traffic & Signals',
    category: 'Traffic & Signals',
    location: 'Station Road & Bypass Junction, Ward 1',
    coordinates: '16.8505, 74.5720',
    severity: 'Medium',
    priority: 'Medium',
    status: 'Pending',
    isEscalated: false,
    createdDate: '2026-09-20 08:00 AM',
    updatedDate: '2026-09-20 08:30 AM',
    reportedDate: '2026-09-20',
    resolutionDate: 'Pending Assignment',
    assignedOfficer: 'Unassigned',
    eta: '2026-09-21 17:00',
    citizenName: 'Rahul Verma',
    citizenContact: '+91 91580 33411',
    citizenEvidence: {
      hasImage: false,
      imageDescription: 'Citizen reported junction lock due to timer board outage.',
      submittedNotes: 'Traffic police constable managing manually.'
    },
    aiAnalysis: {
      issue: 'traffic_signal_outage',
      severity: 'medium',
      priority: 'medium',
      department: 'Traffic Management',
      sla_hours: 24,
      action: 'reboot_controller_and_test_sensors',
      confidence: 0.90,
      reason: 'Electronic controller timer drift causing intersection gridlock.'
    },
    authorityNotes: [],
    timeline: [
      { id: 't1', title: 'Complaint received', type: 'received', timestamp: '2026-09-20 08:00 AM', actor: 'Citizen Rahul Verma', description: 'Complaint logged via citizen app.' },
      { id: 't2', title: 'AI analysis completed', type: 'ai', timestamp: '2026-09-20 08:02 AM', actor: 'Civic AI Engine (Gemini)', description: 'Triage: Traffic Signal Controller fault. 24h SLA.' }
    ]
  },
  {
    id: 'CIV-1006',
    title: 'Blocked Storm Drain Causing Waterlogging',
    description: 'Monsoon drain blocked by construction debris, causing foul-smelling stagnant water outside residential apartments.',
    department: 'Stormwater Drainage',
    issueType: 'Drainage & Sewage',
    category: 'Drainage & Sewage',
    location: 'Behind Sunshine Towers, Lotus Colony, Ward 8',
    coordinates: '16.8580, 74.5840',
    severity: 'High',
    priority: 'High',
    status: 'In Progress',
    isEscalated: false,
    createdDate: '2026-09-17 11:20 AM',
    updatedDate: '2026-09-19 11:00 AM',
    reportedDate: '2026-09-17',
    resolutionDate: '2026-09-21',
    assignedOfficer: 'Drainage Inspector K. Naik',
    eta: '2026-09-21 16:00',
    citizenName: 'Sneha Joshi',
    citizenContact: '+91 98810 66205',
    citizenEvidence: {
      hasImage: true,
      imageDescription: 'Photo showing muddy stagnant pool 30 meters long accumulating beside housing society entrance.',
      submittedNotes: 'Mosquito breeding and foul smell. Pedestrians unable to cross.'
    },
    aiAnalysis: {
      issue: 'stormwater_obstruction',
      severity: 'high',
      priority: 'high',
      department: 'Stormwater Drainage',
      sla_hours: 48,
      action: 'deploy_suction_excavator',
      confidence: 0.93,
      reason: 'Debris impediment in municipal culvert creating environmental hygiene hazard.'
    },
    authorityNotes: [
      { date: '2026-09-18 09:30 AM', officer: 'Drainage Inspector K. Naik', text: 'Site visited. Cement debris dumping noticed. Suction vehicle requisitioned.' },
      { date: '2026-09-19 11:00 AM', officer: 'Drainage Inspector K. Naik', text: 'Excavation team on site; cleared 15 meters of blockage.' }
    ],
    timeline: [
      { id: 't1', title: 'Complaint received', type: 'received', timestamp: '2026-09-17 11:20 AM', actor: 'Citizen Sneha Joshi', description: 'Grievance submitted with location photos.' },
      { id: 't2', title: 'AI analysis completed', type: 'ai', timestamp: '2026-09-17 11:22 AM', actor: 'Civic AI Engine (Gemini)', description: 'Tagged Drainage & Waterlogging. High urgency.' },
      { id: 't3', title: 'Department assigned', type: 'assigned', timestamp: '2026-09-18 09:30 AM', actor: 'Municipal Operations Desk', description: 'Routed to Stormwater Drainage Department.' },
      { id: 't4', title: 'Authority reviewed', type: 'review', timestamp: '2026-09-18 10:00 AM', actor: 'Drainage Inspector K. Naik', description: 'Inspection conducted, suction equipment requisitioned.' },
      { id: 't5', title: 'Status changed', type: 'status', timestamp: '2026-09-19 11:00 AM', actor: 'Drainage Inspector K. Naik', description: 'Work underway. Status moved to In Progress.' }
    ]
  },
  {
    id: 'CIV-1007',
    title: 'Hazardous Open Manhole Without Safety Barricade',
    description: 'Cast-iron sewer manhole cover broken by heavy vehicle. Unprotected gap in road center posing immediate fatal danger.',
    department: 'Water Supply & Sewerage',
    issueType: 'Drainage & Sewage',
    category: 'Drainage & Sewage',
    location: 'College Road, Opp Commerce College Gate',
    coordinates: '16.8540, 74.5790',
    severity: 'Critical',
    priority: 'Critical',
    status: 'Escalated',
    isEscalated: true,
    createdDate: '2026-09-20 07:15 AM',
    updatedDate: '2026-09-20 09:00 AM',
    reportedDate: '2026-09-20',
    resolutionDate: 'Urgent 4h SLA',
    assignedOfficer: 'Emergency Squad #1',
    eta: '2026-09-20 13:00',
    citizenName: 'Kunal Patil',
    citizenContact: '+91 99750 12890',
    citizenEvidence: {
      hasImage: true,
      imageDescription: 'Citizen picture showing deep open chamber directly in carriage lane without barricading or warning cones.',
      submittedNotes: 'A bike narrowly avoided falling in this morning! Immediate barricade needed.'
    },
    aiAnalysis: {
      issue: 'open_manhole_hazard',
      severity: 'critical',
      priority: 'critical',
      department: 'Water Supply & Sewerage',
      sla_hours: 4,
      action: 'install_emergency_barricade_and_replace_cover',
      confidence: 0.98,
      reason: 'Extreme physical fall hazard in high-traffic carriage lane with immediate risk to human life.'
    },
    authorityNotes: [
      { date: '2026-09-20 08:30 AM', officer: 'Er. Rajesh Kulkarni', text: 'Emergency warning: Yellow cones and reflective drums dispatched.' },
      { date: '2026-09-20 09:00 AM', officer: 'Emergency Squad #1', text: 'Barricade installed on site. Heavy-duty ductile iron cover being transported from central yard.' }
    ],
    timeline: [
      { id: 't1', title: 'Complaint received', type: 'received', timestamp: '2026-09-20 07:15 AM', actor: 'Citizen Kunal Patil', description: 'Urgent alert submitted with photo evidence.' },
      { id: 't2', title: 'AI analysis completed', type: 'ai', timestamp: '2026-09-20 07:16 AM', actor: 'Civic AI Engine (Gemini)', description: 'Critical Life-Safety hazard detected (0.98 confidence). Immediate SLA triggered.' },
      { id: 't3', title: 'Department assigned', type: 'assigned', timestamp: '2026-09-20 07:30 AM', actor: 'Emergency Triage Desk', description: 'Dispatched directly to Emergency Squad #1.' },
      { id: 't4', title: 'Status changed', type: 'status', timestamp: '2026-09-20 08:30 AM', actor: 'Er. Rajesh Kulkarni', description: 'Status escalated to Escalated due to imminent traffic danger.' }
    ]
  },
  {
    id: 'CIV-1008',
    title: 'Uncollected Industrial Garbage Dump',
    description: 'Unauthorized commercial dumping of packaging plastic and rotting market organic matter creating health risk.',
    department: 'Solid Waste Management',
    issueType: 'Garbage & Waste',
    category: 'Garbage & Waste',
    location: 'Industrial Estate Lane 2, Kupwad Road',
    coordinates: '16.8650, 74.6100',
    severity: 'Medium',
    priority: 'Low',
    status: 'Pending',
    isEscalated: false,
    createdDate: '2026-09-20 08:45 AM',
    updatedDate: '2026-09-20 08:45 AM',
    reportedDate: '2026-09-20',
    resolutionDate: 'Pending Review',
    assignedOfficer: 'Unassigned',
    eta: '2026-09-22 18:00',
    citizenName: 'Sanjay More',
    citizenContact: '+91 98231 77410',
    citizenEvidence: {
      hasImage: false,
      imageDescription: 'Citizen reported commercial waste heap accumulating behind factory shed.',
      submittedNotes: 'Requires industrial dumper truck.'
    },
    aiAnalysis: {
      issue: 'illegal_commercial_dumping',
      severity: 'medium',
      priority: 'low',
      department: 'Solid Waste Management',
      sla_hours: 48,
      action: 'issue_sanitation_notice_and_clear',
      confidence: 0.89,
      reason: 'Secondary industrial zone non-hazardous solid waste buildup.'
    },
    authorityNotes: [],
    timeline: [
      { id: 't1', title: 'Complaint received', type: 'received', timestamp: '2026-09-20 08:45 AM', actor: 'Citizen Sanjay More', description: 'Commercial grievance logged.' },
      { id: 't2', title: 'AI analysis completed', type: 'ai', timestamp: '2026-09-20 08:46 AM', actor: 'Civic AI Engine (Gemini)', description: 'Classified: Solid Waste. Standard 48h resolution SLA.' }
    ]
  }
];

const STORAGE_KEY = 'bytebloom_authority_complaints_v2';

/**
 * Loads authority complaints from localStorage if available, or returns initial seed.
 */
export const getStoredAuthorityComplaints = () => {
  if (typeof window === 'undefined') return INITIAL_AUTHORITY_COMPLAINTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading authority complaints from storage:', err);
  }
  return INITIAL_AUTHORITY_COMPLAINTS;
};

/**
 * Saves authority complaints to localStorage and dispatches a local event.
 */
export const saveAuthorityComplaints = (complaints) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    window.dispatchEvent(new CustomEvent('authority-state-change', { detail: complaints }));
  } catch (err) {
    console.error('Error saving authority complaints to storage:', err);
  }
};

/**
 * Retrieves a single complaint by ID.
 */
export const getAuthorityComplaintById = (id) => {
  const list = getStoredAuthorityComplaints();
  return list.find((item) => item.id.toUpperCase() === id.toUpperCase()) || null;
};

/**
 * Updates a complaint with authority actions (assign officer, change status, add note, set ETA).
 */
export const updateAuthorityComplaint = (id, { officer, status, note, eta }) => {
  const currentList = getStoredAuthorityComplaints();
  const index = currentList.findIndex((item) => item.id.toUpperCase() === id.toUpperCase());
  if (index === -1) return null;

  const prev = currentList[index];
  const nowFormatted = new Date().toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  });

  const updatedNotes = [...(prev.authorityNotes || [])];
  if (note && note.trim()) {
    updatedNotes.push({
      date: nowFormatted,
      officer: officer || prev.assignedOfficer || AUTHORITY_OFFICER.name,
      text: note.trim()
    });
  }

  const updatedTimeline = [...(prev.timeline || [])];
  
  // If officer assignment changed
  if (officer && officer !== prev.assignedOfficer && officer !== 'Unassigned') {
    updatedTimeline.push({
      id: `t-${Date.now()}-assign`,
      title: 'Department assigned',
      type: 'assigned',
      timestamp: nowFormatted,
      actor: AUTHORITY_OFFICER.name,
      description: `Assigned field officer: ${officer}`
    });
  }

  // If status changed
  if (status && status !== prev.status) {
    updatedTimeline.push({
      id: `t-${Date.now()}-status`,
      title: 'Status changed',
      type: 'status',
      timestamp: nowFormatted,
      actor: AUTHORITY_OFFICER.name,
      description: `Operational status updated from "${prev.status}" to "${status}"`
    });
  }

  // If note added
  if (note && note.trim()) {
    updatedTimeline.push({
      id: `t-${Date.now()}-note`,
      title: 'Authority reviewed',
      type: 'review',
      timestamp: nowFormatted,
      actor: AUTHORITY_OFFICER.name,
      description: note.trim()
    });
  }

  const updatedItem = {
    ...prev,
    assignedOfficer: officer || prev.assignedOfficer,
    status: status || prev.status,
    isEscalated: status === 'Escalated' ? true : prev.isEscalated,
    eta: eta || prev.eta,
    updatedDate: nowFormatted,
    authorityNotes: updatedNotes,
    timeline: updatedTimeline
  };

  currentList[index] = updatedItem;
  saveAuthorityComplaints(currentList);
  return updatedItem;
};

/**
 * Calculates operational metrics for a given department.
 */
export const calculateDepartmentMetrics = (department = 'All Departments') => {
  const list = getStoredAuthorityComplaints();
  const filtered = department === 'All Departments'
    ? list
    : list.filter((c) => c.department === department);

  const total = filtered.length;
  const pending = filtered.filter(
    (c) => c.status === 'Pending' || c.status === 'Submitted' || c.status === 'Under Review'
  ).length;
  const inProgress = filtered.filter(
    (c) => c.status === 'Assigned' || c.status === 'In Progress'
  ).length;
  const resolved = filtered.filter((c) => c.status === 'Resolved').length;
  const escalated = filtered.filter((c) => c.isEscalated || c.status === 'Escalated').length;
  const critical = filtered.filter((c) => c.severity === 'Critical' || c.priority === 'Critical').length;

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
 */
export const getRecentDepartmentComplaints = (department = 'All Departments', limit = 6) => {
  const list = getStoredAuthorityComplaints();
  const filtered = department === 'All Departments'
    ? list
    : list.filter((c) => c.department === department);

  return filtered.slice(0, limit);
};
