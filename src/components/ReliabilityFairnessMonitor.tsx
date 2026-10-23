import React from 'react';
import { BarChart3, AlertCircle, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

export const ReliabilityFairnessMonitor: React.FC = () => {
  // Calibration bins: Predicted vs Observed default frequencies
  const calibrationBins = [
    { bin: '0 - 20% Estimated Risk', predictedAvg: 11.2, observedDefault: 10.8, sampleCount: 380 },
    { bin: '20 - 40% Estimated Risk', predictedAvg: 29.5, observedDefault: 31.0, sampleCount: 290 },
    { bin: '40 - 60% Estimated Risk', predictedAvg: 48.7, observedDefault: 47.9, sampleCount: 160 },
    { bin: '60 - 80% Estimated Risk', predictedAvg: 69.1, observedDefault: 72.4, sampleCount: 115 },
    { bin: '80 - 100% Estimated Risk', predictedAvg: 88.4, observedDefault: 86.8, sampleCount: 55 },
  ];

  // Feature drift PSI (Population Stability Index)
  const driftFeatures = [
    { feature: 'Debt-to-Income (DTI)', psi: 0.042, status: 'STABLE', note: 'No distribution shift detected (PSI < 0.1)' },
    { feature: 'Requested Loan Amount', psi: 0.068, status: 'STABLE', note: 'Slight upward shift toward larger debt consolidation requests' },
    { feature: 'Credit Bureau Score', psi: 0.031, status: 'STABLE', note: 'Distribution matches training baseline' },
    { feature: 'Monthly Inflow (Income)', psi: 0.054, status: 'STABLE', note: 'Nominal variance' },
  ];

  // Missing feature rates
  const missingness = [
    { field: 'Declared Monthly Income', missingRate: 0.0, required: true },
    { field: 'Existing Monthly Debt', missingRate: 0.0, required: true },
    { field: 'Credit Bureau Score', missingRate: 0.0, required: true },
    { field: 'Reserve Asset Estimates', missingRate: 2.4, required: false },
    { field: 'Employment Duration', missingRate: 0.0, required: true },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Fairness & Reliability Monitor
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Empirical probability calibration curves, Population Stability Index (PSI) drift tracking, and Fair Lending governance.
        </p>
      </div>

      {/* Fair Lending Compliance Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Fair Lending & Algorithmic Non-Discrimination Policy</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          In compliance with the Equal Credit Opportunity Act (ECOA) and model risk governance principles, <strong>no sensitive personal characteristics (race, ethnicity, religion, sex, marital status, or age) are collected or supplied to the ML feature vector</strong>. Evaluation metrics are partitioned strictly by objective economic variables (loan purpose and amortization tiers).
        </p>
      </div>

      {/* Calibration Quality & Reliability */}
      <div className="bg-white border border-slate-200 rounded p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Probability Calibration Assessment (Platt-Scaled Sigmoid)
            </h2>
            <p className="text-[11px] text-slate-500">
              Comparing estimated model probability of default against empirical ground truth on held-out test partitions.
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
            Brier Score: 0.089 (Well Calibrated)
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {calibrationBins.map((bin, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between font-medium text-slate-800">
                <span>{bin.bin} <span className="text-[11px] text-slate-400 font-normal">({bin.sampleCount} loans)</span></span>
                <span className="font-mono tabular-nums">
                  Pred: {bin.predictedAvg}% vs Obs: <strong className="text-blue-700">{bin.observedDefault}%</strong>
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded overflow-hidden flex">
                <div
                  style={{ width: `${bin.predictedAvg}%` }}
                  className="bg-blue-600 h-full rounded"
                  title={`Predicted: ${bin.predictedAvg}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Drift (PSI) & Missingness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PSI Drift */}
        <div className="bg-white border border-slate-200 rounded p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Feature Population Stability Index (PSI)
          </h2>
          <div className="space-y-3 text-xs">
            {driftFeatures.map((f, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-800">{f.feature}</span>
                  <span className="font-mono text-emerald-700 font-bold text-[11px]">
                    PSI: {f.psi} ({f.status})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{f.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Feature Rates */}
        <div className="bg-white border border-slate-200 rounded p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Feature Completeness & Missingness Rates
          </h2>
          <div className="space-y-3 text-xs">
            {missingness.map((m, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-100">
                <div>
                  <div className="font-medium text-slate-800">{m.field}</div>
                  <div className="text-[10px] text-slate-400">{m.required ? 'Mandatory Field' : 'Optional Supplemental'}</div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${m.missingRate === 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {m.missingRate.toFixed(1)}% Missing
                  </div>
                  <div className="text-[10px] text-slate-400">Tolerance &lt; 5.0%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
