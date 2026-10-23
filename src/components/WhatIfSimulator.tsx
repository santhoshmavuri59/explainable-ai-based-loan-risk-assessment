import React, { useState, useEffect } from 'react';
import { Sliders, ArrowRight, RotateCcw, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { LoanApplication, RiskPrediction } from '../types';

interface WhatIfSimulatorProps {
  application: LoanApplication;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ application }) => {
  const originalScore = application.latestPrediction?.riskScore ?? 50;

  // Hypothetical state initialized to current application values
  const [loanAmount, setLoanAmount] = useState(application.loanAmount);
  const [loanTenureMonths, setLoanTenureMonths] = useState(application.loanTenureMonths);
  const [monthlyIncome, setMonthlyIncome] = useState(application.monthlyIncome);
  const [existingMonthlyDebt, setExistingMonthlyDebt] = useState(application.existingMonthlyDebt);
  const [creditScore, setCreditScore] = useState(application.creditScore);
  const [employmentDurationYears, setEmploymentDurationYears] = useState(application.employmentDurationYears);
  const [selectedModel, setSelectedModel] = useState<'XGBoost' | 'Random Forest' | 'LightGBM'>('XGBoost');

  const [simulatedPrediction, setSimulatedPrediction] = useState<RiskPrediction | null>(null);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${application.id}/what-if`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': application.applicantId,
        },
        body: JSON.stringify({
          modelName: selectedModel,
          hypotheticalInputs: {
            loanAmount,
            loanTenureMonths,
            monthlyIncome,
            existingMonthlyDebt,
            creditScore,
            employmentDurationYears,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSimulatedPrediction(data.hypotheticalPrediction);
        setScoreDelta(data.scoreDelta);
      }
    } catch (err) {
      console.error('What-If simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [loanAmount, loanTenureMonths, monthlyIncome, existingMonthlyDebt, creditScore, employmentDurationYears, selectedModel]);

  const handleReset = () => {
    setLoanAmount(application.loanAmount);
    setLoanTenureMonths(application.loanTenureMonths);
    setMonthlyIncome(application.monthlyIncome);
    setExistingMonthlyDebt(application.existingMonthlyDebt);
    setCreditScore(application.creditScore);
    setEmploymentDurationYears(application.employmentDurationYears);
  };

  const simDti = Number(((existingMonthlyDebt / (monthlyIncome || 1)) * 100).toFixed(1));
  const simScore = simulatedPrediction?.riskScore ?? originalScore;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            What-If Credit Risk Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Application <strong className="text-slate-700 font-mono">{application.id}</strong> ({application.applicantName}) · Counterfactual Parameter Experimentation
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset to Baseline Values</span>
        </button>
      </div>

      {/* Quality Gate Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Quality Gate Enforced: Read-Only Simulation</div>
          <div>
            Counterfactual calculations run dynamically against versioned decision models. <strong>The saved historical assessment in the database is strictly preserved</strong> and will never be overwritten by exploratory simulations.
          </div>
        </div>
      </div>

      {/* Comparison Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Baseline Card */}
        <div className="p-6 bg-white border border-slate-200 rounded flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Current Case (Saved)
          </div>
          <div className="my-4">
            <div className="text-4xl font-extrabold text-slate-800 tabular-nums">
              {originalScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-xs font-medium text-slate-600 mt-1">
              Band: {application.latestPrediction?.riskBand || 'Assessing'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            DTI: {application.debtToIncomeRatio}% · Score: {application.creditScore} · Debt: ${application.existingMonthlyDebt.toLocaleString()}
          </div>
        </div>

        {/* Delta Card */}
        <div className="p-6 bg-slate-900 text-white rounded flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Simulation Score Delta
          </div>
          <div className="my-4">
            <div className="text-4xl font-black tabular-nums flex items-center gap-2">
              <span className={scoreDelta < 0 ? 'text-emerald-400' : scoreDelta > 0 ? 'text-rose-400' : 'text-slate-300'}>
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
              </span>
              <span className="text-base font-normal text-slate-400">pts</span>
            </div>
            <div className="text-xs text-slate-300 mt-1">
              {scoreDelta < 0
                ? 'Improvement: Risk hazard reduced'
                : scoreDelta > 0
                ? 'Caution: Increased default probability'
                : 'Neutral: No change in risk band'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Evaluated via {selectedModel} (Real-time TreeSHAP recalculation)
          </div>
        </div>

        {/* Simulated Outcome Card */}
        <div className="p-6 bg-white border border-slate-200 rounded flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Hypothetical Result
          </div>
          <div className="my-4">
            <div className="text-4xl font-extrabold text-blue-600 tabular-nums">
              {simScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-xs font-medium text-slate-800 mt-1">
              Band: {simulatedPrediction?.riskBand || 'Calculating...'}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Default Probability:{' '}
            <strong className="tabular-nums">
              {simulatedPrediction ? (simulatedPrediction.defaultProbability * 100).toFixed(1) : 0}%
            </strong>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Modify Hypothetical Parameters
            </h2>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium"
            >
              <option value="XGBoost">Model: XGBoost v2.4</option>
              <option value="Random Forest">Model: Random Forest v3.1</option>
              <option value="LightGBM">Model: LightGBM v4.0</option>
            </select>
          </div>

          {/* Slider 1: Loan Amount */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700">Requested Loan Principal</span>
              <span className="font-bold text-slate-900 tabular-nums">
                ${loanAmount.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="150000"
              step="2500"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>$5,000</span>
              <span>Baseline: ${application.loanAmount.toLocaleString()}</span>
              <span>$150,000</span>
            </div>
          </div>

          {/* Slider 2: Loan Tenure */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700">Amortization Tenure</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {loanTenureMonths} Months
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="60"
              step="12"
              value={loanTenureMonths}
              onChange={(e) => setLoanTenureMonths(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>12 mo</span>
              <span>Baseline: {application.loanTenureMonths} mo</span>
              <span>60 mo</span>
            </div>
          </div>

          {/* Slider 3: Monthly Income */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700">Monthly Gross Inflow (Income)</span>
              <span className="font-bold text-slate-900 tabular-nums">
                ${monthlyIncome.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="2000"
              max="30000"
              step="500"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>$2,000</span>
              <span>Baseline: ${application.monthlyIncome.toLocaleString()}</span>
              <span>$30,000</span>
            </div>
          </div>

          {/* Slider 4: Existing Debt */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700">Existing Monthly Debt Obligations</span>
              <span className="font-bold text-slate-900 tabular-nums">
                ${existingMonthlyDebt.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="250"
              value={existingMonthlyDebt}
              onChange={(e) => setExistingMonthlyDebt(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>$0</span>
              <span>Baseline: ${application.existingMonthlyDebt.toLocaleString()}</span>
              <span>$15,000</span>
            </div>
          </div>

          {/* Slider 5: Credit Score */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-700">Credit Bureau Score</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {creditScore}
              </span>
            </div>
            <input
              type="range"
              min="400"
              max="850"
              step="10"
              value={creditScore}
              onChange={(e) => setCreditScore(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>400 (Subprime)</span>
              <span>Baseline: {application.creditScore}</span>
              <span>850 (Exceptional)</span>
            </div>
          </div>
        </div>

        {/* Dynamic SHAP Explanation of Changes */}
        <div className="bg-white border border-slate-200 rounded p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Hypothetical SHAP Factor Breakdown
          </h2>

          <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
            Simulated DTI is currently <strong className="tabular-nums">{simDti}%</strong> (was{' '}
            {application.debtToIncomeRatio}%).
          </div>

          <div className="space-y-3 pt-2">
            {simulatedPrediction?.shapFactors.map((f, i) => (
              <div key={i} className="p-3 bg-slate-50/70 border border-slate-100 rounded text-xs space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800">{f.label}</span>
                  <span className={f.contribution > 0 ? 'text-rose-600 font-mono' : 'text-emerald-600 font-mono'}>
                    {f.contribution > 0 ? `+${f.contribution}` : f.contribution} pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
