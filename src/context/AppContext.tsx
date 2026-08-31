import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Target, Scan, Finding, MLDetection, Credential, Report, AuditLog, PortScanResult, SubdomainResult, Page } from '../types';
import { api } from '../api/client';

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  targets: Target[];
  scans: Scan[];
  findings: Finding[];
  mlDetections: MLDetection[];
  credentials: Credential[];
  reports: Report[];
  auditLogs: AuditLog[];
  portScanResults: PortScanResult[];
  subdomainResults: SubdomainResult[];
  currentPage: Page;
  selectedFindingId: string | null;
  selectedScanId: string | null;
  selectedTargetId: string | null;
  sidebarCollapsed: boolean;
  loading: boolean;
}

interface AppContextType extends AppState {
  login: (user: User, token: string) => void;
  logout: () => void;
  addTarget: (target: Omit<Target, 'id' | 'createdAt'>) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  startScan: (targetId: string, checks: string[]) => Promise<string>;
  runPentestModule: (module: string, targetId: string) => Promise<void>;
  addCredential: (cred: Omit<Credential, 'id' | 'createdAt' | 'passwordEncrypted'> & { password: string }) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  generateReport: (scanIds: string[]) => Promise<void>;
  setPage: (page: Page) => void;
  setSelectedFinding: (id: string) => void;
  setSelectedScan: (id: string) => void;
  setSelectedTarget: (id: string) => void;
  toggleSidebar: () => void;
  addMLDetection: (detection: Omit<MLDetection, 'id' | 'timestamp'>) => Promise<void>;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;
  refreshData: () => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  users: User[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    isAuthenticated: false,
    targets: [],
    scans: [],
    findings: [],
    mlDetections: [],
    credentials: [],
    reports: [],
    auditLogs: [],
    portScanResults: [],
    subdomainResults: [],
    currentPage: 'dashboard',
    selectedFindingId: null,
    selectedScanId: null,
    selectedTargetId: null,
    sidebarCollapsed: false,
    loading: false,
  });

  const [users, setUsers] = useState<User[]>([]);

  // Auto-login: skip auth check, load data directly
  useEffect(() => {
    const fakeUser = { id: 'u1', name: 'Urvish', email: 'urvish', role: 'admin' as const };
    setState(prev => ({ ...prev, currentUser: fakeUser, isAuthenticated: true }));
    loadAllData();
  }, []);

  const loadAllData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const [targets, scans, findings, mlDetections, credentials, reports, auditLogs, portScanResults, subdomainResults] = await Promise.all([
        api.getTargets(),
        api.getScans(),
        api.getFindings(),
        api.getMLDetections(),
        api.getCredentials(),
        api.getReports(),
        api.getAuditLogs(),
        api.getPortScanResults(),
        api.getSubdomainResults(),
      ]);

      setState(prev => ({
        ...prev,
        targets,
        scans,
        findings,
        mlDetections,
        credentials,
        reports,
        auditLogs,
        portScanResults,
        subdomainResults,
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to load data:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = useCallback((user: User, token: string) => {
    api.setToken(token);
    setState(prev => ({ ...prev, currentUser: user, isAuthenticated: true, loading: true }));
    loadAllData();
  }, [loadAllData]);

  const logout = useCallback(() => {
    api.setToken(null);
    setState(prev => ({
      ...prev,
      currentUser: null,
      isAuthenticated: false,
      targets: [],
      scans: [],
      findings: [],
      mlDetections: [],
      credentials: [],
      reports: [],
      auditLogs: [],
      portScanResults: [],
      subdomainResults: [],
      currentPage: 'dashboard',
    }));
  }, []);

  const addTarget = useCallback(async (target: Omit<Target, 'id' | 'createdAt'>) => {
    const newTarget = await api.addTarget(target);
    setState(prev => ({ ...prev, targets: [newTarget, ...prev.targets] }));
  }, []);

  const deleteTarget = useCallback(async (id: string) => {
    await api.deleteTarget(id);
    setState(prev => ({ ...prev, targets: prev.targets.filter(t => t.id !== id) }));
  }, []);

  const startScan = useCallback(async (targetId: string, checks: string[]): Promise<string> => {
    const scan = await api.startScan(targetId, checks);
    setState(prev => ({ ...prev, scans: [scan, ...prev.scans] }));

    const pollInterval = setInterval(async () => {
      try {
        const updatedScan = await api.getScan(scan.id);
        setState(prev => ({
          ...prev,
          scans: prev.scans.map(s => s.id === scan.id ? updatedScan : s),
        }));

        if (updatedScan.status === 'completed' || updatedScan.status === 'failed') {
          clearInterval(pollInterval);
          if (updatedScan.status === 'completed') {
            const newFindings = await api.getFindings({ scanId: scan.id });
            setState(prev => ({
              ...prev,
              findings: [...newFindings, ...prev.findings.filter(f => !newFindings.some(nf => nf.id === f.id))],
            }));
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 1500);

    return scan.id;
  }, []);

  const runPentestModule = useCallback(async (module: string, targetId: string) => {
    await api.addAuditLog({
      userId: state.currentUser?.id || '',
      userName: state.currentUser?.name || 'System',
      action: `Ran ${module} on target`,
      target: targetId,
      result: 'Completed',
      module: 'Pentest',
    });
    const logs = await api.getAuditLogs();
    setState(prev => ({ ...prev, auditLogs: logs }));
  }, [state.currentUser]);

  const addCredential = useCallback(async (cred: Omit<Credential, 'id' | 'createdAt' | 'passwordEncrypted'> & { password: string }) => {
    const newCred = await api.addCredential(cred);
    setState(prev => ({ ...prev, credentials: [newCred, ...prev.credentials] }));
  }, []);

  const deleteCredential = useCallback(async (id: string) => {
    await api.deleteCredential(id);
    setState(prev => ({ ...prev, credentials: prev.credentials.filter(c => c.id !== id) }));
  }, []);

  const generateReport = useCallback(async (scanIds: string[]) => {
    const newReport = await api.generateReport(scanIds);
    setState(prev => ({ ...prev, reports: [newReport, ...prev.reports] }));
  }, []);

  const setPage = useCallback((page: Page) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const setSelectedFinding = useCallback((id: string) => {
    setState(prev => ({ ...prev, selectedFindingId: id, currentPage: 'finding-detail' }));
  }, []);

  const setSelectedScan = useCallback((id: string) => {
    setState(prev => ({ ...prev, selectedScanId: id, currentPage: 'scanner-results' }));
  }, []);

  const setSelectedTarget = useCallback((id: string) => {
    setState(prev => ({ ...prev, selectedTargetId: id }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const addMLDetection = useCallback(async (detection: Omit<MLDetection, 'id' | 'timestamp'>) => {
    const newDetection = await api.addMLDetection(detection);
    setState(prev => ({ ...prev, mlDetections: [newDetection, ...prev.mlDetections] }));
  }, []);

  const addAuditLog = useCallback(async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog = await api.addAuditLog(log);
    setState(prev => ({ ...prev, auditLogs: [newLog, ...prev.auditLogs] }));
  }, []);

  const refreshData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    await api.updateUserRole(userId, role);
    if (state.currentUser?.id === userId) {
      setState(prev => ({ ...prev, currentUser: prev.currentUser ? { ...prev.currentUser, role: role as any } : null }));
    }
  }, [state.currentUser]);

  return (
    <AppContext.Provider value={{
      ...state,
      login, logout, addTarget, deleteTarget, startScan, runPentestModule,
      addCredential, deleteCredential, generateReport, setPage,
      setSelectedFinding, setSelectedScan, setSelectedTarget, toggleSidebar,
      addMLDetection, addAuditLog, refreshData, updateUserRole, users,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
