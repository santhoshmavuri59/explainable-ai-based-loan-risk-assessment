import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Sliders,
  ScanText,
  Activity,
} from 'lucide-react';
import { LoanApplication, UserRole } from '../types';
import { ScreenId } from './Sidebar';

interface MainDashboardProps {
  applications: LoanApplication[];
  userRole: UserRole;
  onSelectApplication: (app: LoanApplication) => void;
  onNavigateScreen: (screen: ScreenId) => void;
  onOpenDecisionModal: (app: LoanApplication) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  applications,
  userRole,
  onSelectApplication,
  onNavigateScreen,
  onOpenDecisionModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Compute live real metrics from database records
  const totalApps = applications.length;
  const pendingReview = applications.filter(
    (a) => a.status === 'Verification Required' || a.status === 'Submitted'
  ).length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;
  const highRiskCount = applications.filter(
    (a) => a.latestPrediction?.riskBand === 'High Risk' || a.fraudAlerts.length > 0
  ).length;

  const validScores = applications
    .filter((a) => a.latestPrediction?.riskScore !== undefined)
    .map((a) => a.latestPrediction!.riskScore);
  const avgRiskScore = validScores.length > 0
    ? Math.round(validScores.reduce((acc, s) => acc + s, 0) / validScores.length)
    : 0;

  // Distribution
  const lowRiskCount = applications.filter((a) => (a.latestPrediction?.riskScore ?? 0) <= 34).length;
  const mediumRiskCount = applications.filter(
    (a) => (a.latestPrediction?.riskScore ?? 0) > 34 && (a.latestPrediction?.riskScore ?? 0) < 65
  ).length;
  const highRiskBandCount = applications.filter((a) => (a.latestPrediction?.riskScore ?? 0) >= 65).length;

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.loanPurpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PENDING')
      return matchesSearch && (app.status === 'Verification Required' || app.status === 'Submitted');
    if (statusFilter === 'APPROVED') return matchesSearch && app.status === 'Approved';
    if (statusFilter === 'HIGH_RISK')
      return matchesSearch && (app.latestPrediction?.riskBand === 'High Risk' || app.fraudAlerts.length > 0);
    return matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {userRole === 'admin' ? 'Underwriting & Risk Portfolio Overview' : 'My Loan Applications'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time credit risk analytics, TreeSHAP attributions, and OCR cross-document telemetry.
          </p>
        </div>

        <button
          onClick={() => onNavigateScreen('new_application')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          + Submit New Loan Request
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Applications</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalApps}</div>
          <div className="text-[11px] text-slate-400 mt-1">Live Database Records</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded">
          <div className="text-xs font-medium text-slate-500 mb-1">Awaiting Review</div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums">{pendingReview}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires Verification</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded">
          <div className="text-xs font-medium text-slate-500 mb-1">Approved Loans</div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums">{approvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Underwriter Confirmed</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded">
          <div className="text-xs font-medium text-slate-500 mb-1">High Risk / Flagged</div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">{highRiskCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Score ≥ 65 or Anomaly</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded">
          <div className="text-xs font-medium text-slate-500 mb-1">Portfolio Avg Risk</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{avgRiskScore} <span className="text-sm font-normal text-slate-400">/ 100</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Calibrated Baseline</div>
        </div>
      </div>

      {/* Risk Distribution Strip */}
      <div className="p-5 bg-white border border-slate-200 rounded space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
          <span>Portfolio Risk Band Distribution</span>
          <span className="text-slate-500 font-normal">
            Low (0–34) · Medium (35–64) · High (65–100)
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded overflow-hidden flex">
          <div
            style={{ width: `${totalApps > 0 ? (lowRiskCount / totalApps) * 100 : 0}%` }}
            className="bg-emerald-500 h-full transition-all"
            title={`Low Risk: ${lowRiskCount}`}
          />
          <div
            style={{ width: `${totalApps > 0 ? (mediumRiskCount / totalApps) * 100 : 0}%` }}
            className="bg-amber-500 h-full transition-all"
            title={`Medium Risk: ${mediumRiskCount}`}
          />
          <div
            style={{ width: `${totalApps > 0 ? (highRiskBandCount / totalApps) * 100 : 0}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`High Risk: ${highRiskBandCount}`}
          />
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-600 font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>Low Risk: <strong className="tabular-nums">{lowRiskCount}</strong> ({totalApps > 0 ? Math.round((lowRiskCount / totalApps) * 100) : 0}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span>Medium Risk: <strong className="tabular-nums">{mediumRiskCount}</strong> ({totalApps > 0 ? Math.round((mediumRiskCount / totalApps) * 100) : 0}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span>High Risk: <strong className="tabular-nums">{highRiskBandCount}</strong> ({totalApps > 0 ? Math.round((highRiskBandCount / totalApps) * 100) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Applications Ledger Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, name, purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-64 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PENDING', label: 'Pending' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'HIGH_RISK', label: 'High Risk' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="tabular-nums font-semibold text-slate-800">{filteredApps.length}</span> records
          </div>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
                <th className="py-2.5 px-4">Application ID</th>
                <th className="py-2.5 px-4">Applicant</th>
                <th className="py-2.5 px-4 text-right">Loan Amount</th>
                <th className="py-2.5 px-4 text-right">DTI Ratio</th>
                <th className="py-2.5 px-4 text-center">Credit Bureau</th>
                <th className="py-2.5 px-4 text-center">Risk Score</th>
                <th className="py-2.5 px-4">Lifecycle Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No loan applications matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const score = app.latestPrediction?.riskScore;
                  const band = app.latestPrediction?.riskBand;
                  const hasMismatches = app.documents.some((d) => d.status === 'Mismatch detected');

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onSelectApplication(app)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {app.id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{app.applicantName}</div>
                        <div className="text-[11px] text-slate-400">{app.loanPurpose} · {app.loanTenureMonths} mo</div>
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        ${app.loanAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                        <span className={`font-medium ${app.debtToIncomeRatio > 40 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {app.debtToIncomeRatio}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center tabular-nums whitespace-nowrap">
                        <span className={`font-semibold ${app.creditScore >= 720 ? 'text-emerald-600' : app.creditScore >= 640 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {app.creditScore}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {score !== undefined ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                band === 'Low Risk'
                                  ? 'bg-emerald-500'
                                  : band === 'Medium Risk'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span className="font-bold tabular-nums text-slate-900">{score}</span>
                            <span className="text-[11px] text-slate-400">({band?.replace(' Risk', '')})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Calculating</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-700">{app.status}</span>
                          {hasMismatches && (
                            <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-medium border border-rose-200">
                              OCR Mismatch
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              onSelectApplication(app);
                              onNavigateScreen('risk_shap');
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                            title="Inspect TreeSHAP feature attributions"
                          >
                            SHAP
                          </button>

                          <button
                            onClick={() => {
                              onSelectApplication(app);
                              onNavigateScreen('what_if');
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="Test hypothetical adjustments"
                          >
                            What-If
                          </button>

                          <button
                            onClick={() => {
                              onSelectApplication(app);
                              onNavigateScreen('ocr_verification');
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="View OCR documents and heatmap"
                          >
                            OCR
                          </button>

                          {userRole === 'admin' && (
                            <button
                              onClick={() => onOpenDecisionModal(app)}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                            >
                              Decision
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
