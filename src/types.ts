export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'pentester' | 'viewer';
  avatar?: string;
}

export interface Target {
  id: string;
  name: string;
  url: string;
  type: 'Web Application' | 'Host' | 'Network' | 'API';
  status: 'active' | 'inactive' | 'scanning';
  createdAt: string;
  lastScanned?: string;
}

export interface Scan {
  id: string;
  targetId: string;
  targetName: string;
  type: 'vulnerability' | 'pentest';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt: string;
  completedAt?: string;
  checks: string[];
  findingCount: number;
  highCriticalCount: number;
  riskScore: number;
}

export interface Finding {
  id: string;
  scanId: string;
  targetId: string;
  targetName: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss: number;
  category: string;
  status: 'open' | 'confirmed' | 'remediated' | 'false_positive';
  description: string;
  evidence: string;
  remediation: string;
  recommendation: string;
  detectedAt: string;
}

export interface PentestResult {
  id: string;
  targetId: string;
  targetName: string;
  module: 'port_scanner' | 'subdomain_enum' | 'credential_test';
  data: any;
  executedAt: string;
}

export interface PortScanResult {
  port: number;
  protocol: string;
  service: string;
  state: 'open' | 'closed' | 'filtered';
  risk: 'high' | 'medium' | 'low' | 'info';
}

export interface SubdomainResult {
  subdomain: string;
  status: 'active' | 'inactive' | 'unknown';
  ip: string;
  technology: string;
}

export interface MLDetection {
  id: string;
  targetId?: string;
  input: string;
  pattern: string;
  detection: string;
  status: 'normal' | 'suspicious' | 'malicious';
  confidence: number;
  features: string[];
  explanation: string;
  timestamp: string;
}

export interface Credential {
  id: string;
  reference: string;
  targetId?: string;
  targetName?: string;
  username?: string;
  passwordEncrypted: string;
  status: 'active' | 'expired' | 'revoked';
  type: 'password' | 'api_key' | 'token' | 'certificate';
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  scanIds: string[];
  riskScore: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  status: 'draft' | 'final';
  createdAt: string;
  exportedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target?: string;
  result: string;
  timestamp: string;
  module: string;
}

export interface EncryptedPayload {
  data: string;
  iv: string;
  algorithm: string;
  keyWrapped: boolean;
  timestamp: string;
}

export type Page = 
  | 'dashboard'
  | 'targets'
  | 'scanner-configure'
  | 'scanner-results'
  | 'finding-detail'
  | 'pentest-toolkit'
  | 'ml-detection'
  | 'encryptor-decryptor'
  | 'credential-vault'
  | 'reports'
  | 'scan-history'
  | 'settings';
