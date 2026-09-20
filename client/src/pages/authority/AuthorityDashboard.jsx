import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  Info,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import AuthorityHeader from '../../components/authority/AuthorityHeader';
import DepartmentMetrics from '../../components/authority/DepartmentMetrics';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import { getAuthorityComplaints } from '../../services/authorityApi';

const SEVERITY_STYLES = {
  Low: 'bg-blue-50 text-blue-700 border-blue-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
};

/**
 * AuthorityDashboard Page Component
 * Foundation dashboard for municipal authorities and departmental officers.
 * Consumes real complaint data from the central backend API.
 */
export const AuthorityDashboard = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [allComplaints, setAllComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAuthorityComplaints();
      setAllComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints from backend:', err);
      setError(err.message || 'Unable to connect to the complaint backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();

    const handleStateChange = () => {
      fetchComplaints();
    };

    window.addEventListener('authority-state-change', handleStateChange);
    return () => {
      window.removeEventListener('authority-state-change', handleStateChange);
    };
  }, [fetchComplaints]);

  // Compute departmental KPIs dynamically from the live complaints dataset
  const metrics = useMemo(() => {
    const scoped = selectedDepartment === 'All Departments'
      ? allComplaints
      : allComplaints.filter((item) => item.department === selectedDepartment);

    const total = scoped.length;
    const pending = scoped.filter(
      (c) => c.status === 'Pending' || c.status === 'Submitted' || c.status === 'Under Review'
    ).length;
    const inProgress = scoped.filter(
      (c) => c.status === 'Assigned' || c.status === 'In Progress'
    ).length;
    const resolved = scoped.filter((c) => c.status === 'Resolved').length;
    const escalated = scoped.filter((c) => c.isEscalated || c.status === 'Escalated').length;
    const critical = scoped.filter(
      (c) => c.severity === 'Critical' || c.priority === 'Critical'
    ).length;

    return {
      totalComplaints: total,
      pending,
      inProgress,
      resolved,
      escalated,
      criticalIssues: critical
    };
  }, [allComplaints, selectedDepartment]);

  // Extract recent complaints for selected scope
  const recentComplaints = useMemo(() => {
    const scoped = selectedDepartment === 'All Departments'
      ? allComplaints
      : allComplaints.filter((item) => item.department === selectedDepartment);

    return scoped.slice(0, 8);
  }, [allComplaints, selectedDepartment]);

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

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={fetchComplaints}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                title="Refresh complaints from backend"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {recentComplaints.length} Records
              </span>
              <Link to="/authority/complaints">
                <Button
                  size="sm"
                  variant="outline"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="text-xs py-1.5"
                >
                  Manage All
                </Button>
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-civic-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Fetching real complaints from municipal API...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Unable to Load Complaints</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchComplaints} icon={RotateCcw} className="text-xs">
                Retry Connection
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && recentComplaints.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Info className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No complaints found</p>
              <p className="text-xs text-slate-400">
                No civic grievances registered under {selectedDepartment}.
              </p>
            </div>
          )}

          {/* Complaints List / Cards */}
          {!isLoading && !error && recentComplaints.length > 0 && (
            <div className="divide-y divide-slate-100">
              {recentComplaints.map((item) => (
                <article
                  key={item.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors space-y-3 group"
                >
                  {/* Top metadata line */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/authority/complaints/${item.id}`}
                        className="font-mono text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200 hover:bg-civic-100 transition-colors flex items-center gap-1"
                      >
                        <span>{item.id}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
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
                    <Link
                      to={`/authority/complaints/${item.id}`}
                      className="text-sm font-bold text-slate-900 leading-snug hover:text-civic-700 transition-colors block"
                    >
                      {item.title}
                    </Link>
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
              ))}
            </div>
          )}
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

            <div className="pt-2 border-t border-slate-100">
              <Link to="/authority/complaints">
                <Button size="sm" variant="primary" icon={ArrowRight} iconPosition="right" className="w-full text-xs">
                  Open Complaints Queue
                </Button>
              </Link>
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

          {/* Backend Connection Status Notice */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Live Central Backend Connected</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Operating against live PostgreSQL database via <code className="bg-white/80 px-1 py-0.5 rounded text-emerald-800">/api/complaints</code>. Real-time updates active.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
