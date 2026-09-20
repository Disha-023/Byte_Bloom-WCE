import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Activity,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import Button from '../Button';
import {
  STATUS_OPTIONS,
  AVAILABLE_OFFICERS,
  updateAuthorityComplaint
} from '../../utils/authorityState';

/**
 * IssueActionModal Component
 * Allows authority officers to assign personnel, transition status, set ETA, and add official departmental notes.
 */
export const IssueActionModal = ({
  isOpen,
  onClose,
  complaint,
  onSuccess
}) => {
  const [officer, setOfficer] = useState('');
  const [status, setStatus] = useState('');
  const [eta, setEta] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sync state whenever selected complaint changes
  useEffect(() => {
    if (complaint) {
      setOfficer(complaint.assignedOfficer || '');
      setStatus(complaint.status || 'Pending');
      setEta(complaint.eta || '');
      setNote('');
      setError('');
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const updated = updateAuthorityComplaint(complaint.id, {
        officer,
        status,
        note,
        eta
      });

      if (!updated) {
        throw new Error('Failed to update complaint record.');
      }

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while saving changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                {complaint.id}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {complaint.department}
              </span>
            </div>
            <h2 id="action-modal-title" className="text-base font-bold text-slate-900 mt-1">
              Departmental Action & Dispatch
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Officer Assignment */}
          <div className="space-y-1.5">
            <label htmlFor="officer-select" className="font-semibold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Assign Responsible Officer / Crew</span>
            </label>
            <select
              id="officer-select"
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-civic-500"
            >
              <option value="Unassigned">Unassigned / Pending Triage</option>
              {complaint.assignedOfficer && complaint.assignedOfficer !== 'Unassigned' && (
                <option value={complaint.assignedOfficer}>
                  Current: {complaint.assignedOfficer}
                </option>
              )}
              {AVAILABLE_OFFICERS.map((off) => (
                <option key={off.id} value={`${off.name} (${off.role})`}>
                  {off.name} — {off.department} ({off.role})
                </option>
              ))}
            </select>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label htmlFor="status-select" className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Update Operational Status</span>
            </label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-civic-500"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Target Resolution ETA */}
          <div className="space-y-1.5">
            <label htmlFor="eta-input" className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Resolution ETA / Deadline</span>
            </label>
            <input
              id="eta-input"
              type="text"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              placeholder="e.g. 2026-09-22 18:00 or Expected Today"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-500"
            />
          </div>

          {/* Official Department Log / Note */}
          <div className="space-y-1.5">
            <label htmlFor="authority-note" className="font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Add Department Operational Log / Remarks</span>
            </label>
            <textarea
              id="authority-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter official action details, dispatched materials, or inspection notes..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-500 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-400">
              Notes are recorded into the official grievance audit timeline.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Action...' : 'Save & Record Action'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueActionModal;
