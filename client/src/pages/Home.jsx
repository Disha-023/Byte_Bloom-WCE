import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, ArrowDown, ArrowRight, FileText, Cpu, Building2, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

export const Home = () => {
  const navigate = useNavigate();

  const flowSteps = [
    {
      step: '1',
      title: 'Citizen Reports',
      desc: 'Residents capture and submit civic issues in real-time.',
      icon: FileText,
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    {
      step: '2',
      title: 'AI-Assisted Processing',
      desc: 'Automated classification, prioritization, and routing.',
      icon: Cpu,
      badgeColor: 'bg-indigo-100 text-indigo-700'
    },
    {
      step: '3',
      title: 'Authority Action',
      desc: 'Municipal departments receive tasks and take action.',
      icon: Building2,
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    {
      step: '4',
      title: 'Issue Resolved',
      desc: 'Verified completion and transparent status update.',
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-100 text-emerald-700'
    }
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-50 text-civic-700 text-xs font-semibold border border-civic-200">
          Civic Tech Platform
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          Smart Civic Issue Resolution Agent
        </h1>
        
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Report civic issues, track their progress, and help make your community better.
        </p>

        {/* Call to Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/report')}
            className="w-full sm:w-auto"
          >
            Report an Issue
          </Button>
          <Button
            size="lg"
            variant="secondary"
            icon={Search}
            onClick={() => navigate('/track')}
            className="w-full sm:w-auto"
          >
            Track Issue
          </Button>
        </div>
      </div>

      {/* System Flow Diagram / Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xl font-bold text-slate-900">How The System Works</h2>
          <p className="text-xs text-slate-500 mt-1">
            An intelligent pipeline connecting citizens with local government for fast issue resolution.
          </p>
        </div>

        {/* Step-by-Step Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {flowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="flex flex-col items-center text-center p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all relative"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${step.badgeColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Step {step.step}
                </span>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-slate-500">{step.desc}</p>

                {/* Arrow for desktop */}
                {idx < flowSteps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1 border border-slate-200 shadow-sm text-slate-400">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
                {/* Arrow for mobile */}
                {idx < flowSteps.length - 1 && (
                  <div className="md:hidden mt-3 text-slate-400">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Feature Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Citizen-Centric Reporting"
          subtitle="Easy & Accessible"
          icon={FileText}
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Report road hazards, garbage dumps, street lighting failures, or water leakages directly from your device.
          </p>
        </Card>

        <Card
          title="Automated Triage"
          subtitle="Fast & Structured"
          icon={Cpu}
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Issues are categorized and directed to the responsible municipal department without bureaucratic delays.
          </p>
        </Card>

        <Card
          title="End-to-End Tracking"
          subtitle="Full Transparency"
          icon={CheckCircle2}
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Track status updates with real-time feedback until the civic problem is completely resolved.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Home;
