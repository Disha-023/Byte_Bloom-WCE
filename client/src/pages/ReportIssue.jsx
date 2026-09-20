import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Send,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import FormField from '../components/FormField';
import SeveritySelector from '../components/SeveritySelector';
import ImageUpload from '../components/ImageUpload';

import { createComplaint } from '../services/complaintApi';

const CATEGORIES = [
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

const INITIAL_FORM_STATE = {
  category: '',
  title: '',
  description: '',
  severity: '',
  address: '',
  additionalLocation: '',
  latitude: null,
  longitude: null,
  locationSource: null,
  imageFile: null,
  imagePreview: null
};

export const ReportIssue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  // Field change handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (submissionError) {
      setSubmissionError(null);
    }
  };

  // Real Browser Geolocation API Handler
  const handleUseMyLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser. Please enter the issue location manually.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          locationSource: 'gps'
        }));
        setIsLocating(false);
        setLocationError(null);

        if (errors.address) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.address;
            return next;
          });
        }
      },
      (error) => {
        setIsLocating(false);
        let message = 'Your current location could not be determined. Please enter the issue address manually.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission was denied. Please enter the issue address manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Your current location could not be determined. Please enter the issue address manually.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location detection timed out. Please try again or enter the location manually.';
        }
        setLocationError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleImageSelected = (file, previewUrl) => {
    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl
    }));
  };

  const handleImageRemoved = () => {
    setFormData((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: null
    }));
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.category.trim()) {
      newErrors.category = 'Please select an issue category.';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Please enter an issue title.';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title should be at least 3 characters long.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please describe the issue.';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Please provide more details (at least 10 characters).';
    }

    if (!formData.severity) {
      newErrors.severity = 'Please select the severity.';
    }

    if (!formData.address.trim() && (formData.latitude === null || formData.longitude === null)) {
      newErrors.address = 'Please provide the issue location or detect via GPS.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real backend submission flow
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('severity', formData.severity);
      data.append('address', formData.address.trim() || 'GPS Detected Location');

      if (formData.additionalLocation) {
        data.append('additionalLocation', formData.additionalLocation);
      }
      if (formData.latitude !== null && formData.latitude !== undefined) {
        data.append('latitude', String(formData.latitude));
      }
      if (formData.longitude !== null && formData.longitude !== undefined) {
        data.append('longitude', String(formData.longitude));
      }
      if (formData.imageFile) {
        data.append('image', formData.imageFile);
      }

      const response = await createComplaint(data);

      if (response && response.complaint) {
        setSubmittedComplaint(response.complaint);
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error('Unexpected response structure from server.');
      }
    } catch (err) {
      console.error('Complaint submission failed:', err);
      setSubmissionError(
        err.message || 'Failed to submit complaint. Please check your network connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setIsLocating(false);
    setLocationError(null);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmissionError(null);
    setSubmittedComplaint(null);
  };

  // Submitted successfully - Real AI Triage and Complaint Details View
  if (isSubmitted && submittedComplaint) {
    const isAiAvailable = submittedComplaint.ai_analysis_status === 'completed';

    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Complaint Submitted Successfully
            </h1>

            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {isAiAvailable
                ? 'Your complaint was submitted successfully and is now being analyzed by the civic AI system.'
                : 'Complaint submitted, but AI analysis is temporarily unavailable. It has been routed for manual inspection.'}
            </p>

            {/* Prominent Complaint ID Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-sm font-mono font-bold tracking-wide">
              <span>Complaint ID:</span>
              <span className="text-civic-700">{submittedComplaint.complaint_id}</span>
            </div>
          </div>

          {/* AI Intelligence Assessment Card */}
          <div className="bg-gradient-to-br from-civic-50/70 to-slate-50 border border-civic-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-civic-200/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-civic-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  AI Triage & Classification
                </h2>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isAiAvailable
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isAiAvailable ? 'AI Verified' : 'AI Pending'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Issue Type:</span>
                <p className="text-slate-900 font-bold capitalize mt-0.5">
                  {submittedComplaint.issue_type || submittedComplaint.category}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">AI Severity:</span>
                <p className="text-slate-900 font-bold capitalize mt-0.5">
                  {submittedComplaint.ai_severity || 'Under Assessment'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Priority:</span>
                <p className="text-slate-900 font-bold capitalize mt-0.5">
                  {submittedComplaint.priority || 'Normal'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Target SLA:</span>
                <p className="text-slate-900 font-bold mt-0.5">
                  {submittedComplaint.sla_hours ? `${submittedComplaint.sla_hours} Hours` : 'Pending'}
                </p>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 font-medium">Assigned Department:</span>
                <p className="text-slate-900 font-bold capitalize mt-0.5">
                  {submittedComplaint.department
                    ? submittedComplaint.department.replace(/_/g, ' ')
                    : 'Pending Assignment'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">AI Confidence:</span>
                <p className="text-slate-900 font-bold mt-0.5">
                  {submittedComplaint.ai_confidence
                    ? `${Math.round(Number(submittedComplaint.ai_confidence) * 100)}%`
                    : 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Evidence Analysis:</span>
                <p className="text-slate-900 font-bold mt-0.5">
                  {submittedComplaint.image_analyzed ? 'Visual Verified' : 'Text Based'}
                </p>
              </div>

              {submittedComplaint.evidence_summary && (
                <div className="col-span-2 sm:col-span-4 bg-white/80 p-3 rounded-lg border border-civic-100 text-slate-700">
                  <span className="text-slate-500 font-medium block text-[11px] mb-1">
                    AI Evidence Summary:
                  </span>
                  <p className="text-xs leading-relaxed">{submittedComplaint.evidence_summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submitted Complaint Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Submitted Complaint Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Category:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{submittedComplaint.category}</p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Citizen Reported Severity:</span>
                <p className="text-slate-900 font-semibold capitalize mt-0.5">
                  {submittedComplaint.citizen_severity}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium">Title:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{submittedComplaint.title}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium">Description:</span>
                <p className="text-slate-800 mt-0.5 leading-relaxed">{submittedComplaint.description}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium">Location:</span>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {submittedComplaint.address}
                  {submittedComplaint.latitude !== null && submittedComplaint.latitude !== undefined && submittedComplaint.longitude !== null && submittedComplaint.longitude !== undefined && (
                    <span className="ml-1.5 text-civic-700 font-mono font-normal">
                      ({Number(submittedComplaint.latitude).toFixed(6)}, {Number(submittedComplaint.longitude).toFixed(6)})
                    </span>
                  )}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-medium">Source:</span>
                  {submittedComplaint.latitude !== null && submittedComplaint.latitude !== undefined && submittedComplaint.longitude !== null && submittedComplaint.longitude !== undefined ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[10px]">
                      <Navigation className="w-3 h-3" /> GPS
                    </span>
                  ) : (
                    <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                      Manually provided location
                    </span>
                  )}
                </div>
              </div>

              {formData.imagePreview && (
                <div className="sm:col-span-2 pt-2">
                  <span className="text-slate-500 font-medium block mb-1.5">Attached Image:</span>
                  <img
                    src={formData.imagePreview}
                    alt="Evidence Preview"
                    className="h-28 rounded-lg border border-slate-200 object-cover shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={RotateCcw}
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              Report Another Issue
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Civic Issue
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Help your community by reporting problems that need attention.
          </p>
        </div>

        {/* Visual Progress / Step Indicator */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 overflow-x-auto gap-2 py-1">
            <div className="flex items-center gap-2 text-civic-700 font-bold shrink-0">
              <span className="w-5 h-5 rounded-full bg-civic-600 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Issue Details</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <div className="flex items-center gap-2 text-slate-600 shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Location</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <div className="flex items-center gap-2 text-slate-600 shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Evidence</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <div className="flex items-center gap-2 text-slate-600 shrink-0">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                4
              </span>
              <span>Review</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Form Fields (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Issue Details */}
            <Card
              title="1. Issue Details"
              subtitle="Specify the category, title, description, and severity"
              icon={FileText}
            >
              <div className="space-y-5">
                {/* Category */}
                <FormField
                  id="issue-category"
                  label="Issue Category"
                  required
                  error={errors.category}
                  helperText="Choose the municipal category that best matches your issue."
                >
                  <select
                    id="issue-category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                      errors.category ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <option value="">Select an issue category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Title */}
                <FormField
                  id="issue-title"
                  label="Issue Title"
                  required
                  error={errors.title}
                  helperText="Provide a short, clear headline for the problem."
                >
                  <input
                    id="issue-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g. Large pothole near main road"
                    className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                      errors.title ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                </FormField>

                {/* Description */}
                <FormField
                  id="issue-description"
                  label="Description"
                  required
                  error={errors.description}
                  helperText="Describe the issue clearly so authorities can understand the problem."
                >
                  <textarea
                    id="issue-description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the issue clearly so authorities can understand the problem."
                    className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 resize-y ${
                      errors.description ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                </FormField>

                {/* Severity */}
                <FormField
                  label="Severity Level"
                  required
                  error={errors.severity}
                  helperText="Select the urgency of the problem based on safety or public disruption."
                >
                  <SeveritySelector
                    value={formData.severity}
                    onChange={(val) => handleInputChange('severity', val)}
                    error={errors.severity}
                  />
                </FormField>
              </div>
            </Card>

            {/* Card 2: Issue Location */}
            <Card
              title="2. Issue Location"
              subtitle="Provide the exact location or closest landmark"
              icon={MapPin}
            >
              <div className="space-y-5">
                {/* Address & Use My Location button */}
                <FormField
                  id="issue-address"
                  label="Address / Landmark"
                  required
                  error={errors.address}
                  helperText="Enter the street name, area, or notable nearby structure."
                >
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="issue-address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter street, area or nearby landmark"
                          className={`w-full pl-10 pr-3.5 py-2 text-sm bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 ${
                            errors.address ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                          }`}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        icon={isLocating ? undefined : Navigation}
                        disabled={isLocating || isSubmitting}
                        onClick={handleUseMyLocation}
                        className="sm:w-auto shrink-0"
                      >
                        {isLocating ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="animate-spin h-3.5 w-3.5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            <span>Detecting...</span>
                          </span>
                        ) : (
                          'Use My Location'
                        )}
                      </Button>
                    </div>

                    {/* Location Error Notice */}
                    {locationError && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block">Location Notice:</span>
                            <p className="text-amber-800 text-[11px] mt-0.5">{locationError}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocationError(null)}
                          className="text-amber-600 hover:text-amber-900 p-0.5"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Real GPS Location Indicator */}
                    {formData.latitude !== null && formData.longitude !== null && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-emerald-950 block">✓ Current location detected</span>
                            <span className="text-[11px] text-emerald-800 font-mono">
                              Latitude: {Number(formData.latitude).toFixed(6)} | Longitude: {Number(formData.longitude).toFixed(6)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-950 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          GPS
                        </span>
                      </div>
                    )}
                  </div>
                </FormField>

                {/* Additional Location Details */}
                <FormField
                  id="issue-location-details"
                  label="Additional Location Details (Optional)"
                  helperText="Add any landmark or directions that may help locate the issue."
                >
                  <textarea
                    id="issue-location-details"
                    rows={2}
                    value={formData.additionalLocation}
                    onChange={(e) => handleInputChange('additionalLocation', e.target.value)}
                    placeholder="Add any landmark or directions that may help locate the issue."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500 resize-y"
                  />
                </FormField>
              </div>
            </Card>

            {/* Card 3: Add Evidence */}
            <Card
              title="3. Add Evidence"
              subtitle="Attach an image of the civic issue (optional but recommended)"
              icon={Camera}
            >
              <ImageUpload
                previewUrl={formData.imagePreview}
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
              />
            </Card>
          </div>

          {/* Review / Summary Column (Right Column) */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Card 4: Summary & Submission */}
            <Card
              title="4. Review & Summary"
              subtitle="Verify your report details before submitting"
              icon={Sparkles}
            >
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <div className="flex justify-between items-start gap-2 border-b border-slate-200/70 pb-2">
                    <span className="text-slate-500 font-medium">Category:</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {formData.category || <span className="text-slate-400 font-normal italic">Not selected</span>}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2 border-b border-slate-200/70 pb-2">
                    <span className="text-slate-500 font-medium">Title:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]">
                      {formData.title || <span className="text-slate-400 font-normal italic">Not entered</span>}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2 border-b border-slate-200/70 pb-2">
                    <span className="text-slate-500 font-medium">Severity:</span>
                    <span>
                      {formData.severity ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-civic-100 text-civic-800">
                          {formData.severity}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not selected</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2 border-b border-slate-200/70 pb-2">
                    <span className="text-slate-500 font-medium">Location:</span>
                    <div className="text-right max-w-[180px]">
                      <span className="font-semibold text-slate-800 block truncate">
                        {formData.address || (formData.latitude !== null ? 'GPS Coordinates' : <span className="text-slate-400 font-normal italic">Not provided</span>)}
                      </span>
                      {formData.latitude !== null && formData.longitude !== null && (
                        <span className="text-[10px] text-emerald-700 font-mono block">
                          {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)} (GPS)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">Evidence:</span>
                    <span className="font-semibold text-slate-800">
                      {formData.imagePreview ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">No photo</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Validation summary alert if errors exist */}
                {Object.keys(errors).length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                    <p className="font-semibold text-rose-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Please complete required fields:</span>
                    </p>
                    <ul className="list-disc list-inside text-rose-700 text-[11px] pl-1 space-y-0.5">
                      {Object.values(errors).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Submission Error alert if API fails */}
                {submissionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                    <p className="font-semibold text-rose-800 flex items-center gap-1.5 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Submission Error</span>
                    </p>
                    <p className="text-rose-700 text-[11px] leading-relaxed">
                      {submissionError}
                    </p>
                  </div>
                )}

                {/* Submit and Cancel Actions */}
                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={isSubmitting ? undefined : Send}
                    disabled={isSubmitting}
                    className="w-full shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Submitting complaint...</span>
                      </span>
                    ) : (
                      'Submit Issue'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    disabled={isSubmitting}
                    onClick={() => navigate('/')}
                    className="w-full text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Submitted complaints are authenticated and analyzed automatically by the civic triage engine.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReportIssue;
