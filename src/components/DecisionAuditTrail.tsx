import React, { useState, useEffect } from 'react';
import { History, Download, Search, Filter, ShieldCheck } from 'lucide-react';
import { AuditLogEvent } from '../types';

export const DecisionAuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { 'x-user-id': 'usr_admin_001' },
      });
      const data = await res.json();
      setLogs(data.auditLogs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterAction === 'ALL') return matchesSearch;
    return matchesSearch && log.action.includes(filterAction);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Decision Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Append-only immutable record of submissions, OCR extractions, model scoring events, and underwriter determinations.
          </p>
        </div>

        <a
          href="/api/export/applications.csv"
          download
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Records (CSV)</span>
        </a>
      </div>

      {/* Security & Integrity Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Cryptographically timestamped audit logging is active. Every administrative action requires authorized role confirmation and recorded reasons.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Formula-Injection Protection Enabled
        </span>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded w-72 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'DECISION', label: 'Underwriter Decisions' },
            { id: 'SUBMITTED', label: 'Submissions' },
            { id: 'DOCUMENT', label: 'OCR & Docs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterAction(tab.id)}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                filterAction === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target ID</th>
                <th className="py-2.5 px-4">Event Details & Recorded Reason</th>
                <th className="py-2.5 px-4 text-right">Lifecycle Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit events match the query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.actor}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{log.actorRole}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {log.targetId}
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-[11px]">
                        {log.previousState ? (
                          <span>
                            <span className="text-slate-400">{log.previousState}</span>
                            <span className="text-slate-300 mx-1">→</span>
                            <span className="font-bold text-slate-800">{log.newState}</span>
                          </span>
                        ) : log.newState ? (
                          <span className="font-bold text-slate-800">{log.newState}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
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
