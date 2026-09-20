import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  PlusCircle,
  MapPin,
  Calendar,
  Building2,
  User,
  X,
  FileQuestion,
  Info,
  CheckCircle2,
  AlertCircle,
  Camera,
  Cpu,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Clock,
  Tag
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import IssueCard from '../components/IssueCard';
import IssueStatusTimeline from '../components/IssueStatusTimeline';
import { getComplaints, getComplaint } from '../services/complaintApi';
import { mapBackendComplaints, mapBackendComplaintToAuthority } from '../utils/complaintMapper';

const STATUSES = [
  'All',
  'Pending',
  'Assigned',
  'In Progress',
  'Resolved',
  'Escalated'
];

const CATEGORIES = [
  'All Categories',
  'Road & Potholes',
  'Garbage & Waste',
  'Streetlight',
  'Water Supply',
  'Drainage & Sewage',
  'Public Transport',
  'Traffic & Signals',
  'Public Safety',
  'Other'
];

export const TrackIssue = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Complaints state from real backend
  const [complaints, setComplaints] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notFoundId, setNotFoundId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('id') || '');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Load complaints from central backend API
  const fetchComplaints = useCallback(async (requestedId = null) => {
    setIsLoading(true);
    setError(null);
    setNotFoundId(null);

    try {
      const rawList = await getComplaints();
      const mapped = mapBackendComplaints(rawList);
      setComplaints(mapped);

      const targetId = requestedId || searchParams.get('id');
      if (targetId && targetId.trim()) {
        const cleanTargetId = targetId.trim().toLowerCase();
        const found = mapped.find(
          (c) => c.id.toLowerCase() === cleanTargetId
        );

        if (found) {
          setSelectedIssue(found);
        } else {
          // Attempt to fetch single complaint directly by ID from backend
          try {
            const rawSingle = await getComplaint(targetId.trim());
            if (rawSingle) {
              const mappedSingle = mapBackendComplaintToAuthority(rawSingle);
              setSelectedIssue(mappedSingle);
            } else {
              setNotFoundId(targetId.trim());
              setSelectedIssue(mapped.length > 0 ? mapped[0] : null);
            }
          } catch (err) {
            console.warn(`Complaint ${targetId} not found in backend:`, err.message);
            setNotFoundId(targetId.trim());
            setSelectedIssue(mapped.length > 0 ? mapped[0] : null);
          }
        }
      } else if (mapped.length > 0) {
        setSelectedIssue(mapped[0]);
      } else {
        setSelectedIssue(null);
      }
    } catch (err) {
      console.error('Failed to load complaints from backend:', err);
      setError(err.message || 'Unable to connect to civic complaint server. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchComplaints();
  };

  // Reactive filtering
  const filteredIssues = useMemo(() => {
    return complaints.filter((issue) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        issue.id.toLowerCase().includes(query) ||
        issue.title.toLowerCase().includes(query) ||
        (issue.location && issue.location.toLowerCase().includes(query)) ||
        (issue.category && issue.category.toLowerCase().includes(query)) ||
        (issue.issueType && issue.issueType.toLowerCase().includes(query));

      const matchesStatus =
        selectedStatus === 'All' ||
        issue.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesCategory =
        selectedCategory === 'All Categories' ||
        issue.category === selectedCategory ||
        issue.issueType === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [complaints, searchQuery, selectedStatus, selectedCategory]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedCategory('All Categories');
    setNotFoundId(null);
  };

  // Loading State
  if (isLoading && complaints.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto my-12">
        <div className="w-10 h-10 border-3 border-civic-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Loading Citizen Complaints...</h3>
        <p className="text-xs text-slate-500">
          Retrieving real-time civic issue records from the central PostgreSQL database.
        </p>
      </div>
    );
  }

  // API Error State
  if (error && complaints.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Unable to Load Issues</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="primary"
            icon={RotateCcw}
            onClick={() => fetchComplaints()}
          >
            Retry Connection
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={PlusCircle}
            onClick={() => navigate('/report')}
          >
            Report an Issue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-civic-50 text-civic-700 text-xs font-semibold border border-civic-200 mb-2">
            <Info className="w-3.5 h-3.5" />
            <span>Citizen Tracking Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Track Civic Issues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, monitor, and inspect real-time progress across municipal departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="md"
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`text-xs ${isRefreshing ? 'animate-spin' : ''}`}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button
            size="md"
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/report')}
          >
            Report New Issue
          </Button>
        </div>
      </div>

      {/* Complaint Not Found Banner */}
      {notFoundId && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Complaint ID Not Found: </span>
              <span>
                No record matching <strong className="font-mono">{notFoundId}</strong> was found in the database.
                Showing available complaints below.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotFoundId(null)}
            className="text-amber-600 hover:text-amber-900 p-0.5"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Issue ID (e.g. CIV-102431), title, or location..."
              className="w-full pl-10 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-500 text-slate-700 font-medium"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  Status: {status}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-500 text-slate-700 font-medium truncate"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All Categories' ? 'Category: All' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters / Count Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong>{filteredIssues.length}</strong> of{' '}
              <strong>{complaints.length}</strong> real complaints
            </span>
            {(searchQuery || selectedStatus !== 'All' || selectedCategory !== 'All Categories') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-civic-600 hover:text-civic-800 font-medium ml-2 underline underline-offset-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Connected to Central Database</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Master / Detail Grid */}
      {complaints.length === 0 ? (
        /* Entirely Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              No Complaints Registered Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              No citizen grievances have been submitted yet. Be the first to report an issue in your area.
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="sm"
              variant="primary"
              icon={PlusCircle}
              onClick={() => navigate('/report')}
            >
              Report an Issue
            </Button>
          </div>
        </div>
      ) : filteredIssues.length === 0 ? (
        /* Filtered Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              No issues found matching your search or filters
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Try adjusting your keyword query, switching status tags, or reset all filters to view all issues.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              icon={RotateCcw}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={PlusCircle}
              onClick={() => navigate('/report')}
            >
              Report an Issue
            </Button>
          </div>
        </div>
      ) : (
        /* Two-column layout on Desktop, stacked on Mobile */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Issue List (5 Cols on large screens) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Civic Issues List
              </h2>
              <span className="text-xs text-slate-400">Select an issue to inspect</span>
            </div>

            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  isSelected={selectedIssue?.id === issue.id}
                  onSelect={(item) => {
                    setSelectedIssue(item);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Detailed Tracking View & Timeline (7 Cols on large screens) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            {selectedIssue ? (
              <Card
                title={`Tracking: ${selectedIssue.id}`}
                subtitle="Live status updates and departmental resolution timeline"
                headerAction={
                  <StatusBadge status={selectedIssue.status} size="md" />
                }
              >
                <div className="space-y-6">
                  {/* Escalation Alert Banner */}
                  {selectedIssue.isEscalated && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 shadow-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Escalated Grievance: </strong>
                        <span>
                          This issue has exceeded standard response time limits and was automatically escalated to departmental supervisors.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Issue Summary Banner */}
                  <div className="space-y-3 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {selectedIssue.category}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Reported on <strong>{selectedIssue.reportedDate || selectedIssue.createdDate}</strong>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Severity: <strong className="text-slate-800">{selectedIssue.severity}</strong>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Priority: <strong className="text-slate-800">{selectedIssue.priority}</strong>
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {selectedIssue.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      {selectedIssue.description}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-civic-600" />
                        <span>Location & Landmark</span>
                      </div>
                      <p className="font-semibold text-slate-800 leading-tight">
                        {selectedIssue.location}
                      </p>
                      {selectedIssue.coordinates && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          GPS: {selectedIssue.coordinates}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-civic-600" />
                        <span>Assigned Authority</span>
                      </div>
                      <p className="font-semibold text-slate-800 leading-tight">
                        {selectedIssue.department}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Lead: {selectedIssue.assignedOfficer || 'Pending Assignment'}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200/60 sm:border-0 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <User className="w-3.5 h-3.5 text-civic-600" />
                        <span>Submitted By</span>
                      </div>
                      <p className="font-semibold text-slate-800">
                        {selectedIssue.citizenName || 'Verified Citizen'}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200/60 sm:border-0 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-civic-600" />
                        <span>Target SLA</span>
                      </div>
                      <p className="font-semibold text-slate-800">
                        {selectedIssue.status === 'Resolved'
                          ? 'Resolved'
                          : selectedIssue.slaHours
                          ? `${selectedIssue.slaHours} Hours SLA`
                          : 'Standard SLA'}
                        {selectedIssue.slaHoursRemaining !== null && selectedIssue.status !== 'Resolved' && (
                          <span className="ml-1 text-slate-500 font-normal">
                            ({selectedIssue.slaHoursRemaining}h remaining)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Citizen Photo Evidence (if attached) */}
                  {selectedIssue.imageUrl && (
                    <div className="space-y-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Camera className="w-3.5 h-3.5 text-civic-600" />
                        <span>Photographic Evidence</span>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-64">
                        <img
                          src={selectedIssue.imageUrl}
                          alt="Citizen submitted evidence"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Intelligence Assessment & Grounded Reasoning */}
                  {selectedIssue.aiAnalysis && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-civic-50/60 to-slate-50 border border-civic-200/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-civic-200/60 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-civic-600" />
                          <span>AI Triage & Classification</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          AI Analyzed
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Issue Type</span>
                          <span className="font-semibold text-slate-800 capitalize">
                            {selectedIssue.aiAnalysis.issue?.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Confidence</span>
                          <span className="font-mono font-bold text-civic-700">
                            {Math.round((selectedIssue.aiAnalysis.confidence || 0.9) * 100)}%
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Target SLA</span>
                          <span className="font-semibold text-slate-800">
                            {selectedIssue.aiAnalysis.sla_hours}h
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Suggested Action</span>
                          <span className="font-mono text-[11px] font-semibold text-slate-700">
                            {selectedIssue.aiAnalysis.action?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* AI Grounded Reasoning */}
                      {selectedIssue.aiAnalysis.reason && (
                        <div className="p-3 bg-white/80 rounded-lg border border-civic-100 text-xs text-slate-700 space-y-1">
                          <span className="font-semibold text-slate-800 block text-[11px]">
                            AI Assessment & Location Reasoning:
                          </span>
                          <p className="leading-relaxed">
                            {selectedIssue.aiAnalysis.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Progress Timeline */}
                  <div className="space-y-3">
                    <IssueStatusTimeline
                      currentStatus={selectedIssue.status}
                      updates={selectedIssue.timeline || []}
                    />
                  </div>
                </div>
              </Card>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <p className="text-xs">Select an issue from the list to view its tracking timeline.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackIssue;
