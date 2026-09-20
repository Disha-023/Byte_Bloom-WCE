import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Building2,
  ArrowLeft,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileQuestion
} from 'lucide-react';
import Button from '../../components/Button';
import AuthorityIssueTable from '../../components/authority/AuthorityIssueTable';
import IssueActionModal from '../../components/authority/IssueActionModal';
import { getAuthorityComplaints } from '../../services/authorityApi';
import {
  DEPARTMENTS,
  STATUS_OPTIONS,
  SEVERITY_OPTIONS,
  PRIORITY_OPTIONS
} from '../../utils/authorityState';

/**
 * AuthorityComplaints Page Component
 * Main operational complaints management interface with search, multi-axis filtering, and table view.
 * Consumes real complaint data from the central backend API.
 */
export const AuthorityComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedSeverity, setSelectedSeverity] = useState('All Severities');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');

  // Modal State for Quick Action
  const [activeModalComplaint, setActiveModalComplaint] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAuthorityComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints from backend:', err);
      setError(err.message || 'Unable to connect to the complaint backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();

    const handleStateChange = () => {
      fetchComplaints();
    };

    window.addEventListener('authority-state-change', handleStateChange);
    return () => {
      window.removeEventListener('authority-state-change', handleStateChange);
    };
  }, [fetchComplaints]);

  // Reactive Multi-Field Filtering
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q));

      const matchesDept =
        selectedDepartment === 'All Departments' || item.department === selectedDepartment;

      const matchesStatus =
        selectedStatus === 'All Statuses' || item.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesSeverity =
        selectedSeverity === 'All Severities' || item.severity.toLowerCase() === selectedSeverity.toLowerCase();

      const matchesPriority =
        selectedPriority === 'All Priorities' || item.priority.toLowerCase() === selectedPriority.toLowerCase();

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

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchComplaints}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors font-medium shadow-xs disabled:opacity-50"
            title="Refresh complaints from backend"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

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
              placeholder="Search by ID (e.g. CIV-102431), keywords, location..."
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

          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Central API Source (GET /api/complaints)</span>
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-8 h-8 border-2 border-civic-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Fetching real complaints from central backend...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Backend Connection Error</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchComplaints} icon={RotateCcw} className="text-xs">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Empty Database State */}
      {!isLoading && !error && complaints.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No complaints found in database
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The central complaint database is currently empty. When citizens submit complaints via the citizen portal, they will automatically appear here.
          </p>
          <div className="pt-2">
            <Link to="/report">
              <Button size="sm" variant="primary" className="text-xs">
                Submit a Citizen Complaint
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Table */}
      {!isLoading && !error && complaints.length > 0 && (
        <AuthorityIssueTable
          complaints={filteredComplaints}
          onOpenActionModal={(complaint) => setActiveModalComplaint(complaint)}
        />
      )}

      {/* Quick Action Modal */}
      <IssueActionModal
        isOpen={Boolean(activeModalComplaint)}
        complaint={activeModalComplaint}
        onClose={() => setActiveModalComplaint(null)}
        onSuccess={() => {
          fetchComplaints();
          setActiveModalComplaint(null);
        }}
      />
    </div>
  );
};

export default AuthorityComplaints;
