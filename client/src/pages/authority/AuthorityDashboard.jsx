import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  AlertOctagon,
  Clock,
  MapPin,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import AuthorityHeader from '../../components/authority/AuthorityHeader';
import DepartmentMetrics from '../../components/authority/DepartmentMetrics';
import StatusBadge from '../../components/StatusBadge';
import {
  calculateDepartmentMetrics,
  getRecentDepartmentComplaints
} from '../../utils/authorityState';

const SEVERITY_STYLES = {
  Low: 'bg-blue-50 text-blue-700 border-blue-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
};

/**
 * AuthorityDashboard Page Component
 * Foundation dashboard for municipal authorities and departmental officers.
 */
export const AuthorityDashboard = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  // Reactive metrics and complaints calculation based on selected department
  const metrics = useMemo(() => {
    return calculateDepartmentMetrics(selectedDepartment);
  }, [selectedDepartment]);

  const recentComplaints = useMemo(() => {
    return getRecentDepartmentComplaints(selectedDepartment, 8);
  }, [selectedDepartment]);

  return (
    <div className="space-y-6">
      {/* Authority Operations Header */}
      <AuthorityHeader
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
      />

      {/* High-Level Departmental KPIs */}
      <DepartmentMetrics
        metrics={metrics}
        departmentName={selectedDepartment}
      />

      {/* Main Operational Section: Recent Complaints & Department Dispatch Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Complaints Operational Queue (8 Columns on desktop) */}
        <section
          aria-label="Recent Operational Complaints"
          className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-civic-50 text-civic-700 border border-civic-100">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Complaints & Active Grievances
                </h2>
                <p className="text-xs text-slate-500">
                  Current operational queue for {selectedDepartment}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
              Showing {recentComplaints.length} Records
            </span>
          </div>

          {/* Complaints List / Cards */}
          <div className="divide-y divide-slate-100">
            {recentComplaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No active complaints found</p>
                <p className="text-xs text-slate-400">
                  No issues currently registered under {selectedDepartment}.
                </p>
              </div>
            ) : (
              recentComplaints.map((item) => (
                <article
                  key={item.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors space-y-3"
                >
                  {/* Top metadata line */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                        {item.id}
                      </span>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.department}
                      </span>
                      {item.isEscalated && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertOctagon className="w-3 h-3" />
                          <span>Escalated</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                          SEVERITY_STYLES[item.severity] || 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {item.severity} Severity
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                  </div>

                  {/* Complaint Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Operational Details Footer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs text-slate-500 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={item.location}>{item.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Officer: <strong className="text-slate-700 font-medium">{item.assignedOfficer}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:justify-end">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Reported: {item.reportedDate}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Municipal Operational Context & Readiness Desk (4 Columns on desktop) */}
        <aside
          aria-label="Department Readiness & Protocols"
          className="lg:col-span-4 space-y-5"
        >
          {/* Department Quick Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-civic-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Department Operational Scope
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Selected Scope:</span>
                <span className="font-semibold text-slate-800">{selectedDepartment}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Total In Scope:</span>
                <span className="font-semibold text-slate-800">{metrics.totalComplaints} Active</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Action Required:</span>
                <span className="font-semibold text-amber-700">{metrics.pending} Pending Triage</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">High Risk:</span>
                <span className="font-semibold text-rose-700">{metrics.criticalIssues} Critical Hazards</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Resolution Rate:</span>
                <span className="font-semibold text-emerald-700">
                  {metrics.totalComplaints > 0
                    ? `${Math.round((metrics.resolved / metrics.totalComplaints) * 100)}%`
                    : '100%'}
                </span>
              </div>
            </div>
          </div>

          {/* Standard Operating Notice */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-civic-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Authority Directives
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-civic-600 font-bold">•</span>
                <span>Prioritize <strong>Critical Hazards</strong> within the mandatory 4-hour SLA window.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-civic-600 font-bold">•</span>
                <span>Assign designated field crew leads before moving complaints to In Progress.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-civic-600 font-bold">•</span>
                <span>All resolutions must be backed by verified completion notes.</span>
              </li>
            </ul>
          </div>

          {/* Architecture Foundation Notice */}
          <div className="p-4 rounded-xl bg-civic-50/80 border border-civic-200 text-xs text-civic-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-civic-800">
              <CheckCircle2 className="w-4 h-4 text-civic-600" />
              <span>Commit 1: Foundation Active</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Authority layout, department filters, and operational metrics initialized. Subsequent commits will introduce status transition modals, officer dispatch workflows, and AI triage inspection.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
