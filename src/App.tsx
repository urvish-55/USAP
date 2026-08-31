import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Targets from './pages/Targets';
import ScannerConfigure from './pages/ScannerConfigure';
import ScannerResults from './pages/ScannerResults';
import FindingDetail from './pages/FindingDetail';
import PentestToolkit from './pages/PentestToolkit';
import MLDetection from './pages/MLDetection';
import EncryptorDecryptor from './pages/EncryptorDecryptor';
import CredentialVault from './pages/CredentialVault';
import Reports from './pages/Reports';
import ScanHistory from './pages/ScanHistory';
import Settings from './pages/Settings';

function AppContent() {
  const { currentUser, currentPage, loading, isAuthenticated, login } = useApp();

  // Skip login — go straight to the app
  // if (!isAuthenticated) {
  //   return <SignIn onLogin={login} />;
  // }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-slate-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <span className="text-sm">Loading USAP...</span>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'targets': return <Targets />;
      case 'scanner-configure': return <ScannerConfigure />;
      case 'scanner-results': return <ScannerResults />;
      case 'finding-detail': return <FindingDetail />;
      case 'pentest-toolkit': return <PentestToolkit />;
      case 'ml-detection': return <MLDetection />;
      case 'encryptor-decryptor': return <EncryptorDecryptor />;
      case 'credential-vault': return <CredentialVault />;
      case 'reports': return <Reports />;
      case 'scan-history': return <ScanHistory />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
