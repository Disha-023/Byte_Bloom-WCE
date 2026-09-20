import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import Button from './Button';

export const ImageUpload = ({ previewUrl, onImageSelected, onImageRemoved }) => {
  const fileInputRef = useRef(null);
  const [fileError, setFileError] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');

    if (!file) return;

    // Allowed types: JPG, JPEG, PNG, WEBP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Please select a valid image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    // 5MB limit check (5 * 1024 * 1024 bytes)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileError('Image file exceeds the recommended 5 MB limit.');
      return;
    }

    const preview = URL.createObjectURL(file);
    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    setFileName(file.name);
    setFileSize(sizeFormatted);
    onImageSelected(file, preview);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFileName('');
    setFileSize('');
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemoved();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        id="issue-evidence-upload"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          className="border-2 border-dashed border-slate-200 hover:border-civic-400 bg-slate-50/70 hover:bg-civic-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-civic-500"
        >
          <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-sm">
            <UploadCloud className="w-6 h-6 text-civic-600" />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            Click to upload or drag and drop an image
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Upload a clear photo of the civic issue. Maximum recommended size: 5 MB.
          </p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">
            Supported formats: JPG, JPEG, PNG, WEBP (Local Preview Only)
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <ImageIcon className="w-4 h-4 text-civic-600" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{fileName || 'Attached Image'}</span>
              {fileSize && <span className="text-slate-400">({fileSize})</span>}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={X}
              onClick={handleRemove}
              className="text-rose-600 hover:bg-rose-50 border-rose-200"
            >
              Remove
            </Button>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-slate-100 bg-slate-900/5 max-h-72 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Uploaded civic issue preview"
              className="max-h-72 w-auto object-contain rounded-lg shadow-inner"
            />
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Local browser preview — image will not be uploaded to any server in Phase 1.
          </p>
        </div>
      )}

      {fileError && (
        <p className="flex items-center gap-1 text-xs text-rose-600 font-medium leading-normal">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{fileError}</span>
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
