import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable FormField wrapper for inputs, selects, and textareas
 * Handles label, required indicator, helper text, and error messages
 */
export const FormField = ({
  id,
  label,
  required = false,
  error,
  helperText,
  icon: Icon,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
        >
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold" title="Required">*</span>}
        </label>
      )}

      <div>{children}</div>

      {helperText && !error && (
        <p className="text-[11px] text-slate-500 leading-normal">{helperText}</p>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-600 font-medium leading-normal mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default FormField;
