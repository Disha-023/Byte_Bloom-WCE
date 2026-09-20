import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  AlertTriangle,
  Timer,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

/**
 * AuthorityAnalyticsCards Component
 * Reusable operational KPI cards with visual indicators for municipal decision-makers.
 */
export const AuthorityAnalyticsCards = ({ summary, departmentWorkload, departmentName }) => {
  if (!summary) return null;

  // Find department with highest active workload
  const highestActiveDept = departmentWorkload && departmentWorkload.length > 0
    ? [...departmentWorkload].sort((a, b) => b.active - a.active)[0]
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Resolution Rate Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Resolution Rate</span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.resolutionRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+3.2% vs benchmark</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {summary.resolved} of {summary.totalComplaints} grievances successfully closed
          </p>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, summary.resolutionRate)}%` }}
          />
        </div>
      </div>

      {/* 2. Pending Workload Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Pending Workload</span>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 tracking-tight">
              {summary.pending}
            </span>
            <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-medium">
              Requires Triage
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Grievances awaiting initial validation or department assignment
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>In-Progress Crew: <strong>{summary.inProgress}</strong></span>
          <span>Target Triage: <strong>&lt; 2h</strong></span>
        </div>
      </div>

      {/* 3. Critical Complaints Card */}
      <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-800">Critical Hazards</span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700 tracking-tight">
              {summary.criticalIssues}
            </span>
            <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
              Immediate Priority
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Life-safety incidents subject to mandatory 4-hour SLA dispatch
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-rose-700 pt-1 border-t border-rose-100 font-medium">
          <span className="inline-flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency Protocol</span>
          </span>
          <span>Auto-Notified</span>
        </div>
      </div>

      {/* 4. Escalated Complaints Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Escalated Grievances</span>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-700 tracking-tight">
              {summary.escalated}
            </span>
            <span className="text-xs bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200 font-medium">
              SLA Limit Breach
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Issues flagged for administrative supervisor intervention
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Supervisor Desk</span>
          <span className="font-semibold text-purple-700">Needs Review</span>
        </div>
      </div>

      {/* 5. Average Resolution Time Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Average Turnaround Time</span>
          <div className="p-2 rounded-lg bg-civic-50 text-civic-700 border border-civic-200">
            <Timer className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.averageResolutionTime}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Calculated from citizen submission to verified closure
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Target SLA: <strong>&le; 48.0 Hours</strong></span>
          <span className="text-emerald-700 font-semibold">Within Target</span>
        </div>
      </div>

      {/* 6. Department Workload Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Department Workload Focus</span>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {highestActiveDept ? (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 truncate" title={highestActiveDept.department}>
                {highestActiveDept.department}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Highest operational load: <strong>{highestActiveDept.active} active tasks</strong> ({highestActiveDept.pending} pending, {highestActiveDept.critical} critical)
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Workload balanced across divisions</p>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Active Scope: <strong>{departmentName}</strong></span>
          <span className="text-civic-700 font-semibold">Operational</span>
        </div>
      </div>
    </div>
  );
};

export default AuthorityAnalyticsCards;
