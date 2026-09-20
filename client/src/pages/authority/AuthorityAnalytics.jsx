import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Timer,
  Layers,
  Sparkles,
  Info,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/Button';
import AuthorityAnalyticsCards from '../../components/authority/AuthorityAnalyticsCards';
import { DEPARTMENTS } from '../../utils/authorityState';
import { getAuthorityAnalytics } from '../../services/authorityApi';

const SEVERITY_COLORS = {
  Critical: 'bg-rose-500 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-amber-500 text-white',
  Low: 'bg-blue-500 text-white'
};

const STATUS_COLORS = {
  Pending: 'bg-amber-500',
  Assigned: 'bg-indigo-500',
  'In Progress': 'bg-sky-500',
  Resolved: 'bg-emerald-500',
  Escalated: 'bg-rose-500'
};

/**
 * AuthorityAnalytics Page Component
 * Municipal operational analytics, distribution breakdowns, SLA monitors, and workload intelligence.
 * Derived dynamically from the live PostgreSQL complaint database.
 */
export const AuthorityAnalytics = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAuthorityAnalytics(selectedDepartment);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load authority analytics from backend:', err);
      setError(err.message || 'Unable to compute analytics from the municipal backend.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchAnalytics();

    const handleStateChange = () => {
      fetchAnalytics();
    };

    window.addEventListener('authority-state-change', handleStateChange);
    return () => {
      window.removeEventListener('authority-state-change', handleStateChange);
    };
  }, [fetchAnalytics]);

  // Loading State
  if (isLoading && !analyticsData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 max-w-md mx-auto my-8 shadow-sm">
        <div className="w-8 h-8 border-2 border-civic-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Computing live departmental analytics from backend...</p>
      </div>
    );
  }

  // Error State
  if (error && !analyticsData) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-3 max-w-md mx-auto my-8 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Analytics Service Error</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchAnalytics} icon={RotateCcw} className="text-xs">
          Retry Analytics
        </Button>
      </div>
    );
  }

  const { summary, byIssueType, bySeverity, byStatus, departmentWorkload, resolutionStats } = analyticsData || {
    summary: { totalComplaints: 0, resolutionRate: 0, pending: 0, inProgress: 0, resolved: 0, escalated: 0, criticalIssues: 0, averageResolutionTime: 'N/A' },
    byIssueType: {},
    bySeverity: { Critical: 0, High: 0, Medium: 0, Low: 0 },
    byStatus: { Pending: 0, Assigned: 0, 'In Progress': 0, Resolved: 0, Escalated: 0 },
    departmentWorkload: [],
    resolutionStats: { totalResolved: 0, onTimeResolvedRate: 100, firstResponseAvgHours: 0, targetSlaCompliance: '100%' }
  };

  // Calculate percentages for issue type bars
  const totalByIssueType = Object.values(byIssueType).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-6">
      {/* Page Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/authority"
              className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:text-civic-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Authority Dashboard</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-civic-700 shrink-0" />
            <span>Operational Analytics & Insights</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500">
            Municipal resolution efficiency, departmental workload capacity, and SLA compliance derived from live database records.
          </p>
        </div>

        {/* Scope Dropdown & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors font-medium shadow-xs disabled:opacity-50"
            title="Refresh analytics from backend"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="analytics-dept" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Scope:</span>
            </label>
            <select
              id="analytics-dept"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-civic-500 shadow-xs"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. Core Summary KPI Cards */}
      <AuthorityAnalyticsCards
        summary={summary}
        departmentWorkload={departmentWorkload}
        departmentName={selectedDepartment}
      />

      {/* 2. Visual Distributions: Issue Type & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Complaints by Issue Type (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-civic-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Complaints by Issue Type
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {Object.keys(byIssueType).length} Categories Active
            </span>
          </div>

          {Object.keys(byIssueType).length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <p className="text-xs font-medium text-slate-600">No complaints in selected scope</p>
              <p className="text-[11px] text-slate-400">Categories will populate as complaints are received.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(byIssueType).map(([type, count]) => {
                const pct = totalByIssueType > 0 ? Math.round((count / totalByIssueType) * 100) : 0;
                return (
                  <div key={type} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{type}</span>
                      <span className="text-slate-500 font-mono">
                        <strong>{count}</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-civic-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Complaints by Severity & Status (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Severity Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Complaints by Severity
                </h2>
              </div>
              <span className="text-xs text-slate-400">Hazard Index</span>
            </div>

            {/* Segmented Visual Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
              {Object.entries(bySeverity).map(([sev, count]) => {
                const pct = summary.totalComplaints > 0 ? (count / summary.totalComplaints) * 100 : 0;
                if (count === 0) return null;
                const colors = {
                  Critical: 'bg-rose-500',
                  High: 'bg-orange-500',
                  Medium: 'bg-amber-500',
                  Low: 'bg-blue-400'
                };
                return (
                  <div
                    key={sev}
                    className={`${colors[sev]} h-full transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${sev}: ${count} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              {Object.entries(bySeverity).map(([sev, count]) => {
                const borderColors = {
                  Critical: 'border-l-rose-500 bg-rose-50/40',
                  High: 'border-l-orange-500 bg-orange-50/40',
                  Medium: 'border-l-amber-500 bg-amber-50/40',
                  Low: 'border-l-blue-400 bg-blue-50/40'
                };
                return (
                  <div
                    key={sev}
                    className={`p-2 rounded-lg border-l-4 border ${borderColors[sev]} flex items-center justify-between`}
                  >
                    <span className="text-slate-700 font-medium">{sev}</span>
                    <strong className="font-mono text-slate-900">{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-civic-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Complaints by Operational Status
                </h2>
              </div>
              <span className="text-xs text-slate-400">Lifecycle</span>
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(byStatus).map(([st, count]) => {
                const pct = summary.totalComplaints > 0 ? Math.round((count / summary.totalComplaints) * 100) : 0;
                return (
                  <div key={st} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[st] || 'bg-slate-400'}`} />
                      <span className="font-medium text-slate-700">{st}</span>
                    </div>
                    <span className="font-mono text-slate-900 font-bold">
                      {count} <span className="text-[11px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Departmental Workload & Comparative Resolution Statistics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-civic-700" />
              <span>Departmental Workload & SLA Health</span>
            </h2>
            <p className="text-xs text-slate-500">
              Live comparative overview of task volume, active backlog, and resolution efficiency across divisions.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target SLA: {resolutionStats.targetSlaCompliance}</span>
            </span>
          </div>
        </div>

        {/* Workload Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Department Division</th>
                <th className="py-2.5 px-3 text-center">Total Assigned</th>
                <th className="py-2.5 px-3 text-center">Active Backlog</th>
                <th className="py-2.5 px-3 text-center">Resolved</th>
                <th className="py-2.5 px-3 text-center">Critical</th>
                <th className="py-2.5 px-3 text-center">Escalated</th>
                <th className="py-2.5 px-3 text-right">Resolution Rate</th>
                <th className="py-2.5 px-3 text-right">SLA Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departmentWorkload.map((item) => (
                <tr key={item.department} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {item.department}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{item.total}</td>
                  <td className="py-3 px-3 text-center font-mono text-amber-700 font-medium">
                    {item.active}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-700 font-medium">
                    {item.resolved}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {item.critical > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {item.critical}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {item.escalated > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {item.escalated}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 hidden sm:block overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${item.resolutionRate}%` }}
                        />
                      </div>
                      <span>{item.resolutionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        item.slaHealth === 'Healthy'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.slaHealth === 'Critical Attention'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.slaHealth}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuthorityAnalytics;
