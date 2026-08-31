import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function FindingDetail() {
  const { findings, selectedFindingId, setPage } = useApp();
  const finding = findings.find(f => f.id === selectedFindingId);

  if (!finding) {
    return (
      <div>
        <button onClick={() => setPage('scanner-results')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft size={14} /> Back to Results
        </button>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-slate-500">Finding not found</p>
        </div>
      </div>
    );
  }

  const sevColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div>
      <button onClick={() => setPage('scanner-results')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={14} /> Back to Results
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{finding.title}</h1>
        <p className="text-sm text-slate-500 mt-1">Detailed finding with evidence, severity, and remediation</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-3xl space-y-6">
        {/* Target */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Target</label>
          <div className="text-sm text-slate-700 font-medium">{finding.targetName}</div>
        </div>

        {/* Severity */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Severity</label>
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${sevColor(finding.severity)}`}>
            {finding.severity.toUpperCase()}
          </span>
        </div>

        {/* CVSS */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">CVSS Score</label>
          <div className="text-sm text-slate-700 font-mono font-medium">{finding.cvss} / 10</div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Category</label>
          <div className="text-sm text-slate-700">{finding.category}</div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Description</label>
          <p className="text-sm text-slate-600 leading-relaxed">{finding.description}</p>
        </div>

        {/* Evidence */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Evidence / Analysis</label>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-slate-600 font-mono whitespace-pre-wrap overflow-x-auto">
            {finding.evidence}
          </pre>
        </div>

        {/* Remediation */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Remediation</label>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 leading-relaxed">{finding.remediation}</p>
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Recommendation</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-slate-600 leading-relaxed">{finding.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
