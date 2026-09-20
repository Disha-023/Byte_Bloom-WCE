/**
 * Mock issue data for frontend demonstration in Phase 3.
 * Note: This is client-side mock data and is not connected to a live database or backend API.
 */

export const STATUSES = [
  'All',
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved'
];

export const CATEGORIES = [
  'All Categories',
  'Road & Potholes',
  'Garbage & Waste',
  'Streetlight',
  'Water Supply',
  'Drainage & Sewage',
  'Public Transport',
  'Traffic & Signals',
  'Public Safety',
  'Other'
];

export const TIMELINE_STAGES = [
  { key: 'Submitted', label: 'Submitted', desc: 'Issue registered in system' },
  { key: 'Under Review', label: 'Under Review', desc: 'Triaged and verified by civic team' },
  { key: 'Assigned', label: 'Assigned', desc: 'Routed to responsible department' },
  { key: 'In Progress', label: 'In Progress', desc: 'Field crew dispatched for resolution' },
  { key: 'Resolved', label: 'Resolved', desc: 'Work completed and verified' }
];

export const MOCK_ISSUES = [
  {
    id: 'CIV-1001',
    title: 'Deep Pothole on Market Main Road',
    description: 'A dangerous 2-foot wide pothole has formed near the vegetable market intersection, causing severe vehicle slowdowns and two-wheeler accidents.',
    category: 'Road & Potholes',
    location: 'Market Main Road, Opposite City Hospital, Ward 4',
    coordinates: '16.8524, 74.5815',
    severity: 'High',
    reportedDate: '2026-09-15',
    status: 'Resolved',
    submittedBy: 'Aarav Sharma',
    department: 'Roads & Infrastructure Department',
    resolutionDate: '2026-09-19',
    assignedOfficer: 'Officer S. Kulkarni (Field Crew #3)',
    updates: [
      { stage: 'Submitted', date: '2026-09-15 09:30 AM', note: 'Issue submitted by citizen with location coordinates.' },
      { stage: 'Under Review', date: '2026-09-15 11:15 AM', note: 'Issue verified by automated civic triage and flagged High priority.' },
      { stage: 'Assigned', date: '2026-09-16 08:45 AM', note: 'Assigned to Roads & Infrastructure Department - Zone 2.' },
      { stage: 'In Progress', date: '2026-09-17 10:00 AM', note: 'Patching material and asphalt repair team on site.' },
      { stage: 'Resolved', date: '2026-09-19 04:30 PM', note: 'Pothole filled, asphalt compacted, and traffic flow restored.' }
    ]
  },
  {
    id: 'CIV-1002',
    title: 'Overflowing Community Garbage Bin',
    description: 'Public waste container overflowing for the past 4 days. Stray animals are scattering trash across the residential sidewalk.',
    category: 'Garbage & Waste',
    location: 'Corner of 7th Cross, Green Park Extension',
    coordinates: '16.8560, 74.5890',
    severity: 'Medium',
    reportedDate: '2026-09-17',
    status: 'In Progress',
    submittedBy: 'Priya Patel',
    department: 'Solid Waste Management Division',
    resolutionDate: 'Expected today',
    assignedOfficer: 'Sanitation Lead R. Jadhav',
    updates: [
      { stage: 'Submitted', date: '2026-09-17 08:10 AM', note: 'Resident reported overflowing waste container.' },
      { stage: 'Under Review', date: '2026-09-17 09:40 AM', note: 'Categorized under Sanitation & Solid Waste Management.' },
      { stage: 'Assigned', date: '2026-09-17 02:00 PM', note: 'Scheduled for daily compactor collection route.' },
      { stage: 'In Progress', date: '2026-09-18 07:30 AM', note: 'Garbage collection truck and cleanup squad dispatched.' }
    ]
  },
  {
    id: 'CIV-1003',
    title: 'Non-Functional Streetlights on School Road',
    description: 'Three consecutive solar streetlights are dark after sunset. Poses a serious safety hazard for children and evening pedestrians.',
    category: 'Streetlight',
    location: 'Shivaji High School Approach Road, Sector 3',
    coordinates: '16.8480, 74.5760',
    severity: 'High',
    reportedDate: '2026-09-18',
    status: 'Assigned',
    submittedBy: 'Manoj Deshmukh',
    department: 'Electrical Engineering & Street Lighting',
    resolutionDate: '2026-09-22',
    assignedOfficer: 'Junior Engineer V. Patil',
    updates: [
      { stage: 'Submitted', date: '2026-09-18 07:45 PM', note: 'Citizen reported dark street corridor outside school.' },
      { stage: 'Under Review', date: '2026-09-19 08:30 AM', note: 'Verified against municipal streetlight grid records.' },
      { stage: 'Assigned', date: '2026-09-19 01:15 PM', note: 'Assigned to Electrical maintenance contractor.' }
    ]
  },
  {
    id: 'CIV-1004',
    title: 'Drinking Water Pipeline Leakage',
    description: 'Clean drinking water gushing from underground pipeline joint near water tanker stand, flooding the road.',
    category: 'Water Supply',
    location: 'Near Old Water Tank, Ward No. 12',
    coordinates: '16.8610, 74.5950',
    severity: 'Critical',
    reportedDate: '2026-09-19',
    status: 'Under Review',
    submittedBy: 'Anjali Shinde',
    department: 'Water Supply & Sewerage Board',
    resolutionDate: 'Urgent attention required',
    assignedOfficer: 'Triage in progress',
    updates: [
      { stage: 'Submitted', date: '2026-09-19 06:20 AM', note: 'Critical water loss reported by local resident.' },
      { stage: 'Under Review', date: '2026-09-19 07:00 AM', note: 'Emergency water valve shutoff team notified for inspection.' }
    ]
  },
  {
    id: 'CIV-1005',
    title: 'Broken Traffic Signal Timer at Junction',
    description: 'Traffic light stuck on blinking amber since yesterday morning, leading to major bottleneck during peak office hours.',
    category: 'Traffic & Signals',
    location: 'Station Road & Bypass Junction',
    coordinates: '16.8505, 74.5720',
    severity: 'Medium',
    reportedDate: '2026-09-20',
    status: 'Submitted',
    submittedBy: 'Rahul Verma',
    department: 'Traffic Management & Police Cell',
    resolutionDate: 'Pending Review',
    assignedOfficer: 'Pending Assignment',
    updates: [
      { stage: 'Submitted', date: '2026-09-20 08:00 AM', note: 'Issue successfully logged into civic tracking system.' }
    ]
  },
  {
    id: 'CIV-1006',
    title: 'Blocked Drainage Causing Waterlogging',
    description: 'Monsoon drain blocked by construction debris, causing foul-smelling stagnant water outside residential apartments.',
    category: 'Drainage & Sewage',
    location: 'Behind Sunshine Towers, Lotus Colony',
    coordinates: '16.8580, 74.5840',
    severity: 'High',
    reportedDate: '2026-09-17',
    status: 'In Progress',
    submittedBy: 'Sneha Joshi',
    department: 'Stormwater Drainage Department',
    resolutionDate: '2026-09-21',
    assignedOfficer: 'Drainage Inspector K. Naik',
    updates: [
      { stage: 'Submitted', date: '2026-09-17 11:20 AM', note: 'Waterlogging complaint logged.' },
      { stage: 'Under Review', date: '2026-09-17 01:00 PM', note: 'Verified by zone supervisor.' },
      { stage: 'Assigned', date: '2026-09-18 09:30 AM', note: 'Drainage suction truck assigned.' },
      { stage: 'In Progress', date: '2026-09-19 11:00 AM', note: 'Excavation and debris clearing underway.' }
    ]
  }
];
