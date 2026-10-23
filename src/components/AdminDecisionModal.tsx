import React, { useState } from 'react';
import { LoanApplication } from '../types';

interface AdminDecisionModalProps {
  application: LoanApplication | null;
  onClose: () => void;
  onDecisionSubmitted: (updatedApp: LoanApplication) => void;
}

export const AdminDecisionModal: React.FC<AdminDecisionModalProps> = ({
  application,
  onClose,
  onDecisionSubmitted,
}) => {
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'More Information Required'>('Approved');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!application) return null;

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg('A recorded underwriter reason (minimum 5 characters) is required for compliance audit logging.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/applications/${application.id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr_admin_001',
        },
        body: JSON.stringify({ decision, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record administrative decision');
      }

      onDecisionSubmitted(data.application);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Record Underwriter Determination: {application.id}
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Applicant: {application.applicantName} · Requested: ${application.loanAmount.toLocaleString()} · Calibrated Risk: {application.latestPrediction?.riskScore ?? 'N/A'}/100
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Final Administrative Determination
            </label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="Approved">Approved (Issue Formal Facility Offer)</option>
              <option value="Rejected">Rejected (Adverse Action Notice)</option>
              <option value="More Information Required">More Information Required (Request Clarifying Documents)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Mandatory Underwriter Rationale (Recorded to Audit Trail)
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verified low DTI (12%), prime credit rating of 785, clean salary slips matching bank statements..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
          >
            {submitting ? 'Persisting Decision...' : 'Commit Determination to Database'}
          </button>
        </div>
      </div>
    </div>
  );
};
