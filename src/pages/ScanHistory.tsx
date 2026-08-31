import React from 'react';
import { useApp } from '../context/AppContext';

export default function ScanHistory() {
  const { scans, setSelectedScan } = useApp();

  const sortedScans = [...scans].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Scan History</h1>
        <p className="text-sm text-slate-500 mt-1">Historical assessment records and generated reports</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700">Scan History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Scan</th>
                <th className="px-5 py-3 font-medium">Module</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Findings</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedScans.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">No scan history available</td></tr>
              ) : sortedScans.map(scan => (
                <tr
                  key={scan.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => scan.status === 'completed' && setSelectedScan(scan.id)}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-700">{scan.targetName}</div>
                    <div className="text-xs text-slate-400">{scan.checks.slice(0, 3).join(', ')}{scan.checks.length > 3 ? ` +${scan.checks.length - 3} more` : ''}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 capitalize">{scan.type === 'vulnerability' ? 'Scanner' : 'Pentest'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      scan.status === 'completed' ? 'bg-green-50 text-green-700' :
                      scan.status === 'running' ? 'bg-blue-50 text-blue-700' :
                      scan.status === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{scan.findingCount}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(scan.startedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
