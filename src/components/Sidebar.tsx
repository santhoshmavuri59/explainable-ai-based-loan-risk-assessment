import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  ScanText,
  Activity,
  Sliders,
  Cpu,
  ShieldAlert,
  BarChart3,
  Bot,
  History,
  FileText,
} from 'lucide-react';
import { UserRole } from '../types';

export type ScreenId =
  | 'dashboard'
  | 'new_application'
  | 'ocr_verification'
  | 'risk_shap'
  | 'what_if'
  | 'model_lab'
  | 'fraud_anomaly'
  | 'reliability'
  | 'assistant'
  | 'audit_trail';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  userRole: UserRole;
  pendingReviewCount?: number;
  fraudAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  userRole,
  pendingReviewCount = 0,
  fraudAlertCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ScreenId,
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'applicant'],
    },
    {
      id: 'new_application' as ScreenId,
      label: 'New Loan Application',
      icon: FilePlus2,
      roles: ['admin', 'applicant'],
    },
    {
      id: 'ocr_verification' as ScreenId,
      label: 'Document Verification (OCR)',
      icon: ScanText,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      roles: ['admin', 'applicant'],
    },
    {
      id: 'risk_shap' as ScreenId,
      label: 'Risk Assessment + SHAP',
      icon: Activity,
      roles: ['admin', 'applicant'],
    },
    {
      id: 'what_if' as ScreenId,
      label: 'What-If Risk Simulator',
      icon: Sliders,
      roles: ['admin', 'applicant'],
    },
    {
      id: 'model_lab' as ScreenId,
      label: 'Three-Model Lab',
      icon: Cpu,
      roles: ['admin'],
    },
    {
      id: 'fraud_anomaly' as ScreenId,
      label: 'Fraud & Anomaly Screening',
      icon: ShieldAlert,
      badge: fraudAlertCount > 0 ? fraudAlertCount : undefined,
      roles: ['admin'],
    },
    {
      id: 'reliability' as ScreenId,
      label: 'Fairness & Reliability',
      icon: BarChart3,
      roles: ['admin'],
    },
    {
      id: 'assistant' as ScreenId,
      label: 'Risk Intelligence Assistant',
      icon: Bot,
      roles: ['admin', 'applicant'],
    },
    {
      id: 'audit_trail' as ScreenId,
      label: 'Decision Audit Trail',
      icon: History,
      roles: ['admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-1">
          Workspace Mode
        </div>
        <div className="text-sm font-medium text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          {userRole === 'admin' ? 'Underwriter Console' : 'Applicant Portal'}
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-rose-900/60 text-rose-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="font-medium text-slate-300 mb-0.5">XGBoost · RF · LightGBM</div>
        <div>Calibrated TreeSHAP Engine</div>
        <div className="mt-2 text-[10px] text-slate-400">
          Persistent SQLite/JSON Storage
        </div>
      </div>
    </aside>
  );
};
