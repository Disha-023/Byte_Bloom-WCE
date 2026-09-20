import React from 'react';
import { MapPin, Calendar, AlertTriangle, ChevronRight, Tag } from 'lucide-react';
import StatusBadge from './StatusBadge';
import Button from './Button';

const SEVERITY_BADGES = {
  'Low': 'bg-blue-50 text-blue-700 border-blue-200',
  'Medium': 'bg-amber-50 text-amber-700 border-amber-200',
  'High': 'bg-orange-50 text-orange-700 border-orange-200',
  'Critical': 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
};

export const IssueCard = ({ issue, isSelected = false, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(issue)}
      className={`p-5 rounded-xl border transition-all cursor-pointer bg-white ${
        isSelected
          ? 'border-civic-500 ring-2 ring-civic-100 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-civic-700 bg-civic-50 px-2.5 py-1 rounded-md border border-civic-200">
            {issue.id}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>{issue.category}</span>
          </span>
        </div>

        <StatusBadge status={issue.status} size="sm" />
      </div>

      <div className="pt-3 space-y-2">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1 hover:text-civic-700 transition-colors">
          {issue.title}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {issue.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-2">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{issue.location}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Reported {issue.reportedDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Severity:</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                SEVERITY_BADGES[issue.severity] || 'bg-slate-50 text-slate-600'
              }`}
            >
              {issue.severity}
            </span>
          </div>

          <Button
            size="sm"
            variant={isSelected ? 'primary' : 'outline'}
            icon={ChevronRight}
            iconPosition="right"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(issue);
            }}
          >
            {isSelected ? 'Viewing' : 'View Details'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
