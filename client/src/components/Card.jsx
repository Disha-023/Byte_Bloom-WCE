import React from 'react';

/**
 * Reusable Card / Page Container Component
 */
export const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  className = '',
  headerAction,
  footer,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {(title || Icon || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-civic-50 text-civic-600 rounded-lg shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-slate-800 text-base">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
