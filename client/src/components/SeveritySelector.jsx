import React from 'react';
import { AlertCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

const SEVERITY_LEVELS = [
  {
    id: 'Low',
    label: 'Low',
    description: 'Minor inconvenience; no immediate risk',
    icon: Info,
    colorClass: 'text-blue-700 bg-blue-50 border-blue-200 hover:border-blue-400',
    activeClass: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/80 font-semibold text-blue-900',
    dotClass: 'bg-blue-500'
  },
  {
    id: 'Medium',
    label: 'Medium',
    description: 'Moderate disruption; needs standard attention',
    icon: AlertCircle,
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200 hover:border-amber-400',
    activeClass: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/80 font-semibold text-amber-900',
    dotClass: 'bg-amber-500'
  },
  {
    id: 'High',
    label: 'High',
    description: 'Significant public impact or property damage risk',
    icon: AlertTriangle,
    colorClass: 'text-orange-700 bg-orange-50 border-orange-200 hover:border-orange-400',
    activeClass: 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/80 font-semibold text-orange-900',
    dotClass: 'bg-orange-500'
  },
  {
    id: 'Critical',
    label: 'Critical',
    description: 'Immediate hazard to safety or life',
    icon: AlertOctagon,
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200 hover:border-rose-400',
    activeClass: 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/80 font-semibold text-rose-900',
    dotClass: 'bg-rose-500'
  }
];

export const SeveritySelector = ({ value, onChange, error }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SEVERITY_LEVELS.map((level) => {
          const isSelected = value === level.id;
          const Icon = level.icon;

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onChange(level.id)}
              className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                level.colorClass
              } ${isSelected ? level.activeClass : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'} ${
                error && !value ? 'border-rose-300' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <span className={`w-2 h-2 rounded-full ${level.dotClass}`} />
                  <span>{level.label}</span>
                </div>
                <Icon className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-60'}`} />
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {level.description}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-600 font-medium leading-normal mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default SeveritySelector;
