import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, AlertCircle, Info, Shield } from 'lucide-react';

export default function ScannerResults() {
  const { scans, findings, selectedScanId, setSelectedFinding, setPage } = useApp();

  const scan = scans.find(s => s.id === selectedScanId);
  const scanFindings = findings.filter(f => f.scanId === selectedScanId);

  if (!scan) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Vulnerability Scanner — Results</h1>
          <p className="text-sm text-slate-500 mt-1">No scan selected</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Shield size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-slate-500 mb-4">Select a completed scan to view results</p>
          <button onClick={() => setPage('scanner-configure')} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
            Start New Scan
          </button>
        </div>
      </div>
    );
  }

  const critical = scanFindings.filter(f => f.severity === 'critical').length;
  const high = scanFindings.filter(f => f.severity === 'high').length;
  const medium = scanFindings.filter(f => f.severity === 'medium').length;
  const low = scanFindings.filter(f => f.severity === 'low').length;

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Vulnerability Scanner — Results</h1>
        <p className="text-sm text-slate-500 mt-1">Scan of {scan.targetName} · {scan.completedAt ? new Date(scan.completedAt).toLocaleString() : 'In progress'}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Total Findings</div>
          <div className="text-2xl font-bold text-slate-800">{scan.findingCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-red-500 mb-1">Critical</div>
          <div className="text-2xl font-bold text-red-600">{critical}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-orange-500 mb-1">High</div>
          <div className="text-2xl font-bold text-orange-600">{high}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-yellow-600 mb-1">Medium</div>
          <div className="text-2xl font-bold text-yellow-600">{medium}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Low</div>
          <div className="text-2xl font-bold text-slate-600">{low}</div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700">Findings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Finding</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">CVSS</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {scanFindings.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No findings detected</td></tr>
              ) : scanFindings.map(finding => (
                <tr
                  key={finding.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedFinding(finding.id)}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-700">{finding.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{finding.category}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${sevColor(finding.severity)}`}>
                      {finding.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 font-mono">{finding.cvss}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      finding.status === 'open' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {finding.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={() => setPage('reports')} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
        Generate Report
      </button>
    </div>
  );
}
