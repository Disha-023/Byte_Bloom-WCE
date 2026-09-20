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
  mockCoordinates: '',
  mockLocationUsed: false,
  imageFile: null,
  imagePreview: null
};

export const ReportIssue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

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
  };

  // Mock Geolocation Handler (Strictly Mock demonstration, no browser API)
  const handleUseMyLocation = () => {
    const mockCoords = '16.8524, 74.5815';
    setFormData((prev) => ({
      ...prev,
      mockCoordinates: mockCoords,
      mockLocationUsed: true,
      address: prev.address ? prev.address : 'Near Central Civic Square, Main Street'
    }));

    if (errors.address) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.address;
        return next;
      });
    }
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
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title should be at least 5 characters long.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please describe the issue.';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Please provide more details (at least 10 characters).';
    }

    if (!formData.severity) {
      newErrors.severity = 'Please select the severity.';
    }

    if (!formData.address.trim() && !formData.mockCoordinates) {
      newErrors.address = 'Please provide the issue location.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submission (Frontend demonstration only)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset form
  const handleReset = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setIsSubmitted(false);
  };

  // If submitted successfully (Frontend-only Success View)
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Issue Report Ready
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your issue has been prepared successfully. Backend submission will be connected in a later phase.
            </p>
          </div>

          {/* Prepared Issue Summary Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Prepared Issue Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Category:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{formData.category}</p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Severity:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{formData.severity}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium">Title:</span>
                <p className="text-slate-900 font-semibold mt-0.5">{formData.title}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium">Location:</span>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {formData.address}
                  {formData.mockCoordinates && (
                    <span className="ml-1.5 text-civic-600 font-normal">
                      ({formData.mockCoordinates} - Mock GPS)
                    </span>
                  )}
                </p>
              </div>

              {formData.imagePreview && (
                <div className="sm:col-span-2 pt-2">
                  <span className="text-slate-500 font-medium block mb-1.5">Attached Image Preview:</span>
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
                        icon={Navigation}
                        onClick={handleUseMyLocation}
                        className="sm:w-auto shrink-0"
                      >
                        Use My Location
                      </Button>
                    </div>

                    {/* Mock Geolocation Indicator */}
                    {formData.mockLocationUsed && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Location selected:</strong> Mock coordinates ({formData.mockCoordinates})
                          </span>
                        </div>
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                          Demo Mock
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
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]">
                      {formData.address || (formData.mockCoordinates ? `Mock (${formData.mockCoordinates})` : <span className="text-slate-400 font-normal italic">Not provided</span>)}
                    </span>
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

                {/* Submit and Cancel Actions */}
                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={Send}
                    className="w-full shadow-md"
                  >
                    Submit Issue
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => navigate('/')}
                    className="w-full text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Phase 2 Client Demo: Form actions demonstrate full interactive UX without sending data to backend.
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
