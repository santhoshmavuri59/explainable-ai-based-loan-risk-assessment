import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { User, LoanApplication } from '../types';

interface NewLoanApplicationProps {
  currentUser: User;
  onApplicationCreated: (newApp: LoanApplication) => void;
  onCancel: () => void;
}

export const NewLoanApplication: React.FC<NewLoanApplicationProps> = ({
  currentUser,
  onApplicationCreated,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [fullName, setFullName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+1 (555) 234-8899');
  const [homeOwnership, setHomeOwnership] = useState<'Rent' | 'Own' | 'Mortgage'>('Rent');

  const [loanAmount, setLoanAmount] = useState(35000);
  const [loanTenureMonths, setLoanTenureMonths] = useState(36);
  const [loanPurpose, setLoanPurpose] = useState<LoanApplication['loanPurpose']>('Debt Consolidation');

  const [monthlyIncome, setMonthlyIncome] = useState(6500);
  const [existingMonthlyDebt, setExistingMonthlyDebt] = useState(1600);
  const [employmentType, setEmploymentType] = useState<LoanApplication['employmentType']>('Salaried');
  const [employmentDurationYears, setEmploymentDurationYears] = useState(4);
  const [creditScore, setCreditScore] = useState(680);
  const [assetValue, setAssetValue] = useState(25000);

  // Document Upload State
  const [uploadedDocs, setUploadedDocs] = useState<{
    docType: 'identity_proof' | 'salary_slip' | 'bank_statement';
    fileName: string;
  }[]>([
    { docType: 'identity_proof', fileName: 'government_id_card.pdf' },
    { docType: 'salary_slip', fileName: 'recent_payslip_verified.pdf' },
    { docType: 'bank_statement', fileName: 'bank_statement_90days.pdf' },
  ]);

  // Derived calculations
  const dti = Number(((existingMonthlyDebt / (monthlyIncome || 1)) * 100).toFixed(1));
  const estimatedMonthlyPayment = Math.round(loanAmount / loanTenureMonths);
  const pti = Number(((estimatedMonthlyPayment / (monthlyIncome || 1)) * 100).toFixed(1));

  const handleFileUpload = (docType: 'identity_proof' | 'salary_slip' | 'bank_statement', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedDocs((prev) => [
        ...prev.filter((d) => d.docType !== docType),
        { docType, fileName: file.name },
      ]);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (loanAmount <= 0 || monthlyIncome <= 0) {
      setErrorMsg('Loan amount and monthly income must be greater than zero.');
      return;
    }
    if (creditScore < 300 || creditScore > 850) {
      setErrorMsg('Credit bureau score must be within standard range (300 - 850).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          loanAmount,
          loanTenureMonths,
          loanPurpose,
          monthlyIncome,
          employmentType,
          employmentDurationYears,
          existingMonthlyDebt,
          creditScore,
          assetValue,
          homeOwnership,
          documents: uploadedDocs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit loan application');
      }

      onApplicationCreated(data.application);
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          New Loan Application
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete the financial declarations and upload supporting documents for instant explainable credit assessment.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 text-xs font-medium">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            1
          </span>
          <span>Personal Info</span>
        </div>
        <span className="text-slate-300">———</span>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            2
          </span>
          <span>Loan Details</span>
        </div>
        <span className="text-slate-300">———</span>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            3
          </span>
          <span>Financials & Employment</span>
        </div>
        <span className="text-slate-300">———</span>
        <div className={`flex items-center gap-2 ${step >= 4 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            4
          </span>
          <span>Document Upload</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            1. Applicant Identification & Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Legal Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Residential Status</label>
              <select
                value={homeOwnership}
                onChange={(e) => setHomeOwnership(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Own">Own (No Mortgage)</option>
                <option value="Mortgage">Mortgage</option>
                <option value="Rent">Rent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
            >
              <span>Continue to Loan Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Loan Details */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            2. Requested Loan Facility
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Loan Amount ($ USD)</label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Tenure (Months)</label>
              <select
                value={loanTenureMonths}
                onChange={(e) => setLoanTenureMonths(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value={12}>12 Months (1 Year)</option>
                <option value={24}>24 Months (2 Years)</option>
                <option value={36}>36 Months (3 Years)</option>
                <option value={48}>48 Months (4 Years)</option>
                <option value={60}>60 Months (5 Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Loan Purpose</label>
              <select
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Debt Consolidation">Debt Consolidation</option>
                <option value="Home Purchase">Home Purchase / Renovation</option>
                <option value="Auto">Auto Financing</option>
                <option value="Small Business">Small Business Capital</option>
                <option value="Education">Education</option>
                <option value="Personal">Personal Loan</option>
              </select>
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Estimated Amortized Principal: <strong>${estimatedMonthlyPayment.toLocaleString()} / mo</strong></span>
            <span>Tenure: <strong>{loanTenureMonths} months</strong></span>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
            >
              <span>Continue to Financials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Financials & Employment */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            3. Income, Obligations & Credit Bureau
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Gross Monthly Income ($)</label>
              <input
                type="number"
                min="500"
                step="250"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Existing Monthly Debt ($)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={existingMonthlyDebt}
                onChange={(e) => setExistingMonthlyDebt(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Credit Score (300–850)</label>
              <input
                type="number"
                min="300"
                max="850"
                value={creditScore}
                onChange={(e) => setCreditScore(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Salaried">Salaried (W-2 / PAYE)</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Contractor">Contractor / 1099</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Career Tenure (Years)</label>
              <input
                type="number"
                min="0"
                max="40"
                value={employmentDurationYears}
                onChange={(e) => setEmploymentDurationYears(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Estimated Reserve Assets ($)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={assetValue}
                onChange={(e) => setAssetValue(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Real-time calculated indicators */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded text-xs">
            <div>
              <div className="text-slate-500 font-medium mb-0.5">Debt-to-Income (DTI) Ratio</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {dti}%{' '}
                <span className={`text-xs font-normal ${dti > 43 ? 'text-rose-600' : dti > 36 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  ({dti > 43 ? 'High Debt Burden' : dti > 36 ? 'Moderate' : 'Conservative'})
                </span>
              </div>
            </div>

            <div>
              <div className="text-slate-500 font-medium mb-0.5">Payment-to-Income (PTI) Ratio</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {pti}%{' '}
                <span className="text-xs font-normal text-slate-500">
                  (Estimated monthly service: ${estimatedMonthlyPayment})
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
            >
              <span>Continue to Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Document Upload */}
      {step === 4 && (
        <div className="bg-white border border-slate-200 rounded p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            4. Supporting Documents & Declaration
          </h2>

          <div className="space-y-4">
            {[
              {
                type: 'identity_proof' as const,
                title: 'National Identity / Passport Scan',
                desc: 'Government credential used for KYC extraction and name cross-verification.',
              },
              {
                type: 'salary_slip' as const,
                title: 'Salary Slip / Earnings Statement',
                desc: 'Recent official payslip used by OCR to extract gross pay and employer.',
              },
              {
                type: 'bank_statement' as const,
                title: '90-Day Bank Account Statement',
                desc: 'Official bank statement verifying recurring inflow deposits.',
              },
            ].map((docItem) => {
              const currentUploaded = uploadedDocs.find((d) => d.docType === docItem.type);

              return (
                <div
                  key={docItem.type}
                  className="p-4 border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{docItem.title}</div>
                    <div className="text-[11px] text-slate-500">{docItem.desc}</div>
                    {currentUploaded && (
                      <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready: {currentUploaded.fileName}</span>
                      </div>
                    )}
                  </div>

                  <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(docItem.type, e)}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded text-[11px] text-blue-800">
            <strong>OCR Processing Notice:</strong> Files uploaded will undergo OpenCV preprocessing and Tesseract OCR field extraction. The system cross-compares self-reported income with payslip lines.
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing OCR & Running Models...' : 'Submit & Generate Explainable Risk Assessment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
