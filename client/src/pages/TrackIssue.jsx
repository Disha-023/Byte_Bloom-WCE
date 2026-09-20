import React from 'react';
import { Search, Info } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

export const TrackIssue = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Track Civic Issue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Enter your unique Issue Tracking ID to check real-time resolution status.
        </p>
      </div>

      <Card
        title="Lookup Issue by Reference ID"
        subtitle="Track municipal response and resolution timeline"
        icon={Search}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Issue ID (e.g. CIV-2026-0042)"
                disabled
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              disabled
              icon={Search}
              className="sm:w-auto"
            >
              Search
            </Button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
            <Info className="w-4 h-4 text-civic-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800">Issue Tracking Integration</p>
              <p className="mt-0.5">
                Real-time tracking querying backend resolution pipelines will be active once database models and search endpoints are implemented in subsequent updates.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrackIssue;
