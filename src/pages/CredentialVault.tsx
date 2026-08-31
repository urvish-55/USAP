import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Eye, EyeOff, Trash2, Shield } from 'lucide-react';

export default function CredentialVault() {
  const { credentials, targets, addCredential, deleteCredential, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [reference, setReference] = useState('');
  const [targetId, setTargetId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState<'password' | 'api_key' | 'token' | 'certificate'>('password');
  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference || !password) return;
    const target = targets.find(t => t.id === targetId);
    addCredential({
      reference,
      targetId: targetId || undefined,
      targetName: target?.name,
      username,
      password,
      status: 'active',
      type,
    });
    setReference('');
    setTargetId('');
    setUsername('');
    setPassword('');
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Credential Vault</h1>
          <p className="text-sm text-slate-500 mt-1">Secure storage of credentials used during testing</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2">
          <Plus size={16} /> Add Credential
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Credential</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Reference Name</label>
                <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. db-primary-password" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Type</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="password">Password</option>
                  <option value="api_key">API Key</option>
                  <option value="token">Token</option>
                  <option value="certificate">Certificate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Target (optional)</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">No target</option>
                  {targets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Username (optional)</label>
                <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Secret / Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Vault Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-700">Encrypted credential references for authorized testing</p>
            <p className="text-xs text-slate-500 mt-1">All secrets are encrypted using AES-256-GCM before storage. Plaintext is never persisted.</p>
          </div>
        </div>
      </div>

      {/* Credentials Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700">Credential Vault</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {credentials.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No credentials stored. Add your first credential above.</td></tr>
              ) : credentials.map(cred => (
                <tr key={cred.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-700">{cred.reference}</div>
                    <div className="text-xs text-slate-400">{cred.type} {cred.username ? `· ${cred.username}` : ''}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{cred.targetName || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      cred.status === 'active' ? 'bg-green-50 text-green-700' : cred.status === 'expired' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {cred.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingId(viewingId === cred.id ? null : cred.id)}
                        className="text-slate-500 hover:text-slate-700"
                        title="View encrypted"
                      >
                        {viewingId === cred.id ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => deleteCredential(cred.id)} className="text-red-500 hover:text-red-700">
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

      {/* View credential detail */}
      {viewingId && (() => {
        const cred = credentials.find(c => c.id === viewingId);
        if (!cred) return null;
        return (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Credential Detail</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Reference:</span> <span className="text-slate-700">{cred.reference}</span></div>
              <div><span className="text-slate-500">Type:</span> <span className="text-slate-700 capitalize">{cred.type.replace('_', ' ')}</span></div>
              <div><span className="text-slate-500">Username:</span> <span className="text-slate-700">{cred.username || 'N/A'}</span></div>
              <div><span className="text-slate-500">Created:</span> <span className="text-slate-700">{new Date(cred.createdAt).toLocaleDateString()}</span></div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-slate-500">Encrypted value:</span>
              <pre className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-xs font-mono text-slate-500 break-all">{cred.passwordEncrypted}</pre>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
