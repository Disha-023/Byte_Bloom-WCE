import React from 'react';
import {
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon
} from 'lucide-react';

/**
 * DepartmentMetrics Component
 * Renders high-level operational KPI cards for the authority dashboard.
 */
export const DepartmentMetrics = ({ metrics, departmentName }) => {
  const cards = [
    {
      id: 'total',
      label: 'Total Complaints',
      value: metrics.totalComplaints,
      subtext: departmentName === 'All Departments' ? 'All municipal departments' : departmentName,
      icon: FileText,
      containerBg: 'bg-white',
      borderClass: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      valueColor: 'text-slate-900'
    },
    {
      id: 'pending',
      label: 'Pending Review',
      value: metrics.pending,
      subtext: 'Awaiting triage / assignment',
      icon: Clock,
      containerBg: 'bg-white',
      borderClass: 'border-slate-200',
      iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
      valueColor: 'text-amber-700'
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: metrics.inProgress,
      subtext: 'Field crews dispatched',
      icon: Activity,
      containerBg: 'bg-white',
      borderClass: 'border-slate-200',
      iconBg: 'bg-sky-50 text-sky-700 border border-sky-200',
      valueColor: 'text-sky-700'
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: metrics.resolved,
      subtext: 'Closed & verified',
      icon: CheckCircle2,
      containerBg: 'bg-white',
      borderClass: 'border-slate-200',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      valueColor: 'text-emerald-700'
    },
    {
      id: 'escalated',
      label: 'Escalated',
      value: metrics.escalated,
      subtext: 'SLA threshold warning',
      icon: AlertTriangle,
      containerBg: 'bg-white',
      borderClass: 'border-slate-200',
      iconBg: 'bg-purple-50 text-purple-700 border border-purple-200',
      valueColor: 'text-purple-700'
    },
    {
      id: 'critical',
      label: 'Critical Hazards',
      value: metrics.criticalIssues,
      subtext: 'Immediate action needed',
      icon: AlertOctagon,
      containerBg: 'bg-white',
      borderClass: 'border-rose-200',
      iconBg: 'bg-rose-50 text-rose-700 border border-rose-200',
      valueColor: 'text-rose-700'
    }
  ];

  return (
    <section aria-label="Department Key Performance Indicators">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`${card.containerBg} ${card.borderClass} border rounded-xl p-4 shadow-sm flex flex-col justify-between transition-colors`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-600 truncate" title={card.label}>
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg shrink-0 ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.valueColor}`}>
                  {card.value}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 truncate" title={card.subtext}>
                  {card.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DepartmentMetrics;
