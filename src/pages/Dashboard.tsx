import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Target, AlertTriangle, ArrowRight, Swords, Lock } from 'lucide-react';

export default function Dashboard() {
  const { targets, scans, findings, reports, setPage, setSelectedScan } = useApp();

  const completedScans = scans.filter(s => s.status === 'completed');
  const totalFindings = findings.length;
  const openFindings = findings.filter(f => f.status === 'open').length;
  const criticalHigh = findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;
  const avgRisk = completedScans.length > 0
    ? (completedScans.reduce((sum, s) => sum + s.riskScore, 0) / completedScans.length).toFixed(1)
    : '0';

  const recentScans = [...completedScans].sort((a, b) => new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime()).slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Security Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Unified view of assessment activity and risk</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Targets</div>
          <div className="text-2xl font-bold text-slate-800">{targets.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Scan Findings</div>
          <div className="text-2xl font-bold text-slate-800">{totalFindings}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Open / High</div>
          <div className="text-2xl font-bold text-slate-800">{openFindings} <span className="text-sm font-normal text-slate-400">/ {criticalHigh}</span></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Risk Score</div>
          <div className="text-2xl font-bold text-slate-800">{avgRisk} <span className="text-sm font-normal text-slate-400">/ 10</span></div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700">Recent Scans</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Scan</th>
                <th className="px-5 py-3 font-medium">Module</th>
                <th className="px-5 py-3 font-medium">Findings</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No scans completed yet</td></tr>
              ) : recentScans.map(scan => (
                <tr key={scan.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedScan(scan.id)}>
                  <td className="px-5 py-3 font-medium text-slate-700">{scan.targetName}</td>
                  <td className="px-5 py-3 text-slate-500 capitalize">{scan.type === 'vulnerability' ? 'Scanner' : 'Pentest'}</td>
                  <td className="px-5 py-3 text-slate-500">{scan.findingCount}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      scan.status === 'completed' ? 'bg-green-50 text-green-700' : scan.status === 'running' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'
                    }`}>
                      {scan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setPage('scanner-configure')} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-md transition-colors flex items-center gap-2">
            <Shield size={16} /> New Scan
          </button>
          <button onClick={() => setPage('pentest-toolkit')} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-md transition-colors flex items-center gap-2">
            <Swords size={16} /> Start Pentest
          </button>
          <button onClick={() => setPage('encryptor-decryptor')} className="bg-white hover:bg-gray-50 text-slate-700 border border-gray-300 text-sm font-medium px-4 py-2.5 rounded-md transition-colors flex items-center gap-2">
            <Lock size={16} /> Encrypt File
          </button>
        </div>
      </div>
    </div>
  );
}
