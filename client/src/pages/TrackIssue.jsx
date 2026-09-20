import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  RotateCcw,
  PlusCircle,
  MapPin,
  Calendar,
  Building2,
  User,
  X,
  FileQuestion,
  ShieldAlert,
  Info,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import IssueCard from '../components/IssueCard';
import IssueStatusTimeline from '../components/IssueStatusTimeline';
import { MOCK_ISSUES, STATUSES, CATEGORIES } from '../utils/mockIssues';

export const TrackIssue = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('id') || '');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  // Selected Issue for Detailed Inspection
  const [selectedIssue, setSelectedIssue] = useState(MOCK_ISSUES[0]);

  // Reactive filtering
  const filteredIssues = useMemo(() => {
    return MOCK_ISSUES.filter((issue) => {
      // Search matching ID or Title or Location
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        issue.id.toLowerCase().includes(query) ||
        issue.title.toLowerCase().includes(query) ||
        issue.location.toLowerCase().includes(query);

      // Status matching
      const matchesStatus =
        selectedStatus === 'All' || issue.status === selectedStatus;

      // Category matching
      const matchesCategory =
        selectedCategory === 'All Categories' ||
        issue.category === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, selectedStatus, selectedCategory]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedCategory('All Categories');
  };

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

        <div>
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
              placeholder="Search by Issue ID (e.g. CIV-1001) or title..."
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

        {/* Active Filters / Quick Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong>{filteredIssues.length}</strong> of{' '}
              <strong>{MOCK_ISSUES.length}</strong> issues
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

          {/* Demonstration Notice */}
          <span className="text-[11px] text-slate-400">
            Frontend Demonstration Mode (Mock Datastore)
          </span>
        </div>
      </div>

      {/* Main Content Area: Master / Detail Grid */}
      {filteredIssues.length === 0 ? (
        /* Empty State */
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
                  {/* Issue Summary Banner */}
                  <div className="space-y-3 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {selectedIssue.category}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Reported on <strong>{selectedIssue.reportedDate}</strong>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Severity: <strong className="text-slate-800">{selectedIssue.severity}</strong>
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
                        Lead: {selectedIssue.assignedOfficer}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200/60 sm:border-0 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <User className="w-3.5 h-3.5 text-civic-600" />
                        <span>Submitted By</span>
                      </div>
                      <p className="font-semibold text-slate-800">
                        {selectedIssue.submittedBy} (Verified Citizen)
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200/60 sm:border-0 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-civic-600" />
                        <span>Target / Status</span>
                      </div>
                      <p className="font-semibold text-slate-800">
                        {selectedIssue.status === 'Resolved'
                          ? `Completed on ${selectedIssue.resolutionDate}`
                          : `Est: ${selectedIssue.resolutionDate}`}
                      </p>
                    </div>
                  </div>

                  {/* Status Progress Timeline */}
                  <div className="space-y-3">
                    <IssueStatusTimeline
                      currentStatus={selectedIssue.status}
                      updates={selectedIssue.updates}
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
