import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Target, Shield, Swords, Lock, FileText, History, KeyRound, Settings, Brain } from 'lucide-react';
import { Page } from '../types';

const navItems: { id: Page; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'targets', label: 'Targets', icon: Target },
  { id: 'scanner-configure', label: 'Vulnerability Scanner', icon: Shield },
  { id: 'pentest-toolkit', label: 'Pentest Toolkit', icon: Swords },
  { id: 'ml-detection', label: 'ML Detection', icon: Brain },
  { id: 'encryptor-decryptor', label: 'Encryptor / Decryptor', icon: Lock },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'scan-history', label: 'Scan History', icon: History },
  { id: 'credential-vault', label: 'Credential Vault', icon: KeyRound },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { currentPage, setPage, sidebarCollapsed } = useApp();

  const isActive = (id: Page) => {
    if (id === 'scanner-configure' && (currentPage === 'scanner-configure' || currentPage === 'scanner-results' || currentPage === 'finding-detail')) return true;
    return currentPage === id;
  };

  return (
    <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-200`}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">US</div>
          {!sidebarCollapsed && <span className="font-bold text-lg tracking-tight">USAP</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              isActive(item.id)
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

    </aside>
  );
}
