import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { api } from '../api/client';

interface SignInProps {
  onLogin: (user: any, token: string) => void;
}

export default function SignIn({ onLogin }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await api.login(email, password);
      onLogin(result.user, result.token);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Try urvish / urvish123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          {/* Logo & Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">USAP</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-800">Unified Security Assessment Platform</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email / Username</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email or username"
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Role Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Role-based access:</span> Admin · Pentester · Viewer
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Authorized lab / test environments only
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              Demo: <span className="font-mono">urvish</span> / <span className="font-mono">urvish123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
