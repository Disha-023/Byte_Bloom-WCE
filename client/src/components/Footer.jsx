import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-white font-semibold text-base mb-3">
              <div className="w-7 h-7 rounded bg-civic-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Smart Civic Issue Resolution Agent</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Empowering citizens to report municipal and civic problems directly, accelerating automated triage and departmental resolution.
            </p>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">Citizen Dashboard</Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-white transition-colors">Report an Issue</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">Track Status</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              Civic Transparency
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed for open governance, rapid departmental action, and verifiable community improvement.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Smart Civic Issue Resolution Agent. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built for smarter communities</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
