import { User, Target, Scan, Finding, MLDetection, Credential, Report, AuditLog, PortScanResult, SubdomainResult } from '../types';

export const seedUsers: User[] = [
  { id: 'u1', email: 'urvish', password: 'urvish123', name: 'Urvish', role: 'admin' },
];

export const seedTargets: Target[] = [
  { id: 't1', name: 'demo-app.local', url: 'https://demo-app.local', type: 'Web Application', status: 'active', createdAt: '2026-08-15T10:30:00Z', lastScanned: '2026-08-28T14:22:00Z' },
  { id: 't2', name: 'api.staging.internal', url: 'https://api.staging.internal', type: 'API', status: 'active', createdAt: '2026-08-16T09:15:00Z', lastScanned: '2026-08-27T11:45:00Z' },
  { id: 't3', name: '192.168.1.100', url: '192.168.1.100', type: 'Host', status: 'active', createdAt: '2026-08-17T08:00:00Z', lastScanned: '2026-08-26T16:30:00Z' },
  { id: 't4', name: 'webportal.lab.local', url: 'https://webportal.lab.local', type: 'Web Application', status: 'active', createdAt: '2026-08-18T14:20:00Z', lastScanned: '2026-08-25T09:15:00Z' },
  { id: 't5', name: 'db-cluster.internal', url: '10.0.2.15', type: 'Network', status: 'inactive', createdAt: '2026-08-19T11:00:00Z' },
];

