import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Brain, Play, AlertTriangle } from 'lucide-react';

const SAMPLE_INPUTS = [
  'TCP SYN flood: 15,000 packets/sec to port 443 from 203.0.113.45',
  'SQL query: SELECT * FROM users WHERE id=1 UNION SELECT password FROM admin--',
  'GET /search?q=<img src=x onerror=alert(1)> HTTP/1.1',
  'Normal API request: GET /api/users/12345 Authorization: Bearer eyJhbG...',
  'POST /wp-admin/install.php with database credentials in body',
  '500 internal server errors in 2 minutes from user agent: curl/7.68.0',
];

export default function MLDetection() {
  const { mlDetections, addMLDetection, addAuditLog, currentUser } = useApp();
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<string | null>(null);

  const analyzeInput = async () => {
    if (!inputText.trim()) return;
    setAnalyzing(true);

    // Simulate ML processing
    await new Promise(r => setTimeout(r, 1500));

    const isMalicious = /sql|inject|xss|flood|exploit|credential|union|select|script/i.test(inputText);
    const isSuspicious = /error|500|probing|curl|wget|scanner/i.test(inputText);

    const status = isMalicious ? 'malicious' : isSuspicious ? 'suspicious' : 'normal';
    const confidence = isMalicious ? 0.88 + Math.random() * 0.1 : isSuspicious ? 0.7 + Math.random() * 0.15 : 0.85 + Math.random() * 0.15;

    const features: string[] = [];
    if (/sql|select|union/i.test(inputText)) features.push('SQL keywords detected');
    if (/<script|onerror|onclick/i.test(inputText)) features.push('JavaScript injection pattern');
    if (/flood|syn|packet/i.test(inputText)) features.push('High packet rate');
    if (/credential|password|install/i.test(inputText)) features.push('Credential-related activity');
    if (/error|500/i.test(inputText)) features.push('Error pattern detected');
    if (/curl|wget|user.agent/i.test(inputText)) features.push('Automated user agent');
    if (features.length === 0) features.push('No anomalous features');

    const detection = isMalicious ? 'Malicious Pattern Detected' : isSuspicious ? 'Suspicious Activity Detected' : 'Normal Traffic Pattern';

    const explanation = isMalicious
      ? `Request contains patterns consistent with attack activity. Detected features: ${features.join(', ')}. Confidence is high based on known attack signatures.`
      : isSuspicious
      ? `Activity shows indicators of reconnaissance or probing. Features flagged: ${features.join(', ')}. Recommend monitoring.`
      : `Traffic patterns are consistent with normal application behavior. No anomalous features detected.`;

    addMLDetection({
      input: inputText,
      pattern: features[0] || 'Normal pattern',
      detection,
      status,
      confidence: Math.round(confidence * 100) / 100,
      features,
      explanation,
    });

    addAuditLog({
      userId: currentUser?.id || 'u1',
      userName: currentUser?.name || 'System',
      action: `ML analysis on input: ${inputText.substring(0, 50)}...`,
      result: `${status} (confidence: ${Math.round(confidence * 100)}%)`,
      module: 'ML Detection',
    });

    setInputText('');
    setAnalyzing(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ML Detection</h1>
        <p className="text-sm text-slate-500 mt-1">Anomaly detection on captured traffic / logs</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Training dataset</span>
            <p className="text-blue-600">Public dataset such as CICIDS2017 or NSL-KDD</p>
          </div>
          <div>
            <span className="font-medium text-blue-800">Purpose</span>
            <p className="text-blue-600">Flag suspicious patterns during testing</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Input Data for Analysis</label>
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste network traffic, log entry, or HTTP request for analysis..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm h-20 resize-none"
          />
          <button
            onClick={analyzeInput}
            disabled={analyzing || !inputText.trim()}
            className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2 self-end"
          >
            {analyzing ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : <Brain size={14} />}
            Analyze
          </button>
        </div>
        
        {/* Quick sample inputs */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400">Try:</span>
          {SAMPLE_INPUTS.slice(0, 3).map((sample, i) => (
            <button
              key={i}
              onClick={() => setInputText(sample)}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Sample {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Detection Detail */}
      {selectedDetection && (() => {
        const d = mlDetections.find(det => det.id === selectedDetection);
        if (!d) return null;
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Detection Detail</h3>
              <button onClick={() => setSelectedDetection(null)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Status:</span> <span className={`font-medium ${d.status === 'malicious' ? 'text-red-600' : d.status === 'suspicious' ? 'text-yellow-600' : 'text-green-600'}`}>{d.status}</span></div>
              <div><span className="text-slate-500">Confidence:</span> <span className="font-medium text-slate-700">{(d.confidence * 100).toFixed(0)}%</span></div>
            </div>
            <div className="mt-3">
              <span className="text-slate-500 text-sm">Features:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {d.features.map((f, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{f}</span>
                ))}
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-600 leading-relaxed">{d.explanation}</div>
          </div>
        );
      })()}

      {/* Detection Output Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700">Detection Output</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Pattern / Event</th>
                <th className="px-5 py-3 font-medium">Detection</th>
                <th className="px-5 py-3 font-medium">Confidence</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mlDetections.map(d => (
                <tr
                  key={d.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedDetection(d.id)}
                >
                  <td className="px-5 py-3">
                    <div className="text-slate-700 max-w-xs truncate">{d.input}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{d.detection}</td>
                  <td className="px-5 py-3 font-mono text-slate-600">{(d.confidence * 100).toFixed(0)}%</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      d.status === 'malicious' ? 'bg-red-100 text-red-700' : d.status === 'suspicious' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
