import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Edit3,
  MapPin,
  Calendar,
  AlertOctagon,
  FileQuestion,
  UserCheck
} from 'lucide-react';
import Button from '../Button';

const STATUS_BADGE_STYLES = {
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Assigned': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
  'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Escalated': 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
};

const SEVERITY_STYLES = {
  'Critical': 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  'High': 'bg-orange-50 text-orange-700 border-orange-200',
  'Medium': 'bg-amber-50 text-amber-700 border-amber-200',
  'Low': 'bg-blue-50 text-blue-700 border-blue-200'
};

const PRIORITY_STYLES = {
  'Critical': 'bg-rose-100 text-rose-800 font-bold',
  'High': 'bg-amber-100 text-amber-800 font-semibold',
  'Medium': 'bg-slate-100 text-slate-700 font-medium',
  'Low': 'bg-slate-50 text-slate-500 font-normal'
};

/**
 * AuthorityIssueTable Component
 * High-density operational table for managing, inspecting, and triaging municipal complaints.
 */
export const AuthorityIssueTable = ({
  complaints,
  onOpenActionModal
}) => {
  if (!complaints || complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          No complaints found matching current filters
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Try adjusting your department, status, severity, or priority criteria above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 whitespace-nowrap">Complaint ID</th>
              <th className="py-3 px-4">Issue Type & Title</th>
              <th className="py-3 px-4 whitespace-nowrap">Department</th>
              <th className="py-3 px-4 whitespace-nowrap">Severity</th>
              <th className="py-3 px-4 whitespace-nowrap">Priority</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 whitespace-nowrap">Status</th>
              <th className="py-3 px-4 whitespace-nowrap">Created Date</th>
              <th className="py-3 px-4 whitespace-nowrap">Assigned Officer</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {complaints.map((item) => {
              const statusClass = STATUS_BADGE_STYLES[item.status] || 'bg-slate-100 text-slate-700 border-slate-200';
              const severityClass = SEVERITY_STYLES[item.severity] || 'bg-slate-50 text-slate-700 border-slate-200';
              const priorityClass = PRIORITY_STYLES[item.priority] || 'bg-slate-100 text-slate-600';

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Complaint ID */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Link
                      to={`/authority/complaints/${item.id}`}
                      className="font-mono font-bold text-civic-700 hover:text-civic-800 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{item.id}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>

                  {/* Issue Type & Title */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        {item.issueType || item.category}
                      </span>
                      <p className="font-semibold text-slate-900 line-clamp-1" title={item.title}>
                        {item.title}
                      </p>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                    {item.department}
                  </td>

                  {/* Severity */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] ${severityClass}`}>
                      {item.severity}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${priorityClass}`}>
                      {item.priority || 'Medium'}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 max-w-xs truncate" title={item.location}>
                    <div className="flex items-center gap-1 text-slate-600 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium w-fit ${statusClass}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{item.status}</span>
                      </span>
                      {item.isEscalated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 w-fit">
                          <AlertOctagon className="w-3 h-3" />
                          <span>Escalated (SLA Alert)</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.reportedDate || item.createdDate?.split(' ')[0]}</span>
                    </div>
                  </td>

                  {/* Assigned Officer */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">{item.assignedOfficer || 'Unassigned'}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {onOpenActionModal && (
                        <button
                          type="button"
                          onClick={() => onOpenActionModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Quick Update / Assign"
                          aria-label={`Update ${item.id}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Link to={`/authority/complaints/${item.id}`}>
                        <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                          View
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuthorityIssueTable;