export const seedScans: Scan[] = [
  { id: 's1', targetId: 't1', targetName: 'demo-app.local', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-28T14:22:00Z', completedAt: '2026-08-28T14:35:00Z', checks: ['SQL Injection', 'XSS', 'Security Headers', 'Outdated Libraries', 'SSL/TLS', 'Open Ports'], findingCount: 7, highCriticalCount: 2, riskScore: 7.8 },
  { id: 's2', targetId: 't2', targetName: 'api.staging.internal', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-27T11:45:00Z', completedAt: '2026-08-27T11:58:00Z', checks: ['SQL Injection', 'XSS', 'Security Headers', 'SSL/TLS'], findingCount: 5, highCriticalCount: 1, riskScore: 6.2 },
  { id: 's3', targetId: 't3', targetName: '192.168.1.100', type: 'pentest', status: 'completed', progress: 100, startedAt: '2026-08-26T16:30:00Z', completedAt: '2026-08-26T17:15:00Z', checks: ['Port Scanner', 'Subdomain Enum', 'Credential Test'], findingCount: 4, highCriticalCount: 1, riskScore: 5.5 },
  { id: 's4', targetId: 't1', targetName: 'demo-app.local', type: 'pentest', status: 'completed', progress: 100, startedAt: '2026-08-25T09:15:00Z', completedAt: '2026-08-25T10:05:00Z', checks: ['Port Scanner', 'Subdomain Enum'], findingCount: 3, highCriticalCount: 0, riskScore: 3.2 },
  { id: 's5', targetId: 't4', targetName: 'webportal.lab.local', type: 'vulnerability', status: 'completed', progress: 100, startedAt: '2026-08-25T09:15:00Z', completedAt: '2026-08-25T09:32:00Z', checks: ['SQL Injection', 'XSS', 'Security Headers'], findingCount: 6, highCriticalCount: 3, riskScore: 8.9 },
];

export const seedFindings: Finding[] = [
  {
    id: 'f1', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'SQL Injection in Login Form',
    severity: 'critical', cvss: 9.8, category: 'SQL Injection', status: 'open',
    description: 'The login form at /api/auth/login is vulnerable to SQL injection. User-supplied input in the "username" parameter is concatenated directly into a SQL query without sanitization or parameterization.',
    evidence: 'POST /api/auth/login\nContent-Type: application/json\n\n{"username": "admin\' OR 1=1--", "password": "test"}\n\nResponse: 200 OK\n{"token": "eyJhbGciOi..."}\n\nThe application returns a valid JWT token when the injected payload is used, confirming successful authentication bypass.',
    remediation: 'Replace string concatenation with parameterized queries (prepared statements). Implement an ORM or use a query builder that automatically escapes user input. Add input validation to reject SQL metacharacters in username fields.',
    recommendation: 'Implement parameterized queries across all database interactions. Deploy a Web Application Firewall (WAF) as an additional defense layer. Conduct a full code review of all database query construction.',
    detectedAt: '2026-08-28T14:28:00Z'
  },
  {
    id: 'f2', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Cross-Site Scripting (XSS) in Search',
    severity: 'high', cvss: 7.5, category: 'XSS', status: 'open',
    description: 'The search endpoint at /api/search?q= reflects user input in the HTML response without proper output encoding. This enables reflected XSS attacks.',
    evidence: 'GET /api/search?q=<script>alert(document.cookie)</script>\n\nResponse HTML includes:\n<div class="results">Showing results for: <script>alert(document.cookie)</script></div>\n\nThe script executes in the browser context, confirming the XSS vulnerability.',
    remediation: 'Implement Content Security Policy (CSP) headers. Encode all user input before rendering in HTML context using appropriate encoding functions (HTML entity encoding). Use templating engines that auto-escape by default.',
    recommendation: 'Deploy CSP headers with strict-src directives. Implement auto-escaping templates. Validate and sanitize all user inputs on both client and server side.',
    detectedAt: '2026-08-28T14:29:00Z'
  },
  {
    id: 'f3', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Missing Content-Security-Policy Header',
    severity: 'medium', cvss: 5.3, category: 'Security Headers', status: 'open',
    description: 'The application does not set a Content-Security-Policy (CSP) header. This allows inline script execution and resource loading from any origin, increasing the impact of XSS attacks.',
    evidence: 'GET / HTTP/1.1\nHost: demo-app.local\n\nHTTP/1.1 200 OK\nContent-Type: text/html\n\nMissing headers detected:\n- Content-Security-Policy\n- X-Content-Type-Options\n- X-Frame-Options\n\nExpected: Content-Security-Policy: default-src \'self\'',
    remediation: 'Configure the web server to return a Content-Security-Policy header. Start with a restrictive policy and gradually relax as needed. At minimum, include: default-src \'self\'; script-src \'self\'',
    recommendation: 'Implement a layered CSP policy. Add X-Content-Type-Options: nosniff and X-Frame-Options: DENY. Use Subresource Integrity (SRI) for external scripts.',
    detectedAt: '2026-08-28T14:30:00Z'
  },
  {
    id: 'f4', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Outdated JavaScript Library: jQuery 3.3.1',
    severity: 'medium', cvss: 6.1, category: 'Outdated Libraries', status: 'open',
    description: 'The application loads jQuery version 3.3.1 which has known vulnerabilities including prototype pollution (CVE-2019-11358) and XSS via crafted HTML.',
    evidence: 'Script tag found:\n<script src="/static/js/jquery-3.3.1.min.js"></script>\n\nCurrent stable version: 3.7.1\nKnown CVEs:\n- CVE-2019-11358: Object.prototype pollution\n- CVE-2020-11022/CVE-2020-11023: XSS via HTML passed to DOM manipulation methods',
    remediation: 'Update jQuery to the latest stable version (3.7.1 or later). Alternatively, migrate to a modern framework or lightweight alternative such as Alpine.js or vanilla JavaScript.',
    recommendation: 'Implement automated dependency scanning (e.g., Dependabot, Snyk). Establish a patch management process for frontend dependencies.',
    detectedAt: '2026-08-28T14:31:00Z'
  },
  {
    id: 'f5', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Weak SSL/TLS Configuration: TLS 1.0 Enabled',
    severity: 'high', cvss: 7.4, category: 'SSL/TLS Configuration', status: 'open',
    description: 'The server accepts TLS 1.0 connections, which is deprecated and vulnerable to BEAST and POODLE attacks. TLS 1.0 and 1.1 should be disabled.',
    evidence: 'SSL/TLS scan results:\n- TLS 1.0: ENABLED (weak)\n- TLS 1.1: ENABLED (weak)\n- TLS 1.2: ENABLED\n- TLS 1.3: ENABLED\n\nCipher suites supported with TLS 1.0:\n- TLS_RSA_WITH_AES_128_CBC_SHA (weak)\n- TLS_RSA_WITH_AES_256_CBC_SHA (weak)\n\nBEAST attack probability: Medium',
    remediation: 'Disable TLS 1.0 and TLS 1.1 on the server. Configure the server to only accept TLS 1.2 and TLS 1.3 connections. Remove weak cipher suites from the configuration.',
    recommendation: 'Use Mozilla SSL Configuration Generator to generate server configuration. Enable HTTP Strict Transport Security (HSTS) with a long max-age. Test configuration using SSL Labs.',
    detectedAt: '2026-08-28T14:32:00Z'
  },
  {
    id: 'f6', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Open SSH Port Exposed (22/tcp)',
    severity: 'medium', cvss: 5.0, category: 'Open Ports', status: 'open',
    description: 'Port 22 (SSH) is accessible from external networks. The SSH banner reveals OpenSSH 8.2 which has known vulnerabilities. Publicly exposed SSH increases attack surface.',
    evidence: 'Port scan results:\n22/tcp  open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux)\n\nBanner: SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.3\n\nVulnerabilities associated with OpenSSH 8.2:\n- CVE-2021-28041: Double-free memory corruption\n- CVE-2021-41617: Privilege escalation',
    remediation: 'Restrict SSH access to known IP addresses using firewall rules. If SSH must be public, use key-based authentication only and disable password authentication. Update OpenSSH to the latest version.',
    recommendation: 'Implement IP allowlisting for SSH access. Use a bastion host or VPN for administrative access. Monitor SSH login attempts for brute-force detection.',
    detectedAt: '2026-08-28T14:33:00Z'
  },
  {
    id: 'f7', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Missing X-Content-Type-Options Header',
    severity: 'low', cvss: 3.1, category: 'Security Headers', status: 'open',
    description: 'The X-Content-Type-Options header is not set. Without this header, browsers may MIME-sniff responses, potentially loading scripts as HTML.',
    evidence: 'GET / HTTP/1.1\n\nHTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\n\nMissing: X-Content-Type-Options: nosniff',
    remediation: 'Add "X-Content-Type-Options: nosniff" to all HTTP responses. Configure this at the web server level.',
    recommendation: 'Implement all recommended security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.',
    detectedAt: '2026-08-28T14:34:00Z'
  },
  {
    id: 'f8', scanId: 's2', targetId: 't2', targetName: 'api.staging.internal', title: 'SQL Injection in User Search Endpoint',
    severity: 'critical', cvss: 9.1, category: 'SQL Injection', status: 'open',
    description: 'The /api/v2/users/search endpoint is vulnerable to blind SQL injection via the "name" parameter. Extracted database version: MySQL 8.0.33.',
    evidence: 'GET /api/v2/users/search?name=admin\' UNION SELECT version()--\n\nResponse (delayed): "users": [{"name": "MySQL 8.0.33"}]\n\nTiming-based confirmation:\n- Normal response: 45ms\n- Injected response: 4521ms (WAITFOR DELAY confirmed)',
    remediation: 'Implement parameterized queries. Apply input validation using allowlist approach. Deploy application firewall rules for the API.',
    recommendation: 'Conduct thorough audit of all API endpoints for injection vulnerabilities. Implement API gateway with input validation. Enable query logging for security monitoring.',
    detectedAt: '2026-08-27T11:50:00Z'
  },
  {
    id: 'f9', scanId: 's2', targetId: 't2', targetName: 'api.staging.internal', title: 'Missing Rate Limiting on Authentication Endpoint',
    severity: 'medium', cvss: 5.3, category: 'Security Headers', status: 'open',
    description: 'The authentication endpoint /api/v2/auth/token does not implement rate limiting, allowing unlimited brute-force attempts.',
    evidence: 'Sent 1000 authentication requests in 30 seconds:\n- All requests processed without throttling\n- No 429 Too Many Responses returned\n- 23 successful logins detected (credential stuffing confirmed feasible)',
    remediation: 'Implement rate limiting (max 5 attempts per minute per IP). Add account lockout after 10 failed attempts. Implement CAPTCHA after 3 failed attempts.',
    recommendation: 'Deploy a rate-limiting middleware. Implement progressive delays for failed authentication. Monitor and alert on anomalous login patterns.',
    detectedAt: '2026-08-27T11:52:00Z'
  },
  {
    id: 'f10', scanId: 's3', targetId: 't3', targetName: '192.168.1.100', title: 'Exposed Database Port (MySQL 3306)',
    severity: 'high', cvss: 7.5, category: 'Open Ports', status: 'open',
    description: 'MySQL port 3306 is accessible without network-level restrictions. The MySQL version 5.7.42 has known vulnerabilities.',
    evidence: 'Port scan:\n3306/tcp open  mysql   MySQL 5.7.42-0ubuntu0.18.04.1\n\nMySQL banner disclosure:\n- Version: 5.7.42\n- Protocol: 10\n- Server Status: AUTO_INCREMENT, BIG_TABLES, ...',
    remediation: 'Restrict MySQL access to application servers only using firewall rules. Bind MySQL to localhost or specific application network. Update MySQL to latest stable version.',
    recommendation: 'Implement network segmentation for database tier. Enable SSL for MySQL connections. Implement database audit logging.',
    detectedAt: '2026-08-26T16:45:00Z'
  },
  {
    id: 'f11', scanId: 's3', targetId: 't3', targetName: '192.168.1.100', title: 'Weak SSH Configuration: Root Login Enabled',
    severity: 'high', cvss: 7.0, category: 'Credential Test', status: 'open',
    description: 'SSH root login is permitted with password authentication. This enables brute-force attacks against the root account.',
    evidence: 'SSH configuration analysis:\nPermitRootLogin yes\nPasswordAuthentication yes\n\nBrute-force test (controlled, 100 attempts):\n- 100 attempts against root@192.168.1.100:22\n- No rate limiting detected\n- Banner reveals OS: Ubuntu 18.04.6 LTS',
    remediation: 'Set PermitRootLogin to "no" or "prohibit-password". Use key-based authentication. Implement Fail2Ban or similar intrusion prevention.',
    recommendation: 'Disable root login via SSH. Implement key-based authentication only. Deploy Fail2Ban with aggressive banning policies. Monitor SSH access through centralized logging.',
    detectedAt: '2026-08-26T16:55:00Z'
  },
];

export const seedMLDetections: MLDetection[] = [
  { id: 'ml1', input: 'TCP SYN flood: 15,000 packets/sec to port 443 from 203.0.113.45', pattern: 'SYN flood pattern', detection: 'DDoS SYN Flood Attack', status: 'malicious', confidence: 0.97, features: ['High packet rate', 'Single source IP', 'SYN flag dominant', 'Port 443 targeting'], explanation: 'Traffic pattern matches known SYN flood attack signatures. Packet rate exceeds 10,000 pps threshold with exclusive SYN flags from single source.', timestamp: '2026-08-28T10:15:00Z' },
  { id: 'ml2', input: 'SQL query: SELECT * FROM users WHERE id=1 UNION SELECT password FROM admin--', pattern: 'SQLi payload detected', detection: 'SQL Injection Attempt', status: 'malicious', confidence: 0.95, features: ['UNION SELECT keyword', 'Comment injection', 'Table name "admin"', 'String concatenation'], explanation: 'Request contains SQL injection pattern matching UNION-based injection technique. Detected keywords: UNION, SELECT, --, FROM. Consistent with automated SQLi tool output.', timestamp: '2026-08-28T10:20:00Z' },
  { id: 'ml3', input: 'GET /search?q=<img src=x onerror=alert(1)> HTTP/1.1', pattern: 'XSS payload pattern', detection: 'Cross-Site Scripting Attempt', status: 'suspicious', confidence: 0.89, features: ['HTML tag in query', 'Event handler', 'JavaScript execution', 'Error handler abuse'], explanation: 'Request parameter contains HTML/JavaScript injection attempt. The onerror event handler is a common XSS vector. Confidence reduced due to legitimate use of angle brackets in search queries.', timestamp: '2026-08-28T10:25:00Z' },
  { id: 'ml4', input: 'Normal API request: GET /api/users/12345 Authorization: Bearer eyJhbG...', pattern: 'Normal API traffic', detection: 'Normal API Request', status: 'normal', confidence: 0.98, features: ['Valid JWT token', 'RESTful path', 'Single request', 'Normal headers'], explanation: 'Request follows standard API patterns with valid authentication token. No anomalous features detected. Request rate and payload size within normal parameters.', timestamp: '2026-08-28T10:30:00Z' },
  { id: 'ml5', input: 'POST /wp-admin/install.php with database credentials in body', pattern: 'WordPress exploit attempt', detection: 'CMS Exploitation Attempt', status: 'malicious', confidence: 0.92, features: ['WordPress admin path', 'Credential submission', 'Installation endpoint', 'POST method'], explanation: 'Request targets WordPress installation endpoint with database credentials, consistent with automated CMS exploitation tools. Path pattern matches Metasploit WP module.', timestamp: '2026-08-28T10:35:00Z' },
  { id: 'ml6', input: '500 internal server errors in 2 minutes from user agent: curl/7.68.0', pattern: 'Error probing pattern', detection: 'Reconnaissance Activity', status: 'suspicious', confidence: 0.78, features: ['High error rate', 'Automated user agent', 'Short time window', 'Probing behavior'], explanation: 'Elevated rate of 500 errors suggests directory/file brute-forcing or vulnerability scanning. User agent indicates automated tool. Confidence reduced due to possible misconfiguration causing cascading errors.', timestamp: '2026-08-28T10:40:00Z' },
];

export const seedCredentials: Credential[] = [
  { id: 'c1', reference: 'demo-app-db-primary', targetId: 't1', targetName: 'demo-app.local', username: 'app_user', passwordEncrypted: 'U2FsdGVkX1+vupppZ2z8vAnF1YX...', status: 'active', type: 'password', createdAt: '2026-08-20T08:00:00Z' },
  { id: 'c2', reference: 'api-service-key', targetId: 't2', targetName: 'api.staging.internal', username: 'api_svc', passwordEncrypted: 'U2FsdGVkX18JKH9s2a4MzN3xR7q...', status: 'active', type: 'api_key', createdAt: '2026-08-21T10:30:00Z' },
  { id: 'c3', reference: 'ssh-bastion-key', targetId: 't3', targetName: '192.168.1.100', username: 'deploy', passwordEncrypted: 'U2FsdGVkX1+Rf8kN2mW5vH3pQ6t...', status: 'active', type: 'certificate', createdAt: '2026-08-22T14:15:00Z' },
  { id: 'c4', reference: 'monitoring-token', targetName: 'webportal.lab.local', username: 'monitor', passwordEncrypted: 'U2FsdGVkX14aB7dK1mN8wF5xS2u...', status: 'expired', type: 'token', createdAt: '2026-08-23T09:00:00Z' },
];

export const seedReports: Report[] = [
  { id: 'r1', title: 'Security Assessment — demo-app.local', scanIds: ['s1', 's4'], riskScore: 7.8, totalFindings: 10, criticalCount: 1, highCount: 2, mediumCount: 5, lowCount: 2, infoCount: 0, status: 'final', createdAt: '2026-08-28T15:00:00Z', exportedAt: '2026-08-28T15:05:00Z' },
  { id: 'r2', title: 'API Security Review — api.staging.internal', scanIds: ['s2'], riskScore: 6.2, totalFindings: 5, criticalCount: 1, highCount: 0, mediumCount: 3, lowCount: 1, infoCount: 0, status: 'final', createdAt: '2026-08-27T12:30:00Z' },
  { id: 'r3', title: 'Infrastructure Audit — 192.168.1.100', scanIds: ['s3'], riskScore: 5.5, totalFindings: 4, criticalCount: 0, highCount: 2, mediumCount: 1, lowCount: 1, infoCount: 0, status: 'draft', createdAt: '2026-08-26T18:00:00Z' },
];

export const seedAuditLogs: AuditLog[] = [
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
];

export const seedPortScanResults: PortScanResult[] = [
  { port: 22, protocol: 'TCP', service: 'SSH', state: 'open', risk: 'medium' },
  { port: 80, protocol: 'TCP', service: 'HTTP', state: 'open', risk: 'low' },
  { port: 443, protocol: 'TCP', service: 'HTTPS', state: 'open', risk: 'info' },
  { port: 3306, protocol: 'TCP', service: 'MySQL', state: 'open', risk: 'high' },
  { port: 8080, protocol: 'TCP', service: 'HTTP Proxy', state: 'open', risk: 'medium' },
  { port: 8443, protocol: 'TCP', service: 'HTTPS Alt', state: 'open', risk: 'info' },
  { port: 6379, protocol: 'TCP', service: 'Redis', state: 'filtered', risk: 'high' },
  { port: 27017, protocol: 'TCP', service: 'MongoDB', state: 'closed', risk: 'info' },
];

export const seedSubdomainResults: SubdomainResult[] = [
  { subdomain: 'api.demo-app.local', status: 'active', ip: '192.168.1.101', technology: 'Node.js / Express' },
  { subdomain: 'admin.demo-app.local', status: 'active', ip: '192.168.1.102', technology: 'React / Nginx' },
  { subdomain: 'staging.demo-app.local', status: 'active', ip: '192.168.1.103', technology: 'Docker' },
  { subdomain: 'cdn.demo-app.local', status: 'active', ip: '10.0.0.50', technology: 'CloudFront' },
  { subdomain: 'legacy.demo-app.local', status: 'inactive', ip: '192.168.1.200', technology: 'Apache / PHP' },
];
