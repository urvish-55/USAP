import React from 'react';
import Sidebar from './Sidebar';
import { useApp } from '../context/AppContext';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed, toggleSidebar } = useApp();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="p-6">
          <button
            onClick={toggleSidebar}
            className="mb-4 p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          {children}
        </div>
      </main>
    </div>
  );
}
