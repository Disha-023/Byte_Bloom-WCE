import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Building2,
  ArrowLeft,
  X,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/Button';
import AuthorityIssueTable from '../../components/authority/AuthorityIssueTable';
import IssueActionModal from '../../components/authority/IssueActionModal';
import {
  DEPARTMENTS,
  STATUS_OPTIONS,
  SEVERITY_OPTIONS,
  PRIORITY_OPTIONS,
  getStoredAuthorityComplaints
} from '../../utils/authorityState';

/**
 * AuthorityComplaints Page Component
 * Main operational complaints management interface with search, multi-axis filtering, and table view.
 */
export const AuthorityComplaints = () => {
  const [complaints, setComplaints] = useState(() => getStoredAuthorityComplaints());
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedSeverity, setSelectedSeverity] = useState('All Severities');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');

  // Modal State for Quick Action
  const [activeModalComplaint, setActiveModalComplaint] = useState(null);

  // Subscribe to storage / custom event state changes
  useEffect(() => {
    const handleStateChange = () => {
      setComplaints(getStoredAuthorityComplaints());
    };

    window.addEventListener('authority-state-change', handleStateChange);
    window.addEventListener('storage', handleStateChange);
    return () => {
      window.removeEventListener('authority-state-change', handleStateChange);
      window.removeEventListener('storage', handleStateChange);
    };
  }, []);

  // Reactive Multi-Field Filtering
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      const matchesDept =
        selectedDepartment === 'All Departments' || item.department === selectedDepartment;

      const matchesStatus =
        selectedStatus === 'All Statuses' || item.status === selectedStatus;

      const matchesSeverity =
        selectedSeverity === 'All Severities' || item.severity === selectedSeverity;

      const matchesPriority =
        selectedPriority === 'All Priorities' || item.priority === selectedPriority;

      return matchesSearch && matchesDept && matchesStatus && matchesSeverity && matchesPriority;
    });
  }, [complaints, searchQuery, selectedDepartment, selectedStatus, selectedSeverity, selectedPriority]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('All Departments');
    setSelectedStatus('All Statuses');
    setSelectedSeverity('All Severities');
    setSelectedPriority('All Priorities');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedDepartment !== 'All Departments' ||
    selectedStatus !== 'All Statuses' ||
    selectedSeverity !== 'All Severities' ||
    selectedPriority !== 'All Priorities';

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/authority"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-civic-700 hover:text-civic-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Authority Dashboard</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-civic-700 shrink-0" />
            <span>Operational Complaints Management</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500">
            Search, filter, assign personnel, and transition grievance workflows across municipal departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-semibold border border-slate-200">
            Total In Scope: <strong>{filteredComplaints.length}</strong> / {complaints.length}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (e.g. CIV-1001), keywords, location..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-500 text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-civic-500 truncate"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All Departments' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-civic-500"
            >
              <option value="All Statuses">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-civic-500"
            >
              <option value="All Severities">All Severities</option>
              {SEVERITY_OPTIONS.map((sev) => (
                <option key={sev} value={sev}>
                  Severity: {sev}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-civic-500"
            >
              <option value="All Priorities">All Priorities</option>
              {PRIORITY_OPTIONS.map((pri) => (
                <option key={pri} value={pri}>
                  Priority: {pri}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters & Summary Sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Displaying <strong>{filteredComplaints.length}</strong> active complaints
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-civic-600 hover:text-civic-800 font-medium underline underline-offset-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            Isolated Authority State Layer (Client Demo)
          </span>
        </div>
      </div>

      {/* Main Table */}
      <AuthorityIssueTable
        complaints={filteredComplaints}
        onOpenActionModal={(complaint) => setActiveModalComplaint(complaint)}
      />

      {/* Quick Action Modal */}
      <IssueActionModal
        isOpen={Boolean(activeModalComplaint)}
        complaint={activeModalComplaint}
        onClose={() => setActiveModalComplaint(null)}
        onSuccess={() => {
          setComplaints(getStoredAuthorityComplaints());
          setActiveModalComplaint(null);
        }}
      />
    </div>
  );
};

export default AuthorityComplaints;
