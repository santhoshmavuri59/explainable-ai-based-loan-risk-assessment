import React from 'react';
import {
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { LoanApplication, ShapFactor } from '../types';

interface RiskAssessmentSHAPProps {
  application: LoanApplication;
  onNavigateWhatIf: () => void;
}

export const RiskAssessmentSHAP: React.FC<RiskAssessmentSHAPProps> = ({
  application,
  onNavigateWhatIf,
}) => {
  const prediction = application.latestPrediction;

  if (!prediction) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center py-16">
        <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" />
        <h2 className="text-base font-semibold text-slate-800">Calculating Model Inference...</h2>
        <p className="text-xs text-slate-500">TreeSHAP decomposition in progress.</p>
      </div>
    );
  }

  const { riskScore, riskBand, defaultProbability, baseValue, shapFactors, summaryExplanation, modelName, modelVersion } = prediction;

  const scoreColor =
    riskBand === 'Low Risk'
      ? 'text-emerald-600'
      : riskBand === 'Medium Risk'
      ? 'text-amber-600'
      : 'text-rose-600';

  const badgeBg =
    riskBand === 'Low Risk'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : riskBand === 'Medium Risk'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-rose-50 text-rose-800 border-rose-200';

  const maxContribution = Math.max(1, ...shapFactors.map((f) => Math.abs(f.contribution)));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Loan Risk Assessment & TreeSHAP Explanation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Application <strong className="text-slate-700 font-mono">{application.id}</strong> ({application.applicantName}) · Calibrated Probabilistic Inference
          </p>
        </div>

        <button
          onClick={onNavigateWhatIf}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Launch What-If Simulator</span>
        </button>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Score Dial Card */}
        <div className="p-6 bg-white border border-slate-200 rounded flex flex-col items-center justify-center text-center">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Calibrated Risk Score
          </div>

          <div className="relative flex items-center justify-center my-1">
            <span className={`text-5xl font-black tracking-tight tabular-nums ${scoreColor}`}>
              {riskScore}
            </span>
            <span className="text-slate-400 text-sm font-normal ml-1">/ 100</span>
          </div>

          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
            {riskBand}
          </div>

          <div className="text-[11px] text-slate-400 mt-2">
            Base Expectation: <strong className="tabular-nums">{baseValue.toFixed(0)} pts</strong>
          </div>
        </div>

        {/* Default Probability */}
        <div className="p-6 bg-white border border-slate-200 rounded flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Estimated Default Probability
            </div>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {(defaultProbability * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Platt-scaled sigmoid calibration on 1,000 held-out loan observations.
          </div>
        </div>

        {/* Debt-to-Income Indicator */}
        <div className="p-6 bg-white border border-slate-200 rounded flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Debt-to-Income (DTI)
            </div>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {application.debtToIncomeRatio}%
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Monthly debt (${application.existingMonthlyDebt.toLocaleString()}) / Monthly income (${application.monthlyIncome.toLocaleString()}).
          </div>
        </div>

        {/* Active Model Version */}
        <div className="p-6 bg-white border border-slate-200 rounded flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Model Engine
            </div>
            <div className="text-lg font-bold text-slate-900">{modelName}</div>
            <div className="text-[11px] font-mono text-slate-500">{modelVersion}</div>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium pt-2 border-t border-slate-100 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero-Leakage Validated</span>
          </div>
        </div>
      </div>

      {/* Human Explanation Narrative */}
      <div className="p-5 bg-white border border-slate-200 rounded space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Explainable Credit Reasoning Synthesis</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          {summaryExplanation}
        </p>
        <div className="text-[11px] text-slate-400 pt-1">
          <strong>Fair Lending Compliance Note:</strong> In accordance with credit governance standards, features are restricted to verifiable economic parameters. Demographics, protected classes, or non-financial characteristics are not utilized.
        </div>
      </div>

      {/* TreeSHAP Feature Attribution Chart */}
      <div className="bg-white border border-slate-200 rounded p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              TreeSHAP Local Feature Attributions (Additive Breakdown)
            </h2>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                <span>Increases Risk Score (+)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>Mitigates Risk Score (-)</span>
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Quantifies the exact contribution of each factor to shifting the candidate’s score from the population baseline ({baseValue.toFixed(0)} pts) to the final prediction ({riskScore} pts).
          </p>
        </div>

        {/* Feature Bars */}
        <div className="space-y-4 pt-2">
          {shapFactors.map((factor, idx) => {
            const isRisk = factor.contribution > 0;
            const barWidthPercent = (Math.abs(factor.contribution) / maxContribution) * 100;

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-800">
                    {factor.label}{' '}
                    <span className="text-[11px] font-normal text-slate-400">
                      ({factor.description})
                    </span>
                  </div>
                  <div className="font-mono font-bold tabular-nums">
                    <span className={isRisk ? 'text-rose-600' : 'text-emerald-600'}>
                      {isRisk ? `+${factor.contribution}` : factor.contribution} pts
                    </span>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded overflow-hidden flex">
                  {isRisk ? (
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className="bg-rose-500 h-full rounded transition-all"
                    />
                  ) : (
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className="bg-emerald-500 h-full rounded transition-all"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
