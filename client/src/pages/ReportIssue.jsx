import React from 'react';
import { PlusCircle, MapPin, Camera, AlertTriangle, Send } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

export const ReportIssue = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Report a Civic Issue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit details about municipal problems in your area for automated triage and action.
        </p>
      </div>

      <Card
        title="Issue Submission Form"
        subtitle="Provide accurate information to speed up resolution"
        icon={PlusCircle}
      >
        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Issue Title / Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Broken streetlight on 5th Avenue"
              disabled
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Category & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                disabled
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              >
                <option>Select a category (Roads, Sanitation, Water, Lighting)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Urgency Level
              </label>
              <select
                disabled
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              >
                <option>Standard / Medium Priority</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location / Landmark</span>
            </label>
            <input
              type="text"
              placeholder="Street address, coordinates, or landmark"
              disabled
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe the problem, severity, and any hazards..."
              disabled
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed resize-none"
            />
          </div>

          {/* Photo upload placeholder */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span>Attach Image (Optional)</span>
            </label>
            <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center bg-slate-50/50">
              <Camera className="w-6 h-6 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Image upload preview (Active in later phases)</p>
            </div>
          </div>

          {/* Notice Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-normal">
              <strong>Phase 1 Preview:</strong> Form submission, automated AI categorization, and database persistence will be connected in future milestone phases.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="primary"
              icon={Send}
              disabled
            >
              Submit Issue (Preview)
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReportIssue;
