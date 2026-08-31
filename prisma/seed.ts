import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PostgreSQL database...');

  // Clean
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.scan.deleteMany();
  await prisma.mLDetection.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.target.deleteMany();
  await prisma.portScanResult.deleteMany();
  await prisma.subdomainResult.deleteMany();
  await prisma.user.deleteMany();

  // User
  const hashed = await bcrypt.hash('urvish123', 10);
  await prisma.user.create({ data: { id: 'u1', email: 'urvish', password: hashed, name: 'Urvish', role: 'admin' } });
  console.log('✅ User: urvish / urvish123');

  // Targets
  await prisma.target.createMany({ data: [
    { id: 't1', name: 'demo-app.local', url: 'https://demo-app.local', type: 'Web Application', status: 'active', createdAt: '2026-08-15T10:30:00Z', lastScanned: '2026-08-28T14:22:00Z' },
    { id: 't2', name: 'api.staging.internal', url: 'https://api.staging.internal', type: 'API', status: 'active', createdAt: '2026-08-16T09:15:00Z', lastScanned: '2026-08-27T11:45:00Z' },
    { id: 't3', name: '192.168.1.100', url: '192.168.1.100', type: 'Host', status: 'active', createdAt: '2026-08-17T08:00:00Z', lastScanned: '2026-08-26T16:30:00Z' },
    { id: 't4', name: 'webportal.lab.local', url: 'https://webportal.lab.local', type: 'Web Application', status: 'active', createdAt: '2026-08-18T14:20:00Z', lastScanned: '2026-08-25T09:15:00Z' },
    { id: 't5', name: 'db-cluster.internal', url: '10.0.2.15', type: 'Network', status: 'inactive', createdAt: '2026-08-19T11:00:00Z' },
  ]});
  console.log('✅ 5 targets');

  // Scans
  await prisma.scan.createMany({ data: [
    { id: 's1', targetId: 't1', targetName: 'demo-app.local', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-28T14:22:00Z', completedAt: '2026-08-28T14:35:00Z', checks: ['SQL Injection', 'XSS', 'Security Headers', 'Outdated Libraries', 'SSL/TLS', 'Open Ports'], findingCount: 7, highCriticalCount: 2, riskScore: 7.8 },
    { id: 's2', targetId: 't2', targetName: 'api.staging.internal', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-27T11:45:00Z', completedAt: '2026-08-27T11:58:00Z', checks: ['SQL Injection', 'XSS', 'Security Headers', 'SSL/TLS'], findingCount: 5, highCriticalCount: 1, riskScore: 6.2 },
    { id: 's3', targetId: 't3', targetName: '192.168.1.100', type: 'pentest', status: 'completed', progress: 100, startedAt: '2026-08-26T16:30:00Z', completedAt: '2026-08-26T17:15:00Z', checks: ['Port Scanner', 'Subdomain Enum', 'Credential Test'], findingCount: 4, highCriticalCount: 1, riskScore: 5.5 },
    { id: 's4', targetId: 't1', targetName: 'demo-app.local', type: 'pentest', status: 'completed', progress: 100, startedAt: '2026-08-25T09:15:00Z', completedAt: '2026-08-25T10:05:00Z', checks: ['Port Scanner', 'Subdomain Enum'], findingCount: 3, highCriticalCount: 0, riskScore: 3.2 },
    { id: 's5', targetId: 't4', targetName: 'webportal.lab.local', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-25T09:15:00Z', completedAt: '2026-08-25T09:32:00Z', checks: ['SQL Injection', 'XSS', 'Security Headers'], findingCount: 6, highCriticalCount: 3, riskScore: 8.9 },
  ]});
  console.log('✅ 5 scans');

  // Findings
  await prisma.finding.createMany({ data: [
    { id: 'f1', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'SQL Injection in Login Form', severity: 'critical', cvss: 9.8, category: 'SQL Injection', status: 'open', description: 'User input concatenated directly into SQL queries.', evidence: 'POST /api/auth/login\n{"username": "admin\' OR 1=1--"}\nResponse: 200 OK with JWT.', remediation: 'Implement parameterized queries.', recommendation: 'Deploy WAF.', detectedAt: '2026-08-28T14:28:00Z' },
    { id: 'f2', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Cross-Site Scripting (XSS) in Search', severity: 'high', cvss: 7.5, category: 'XSS', status: 'open', description: 'Search reflects input without encoding.', evidence: 'GET /api/search?q=<script>alert(1)</script>', remediation: 'Implement CSP headers.', recommendation: 'Use auto-escaping templates.', detectedAt: '2026-08-28T14:29:00Z' },
    { id: 'f3', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Missing Content-Security-Policy Header', severity: 'medium', cvss: 5.3, category: 'Security Headers', status: 'open', description: 'No CSP header set.', evidence: 'Missing: CSP, X-Content-Type-Options', remediation: 'Configure CSP header.', recommendation: 'Add nosniff.', detectedAt: '2026-08-28T14:30:00Z' },
    { id: 'f4', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Outdated jQuery 3.3.1', severity: 'medium', cvss: 6.1, category: 'Outdated Libraries', status: 'open', description: 'jQuery 3.3.1 has known CVEs.', evidence: 'CVE-2019-11358', remediation: 'Update to 3.7.1+.', recommendation: 'Dependency scanning.', detectedAt: '2026-08-28T14:31:00Z' },
    { id: 'f5', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Weak TLS 1.0 Enabled', severity: 'high', cvss: 7.4, category: 'SSL/TLS Configuration', status: 'open', description: 'Server accepts TLS 1.0.', evidence: 'TLS 1.0: ENABLED', remediation: 'Disable TLS 1.0/1.1.', recommendation: 'Enable HSTS.', detectedAt: '2026-08-28T14:32:00Z' },
    { id: 'f6', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Open SSH Port (22/tcp)', severity: 'medium', cvss: 5.0, category: 'Open Ports', status: 'open', description: 'SSH accessible externally.', evidence: '22/tcp open ssh OpenSSH 8.2', remediation: 'Restrict SSH access.', recommendation: 'Use bastion host.', detectedAt: '2026-08-28T14:33:00Z' },
    { id: 'f7', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Missing X-Content-Type-Options', severity: 'low', cvss: 3.1, category: 'Security Headers', status: 'open', description: 'Browser may MIME-sniff.', evidence: 'Missing: X-Content-Type-Options: nosniff', remediation: 'Add nosniff header.', recommendation: 'Implement all headers.', detectedAt: '2026-08-28T14:34:00Z' },
    { id: 'f8', scanId: 's2', targetId: 't2', targetName: 'api.staging.internal', title: 'SQL Injection in User Search', severity: 'critical', cvss: 9.1, category: 'SQL Injection', status: 'open', description: 'Blind SQL injection.', evidence: 'UNION SELECT version()--', remediation: 'Parameterized queries.', recommendation: 'Audit all endpoints.', detectedAt: '2026-08-27T11:50:00Z' },
    { id: 'f9', scanId: 's2', targetId: 't2', targetName: 'api.staging.internal', title: 'Missing Rate Limiting', severity: 'medium', cvss: 5.3, category: 'Security Headers', status: 'open', description: 'No rate limiting on auth.', evidence: '1000 requests in 30s, no throttling.', remediation: 'Implement rate limiting.', recommendation: 'Deploy rate-limiting middleware.', detectedAt: '2026-08-27T11:52:00Z' },
    { id: 'f10', scanId: 's3', targetId: 't3', targetName: '192.168.1.100', title: 'Exposed MySQL Port (3306)', severity: 'high', cvss: 7.5, category: 'Open Ports', status: 'open', description: 'MySQL accessible externally.', evidence: '3306/tcp open mysql MySQL 5.7.42', remediation: 'Restrict MySQL access.', recommendation: 'Network segmentation.', detectedAt: '2026-08-26T16:45:00Z' },
    { id: 'f11', scanId: 's3', targetId: 't3', targetName: '192.168.1.100', title: 'Root SSH Login Enabled', severity: 'high', cvss: 7.0, category: 'Credential Test', status: 'open', description: 'SSH root login with password.', evidence: 'PermitRootLogin yes', remediation: 'Disable root login.', recommendation: 'Deploy Fail2Ban.', detectedAt: '2026-08-26T16:55:00Z' },
  ]});
  console.log('✅ 11 findings');

  // ML Detections
  await prisma.mLDetection.createMany({ data: [
    { id: 'ml1', input: 'TCP SYN flood: 15,000 packets/sec to port 443', pattern: 'SYN flood pattern', detection: 'DDoS SYN Flood Attack', status: 'malicious', confidence: 0.97, features: ['High packet rate', 'Single source IP', 'SYN flag dominant'], explanation: 'Traffic matches SYN flood signatures.', timestamp: '2026-08-28T10:15:00Z' },
    { id: 'ml2', input: 'SQL: SELECT * FROM users UNION SELECT password FROM admin--', pattern: 'SQLi payload detected', detection: 'SQL Injection Attempt', status: 'malicious', confidence: 0.95, features: ['UNION SELECT', 'Comment injection', 'Admin table'], explanation: 'SQL injection pattern detected.', timestamp: '2026-08-28T10:20:00Z' },
    { id: 'ml3', input: 'GET /search?q=<img src=x onerror=alert(1)>', pattern: 'XSS payload pattern', detection: 'XSS Attempt', status: 'suspicious', confidence: 0.89, features: ['HTML tag in query', 'Event handler', 'JavaScript execution'], explanation: 'HTML injection attempt detected.', timestamp: '2026-08-28T10:25:00Z' },
    { id: 'ml4', input: 'Normal API request: GET /api/users/12345', pattern: 'Normal API traffic', detection: 'Normal API Request', status: 'normal', confidence: 0.98, features: ['Valid JWT token', 'RESTful path', 'Single request'], explanation: 'Standard API request.', timestamp: '2026-08-28T10:30:00Z' },
    { id: 'ml5', input: 'POST /wp-admin/install.php with credentials', pattern: 'WordPress exploit', detection: 'CMS Exploitation', status: 'malicious', confidence: 0.92, features: ['WordPress admin path', 'Credential submission'], explanation: 'WordPress exploitation attempt.', timestamp: '2026-08-28T10:35:00Z' },
    { id: 'ml6', input: '500 errors in 2 minutes from curl/7.68.0', pattern: 'Error probing', detection: 'Reconnaissance', status: 'suspicious', confidence: 0.78, features: ['High error rate', 'Automated user agent'], explanation: 'Brute-forcing detected.', timestamp: '2026-08-28T10:40:00Z' },
  ]});
  console.log('✅ 6 ML detections');

  // Credentials
  await prisma.credential.createMany({ data: [
    { id: 'c1', reference: 'demo-app-db-primary', targetId: 't1', targetName: 'demo-app.local', username: 'app_user', passwordEncrypted: 'U2FsdGVkX1+vupppZ2z8vAnF1YX...', status: 'active', type: 'password', createdAt: '2026-08-20T08:00:00Z' },
    { id: 'c2', reference: 'api-service-key', targetId: 't2', targetName: 'api.staging.internal', username: 'api_svc', passwordEncrypted: 'U2FsdGVkX18JKH9s2a4MzN3xR7q...', status: 'active', type: 'api_key', createdAt: '2026-08-21T10:30:00Z' },
    { id: 'c3', reference: 'ssh-bastion-key', targetId: 't3', targetName: '192.168.1.100', username: 'deploy', passwordEncrypted: 'U2FsdGVkX1+Rf8kN2mW5vH3pQ6t...', status: 'active', type: 'certificate', createdAt: '2026-08-22T14:15:00Z' },
    { id: 'c4', reference: 'monitoring-token', targetName: 'webportal.lab.local', username: 'monitor', passwordEncrypted: 'U2FsdGVkX14aB7dK1mN8wF5xS2u...', status: 'expired', type: 'token', createdAt: '2026-08-23T09:00:00Z' },
  ]});
  console.log('✅ 4 credentials');

  // Reports
  await prisma.report.createMany({ data: [
    { id: 'r1', title: 'Security Assessment — demo-app.local', scanIds: ['s1', 's4'], riskScore: 7.8, totalFindings: 10, criticalCount: 1, highCount: 2, mediumCount: 5, lowCount: 2, infoCount: 0, status: 'final', createdAt: '2026-08-28T15:00:00Z', exportedAt: '2026-08-28T15:05:00Z' },
    { id: 'r2', title: 'API Security Review — api.staging.internal', scanIds: ['s2'], riskScore: 6.2, totalFindings: 5, criticalCount: 1, highCount: 0, mediumCount: 3, lowCount: 1, infoCount: 0, status: 'final', createdAt: '2026-08-27T12:30:00Z' },
    { id: 'r3', title: 'Infrastructure Audit — 192.168.1.100', scanIds: ['s3'], riskScore: 5.5, totalFindings: 4, criticalCount: 0, highCount: 2, mediumCount: 1, lowCount: 1, infoCount: 0, status: 'draft', createdAt: '2026-08-26T18:00:00Z' },
  ]});
  console.log('✅ 3 reports');

  // Audit Logs
  await prisma.auditLog.createMany({ data: [
    { id: 'al1', userId: 'u1', userName: 'Urvish', action: 'Login', result: 'Success', timestamp: '2026-08-28T09:00:00Z', module: 'Auth' },
    { id: 'al2', userId: 'u1', userName: 'Urvish', action: 'Start scan on demo-app.local', result: 'Scan queued', timestamp: '2026-08-28T14:22:00Z', module: 'Scanner' },
    { id: 'al3', userId: 'u1', userName: 'Urvish', action: 'Scan completed — 7 findings', result: 'Success', timestamp: '2026-08-28T14:35:00Z', module: 'Scanner' },
    { id: 'al4', userId: 'u1', userName: 'Urvish', action: 'Port scan on 192.168.1.100', result: '12 ports scanned', timestamp: '2026-08-26T16:32:00Z', module: 'Pentest' },
    { id: 'al5', userId: 'u1', userName: 'Urvish', action: 'Subdomain enumeration', result: '5 subdomains found', timestamp: '2026-08-26T16:40:00Z', module: 'Pentest' },
    { id: 'al6', userId: 'u1', userName: 'Urvish', action: 'Generated report', result: 'PDF exported', timestamp: '2026-08-28T15:05:00Z', module: 'Reports' },
    { id: 'al7', userId: 'u1', userName: 'Urvish', action: 'ML Detection analysis', result: '6 patterns analyzed', timestamp: '2026-08-28T10:45:00Z', module: 'ML Detection' },
    { id: 'al8', userId: 'u1', userName: 'Urvish', action: 'Added credential: api-service-key', result: 'Encrypted and stored', timestamp: '2026-08-21T10:30:00Z', module: 'Credential Vault' },
    { id: 'al9', userId: 'u1', userName: 'Urvish', action: 'Encrypted report data', result: 'Success', timestamp: '2026-08-28T15:10:00Z', module: 'Encryptor' },
    { id: 'al10', userId: 'u1', userName: 'Urvish', action: 'Credential test on 192.168.1.100', result: '100 attempts', timestamp: '2026-08-26T17:00:00Z', module: 'Pentest' },
  ]});
  console.log('✅ 10 audit logs');

  // Port scan results
  await prisma.portScanResult.createMany({ data: [
    { id: 'ps1', port: 22, protocol: 'TCP', service: 'SSH', state: 'open', risk: 'medium' },
    { id: 'ps2', port: 80, protocol: 'TCP', service: 'HTTP', state: 'open', risk: 'low' },
    { id: 'ps3', port: 443, protocol: 'TCP', service: 'HTTPS', state: 'open', risk: 'info' },
    { id: 'ps4', port: 3306, protocol: 'TCP', service: 'MySQL', state: 'open', risk: 'high' },
    { id: 'ps5', port: 8080, protocol: 'TCP', service: 'HTTP Proxy', state: 'open', risk: 'medium' },
    { id: 'ps6', port: 8443, protocol: 'TCP', service: 'HTTPS Alt', state: 'open', risk: 'info' },
    { id: 'ps7', port: 6379, protocol: 'TCP', service: 'Redis', state: 'filtered', risk: 'high' },
    { id: 'ps8', port: 27017, protocol: 'TCP', service: 'MongoDB', state: 'closed', risk: 'info' },
  ]});
  console.log('✅ 8 port scan results');

  // Subdomain results
  await prisma.subdomainResult.createMany({ data: [
    { id: 'sd1', subdomain: 'api.demo-app.local', status: 'active', ip: '192.168.1.101', technology: 'Node.js / Express' },
    { id: 'sd2', subdomain: 'admin.demo-app.local', status: 'active', ip: '192.168.1.102', technology: 'React / Nginx' },
    { id: 'sd3', subdomain: 'staging.demo-app.local', status: 'active', ip: '192.168.1.103', technology: 'Docker' },
    { id: 'sd4', subdomain: 'cdn.demo-app.local', status: 'active', ip: '10.0.0.50', technology: 'CloudFront' },
    { id: 'sd5', subdomain: 'legacy.demo-app.local', status: 'inactive', ip: '192.168.1.200', technology: 'Apache / PHP' },
  ]});
  console.log('✅ 5 subdomain results');

  console.log('\n🎉 PostgreSQL seeded!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
