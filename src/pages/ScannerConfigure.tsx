import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

const CHECK_OPTIONS = [
  'SQL Injection',
  'XSS',
  'Security Headers',
  'Outdated JavaScript Libraries',
  'SSL/TLS Configuration',
  'Open Ports',
];

export default function ScannerConfigure() {
  const { targets, selectedTargetId, startScan, scans, setPage, setSelectedScan } = useApp();
  const [selectedTarget, setSelectedTarget] = useState(selectedTargetId || '');
  const [selectedChecks, setSelectedChecks] = useState<string[]>([...CHECK_OPTIONS]);
  const [scanning, setScanning] = useState(false);
  const currentScanIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedTargetId) setSelectedTarget(selectedTargetId);
  }, [selectedTargetId]);

  // Watch for scan completion and navigate to results
  useEffect(() => {
    if (!scanning || !currentScanIdRef.current) return;
    const scan = scans.find(s => s.id === currentScanIdRef.current);
    if (scan && (scan.status === 'completed' || scan.status === 'failed')) {
      setSelectedScan(scan.id);
      setScanning(false);
      currentScanIdRef.current = null;
    }
  }, [scans, scanning, setSelectedScan]);

  const toggleCheck = (check: string) => {
    setSelectedChecks(prev =>
      prev.includes(check) ? prev.filter(c => c !== check) : [...prev, check]
    );
  };

  const handleStartScan = async () => {
    if (!selectedTarget || selectedChecks.length === 0) return;
    setScanning(true);

    const scanId = await startScan(selectedTarget, selectedChecks);
    currentScanIdRef.current = scanId;
  };

  // Get current scan progress
  const currentScan = currentScanIdRef.current
    ? scans.find(s => s.id === currentScanIdRef.current)
    : null;
  const progress = currentScan?.progress || 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Vulnerability Scanner — Configure</h1>
        <p className="text-sm text-slate-500 mt-1">Automated checks against authorized web application or host</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
        {/* Target Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Target</label>
          <select
            value={selectedTarget}
            onChange={e => setSelectedTarget(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select a target...</option>
            {targets.filter(t => t.status === 'active').map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.url})</option>
            ))}
          </select>
        </div>

        {/* Detection Checks */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Detection Checks</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              {CHECK_OPTIONS.map(check => (
                <label key={check} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChecks.includes(check)}
                    onChange={() => toggleCheck(check)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {check}
                </label>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Signatures rule-based detection · Request/response analysis · CVSS severity</p>
        </div>

        {/* Start Scan Button */}
        <button
          onClick={handleStartScan}
          disabled={!selectedTarget || selectedChecks.length === 0 || scanning}
          className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors"
        >
          {scanning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Scanning...
            </span>
          ) : 'Start Scan'}
        </button>
      </div>

      {/* Scanning progress overlay */}
      {scanning && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span className="text-sm font-medium text-blue-800">Scan in progress... {progress > 0 ? `${progress}%` : ''}</span>
          </div>
          <div className="text-sm text-blue-600 space-y-1">
            <p>→ Analyzing target configuration</p>
            <p>→ Running {selectedChecks.length} detection modules</p>
            <p>→ Processing results...</p>
          </div>
          <div className="mt-4 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(progress, 5)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
