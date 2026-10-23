import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ScanText,
  ShieldAlert,
  Edit3,
  ExternalLink,
  Info,
} from 'lucide-react';
import { LoanApplication, UploadedDocument } from '../types';
import { runCrossDocumentVerification } from '../services/ocrService';

interface DocumentVerificationProps {
  application: LoanApplication;
  onRefreshApplication: (updatedApp: LoanApplication) => void;
  isAdmin: boolean;
}

export const DocumentVerification: React.FC<DocumentVerificationProps> = ({
  application,
  onRefreshApplication,
  isAdmin,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(
    application.documents[0] || null
  );
  const [editingDoc, setEditingDoc] = useState<UploadedDocument | null>(null);
  const [correctedIncome, setCorrectedIncome] = useState<number>(0);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  const crossChecks = runCrossDocumentVerification(application);
  const hasMismatches = crossChecks.some((c) => c.matchStatus === 'MISMATCH');

  const handleOpenOverride = (doc: UploadedDocument) => {
    setEditingDoc(doc);
    setCorrectedIncome(doc.extractedFields.income || application.monthlyIncome);
    setReviewerNotes(doc.reviewerNotes || 'Underwriter physically verified employer voucher.');
  };

  const handleSaveOverride = async () => {
    if (!editingDoc) return;
    setSavingOverride(true);
    try {
      const res = await fetch(`/api/documents/${editingDoc.id}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr_admin_001',
        },
        body: JSON.stringify({
          docId: editingDoc.id,
          correctedIncome,
          reviewerNotes,
          newStatus: 'Matched',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onRefreshApplication(data.application);
        setEditingDoc(null);
      }
    } catch (err) {
      console.error('Failed to save manual override:', err);
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Document Verification & OCR Cross-Check
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Application <strong className="text-slate-700 font-mono">{application.id}</strong> ({application.applicantName}) · Computer Vision OCR Field Extraction
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded border ${
              hasMismatches
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {hasMismatches ? 'Cross-Document Mismatch Flagged' : 'All Documents Verified'}
          </span>
        </div>
      </div>

      {/* Honest Disclosure Banner */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-slate-800">Quality & Authenticity Disclosure</div>
          <div>
            OCR text extraction confirms legible characters in submitted scans but <strong>does not prove document authenticity or anti-forgery</strong>. External biometric / KYC verification service status: <strong className="text-amber-700 font-medium">Not Configured (Sandbox Mode)</strong>.
          </div>
        </div>
      </div>

      {/* Main Grid: Uploaded Documents list vs Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Documents List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Uploaded Supporting Files ({application.documents.length})
          </div>

          {application.documents.length === 0 ? (
            <div className="p-6 bg-white border border-slate-200 rounded text-center text-xs text-slate-400">
              No documents uploaded for this application.
            </div>
          ) : (
            application.documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              const isMismatch = doc.status === 'Mismatch detected';

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 bg-white border rounded cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 ring-1 ring-blue-600 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {doc.fileName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        isMismatch
                          ? 'bg-rose-100 text-rose-700'
                          : doc.status === 'Matched'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="capitalize">{doc.docType.replace('_', ' ')}</span>
                    <span className="tabular-nums font-mono">
                      Clarity: {(doc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {isMismatch && (
                    <div className="mt-2 text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded">
                      Discrepancy detected during cross-check
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right 2 Cols: Extracted Data & Cross-Check Matrix */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Document Details Card */}
          {selectedDoc && (
            <div className="bg-white border border-slate-200 rounded p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Extracted Optical Fields: {selectedDoc.fileName}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    OCR Engine: Tesseract 5.3 + OpenCV Adaptive Thresholding
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenOverride(selectedDoc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Underwriter Override</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <div className="text-slate-400 text-[11px] mb-0.5">Applicant Name</div>
                  <div className="font-semibold text-slate-800">
                    {selectedDoc.extractedFields.applicantName || 'Not identified'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <div className="text-slate-400 text-[11px] mb-0.5">Extracted Monthly Income</div>
                  <div className="font-semibold text-slate-800 tabular-nums">
                    {selectedDoc.extractedFields.income
                      ? `$${selectedDoc.extractedFields.income.toLocaleString()}`
                      : 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <div className="text-slate-400 text-[11px] mb-0.5">Employer / Authority</div>
                  <div className="font-semibold text-slate-800 truncate">
                    {selectedDoc.extractedFields.employerName ||
                      selectedDoc.extractedFields.issueAuthority ||
                      'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <div className="text-slate-400 text-[11px] mb-0.5">Account / Identifier #</div>
                  <div className="font-semibold text-slate-800 font-mono">
                    {selectedDoc.extractedFields.accountNumber ||
                      selectedDoc.extractedFields.idNumber ||
                      'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <div className="text-slate-400 text-[11px] mb-0.5">Document Date</div>
                  <div className="font-semibold text-slate-800 tabular-nums">
                    {selectedDoc.extractedFields.documentDate || 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <div className="text-slate-400 text-[11px] mb-0.5">OCR Confidence</div>
                  <div className="font-semibold text-emerald-700 tabular-nums">
                    {(selectedDoc.confidence * 100).toFixed(1)}% Clarity
                  </div>
                </div>
              </div>

              {selectedDoc.reviewedBy && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900">
                  <strong>Underwriter Override Active:</strong> Verified by {selectedDoc.reviewedBy} at{' '}
                  {new Date(selectedDoc.reviewedAt!).toLocaleDateString()}. Notes: {selectedDoc.reviewerNotes}
                </div>
              )}
            </div>
          )}

          {/* Cross-Document Heatmap Matrix */}
          <div className="bg-white border border-slate-200 rounded p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Cross-Document Verification Matrix
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated reconciliation comparing applicant declarations against extracted optical tokens.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Declared in Application</th>
                    <th className="py-2.5 px-3">Extracted from Document</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Audit Evidence & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {crossChecks.map((row, idx) => {
                    const isMismatch = row.matchStatus === 'MISMATCH';

                    return (
                      <tr key={idx} className={isMismatch ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}>
                        <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                          {row.fieldName}
                        </td>

                        <td className="py-3 px-3 tabular-nums text-slate-700 font-medium">
                          {row.declaredValue}
                        </td>

                        <td className="py-3 px-3 tabular-nums text-slate-700">
                          <div>{row.extractedValue}</div>
                          <div className="text-[10px] text-slate-400">{row.documentSource}</div>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isMismatch
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.matchStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-600">
                          {row.notes}
                          {row.discrepancyPercentage !== undefined && (
                            <span className="font-bold text-rose-700 ml-1">
                              ({row.discrepancyPercentage}% variance)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Reviewer Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Manual OCR Reviewer Override: {editingDoc.fileName}
            </h3>

            <p className="text-xs text-slate-500">
              Underwriters may adjust extracted income if a physical paystub voucher or direct employer HR call was verified.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Corrected Verified Monthly Income ($)
                </label>
                <input
                  type="number"
                  value={correctedIncome}
                  onChange={(e) => setCorrectedIncome(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium tabular-nums"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Underwriting Justification Notes (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                  placeholder="e.g. Cross-verified with HR payroll records directly..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingDoc(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverride}
                disabled={savingOverride}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded disabled:opacity-50"
              >
                {savingOverride ? 'Recording Audit...' : 'Save Override & Re-score'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
