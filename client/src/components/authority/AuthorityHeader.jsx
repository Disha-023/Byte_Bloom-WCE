import React from 'react';
import {
  Building2,
  Shield,
  Calendar,
  Filter,
  UserCheck,
  Activity
} from 'lucide-react';
import { DEPARTMENTS, AUTHORITY_OFFICER } from '../../utils/authorityState';

/**
 * AuthorityHeader Component
 * Displays portal branding, active department dropdown, official identity, and operational context.
 */
export const AuthorityHeader = ({
  selectedDepartment,
  onDepartmentChange
}) => {
  // Current operational date in standard municipal format
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Bar: Title & Official Identification */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-civic-700" />
              <span>Official Department Access</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{AUTHORITY_OFFICER.status}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-civic-700 shrink-0" />
            <span>Authority Operations Dashboard</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500">
            Municipal civic resolution monitoring, departmental dispatch, and grievance triage command.
          </p>
        </div>

        {/* Official Officer Identity Card */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs self-start lg:self-auto">
          <div className="w-9 h-9 rounded-full bg-civic-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{AUTHORITY_OFFICER.name}</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                {AUTHORITY_OFFICER.officerId}
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">{AUTHORITY_OFFICER.designation}</p>
            <p className="text-slate-400 text-[10px]">{AUTHORITY_OFFICER.jurisdiction}</p>
          </div>
        </div>
      </div>

      {/* Operational Controls & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        {/* Department Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="department-filter"
            className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Select Department Scope:</span>
          </label>

          <select
            id="department-filter"
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-civic-500 transition-colors shadow-sm"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Current Operational Metadata */}
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Operational Date: <strong className="text-slate-700">{todayFormatted}</strong></span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>Shift: <span className="text-slate-700">{AUTHORITY_OFFICER.shift}</span></span>
          </div>

          <div className="bg-civic-50 text-civic-800 px-2.5 py-1 rounded border border-civic-200 font-medium">
            Active: <span className="font-semibold">{selectedDepartment}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthorityHeader;
