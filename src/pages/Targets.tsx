import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';

export default function Targets() {
  const { targets, addTarget, deleteTarget, findings, setPage, setSelectedScan, setSelectedTarget } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'Web Application' | 'Host' | 'Network' | 'API'>('Web Application');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    addTarget({ name, url, type, status: 'active' });
    setName('');
    setUrl('');
    setType('Web Application');
    setShowForm(false);
  };

  const getFindingCount = (targetId: string) => findings.filter(f => f.targetId === targetId).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Targets</h1>
          <p className="text-sm text-slate-500 mt-1">Manage authorized lab / test targets</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2">
          <Plus size={16} /> Add Target
        </button>
      </div>

      {/* Add Target Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Add New Target</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Target Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. demo-app.local" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">URL / Host</label>
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://demo-app.local" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Type</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option>Web Application</option>
                  <option>API</option>
                  <option>Host</option>
                  <option>Network</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">Save Target</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Target List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700">Target List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Findings</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {targets.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No targets configured. Add your first target above.</td></tr>
              ) : targets.map(target => (
                <tr key={target.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-700">{target.name}</div>
                    <div className="text-xs text-slate-400">{target.url}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{target.type}</td>
                  <td className="px-5 py-3 text-slate-500">{getFindingCount(target.id)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedTarget(target.id); setPage('scanner-configure'); }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Scan
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => deleteTarget(target.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
