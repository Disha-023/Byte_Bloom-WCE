import React from 'react';
import {
  Clock,
  Eye,
  UserCheck,
  Activity,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  'Pending': {
    label: 'Pending',
    icon: Clock,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500'
  },
  'Submitted': {
    label: 'Submitted',
    icon: Clock,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500'
  },
  'Under Review': {
    label: 'Under Review',
    icon: Eye,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500'
  },
  'Assigned': {
    label: 'Assigned',
    icon: UserCheck,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500'
  },
  'In Progress': {
    label: 'In Progress',
    icon: Activity,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500'
  },
  'Resolved': {
    label: 'Resolved',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  'Escalated': {
    label: 'Escalated',
    icon: Activity,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
    dotClass: 'bg-rose-500'
  }
};

export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    icon: HelpCircle,
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400'
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.badgeClass} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
