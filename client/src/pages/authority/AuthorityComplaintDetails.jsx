import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  User,
  Clock,
  Cpu,
  Edit3,
  Sparkles,
  ShieldCheck,
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  UserCheck
} from 'lucide-react';
import Button from '../../components/Button';
import IssueActionModal from '../../components/authority/IssueActionModal';
import AITriageDetailsDrawer from '../../components/authority/AITriageDetailsDrawer';
import {
  getAuthorityComplaintById,
  getStoredAuthorityComplaints
} from '../../utils/authorityState';

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

const TIMELINE_ICON_MAP = {
  received: FileText,
  ai: Cpu,
  assigned: UserCheck,
  review: ShieldCheck,
  status: CheckCircle2
};

/**
 * AuthorityComplaintDetails Page Component
 * Complete operational inspection view for a single civic grievance.
 */
export const AuthorityComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(() => getAuthorityComplaintById(id));
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  // Reload when ID changes or custom event fires
  useEffect(() => {
    const refreshData = () => {
      setComplaint(getAuthorityComplaintById(id));
    };

    refreshData();
    window.addEventListener('authority-state-change', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('authority-state-change', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, [id]);

  if (!complaint) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          Complaint Record Not Found
        </h2>
        <p className="text-xs text-slate-500">
          No authority complaint found matching ID <strong className="font-mono">{id}</strong>.
        </p>
        <Link to="/authority/complaints">
          <Button size="sm" variant="primary" icon={ArrowLeft}>
            Back to Complaints List
          </Button>
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_BADGE_STYLES[complaint.status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const severityStyle = SEVERITY_STYLES[complaint.severity] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="space-y-6">
      {/* Top Header Bar & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/authority/complaints"
              className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:text-civic-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Complaints Management</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {complaint.id}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusStyle}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{complaint.status}</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs border font-medium ${severityStyle}`}>
              {complaint.severity} Severity
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              Priority: <strong>{complaint.priority}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            icon={Cpu}
            onClick={() => setIsAIDrawerOpen(true)}
            className="text-xs"
          >
            Inspect AI Triage
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={Edit3}
            onClick={() => setIsActionModalOpen(true)}
            className="text-xs"
          >
            Take Authority Action
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complaint Details & Citizen Evidence (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Complaint Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {complaint.issueType || complaint.category}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5 leading-snug">
                {complaint.title}
              </h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>{complaint.description}</p>
            </div>

            {/* Structured Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="space-y-1 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-civic-600" />
                  <span>Assigned Department</span>
                </div>
                <p className="font-semibold text-slate-800">{complaint.department}</p>
              </div>

              <div className="space-y-1 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-civic-600" />
                  <span>Responsible Field Lead</span>
                </div>
                <p className="font-semibold text-slate-800">{complaint.assignedOfficer || 'Unassigned'}</p>
              </div>

              <div className="space-y-1 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-civic-600" />
                  <span>Location / Landmark</span>
                </div>
                <p className="font-semibold text-slate-800">{complaint.location}</p>
                {complaint.coordinates && (
                  <p className="text-[11px] text-slate-400 font-mono">GPS: {complaint.coordinates}</p>
                )}
              </div>

              <div className="space-y-1 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-civic-600" />
                  <span>Resolution Target (ETA)</span>
                </div>
                <p className="font-semibold text-slate-800">{complaint.eta || 'Pending Schedule'}</p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Created: <strong>{complaint.createdDate}</strong></span>
              </div>
              <div>
                <span>Last Updated: <strong>{complaint.updatedDate || complaint.createdDate}</strong></span>
              </div>
            </div>
          </div>

          {/* Section 5: Citizen-Submitted Evidence (Clearly Distinguished) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-civic-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Citizen-Submitted Evidence & Intake
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Verified Citizen Intake
              </span>
            </div>

            {/* Submitter Credentials */}
            <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400">Reported By: </span>
                <strong className="text-slate-800">{complaint.citizenName || 'Verified Citizen'}</strong>
              </div>
              {complaint.citizenContact && (
                <div className="text-slate-500 font-mono">
                  {complaint.citizenContact}
                </div>
              )}
            </div>

            {/* Visual Evidence Placeholder / Representation */}
            {complaint.citizenEvidence ? (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-2">
                  <Camera className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Citizen Photo Attachment</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                      {complaint.citizenEvidence.imageDescription || 'Visual attachment captured at location of grievance.'}
                    </p>
                  </div>
                </div>

                {complaint.citizenEvidence.submittedNotes && (
                  <div className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-1">Citizen Remarks:</span>
                    <p className="italic leading-relaxed">"{complaint.citizenEvidence.submittedNotes}"</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No photographic evidence attached with this complaint.</p>
            )}
          </div>

          {/* Department Authority Operational Notes / Logs */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-civic-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Official Department Operational Logs
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={Edit3}
                onClick={() => setIsActionModalOpen(true)}
                className="text-xs py-1"
              >
                Add Log
              </Button>
            </div>

            {complaint.authorityNotes && complaint.authorityNotes.length > 0 ? (
              <div className="space-y-2.5">
                {complaint.authorityNotes.map((noteItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <strong className="text-slate-700 font-semibold">{noteItem.officer}</strong>
                      <span>{noteItem.date}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{noteItem.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No official notes recorded yet. Use the action button above to log remarks.</p>
            )}
          </div>
        </div>

        {/* Right Column: AI Triage Summary Card & Chronological Timeline (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI-Generated Analysis Snapshot Card */}
          <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  AI Triage Diagnostic Summary
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                Gemini Pipeline
              </span>
            </div>

            {complaint.aiAnalysis ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Predicted Class:</span>
                  <span className="font-mono font-bold text-slate-900 capitalize">
                    {complaint.aiAnalysis.issue?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Confidence Score:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {Math.round((complaint.aiAnalysis.confidence || 0.9) * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Suggested Route:</span>
                  <span className="font-semibold text-slate-800">
                    {complaint.aiAnalysis.department}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Recommended SLA:</span>
                  <span className="font-semibold text-slate-800">
                    {complaint.aiAnalysis.sla_hours} Hours
                  </span>
                </div>

                <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                  <span className="font-semibold block mb-0.5">Triage Rationale:</span>
                  {complaint.aiAnalysis.reason}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  icon={Sparkles}
                  onClick={() => setIsAIDrawerOpen(true)}
                  className="w-full text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                >
                  View Complete AI Payload
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">AI triage record not found for this complaint.</p>
            )}
          </div>

          {/* Section 6: Chronological Activity / Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-civic-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Grievance Resolution Audit Trail
              </h3>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {complaint.timeline && complaint.timeline.length > 0 ? (
                complaint.timeline.map((event, idx) => {
                  const Icon = TIMELINE_ICON_MAP[event.type] || FileText;

                  return (
                    <div key={event.id || idx} className="relative space-y-1">
                      {/* Timeline dot/icon */}
                      <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-white border-2 border-civic-600 flex items-center justify-center text-civic-700 shadow-2xs">
                        <Icon className="w-2.5 h-2.5" />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900">
                          {event.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {event.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-normal">
                        {event.description}
                      </p>

                      {event.actor && (
                        <p className="text-[10px] text-slate-400">
                          Actioned by: <span className="font-medium text-slate-600">{event.actor}</span>
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">No activity recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <IssueActionModal
        isOpen={isActionModalOpen}
        complaint={complaint}
        onClose={() => setIsActionModalOpen(false)}
        onSuccess={(updated) => {
          setComplaint(updated);
          setIsActionModalOpen(false);
        }}
      />

      {/* AI Triage Details Drawer */}
      <AITriageDetailsDrawer
        isOpen={isAIDrawerOpen}
        complaint={complaint}
        onClose={() => setIsAIDrawerOpen(false)}
      />
    </div>
  );
};

export default AuthorityComplaintDetails;
