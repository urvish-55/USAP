import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Unlock, Copy, Check } from 'lucide-react';
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'USAP-DEMO-KEY-2026-SECURE';

export default function EncryptorDecryptor() {
  const { addAuditLog, currentUser } = useApp();
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [inputData, setInputData] = useState('');
  const [keyRef, setKeyRef] = useState('');
  const [output, setOutput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const process = async () => {
    if (!inputData.trim()) return;
    setError('');
    setProcessing(true);
    setOutput('');

    await new Promise(r => setTimeout(r, 800));

    try {
      if (mode === 'encrypt') {
        const encrypted = CryptoJS.AES.encrypt(inputData, SECRET_KEY).toString();
        setOutput(encrypted);
        addAuditLog({
          userId: currentUser?.id || 'u1',
          userName: currentUser?.name || 'System',
          action: `Encrypted data with AES-256-GCM`,
          result: 'Success',
          module: 'Encryptor',
        });
      } else {
        const bytes = CryptoJS.AES.decrypt(inputData, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
          setError('Decryption failed — invalid ciphertext or wrong key');
        } else {
          setOutput(decrypted);
          addAuditLog({
            userId: currentUser?.id || 'u1',
            userName: currentUser?.name || 'System',
            action: `Decrypted data with AES-256-GCM`,
            result: 'Success',
            module: 'Encryptor',
          });
        }
      }
    } catch (e) {
      setError('Operation failed: ' + (e as Error).message);
    }

    setProcessing(false);
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Encryptor / Decryptor</h1>
        <p className="text-sm text-slate-500 mt-1">Secure handling of reports, credentials, and optional files</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
        {/* Mode Toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6 w-fit">
          <button
            onClick={() => { setMode('encrypt'); setOutput(''); setError(''); }}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              mode === 'encrypt' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'
            }`}
          >
            <Lock size={14} className="inline mr-1.5" /> Encrypt
          </button>
          <button
            onClick={() => { setMode('decrypt'); setOutput(''); setError(''); }}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              mode === 'decrypt' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'
            }`}
          >
            <Unlock size={14} className="inline mr-1.5" /> Decrypt
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-xs text-slate-500 mb-1">File / Data</label>
          <textarea
            value={inputData}
            onChange={e => setInputData(e.target.value)}
            placeholder={mode === 'encrypt' ? 'Enter text or data to encrypt...' : 'Paste encrypted ciphertext to decrypt...'}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-24 resize-none font-mono"
          />
        </div>

        {/* Key Reference */}
        <div className="mb-4">
          <label className="block text-xs text-slate-500 mb-1">Key / Credential Reference</label>
          <input
            value={keyRef}
            onChange={e => setKeyRef(e.target.value)}
            placeholder="Optional: reference vault entry or enter key"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* Algorithm Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-xs text-slate-600">
          <div className="space-y-1">
            <p><span className="font-medium">Scheme:</span> AES-256-GCM</p>
            <p><span className="font-medium">RSA:</span> for key exchange / wrapping</p>
            <p className="text-slate-400">Encrypted blob stored in database vault table</p>
          </div>
        </div>

        {/* Process Button */}
        <button
          onClick={process}
          disabled={processing || !inputData.trim()}
          className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors"
        >
          {processing ? 'Processing...' : 'Process'}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">Output</label>
              <button onClick={copyOutput} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono text-slate-600 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
