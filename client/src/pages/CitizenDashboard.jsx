import React from 'react';
import { LayoutDashboard, PlusCircle, Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';

export const CitizenDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citizen Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of reported civic issues and community resolution status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/report">
            <Button size="sm" variant="primary" icon={PlusCircle}>
              New Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Review</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">--</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In Progress</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">--</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Resolved Issues</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">--</h3>
          </div>
        </div>
      </div>

      {/* Main Dashboard Placeholder Content */}
      <Card
        title="Recent Civic Issues"
        subtitle="List of your submitted complaints and their tracking progress"
        icon={LayoutDashboard}
      >
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <LayoutDashboard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Citizen Dashboard Interface</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Issue management and live reporting metrics will be populated here in subsequent phases after database and authentication integration.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/report">
              <Button size="sm" variant="outline" icon={PlusCircle}>
                Report an Issue
              </Button>
            </Link>
            <Link to="/track">
              <Button size="sm" variant="secondary" icon={Search}>
                Track an Issue
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CitizenDashboard;
