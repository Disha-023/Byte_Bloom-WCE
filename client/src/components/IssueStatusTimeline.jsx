import React from 'react';
import { Check, Clock, Circle, ArrowRight, AlertTriangle } from 'lucide-react';

export const TIMELINE_STAGES = [
  { key: 'Submitted', label: 'Submitted', desc: 'Issue registered in system' },
  { key: 'Under Review', label: 'Under Review', desc: 'Triaged and verified by civic team' },
  { key: 'Assigned', label: 'Assigned', desc: 'Routed to responsible department' },
  { key: 'In Progress', label: 'In Progress', desc: 'Field crew dispatched for resolution' },
  { key: 'Resolved', label: 'Resolved', desc: 'Work completed and verified' }
];

export const IssueStatusTimeline = ({ currentStatus, updates = [] }) => {
  const stageOrder = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

  // Normalize backend status values to timeline stages
  let normalizedStatus = currentStatus;
  if (currentStatus === 'Pending') {
    normalizedStatus = 'Submitted';
  } else if (currentStatus === 'Escalated') {
    normalizedStatus = 'In Progress';
  }

  const currentIndex = Math.max(0, stageOrder.indexOf(normalizedStatus));
  const isResolved = currentStatus === 'Resolved' || normalizedStatus === 'Resolved';

  return (
    <div className="space-y-6">
      {/* Horizontal Progress Bar for Desktop / Tablet */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between relative">
          {TIMELINE_STAGES.map((stage, idx) => {
            const isCompleted = isResolved ? true : idx < currentIndex;
            const isCurrent = isResolved ? idx === 4 : idx === currentIndex;
            const isUpcoming = !isCompleted && !isCurrent;

            return (
              <React.Fragment key={stage.key}>
                {/* Node */}
                <div className="flex flex-col items-center text-center relative z-10 max-w-[100px]">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-civic-600 text-white ring-4 ring-civic-100 shadow-sm animate-pulse'
                        : 'bg-slate-100 border border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium leading-tight ${
                      isCompleted
                        ? 'text-slate-900 font-semibold'
                        : isCurrent
                        ? 'text-civic-700 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>

                {/* Connecting Line */}
                {idx < TIMELINE_STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-1 -mt-6 transition-all ${
                      idx < currentIndex || currentStatus === 'Resolved'
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Detailed Vertical Tracking History */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Tracking Timeline & Activity
        </h4>

        <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
          {TIMELINE_STAGES.map((stage, idx) => {
            const isCompleted = currentStatus === 'Resolved' ? true : idx < currentIndex;
            const isCurrent = currentStatus === 'Resolved' ? idx === 4 : idx === currentIndex;
            const isUpcoming = !isCompleted && !isCurrent;

            // Find matching update note from mock data if present
            const matchedUpdate = updates.find((u) => u.stage === stage.key);

            return (
              <div key={stage.key} className="flex items-start gap-4 relative">
                {/* Status Dot */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-civic-600 text-white ring-4 ring-civic-100'
                      : 'bg-white border-2 border-slate-300 text-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>

                {/* Status Description & Log */}
                <div
                  className={`flex-1 p-3 rounded-lg border text-xs transition-colors ${
                    isCurrent
                      ? 'bg-civic-50/50 border-civic-200 shadow-sm'
                      : isCompleted
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-white border-dashed border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <span
                      className={`font-semibold ${
                        isCurrent
                          ? 'text-civic-900 font-bold'
                          : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-500'
                      }`}
                    >
                      {stage.label}
                      {isCurrent && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-civic-600 text-white uppercase font-bold tracking-wider">
                          Current Stage
                        </span>
                      )}
                    </span>
                    {matchedUpdate?.date && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {matchedUpdate.date}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {matchedUpdate?.note || stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IssueStatusTimeline;
