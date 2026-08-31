import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding USAP database...');

  // Clean existing data (order matters for foreign keys)
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

  // ─── USERS (with different roles for RBAC demo) ──────────────
  const hashed = await bcrypt.hash('urvish123', 10);
  await prisma.user.createMany({
    data: [
      { id: 'u1', email: 'urvish', password: hashed, name: 'Urvish', role: 'admin' },
      { id: 'u2', email: 'pentester', password: hashed, name: 'Alex Chen', role: 'pentester' },
      { id: 'u3', email: 'viewer', password: hashed, name: 'Sarah Kim', role: 'viewer' },
    ],
  });
  console.log('✅ 3 users (admin: urvish, pentester: pentester, viewer: viewer) — all / urvish123');

  // ─── TARGETS ─────────────────────────────────────────────────
  await prisma.target.createMany({
    data: [
      { id: 't1', name: 'demo-app.local', url: 'https://demo-app.local', type: 'Web Application', status: 'active', createdAt: '2026-08-15T10:30:00Z', lastScanned: '2026-08-28T14:22:00Z' },
      { id: 't2', name: 'api.staging.internal', url: 'https://api.staging.internal', type: 'API', status: 'active', createdAt: '2026-08-16T09:15:00Z', lastScanned: '2026-08-27T11:45:00Z' },
      { id: 't3', name: '192.168.1.100', url: '192.168.1.100', type: 'Host', status: 'active', createdAt: '2026-08-17T08:00:00Z', lastScanned: '2026-08-26T16:30:00Z' },
      { id: 't4', name: 'webportal.lab.local', url: 'https://webportal.lab.local', type: 'Web Application', status: 'active', createdAt: '2026-08-18T14:20:00Z', lastScanned: '2026-08-25T09:15:00Z' },
      { id: 't5', name: 'db-cluster.internal', url: '10.0.2.15', type: 'Network', status: 'inactive', createdAt: '2026-08-19T11:00:00Z' },
    ],
  });
  console.log('✅ 5 targets');

  // ─── SCANS (checks stored as JSON string for SQLite) ─────────
  await prisma.scan.createMany({
    data: [
      { id: 's1', targetId: 't1', targetName: 'demo-app.local', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-28T14:22:00Z', completedAt: '2026-08-28T14:35:00Z', checks: JSON.stringify(['SQL Injection', 'XSS', 'Security Headers', 'Outdated JavaScript Libraries', 'SSL/TLS Configuration', 'Open Ports']), findingCount: 7, highCriticalCount: 2, riskScore: 7.8 },
      { id: 's2', targetId: 't2', targetName: 'api.staging.internal', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-27T11:45:00Z', completedAt: '2026-08-27T11:58:00Z', checks: JSON.stringify(['SQL Injection', 'XSS', 'Security Headers', 'SSL/TLS Configuration']), findingCount: 5, highCriticalCount: 1, riskScore: 6.2 },
      { id: 's3', targetId: 't3', targetName: '192.168.1.100', type: 'pentest', status: 'completed', progress: 100, startedAt: '2026-08-26T16:30:00Z', completedAt: '2026-08-26T17:15:00Z', checks: JSON.stringify(['Port Scanner', 'Subdomain Enum', 'Credential Test']), findingCount: 4, highCriticalCount: 1, riskScore: 5.5 },
      { id: 's4', targetId: 't1', targetName: 'demo-app.local', type: 'pentest', status: 'completed', progress: 100, startedAt: '2026-08-25T09:15:00Z', completedAt: '2026-08-25T10:05:00Z', checks: JSON.stringify(['Port Scanner', 'Subdomain Enum']), findingCount: 3, highCriticalCount: 0, riskScore: 3.2 },
      { id: 's5', targetId: 't4', targetName: 'webportal.lab.local', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-25T09:15:00Z', completedAt: '2026-08-25T09:32:00Z', checks: JSON.stringify(['SQL Injection', 'XSS', 'Security Headers']), findingCount: 6, highCriticalCount: 3, riskScore: 8.9 },
    ],
  });
  console.log('✅ 5 scans');

  // ─── FINDINGS ────────────────────────────────────────────────
  await prisma.finding.createMany({
    data: [
      { id: 'f1', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'SQL Injection in Login Form', severity: 'critical', cvss: 9.8, category: 'SQL Injection', status: 'open', description: 'The login form at /api/auth/login is vulnerable to SQL injection. User-supplied input in the "username" parameter is concatenated directly into a SQL query without sanitization or parameterization.', evidence: 'POST /api/auth/login\nContent-Type: application/json\n\n{"username": "admin\' OR 1=1--", "password": "test"}\n\nResponse: 200 OK\n{"token": "eyJhbGciOi..."}\n\nThe application returns a valid JWT token when the injected payload is used, confirming successful authentication bypass.', remediation: 'Implement parameterized queries (prepared statements). Use an ORM or query builder that automatically escapes user input. Add input validation to reject SQL metacharacters.', recommendation: 'Deploy WAF as defense layer. Conduct full code review of database query construction. Implement input validation.', detectedAt: '2026-08-28T14:28:00Z' },
      { id: 'f2', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Cross-Site Scripting (XSS) in Search', severity: 'high', cvss: 7.5, category: 'XSS', status: 'open', description: 'The search endpoint at /api/search?q= reflects user input in the HTML response without proper output encoding. This enables reflected XSS attacks.', evidence: 'GET /api/search?q=<script>alert(document.cookie)</script>\n\nResponse HTML includes:\n<div class="results">Showing results for: <script>alert(document.cookie)</script></div>\n\nThe script executes in the browser context, confirming the XSS vulnerability.', remediation: 'Implement Content-Security-Policy (CSP) headers. Encode all user input before rendering in HTML context. Use templating engines that auto-escape by default.', recommendation: 'Deploy CSP headers with strict-src directives. Implement auto-escaping templates.', detectedAt: '2026-08-28T14:29:00Z' },
      { id: 'f3', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Missing Content-Security-Policy Header', severity: 'medium', cvss: 5.3, category: 'Security Headers', status: 'open', description: 'The application does not set a Content-Security-Policy (CSP) header. This allows inline script execution and resource loading from any origin.', evidence: 'GET / HTTP/1.1\nHost: demo-app.local\n\nHTTP/1.1 200 OK\nContent-Type: text/html\n\nMissing headers:\n- Content-Security-Policy\n- X-Content-Type-Options\n- X-Frame-Options', remediation: "Configure the web server to return a Content-Security-Policy header. Start with: default-src 'self'; script-src 'self'", recommendation: 'Add X-Content-Type-Options: nosniff and X-Frame-Options: DENY. Use SRI for external scripts.', detectedAt: '2026-08-28T14:30:00Z' },
      { id: 'f4', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Outdated JavaScript Library: jQuery 3.3.1', severity: 'medium', cvss: 6.1, category: 'Outdated Libraries', status: 'open', description: 'The application loads jQuery version 3.3.1 which has known vulnerabilities including prototype pollution (CVE-2019-11358).', evidence: 'Script tag found:\n<script src="/static/js/jquery-3.3.1.min.js"></script>\n\nCurrent stable version: 3.7.1\nCVE-2019-11358: Object.prototype pollution\nCVE-2020-11022/CVE-2020-11023: XSS', remediation: 'Update jQuery to 3.7.1+ or migrate to modern framework.', recommendation: 'Implement automated dependency scanning (Dependabot, Snyk).', detectedAt: '2026-08-28T14:31:00Z' },
      { id: 'f5', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Weak SSL/TLS Configuration: TLS 1.0 Enabled', severity: 'high', cvss: 7.4, category: 'SSL/TLS Configuration', status: 'open', description: 'The server accepts TLS 1.0 connections, which is deprecated and vulnerable to BEAST and POODLE attacks.', evidence: 'SSL/TLS scan results:\n- TLS 1.0: ENABLED (weak)\n- TLS 1.1: ENABLED (weak)\n- TLS 1.2: ENABLED\n- TLS 1.3: ENABLED\n\nCipher suites: TLS_RSA_WITH_AES_128_CBC_SHA (weak)', remediation: 'Disable TLS 1.0 and TLS 1.1. Configure server to accept only TLS 1.2+ connections.', recommendation: 'Use Mozilla SSL Configuration Generator. Enable HSTS with long max-age.', detectedAt: '2026-08-28T14:32:00Z' },
      { id: 'f6', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Open SSH Port Exposed (22/tcp)', severity: 'medium', cvss: 5.0, category: 'Open Ports', status: 'open', description: 'Port 22 (SSH) is accessible from external networks. OpenSSH 8.2 has known vulnerabilities.', evidence: '22/tcp open ssh OpenSSH 8.2p1 Ubuntu 4ubuntu0.3\n\nCVE-2021-28041: Double-free memory corruption\nCVE-2021-41617: Privilege escalation', remediation: 'Restrict SSH access to known IP addresses. Use key-based authentication only.', recommendation: 'Use bastion host or VPN for admin access. Monitor SSH login attempts.', detectedAt: '2026-08-28T14:33:00Z' },
      { id: 'f7', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Missing X-Content-Type-Options Header', severity: 'low', cvss: 3.1, category: 'Security Headers', status: 'open', description: 'The X-Content-Type-Options header is not set. Browsers may MIME-sniff responses.', evidence: 'HTTP response missing:\nX-Content-Type-Options: nosniff', remediation: 'Add "X-Content-Type-Options: nosniff" to all HTTP responses.', recommendation: 'Implement all recommended security headers.', detectedAt: '2026-08-28T14:34:00Z' },
      { id: 'f8', scanId: 's2', targetId: 't2', targetName: 'api.staging.internal', title: 'SQL Injection in User Search Endpoint', severity: 'critical', cvss: 9.1, category: 'SQL Injection', status: 'open', description: 'The /api/v2/users/search endpoint is vulnerable to blind SQL injection via the "name" parameter.', evidence: 'GET /api/v2/users/search?name=admin\' UNION SELECT version()--\n\nResponse: MySQL 8.0.33\nTiming: Normal 45ms → Injected 4521ms', remediation: 'Implement parameterized queries. Apply input validation using allowlist approach.', recommendation: 'Audit all API endpoints. Implement API gateway with input validation.', detectedAt: '2026-08-27T11:50:00Z' },
      { id: 'f9', scanId: 's2', targetId: 't2', targetName: 'api.staging.internal', title: 'Missing Rate Limiting on Authentication Endpoint', severity: 'medium', cvss: 5.3, category: 'Security Headers', status: 'open', description: 'The authentication endpoint does not implement rate limiting, allowing unlimited brute-force attempts.', evidence: '1000 authentication requests in 30 seconds\nNo 429 Too Many Responses returned\n23 successful logins detected', remediation: 'Implement rate limiting (max 5 attempts per minute per IP). Add account lockout after 10 failed attempts.', recommendation: 'Deploy rate-limiting middleware. Monitor anomalous login patterns.', detectedAt: '2026-08-27T11:52:00Z' },
      { id: 'f10', scanId: 's3', targetId: 't3', targetName: '192.168.1.100', title: 'Exposed Database Port (MySQL 3306)', severity: 'high', cvss: 7.5, category: 'Open Ports', status: 'open', description: 'MySQL port 3306 is accessible without network-level restrictions. MySQL 5.7.42 has known vulnerabilities.', evidence: '3306/tcp open mysql MySQL 5.7.42-0ubuntu0.18.04.1', remediation: 'Restrict MySQL access to application servers only. Bind to localhost or specific network.', recommendation: 'Implement network segmentation. Enable SSL for MySQL connections.', detectedAt: '2026-08-26T16:45:00Z' },
      { id: 'f11', scanId: 's3', targetId: 't3', targetName: '192.168.1.100', title: 'Weak SSH Configuration: Root Login Enabled', severity: 'high', cvss: 7.0, category: 'Credential Test', status: 'open', description: 'SSH root login is permitted with password authentication, enabling brute-force attacks.', evidence: 'SSH config: PermitRootLogin yes, PasswordAuthentication yes\n100 brute-force attempts completed, no rate limiting', remediation: 'Set PermitRootLogin to "no". Use key-based authentication only.', recommendation: 'Deploy Fail2Ban with aggressive banning policies.', detectedAt: '2026-08-26T16:55:00Z' },
    ],
  });
  console.log('✅ 11 findings');

  // ─── ML DETECTIONS ───────────────────────────────────────────
  await prisma.mLDetection.createMany({
    data: [
      { id: 'ml1', input: 'TCP SYN flood: 15,000 packets/sec to port 443 from 203.0.113.45', pattern: 'SYN flood pattern', detection: 'DDoS SYN Flood Attack', status: 'malicious', confidence: 0.97, features: JSON.stringify(['High packet rate', 'Single source IP', 'SYN flag dominant', 'Port 443 targeting']), explanation: 'Traffic pattern matches known SYN flood attack signatures. Packet rate exceeds 10,000 pps threshold with exclusive SYN flags from single source.', timestamp: '2026-08-28T10:15:00Z' },
      { id: 'ml2', input: 'SQL query: SELECT * FROM users WHERE id=1 UNION SELECT password FROM admin--', pattern: 'SQLi payload detected', detection: 'SQL Injection Attempt', status: 'malicious', confidence: 0.95, features: JSON.stringify(['UNION SELECT keyword', 'Comment injection', 'Table name "admin"', 'String concatenation']), explanation: 'Request contains SQL injection pattern matching UNION-based injection technique. Detected keywords: UNION, SELECT, --, FROM.', timestamp: '2026-08-28T10:20:00Z' },
      { id: 'ml3', input: 'GET /search?q=<img src=x onerror=alert(1)> HTTP/1.1', pattern: 'XSS payload pattern', detection: 'Cross-Site Scripting Attempt', status: 'suspicious', confidence: 0.89, features: JSON.stringify(['HTML tag in query', 'Event handler', 'JavaScript execution', 'Error handler abuse']), explanation: 'Request parameter contains HTML/JavaScript injection attempt. The onerror event handler is a common XSS vector.', timestamp: '2026-08-28T10:25:00Z' },
      { id: 'ml4', input: 'Normal API request: GET /api/users/12345 Authorization: Bearer eyJhbG...', pattern: 'Normal API traffic', detection: 'Normal API Request', status: 'normal', confidence: 0.98, features: JSON.stringify(['Valid JWT token', 'RESTful path', 'Single request', 'Normal headers']), explanation: 'Request follows standard API patterns with valid authentication token. No anomalous features detected.', timestamp: '2026-08-28T10:30:00Z' },
      { id: 'ml5', input: 'POST /wp-admin/install.php with database credentials in body', pattern: 'WordPress exploit attempt', detection: 'CMS Exploitation Attempt', status: 'malicious', confidence: 0.92, features: JSON.stringify(['WordPress admin path', 'Credential submission', 'Installation endpoint', 'POST method']), explanation: 'Request targets WordPress installation endpoint with database credentials, consistent with automated CMS exploitation tools.', timestamp: '2026-08-28T10:35:00Z' },
      { id: 'ml6', input: '500 internal server errors in 2 minutes from user agent: curl/7.68.0', pattern: 'Error probing pattern', detection: 'Reconnaissance Activity', status: 'suspicious', confidence: 0.78, features: JSON.stringify(['High error rate', 'Automated user agent', 'Short time window', 'Probing behavior']), explanation: 'Elevated rate of 500 errors suggests directory/file brute-forcing or vulnerability scanning.', timestamp: '2026-08-28T10:40:00Z' },
    ],
  });
  console.log('✅ 6 ML detections');

  // ─── CREDENTIALS ─────────────────────────────────────────────
  await prisma.credential.createMany({
    data: [
      { id: 'c1', reference: 'demo-app-db-primary', targetId: 't1', targetName: 'demo-app.local', username: 'app_user', passwordEncrypted: 'U2FsdGVkX1+vupppZ2z8vAnF1YXqRzN9mK3wL7hJ8pQ4tS6uV0wX2yZ==', status: 'active', type: 'password', createdAt: '2026-08-20T08:00:00Z' },
      { id: 'c2', reference: 'api-service-key', targetId: 't2', targetName: 'api.staging.internal', username: 'api_svc', passwordEncrypted: 'U2FsdGVkX18JKH9s2a4MzN3xR7qB5cD1eF8gH0iJ2kL==', status: 'active', type: 'api_key', createdAt: '2026-08-21T10:30:00Z' },
      { id: 'c3', reference: 'ssh-bastion-key', targetId: 't3', targetName: '192.168.1.100', username: 'deploy', passwordEncrypted: 'U2FsdGVkX1+Rf8kN2mW5vH3pQ6tY4uI7oP0aS2dF4gH==', status: 'active', type: 'certificate', createdAt: '2026-08-22T14:15:00Z' },
      { id: 'c4', reference: 'monitoring-token', targetName: 'webportal.lab.local', username: 'monitor', passwordEncrypted: 'U2FsdGVkX14aB7dK1mN8wF5xS2uJ9iH6gE3dA1cZ0vB==', status: 'expired', type: 'token', createdAt: '2026-08-23T09:00:00Z' },
    ],
  });
  console.log('✅ 4 credentials');

  // ─── REPORTS ─────────────────────────────────────────────────
  await prisma.report.createMany({
    data: [
      { id: 'r1', title: 'Security Assessment — demo-app.local', scanIds: JSON.stringify(['s1', 's4']), riskScore: 7.8, totalFindings: 10, criticalCount: 1, highCount: 2, mediumCount: 5, lowCount: 2, infoCount: 0, status: 'final', createdAt: '2026-08-28T15:00:00Z', exportedAt: '2026-08-28T15:05:00Z' },
      { id: 'r2', title: 'API Security Review — api.staging.internal', scanIds: JSON.stringify(['s2']), riskScore: 6.2, totalFindings: 5, criticalCount: 1, highCount: 0, mediumCount: 3, lowCount: 1, infoCount: 0, status: 'final', createdAt: '2026-08-27T12:30:00Z', exportedAt: '2026-08-27T12:35:00Z' },
      { id: 'r3', title: 'Infrastructure Audit — 192.168.1.100', scanIds: JSON.stringify(['s3']), riskScore: 5.5, totalFindings: 4, criticalCount: 0, highCount: 2, mediumCount: 1, lowCount: 1, infoCount: 0, status: 'draft', createdAt: '2026-08-26T18:00:00Z' },
    ],
  });
  console.log('✅ 3 reports');

  // ─── AUDIT LOGS ──────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { id: 'al1', userId: 'u1', userName: 'Urvish', action: 'Login', result: 'Success', timestamp: '2026-08-28T09:00:00Z', module: 'Auth' },
      { id: 'al2', userId: 'u1', userName: 'Urvish', action: 'Start vulnerability scan on demo-app.local', result: 'Scan queued', timestamp: '2026-08-28T14:22:00Z', module: 'Scanner' },
      { id: 'al3', userId: 'u1', userName: 'Urvish', action: 'Scan completed — 7 findings', result: 'Success', timestamp: '2026-08-28T14:35:00Z', module: 'Scanner' },
      { id: 'al4', userId: 'u1', userName: 'Urvish', action: 'Port scan on 192.168.1.100', result: '12 ports scanned', timestamp: '2026-08-26T16:32:00Z', module: 'Pentest' },
      { id: 'al5', userId: 'u1', userName: 'Urvish', action: 'Subdomain enumeration on demo-app.local', result: '5 subdomains found', timestamp: '2026-08-26T16:40:00Z', module: 'Pentest' },
      { id: 'al6', userId: 'u1', userName: 'Urvish', action: 'Generated report: Security Assessment — demo-app.local', result: 'PDF exported', timestamp: '2026-08-28T15:05:00Z', module: 'Reports' },
      { id: 'al7', userId: 'u1', userName: 'Urvish', action: 'ML Detection analysis on traffic capture', result: '6 patterns analyzed', timestamp: '2026-08-28T10:45:00Z', module: 'ML Detection' },
      { id: 'al8', userId: 'u1', userName: 'Urvish', action: 'Added credential: api-service-key', result: 'Encrypted and stored', timestamp: '2026-08-21T10:30:00Z', module: 'Credential Vault' },
      { id: 'al9', userId: 'u1', userName: 'Urvish', action: 'Encrypted report data with AES-256-GCM', result: 'Success', timestamp: '2026-08-28T15:10:00Z', module: 'Encryptor' },
      { id: 'al10', userId: 'u1', userName: 'Urvish', action: 'Credential test on 192.168.1.100', result: '100 attempts completed', timestamp: '2026-08-26T17:00:00Z', module: 'Pentest' },
    ],
  });
  console.log('✅ 10 audit logs');

  // ─── PORT SCAN RESULTS ───────────────────────────────────────
  await prisma.portScanResult.createMany({
    data: [
      { id: 'ps1', port: 22, protocol: 'TCP', service: 'SSH', state: 'open', risk: 'medium' },
      { id: 'ps2', port: 80, protocol: 'TCP', service: 'HTTP', state: 'open', risk: 'low' },
      { id: 'ps3', port: 443, protocol: 'TCP', service: 'HTTPS', state: 'open', risk: 'info' },
      { id: 'ps4', port: 3306, protocol: 'TCP', service: 'MySQL', state: 'open', risk: 'high' },
      { id: 'ps5', port: 8080, protocol: 'TCP', service: 'HTTP Proxy', state: 'open', risk: 'medium' },
      { id: 'ps6', port: 8443, protocol: 'TCP', service: 'HTTPS Alt', state: 'open', risk: 'info' },
      { id: 'ps7', port: 6379, protocol: 'TCP', service: 'Redis', state: 'filtered', risk: 'high' },
      { id: 'ps8', port: 27017, protocol: 'TCP', service: 'MongoDB', state: 'closed', risk: 'info' },
    ],
  });
  console.log('✅ 8 port scan results');

  // ─── SUBDOMAIN RESULTS ───────────────────────────────────────
  await prisma.subdomainResult.createMany({
    data: [
      { id: 'sd1', subdomain: 'api.demo-app.local', status: 'active', ip: '192.168.1.101', technology: 'Node.js / Express' },
      { id: 'sd2', subdomain: 'admin.demo-app.local', status: 'active', ip: '192.168.1.102', technology: 'React / Nginx' },
      { id: 'sd3', subdomain: 'staging.demo-app.local', status: 'active', ip: '192.168.1.103', technology: 'Docker' },
      { id: 'sd4', subdomain: 'cdn.demo-app.local', status: 'active', ip: '10.0.0.50', technology: 'CloudFront' },
      { id: 'sd5', subdomain: 'legacy.demo-app.local', status: 'inactive', ip: '192.168.1.200', technology: 'Apache / PHP' },
    ],
  });
  console.log('✅ 5 subdomain results');

  console.log('\n🎉 Database seeded successfully!');
  console.log('   Login credentials: urvish / urvish123 (admin)');
  console.log('                       pentester / urvish123 (pentester)');
  console.log('                       viewer / urvish123 (viewer)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
