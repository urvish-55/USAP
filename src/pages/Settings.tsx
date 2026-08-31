import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Database, FileText, Lock, Info, Users, Save } from 'lucide-react';
import { api } from '../api/client';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

const ROLES = [
  { role: 'admin', label: 'Admin', access: 'Full access to platform and role management' },
  { role: 'pentester', label: 'Pentester', access: 'Security testing and assessment modules' },
  { role: 'viewer', label: 'Viewer', access: 'Read-only access to assessment output' },
];

export default function Settings() {
  const { currentUser, updateUserRole, logout } = useApp();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSaving(true);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccessMsg('Role updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings & Role Management</h1>
        <p className="text-sm text-slate-500 mt-1">Authentication, role management and platform configuration</p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-md flex items-center gap-2">
          <Shield size={14} /> {successMsg}
        </div>
      )}

      {/* Current User */}
      {currentUser && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Current Account</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">{currentUser.name}</div>
                <div className="text-xs text-slate-500">{currentUser.email} · {currentUser.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded border border-red-200 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Roles */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users size={14} /> Roles
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map(r => (
                <tr key={r.role} className="border-b border-gray-50">
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-700 capitalize">{r.label}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{r.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management (Admin only) */}
      {currentUser?.role === 'admin' && (
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users size={14} /> User Management
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No users found</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-700">{user.name}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{user.email}</td>
                    <td className="px-5 py-3">
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        disabled={saving}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="pentester">Pentester</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {user.id === currentUser?.id ? 'You' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-slate-700">System Configuration</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Database</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-slate-700">
                PostgreSQL or MySQL
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Reporting</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-slate-700">
                PDF / HTML
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Encryption</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-slate-700">
                AES-256-GCM + RSA
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Environment</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-slate-700">
                {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Platform</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-slate-700">
                USAP v1.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
