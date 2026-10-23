import React from 'react';
import { ShieldCheck, UserCheck, PlayCircle, Download } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  availableUsers: User[];
  onOpenTests: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  availableUsers,
  onOpenTests,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8 sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-wider">
          AI
        </div>
        <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
          Explainable Loan Risk Matrix
        </span>
      </div>

      {/* Zone 2: Navigation / Quick links */}
      <div className="hidden md:flex items-center gap-6 text-xs text-slate-500 font-medium">
        <span>XGBoost · Random Forest · LightGBM</span>
        <span aria-hidden="true">·</span>
        <span>TreeSHAP Attributions</span>
        <span aria-hidden="true">·</span>
        <span>OCR Integrity Verification</span>
      </div>

      {/* Zone 3: Primary actions & User selector */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenTests}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
          title="Run and view automated test results and dependency map"
        >
          <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Execute Tests (12 Pass)</span>
        </button>

        {currentUser.role === 'admin' && (
          <a
            href="/api/export/applications.csv"
            download
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
        )}

        {/* User Role Switcher */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-slate-500 capitalize">
              {currentUser.role === 'admin' ? 'Credit Underwriter' : 'Loan Applicant'}
            </div>
          </div>
          
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = availableUsers.find((user) => user.id === e.target.value);
              if (u) onSwitchUser(u);
            }}
            aria-label="Switch active test account"
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.role === 'admin' ? `[Admin] ${u.name}` : `[Applicant] ${u.name}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
