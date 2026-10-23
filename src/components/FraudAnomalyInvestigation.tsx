import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Search, Filter, ShieldCheck } from 'lucide-react';
import { FraudAnomalyAlert } from '../types';

export const FraudAnomalyInvestigation: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAnomalyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState<FraudAnomalyAlert | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'Cleared' | 'Confirmed Fraud'>('Cleared');
  const [underwriterNotes, setUnderwriterNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fraud-alerts', {
        headers: { 'x-user-id': 'usr_admin_001' },
      });
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to load fraud alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/fraud-alerts/${selectedAlert.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr_admin_001',
        },
        body: JSON.stringify({
          status: resolutionStatus,
          adminNotes: underwriterNotes || 'Underwriter confirmed discrepancy was administrative typing error.',
        }),
      });

      if (res.ok) {
        setSelectedAlert(null);
        setUnderwriterNotes('');
        fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity.toUpperCase() === filterSeverity;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Fraud & Anomaly Investigation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Multivariate Isolation Forest screening, cross-document inconsistency tracking, and velocity monitoring.
        </p>
      </div>

      {/* Fairness & Legal Notice */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Ethical Screening Policy: Review Required, Not Automatic Proof</div>
          <div>
            Statistical outliers and document discrepancies trigger investigative review flags. <strong>An anomaly is not proof of fraud</strong>. Applications must never be rejected automatically by algorithmic flags without human underwriter examination.
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                filterSeverity === sev ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sev === 'ALL' ? 'All Alerts' : `${sev} Severity`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Flagged: <strong className="tabular-nums text-slate-800">{filteredAlerts.length}</strong>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Application</th>
                <th className="py-2.5 px-4">Applicant</th>
                <th className="py-2.5 px-4">Detection Model</th>
                <th className="py-2.5 px-4 text-center">Severity</th>
                <th className="py-2.5 px-4">Evidence Description</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No active fraud or anomaly flags recorded.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isCrit = alert.severity === 'critical';
                  const isHigh = alert.severity === 'high';

                  return (
                    <tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {alert.applicationId}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        {alert.applicantName}
                      </td>

                      <td className="py-3 px-4 capitalize text-slate-700 whitespace-nowrap">
                        {alert.detectionType.replace('_', ' ')}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCrit
                              ? 'bg-rose-100 text-rose-800'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {alert.reason}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            alert.status === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-800'
                              : alert.status === 'Confirmed Fraud'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Investigate Alert: {selectedAlert.applicationId} ({selectedAlert.applicantName})
            </h3>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 space-y-1">
              <div><strong>Trigger:</strong> {selectedAlert.reason}</div>
              <div><strong>Detection Type:</strong> {selectedAlert.detectionType}</div>
              <div><strong>Recorded At:</strong> {new Date(selectedAlert.createdAt).toLocaleString()}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Investigation Finding Outcome
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 font-medium"
                >
                  <option value="Cleared">Cleared (Verified Legitimate / Explained Variance)</option>
                  <option value="Confirmed Fraud">Confirmed Fraud (Material Fabrication or Identity Theft)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Underwriter Investigative Rationale (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={underwriterNotes}
                  onChange={(e) => setUnderwriterNotes(e.target.value)}
                  placeholder="Detail physical cross-check or fraud investigation evidence..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveAlert}
                disabled={saving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded disabled:opacity-50"
              >
                {saving ? 'Recording Finding...' : 'Record Outcome'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
