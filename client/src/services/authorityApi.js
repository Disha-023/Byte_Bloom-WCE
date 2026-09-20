/**
 * API-Ready Service Layer for Authority / Department Dashboard.
 * 
 * Member 3: Final Feature Set
 * 
 * This service acts as an abstraction barrier between the Authority UI components
 * and the underlying data layer. Currently, it resolves against the isolated
 * client-side authority state (localStorage / mock store).
 * 
 * When backend endpoints are integrated in future phases (e.g. /api/authority/*),
 * only this file needs to be updated with real fetch/axios calls; the UI components
 * will continue calling these identical service signatures.
 */

import {
  getStoredAuthorityComplaints,
  getAuthorityComplaintById as getByIdLocal,
  updateAuthorityComplaint as updateLocal,
  calculateDepartmentMetrics as calcMetricsLocal,
  DEPARTMENTS
} from '../utils/authorityState';

/**
 * Simulates network latency if needed for realistic async UI transitions.
 */
const simulateLatency = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches all authority complaints, optionally filtered by department or query.
 * @param {object} filters - { department, status, severity, priority, search }
 * @returns {Promise<Array>} List of complaint objects
 */
export const getAuthorityComplaints = async (filters = {}) => {
  await simulateLatency(30);
  const all = getStoredAuthorityComplaints();

  return all.filter((item) => {
    if (filters.department && filters.department !== 'All Departments' && item.department !== filters.department) {
      return false;
    }
    if (filters.status && filters.status !== 'All Statuses' && item.status !== filters.status) {
      return false;
    }
    if (filters.severity && filters.severity !== 'All Severities' && item.severity !== filters.severity) {
      return false;
    }
    if (filters.priority && filters.priority !== 'All Priorities' && item.priority !== filters.priority) {
      return false;
    }
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      const match =
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
};

/**
 * Retrieves a single complaint by its unique identifier.
 * @param {string} id - Complaint ID (e.g. CIV-1001)
 * @returns {Promise<object|null>} Complaint object or null
 */
export const getAuthorityComplaintById = async (id) => {
  await simulateLatency(20);
  return getByIdLocal(id);
};

/**
 * Updates the operational status and assigned details of a complaint.
 * @param {string} id - Complaint ID
 * @param {string} status - New operational status ('Pending', 'Assigned', 'In Progress', 'Resolved', 'Escalated')
 * @param {string} [notes] - Official departmental remarks
 * @param {string} [officer] - Assigned lead or crew
 * @param {string} [eta] - Expected resolution time
 * @returns {Promise<object|null>} Updated complaint record
 */
export const updateAuthorityComplaintStatus = async (id, status, notes = '', officer = '', eta = '') => {
  await simulateLatency(50);
  return updateLocal(id, {
    status,
    note: notes,
    officer,
    eta
  });
};

/**
 * Computes and returns aggregated municipal analytics, resolution KPIs,
 * issue distributions, and departmental workload summaries.
 * @param {string} department - Selected department scope or 'All Departments'
 * @returns {Promise<object>} Complete analytical dataset
 */
export const getAuthorityAnalytics = async (department = 'All Departments') => {
  await simulateLatency(40);
  const all = getStoredAuthorityComplaints();
  const scoped = department === 'All Departments'
    ? all
    : all.filter((item) => item.department === department);

  const total = scoped.length;
  const pending = scoped.filter(
    (c) => c.status === 'Pending' || c.status === 'Submitted' || c.status === 'Under Review'
  ).length;
  const inProgress = scoped.filter(
    (c) => c.status === 'Assigned' || c.status === 'In Progress'
  ).length;
  const resolved = scoped.filter((c) => c.status === 'Resolved').length;
  const escalated = scoped.filter((c) => c.isEscalated || c.status === 'Escalated').length;
  const critical = scoped.filter((c) => c.severity === 'Critical' || c.priority === 'Critical').length;

  // Resolution Rate calculation
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

  // Mock average resolution time (hours)
  const averageResolutionTimeHours = 28.4;
  const averageResolutionTime = '28.4 Hours';

  // Issue Type breakdown
  const byIssueType = {};
  scoped.forEach((c) => {
    const key = c.issueType || c.category || 'Other';
    byIssueType[key] = (byIssueType[key] || 0) + 1;
  });

  // Severity breakdown
  const bySeverity = {
    Critical: scoped.filter((c) => c.severity === 'Critical').length,
    High: scoped.filter((c) => c.severity === 'High').length,
    Medium: scoped.filter((c) => c.severity === 'Medium').length,
    Low: scoped.filter((c) => c.severity === 'Low').length
  };

  // Status breakdown
  const byStatus = {
    Pending: pending,
    Assigned: scoped.filter((c) => c.status === 'Assigned').length,
    'In Progress': inProgress,
    Resolved: resolved,
    Escalated: escalated
  };

  // Department Workload & Performance
  const deptsToInspect = department === 'All Departments'
    ? DEPARTMENTS.filter((d) => d !== 'All Departments')
    : [department];

  const departmentWorkload = deptsToInspect.map((dept) => {
    const deptItems = all.filter((c) => c.department === dept);
    const deptTotal = deptItems.length;
    const deptResolved = deptItems.filter((c) => c.status === 'Resolved').length;
    const deptPending = deptItems.filter(
      (c) => c.status === 'Pending' || c.status === 'Submitted' || c.status === 'Under Review'
    ).length;
    const deptInProgress = deptItems.filter(
      (c) => c.status === 'Assigned' || c.status === 'In Progress'
    ).length;
    const deptEscalated = deptItems.filter((c) => c.isEscalated || c.status === 'Escalated').length;
    const deptCritical = deptItems.filter((c) => c.severity === 'Critical').length;
    const deptRate = deptTotal > 0 ? Math.round((deptResolved / deptTotal) * 100) : 100;

    let slaHealth = 'Healthy';
    if (deptCritical > 0 || deptEscalated > 0) {
      slaHealth = 'Critical Attention';
    } else if (deptPending > 2) {
      slaHealth = 'Moderate Load';
    }

    return {
      department: dept,
      total: deptTotal,
      active: deptPending + deptInProgress,
      resolved: deptResolved,
      pending: deptPending,
      escalated: deptEscalated,
      critical: deptCritical,
      resolutionRate: deptRate,
      slaHealth
    };
  });

  return {
    summary: {
      totalComplaints: total,
      resolutionRate,
      pending,
      inProgress,
      resolved,
      escalated,
      criticalIssues: critical,
      averageResolutionTime,
      averageResolutionTimeHours
    },
    byIssueType,
    bySeverity,
    byStatus,
    departmentWorkload,
    resolutionStats: {
      totalResolved: resolved,
      onTimeResolvedRate: 92, // 92% resolved within municipal SLA
      firstResponseAvgHours: 2.1,
      targetSlaCompliance: '94.2%'
    }
  };
};

export default {
  getAuthorityComplaints,
  getAuthorityComplaintById,
  updateAuthorityComplaintStatus,
  getAuthorityAnalytics
};
