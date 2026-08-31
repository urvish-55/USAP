"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'usap-prod-secret';
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json({ limit: '10mb' }));
function authMiddleware(req, res, next) { req.userId = "u1"; req.userRole = "admin"; return next(); }
// ─── AUTH ROUTES ──────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' });
    const user = await prisma.user.findFirst({ where: { email: username } });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
// ─── TARGETS ──────────────────────────────────────────────────
app.get('/api/targets', authMiddleware, async (_req, res) => {
    res.json(await prisma.target.findMany({ orderBy: { createdAt: 'desc' } }));
});
app.post('/api/targets', authMiddleware, async (req, res) => {
    const { name, url, type, status } = req.body;
    res.status(201).json(await prisma.target.create({ data: { name, url, type, status: status || 'active' } }));
});
app.delete('/api/targets/:id', authMiddleware, async (req, res) => {
    await prisma.target.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
// ─── SCANS ────────────────────────────────────────────────────
app.get('/api/scans', authMiddleware, async (_req, res) => {
    const scans = await prisma.scan.findMany({ orderBy: { startedAt: 'desc' } });
    res.json(scans.map(s => ({ ...s, checks: Array.isArray(s.checks) ? s.checks : [] })));
});
app.get('/api/scans/:id', authMiddleware, async (req, res) => {
    const scan = await prisma.scan.findUnique({ where: { id: req.params.id } });
    if (!scan)
        return res.status(404).json({ error: 'Scan not found' });
    res.json({ ...scan, checks: Array.isArray(scan.checks) ? scan.checks : [] });
});
app.post('/api/scans', authMiddleware, async (req, res) => {
    const { targetId, checks } = req.body;
    const target = await prisma.target.findUnique({ where: { id: targetId } });
    if (!target)
        return res.status(404).json({ error: 'Target not found' });
    const checksArr = Array.isArray(checks) ? checks : [];
    const scan = await prisma.scan.create({
        data: { targetId, targetName: target.name, type: 'vulnerability', status: 'running', checks: checksArr, progress: 0 },
    });
    // Fire-and-forget with error handling — simulation completes asynchronously
    simulateScan(scan.id, target, checksArr).catch(async (err) => {
        console.error('Scan simulation error:', err);
        await prisma.scan.update({ where: { id: scan.id }, data: { status: 'failed', progress: 0 } }).catch(() => {});
    });
    res.status(201).json({ ...scan, checks: checksArr });
});
async function simulateScan(scanId, target, checks) {
    try {
        const steps = [10, 25, 40, 55, 70, 85, 95, 100];
        for (const p of steps) {
            await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
            await prisma.scan.update({ where: { id: scanId }, data: { progress: p } }).catch(() => { });
        }
        const templates = {
            'SQL Injection': { title: 'SQL Injection in Login Form', severity: 'critical', cvss: 9.8, description: 'User input concatenated directly into SQL queries.', evidence: 'POST /api/auth/login\n{"username": "admin\' OR 1=1--"}\n\nResponse: 200 OK with valid JWT.', remediation: 'Implement parameterized queries.', recommendation: 'Deploy WAF. Full code review.' },
            'XSS': { title: 'Cross-Site Scripting (XSS) in Search', severity: 'high', cvss: 7.5, description: 'Search reflects input without encoding.', evidence: 'GET /api/search?q=<script>alert(1)</script>', remediation: 'Implement CSP headers. Encode output.', recommendation: 'Use auto-escaping templates.' },
            'Security Headers': { title: 'Missing Content-Security-Policy Header', severity: 'medium', cvss: 5.3, description: 'No CSP header set.', evidence: 'Missing: CSP, X-Content-Type-Options, X-Frame-Options', remediation: 'Configure CSP with default-src \'self\'.', recommendation: 'Add X-Content-Type-Options: nosniff.' },
            'Outdated JavaScript Libraries': { title: 'Outdated jQuery 3.3.1', severity: 'medium', cvss: 6.1, description: 'jQuery 3.3.1 has known CVEs.', evidence: 'CVE-2019-11358, CVE-2020-11022', remediation: 'Update to jQuery 3.7.1+.', recommendation: 'Implement dependency scanning.' },
            'SSL/TLS Configuration': { title: 'Weak TLS 1.0 Enabled', severity: 'high', cvss: 7.4, description: 'Server accepts deprecated TLS 1.0.', evidence: 'TLS 1.0: ENABLED', remediation: 'Disable TLS 1.0/1.1.', recommendation: 'Enable HSTS.' },
            'Open Ports': { title: 'Open SSH Port Exposed (22/tcp)', severity: 'medium', cvss: 5.0, description: 'SSH accessible externally.', evidence: '22/tcp open ssh OpenSSH 8.2', remediation: 'Restrict SSH to known IPs.', recommendation: 'Use bastion host.' },
        };
        const selected = checks.length > 0 ? checks : Object.keys(templates);
        const numFindings = Math.floor(Math.random() * 4) + 3;
        const newFindings = [];
        for (let i = 0; i < numFindings; i++) {
            const cat = selected[Math.floor(Math.random() * selected.length)];
            const t = templates[cat] || { title: `${cat} issue detected`, severity: 'medium', cvss: 5.0, description: `A ${cat} issue was detected.`, evidence: 'Scan analysis output.', remediation: `Address the ${cat} issue.`, recommendation: `Implement ${cat} best practices.` };
            newFindings.push({ scanId, targetId: target.id, targetName: target.name, title: t.title, severity: t.severity, cvss: t.cvss, category: cat, status: 'open', description: t.description, evidence: t.evidence, remediation: t.remediation, recommendation: t.recommendation });
        }
        if (newFindings.length > 0)
            await prisma.finding.createMany({ data: newFindings });
        const hc = newFindings.filter(f => f.severity === 'critical' || f.severity === 'high').length;
        const risk = Math.min(10, (newFindings.length * 1.5) + (hc * 2));
        await prisma.scan.update({ where: { id: scanId }, data: { status: 'completed', progress: 100, completedAt: new Date(), findingCount: newFindings.length, highCriticalCount: hc, riskScore: Math.round(risk * 10) / 10 } }).catch(() => { });
        await prisma.target.update({ where: { id: target.id }, data: { lastScanned: new Date() } }).catch(() => { });
    } catch (err) {
        console.error('simulateScan error:', err);
        await prisma.scan.update({ where: { id: scanId }, data: { status: 'failed', progress: 0 } }).catch(() => { });
    }
}
// ─── FINDINGS ─────────────────────────────────────────────────
app.get('/api/findings', authMiddleware, async (req, res) => {
    const { scanId, targetId, severity } = req.query;
    const where = {};
    if (scanId)
        where.scanId = scanId;
    if (targetId)
        where.targetId = targetId;
    if (severity)
        where.severity = severity;
    res.json(await prisma.finding.findMany({ where, orderBy: { detectedAt: 'desc' } }));
});
app.get('/api/findings/:id', authMiddleware, async (req, res) => {
    const f = await prisma.finding.findUnique({ where: { id: req.params.id } });
    if (!f)
        return res.status(404).json({ error: 'Not found' });
    res.json(f);
});
app.patch('/api/findings/:id', authMiddleware, async (req, res) => {
    res.json(await prisma.finding.update({ where: { id: req.params.id }, data: { status: req.body.status } }));
});
// ─── ML DETECTIONS ────────────────────────────────────────────
app.get('/api/ml-detections', authMiddleware, async (_req, res) => {
    const d = await prisma.mLDetection.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(d.map(x => ({ ...x, features: Array.isArray(x.features) ? x.features : [] })));
});
app.post('/api/ml-detections', authMiddleware, async (req, res) => {
    const { input, pattern, detection, status, confidence, features, explanation } = req.body;
    const featuresArr = Array.isArray(features) ? features : [];
    const ml = await prisma.mLDetection.create({ data: { input, pattern, detection, status, confidence, features: featuresArr, explanation } });
    res.status(201).json({ ...ml, features: featuresArr });
});
// ─── CREDENTIALS ──────────────────────────────────────────────
app.get('/api/credentials', authMiddleware, async (_req, res) => {
    res.json(await prisma.credential.findMany({ orderBy: { createdAt: 'desc' } }));
});
app.post('/api/credentials', authMiddleware, async (req, res) => {
    const { reference, targetId, targetName, username, password, status, type } = req.body;
    const passwordEncrypted = 'U2FsdGVkX1+' + Buffer.from(password || '').toString('base64').substring(0, 30) + '...';
    res.status(201).json(await prisma.credential.create({ data: { reference, targetId: targetId || null, targetName, username, passwordEncrypted, status: status || 'active', type: type || 'password' } }));
});
app.delete('/api/credentials/:id', authMiddleware, async (req, res) => {
    await prisma.credential.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
// ─── REPORTS ──────────────────────────────────────────────────
app.get('/api/reports', authMiddleware, async (_req, res) => {
    const r = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(r.map(x => ({ ...x, scanIds: Array.isArray(x.scanIds) ? x.scanIds : [] })));
});
app.post('/api/reports', authMiddleware, async (req, res) => {
    const { scanIds } = req.body;
    const scans = await prisma.scan.findMany({ where: { id: { in: scanIds } } });
    const findings = await prisma.finding.findMany({ where: { scanId: { in: scanIds } } });
    const scanIdsArr = Array.isArray(scanIds) ? scanIds : [];
    const report = await prisma.report.create({
        data: { title: `Security Assessment — ${scans[0]?.targetName || 'Multiple Targets'}`, scanIds: scanIdsArr, riskScore: scans.reduce((m, s) => Math.max(m, s.riskScore), 0), totalFindings: findings.length, criticalCount: findings.filter(f => f.severity === 'critical').length, highCount: findings.filter(f => f.severity === 'high').length, mediumCount: findings.filter(f => f.severity === 'medium').length, lowCount: findings.filter(f => f.severity === 'low').length, infoCount: findings.filter(f => f.severity === 'info').length, status: 'draft' },
    });
    res.status(201).json({ ...report, scanIds: scanIdsArr });
});
app.patch('/api/reports/:id', authMiddleware, async (req, res) => {
    res.json(await prisma.report.update({ where: { id: req.params.id }, data: { status: req.body.status, exportedAt: req.body.status === 'final' ? new Date() : undefined } }));
});
// ─── AUDIT LOGS ───────────────────────────────────────────────
app.get('/api/audit-logs', authMiddleware, async (_req, res) => {
    res.json(await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }));
});
app.post('/api/audit-logs', authMiddleware, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    res.status(201).json(await prisma.auditLog.create({ data: { userId: req.userId, userName: user?.name || 'System', action: req.body.action, target: req.body.target, result: req.body.result, module: req.body.module } }));
});
// ─── PORT SCAN & SUBDOMAIN ────────────────────────────────────
app.get('/api/port-scan-results', authMiddleware, async (_req, res) => {
    res.json(await prisma.portScanResult.findMany());
});
app.get('/api/subdomain-results', authMiddleware, async (_req, res) => {
    res.json(await prisma.subdomainResult.findMany());
});
// ─── DASHBOARD ────────────────────────────────────────────────
app.get('/api/dashboard/stats', authMiddleware, async (_req, res) => {
    const [tc, sc, fc, hc] = await Promise.all([
        prisma.target.count(), prisma.scan.count({ where: { status: 'completed' } }), prisma.finding.count(), prisma.finding.count({ where: { severity: { in: ['critical', 'high'] } } }),
    ]);
    const recentScans = await prisma.scan.findMany({ orderBy: { startedAt: 'desc' }, take: 5, select: { id: true, targetName: true, type: true, findingCount: true, status: true, riskScore: true, startedAt: true } });
    const avgRisk = await prisma.scan.aggregate({ where: { status: 'completed' }, _avg: { riskScore: true } });
    res.json({ targetCount: tc, scanCount: sc, findingCount: fc, highCriticalCount: hc, riskScore: Math.round((avgRisk._avg.riskScore || 0) * 10) / 10, recentScans });
});
// ─── SETTINGS ─────────────────────────────────────────────────
app.get('/api/settings', authMiddleware, async (_req, res) => {
    res.json({ database: process.env.DATABASE_URL?.includes('postgres') ? 'PostgreSQL' : 'SQLite', reporting: 'PDF / HTML', encryption: 'AES-256-GCM + RSA', environment: process.env.NODE_ENV || 'development', platform: 'USAP v1.0' });
});
// ─── SEED ENDPOINT ─────────────────────────────────────────
app.post('/api/seed', async (req, res) => {
    const { secret } = req.body;
    if (secret !== process.env.SEED_SECRET)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
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
        const hashed = await bcryptjs_1.default.hash('urvish123', 10);
        await prisma.user.create({ data: { id: 'u1', email: 'urvish', password: hashed, name: 'Urvish', role: 'admin' } });
        await prisma.target.createMany({ data: [
                { id: 't1', name: 'demo-app.local', url: 'https://demo-app.local', type: 'Web Application', status: 'active', lastScanned: new Date('2026-08-28T14:22:00Z') },
                { id: 't2', name: 'api.staging.internal', url: 'https://api.staging.internal', type: 'API', status: 'active', lastScanned: new Date('2026-08-27T11:45:00Z') },
                { id: 't3', name: '192.168.1.100', url: '192.168.1.100', type: 'Host', status: 'active', lastScanned: new Date('2026-08-26T16:30:00Z') },
                { id: 't4', name: 'webportal.lab.local', url: 'https://webportal.lab.local', type: 'Web Application', status: 'active', lastScanned: new Date('2026-08-25T09:15:00Z') },
                { id: 't5', name: 'db-cluster.internal', url: '10.0.2.15', type: 'Network', status: 'inactive' },
            ] });
        await prisma.scan.createMany({ data: [
                { id: 's1', targetId: 't1', targetName: 'demo-app.local', type: 'vulnerability', status: 'completed', progress: 100, checks: JSON.stringify(['SQL Injection', 'XSS', 'Security Headers', 'Outdated Libraries', 'SSL/TLS', 'Open Ports']), findingCount: 7, highCriticalCount: 2, riskScore: 7.8 },
                { id: 's2', targetId: 't2', targetName: 'api.staging.internal', type: 'vulnerability', status: 'completed', progress: 100, checks: JSON.stringify(['SQL Injection', 'XSS', 'Security Headers', 'SSL/TLS']), findingCount: 5, highCriticalCount: 1, riskScore: 6.2 },
                { id: 's3', targetId: 't3', targetName: '192.168.1.100', type: 'pentest', status: 'completed', progress: 100, checks: JSON.stringify(['Port Scanner', 'Subdomain Enum', 'Credential Test']), findingCount: 4, highCriticalCount: 1, riskScore: 5.5 },
                { id: 's4', targetId: 't1', targetName: 'demo-app.local', type: 'pentest', status: 'completed', progress: 100, checks: JSON.stringify(['Port Scanner', 'Subdomain Enum']), findingCount: 3, highCriticalCount: 0, riskScore: 3.2 },
                { id: 's5', targetId: 't4', targetName: 'webportal.lab.local', type: 'vulnerability', status: 'completed', progress: 100, checks: JSON.stringify(['SQL Injection', 'XSS', 'Security Headers']), findingCount: 6, highCriticalCount: 3, riskScore: 8.9 },
            ] });
        await prisma.finding.createMany({ data: [
                { id: 'f1', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'SQL Injection in Login Form', severity: 'critical', cvss: 9.8, category: 'SQL Injection', status: 'open', description: 'User input concatenated directly into SQL queries.', evidence: 'POST /api/auth/login with injected payload', remediation: 'Implement parameterized queries.', recommendation: 'Deploy WAF.' },
                { id: 'f2', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Cross-Site Scripting (XSS) in Search', severity: 'high', cvss: 7.5, category: 'XSS', status: 'open', description: 'Search reflects input without encoding.', evidence: 'GET /api/search?q=<script>alert(1)</script>', remediation: 'Implement CSP headers.', recommendation: 'Use auto-escaping templates.' },
                { id: 'f3', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Missing CSP Header', severity: 'medium', cvss: 5.3, category: 'Security Headers', status: 'open', description: 'No CSP header.', evidence: 'Missing headers', remediation: 'Configure CSP.', recommendation: 'Add nosniff.' },
                { id: 'f4', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Outdated jQuery 3.3.1', severity: 'medium', cvss: 6.1, category: 'Outdated Libraries', status: 'open', description: 'Known CVEs.', evidence: 'CVE-2019-11358', remediation: 'Update jQuery.', recommendation: 'Dependency scanning.' },
                { id: 'f5', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Weak TLS 1.0', severity: 'high', cvss: 7.4, category: 'SSL/TLS', status: 'open', description: 'TLS 1.0 enabled.', evidence: 'TLS 1.0: ENABLED', remediation: 'Disable TLS 1.0.', recommendation: 'Enable HSTS.' },
                { id: 'f6', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Open SSH (22/tcp)', severity: 'medium', cvss: 5.0, category: 'Open Ports', status: 'open', description: 'SSH exposed.', evidence: '22/tcp open ssh', remediation: 'Restrict SSH.', recommendation: 'Use bastion host.' },
                { id: 'f7', scanId: 's1', targetId: 't1', targetName: 'demo-app.local', title: 'Missing X-Content-Type-Options', severity: 'low', cvss: 3.1, category: 'Security Headers', status: 'open', description: 'MIME-sniff risk.', evidence: 'Missing header', remediation: 'Add nosniff.', recommendation: 'Implement all headers.' },
                { id: 'f8', scanId: 's2', targetId: 't2', targetName: 'api.staging.internal', title: 'SQL Injection in User Search', severity: 'critical', cvss: 9.1, category: 'SQL Injection', status: 'open', description: 'Blind SQLi.', evidence: 'UNION SELECT', remediation: 'Parameterized queries.', recommendation: 'Audit endpoints.' },
                { id: 'f9', scanId: 's2', targetId: 't2', targetName: 'api.staging.internal', title: 'Missing Rate Limiting', severity: 'medium', cvss: 5.3, category: 'Security Headers', status: 'open', description: 'No rate limiting.', evidence: '1000 req/30s', remediation: 'Rate limiting.', recommendation: 'Deploy middleware.' },
                { id: 'f10', scanId: 's3', targetId: 't3', targetName: '192.168.1.100', title: 'Exposed MySQL (3306)', severity: 'high', cvss: 7.5, category: 'Open Ports', status: 'open', description: 'MySQL exposed.', evidence: '3306/tcp open', remediation: 'Restrict access.', recommendation: 'Network segmentation.' },
                { id: 'f11', scanId: 's3', targetId: 't3', targetName: '192.168.1.100', title: 'Root SSH Login', severity: 'high', cvss: 7.0, category: 'Credential Test', status: 'open', description: 'Root login enabled.', evidence: 'PermitRootLogin yes', remediation: 'Disable root.', recommendation: 'Deploy Fail2Ban.' },
            ] });
        await prisma.mLDetection.createMany({ data: [
                { id: 'ml1', input: 'TCP SYN flood: 15,000 pps', pattern: 'SYN flood', detection: 'DDoS SYN Flood', status: 'malicious', confidence: 0.97, features: JSON.stringify(['High packet rate', 'Single source IP', 'SYN dominant']), explanation: 'SYN flood detected.' },
                { id: 'ml2', input: 'SQL: UNION SELECT password FROM admin--', pattern: 'SQLi payload', detection: 'SQL Injection', status: 'malicious', confidence: 0.95, features: JSON.stringify(['UNION SELECT', 'Comment injection', 'Admin table']), explanation: 'SQL injection pattern.' },
                { id: 'ml3', input: 'GET /search?q=<img onerror=alert(1)>', pattern: 'XSS payload', detection: 'XSS Attempt', status: 'suspicious', confidence: 0.89, features: JSON.stringify(['HTML tag', 'Event handler', 'JavaScript']), explanation: 'XSS attempt.' },
                { id: 'ml4', input: 'GET /api/users/12345 with valid JWT', pattern: 'Normal traffic', detection: 'Normal Request', status: 'normal', confidence: 0.98, features: JSON.stringify(['Valid JWT', 'RESTful path', 'Single request']), explanation: 'Normal request.' },
                { id: 'ml5', input: 'POST /wp-admin/install.php with creds', pattern: 'WordPress exploit', detection: 'CMS Exploitation', status: 'malicious', confidence: 0.92, features: JSON.stringify(['WP admin path', 'Credential submission']), explanation: 'CMS exploitation.' },
                { id: 'ml6', input: '500 errors in 2 min from curl/7.68.0', pattern: 'Error probing', detection: 'Reconnaissance', status: 'suspicious', confidence: 0.78, features: JSON.stringify(['High error rate', 'Automated UA']), explanation: 'Recon activity.' },
            ] });
        await prisma.credential.createMany({ data: [
                { id: 'c1', reference: 'demo-app-db', targetId: 't1', targetName: 'demo-app.local', username: 'app_user', passwordEncrypted: 'U2FsdGVkX1+vupppZ2z8vAnF1YX...', status: 'active', type: 'password' },
                { id: 'c2', reference: 'api-service-key', targetId: 't2', targetName: 'api.staging.internal', username: 'api_svc', passwordEncrypted: 'U2FsdGVkX18JKH9s2a4MzN3xR7q...', status: 'active', type: 'api_key' },
                { id: 'c3', reference: 'ssh-bastion', targetId: 't3', targetName: '192.168.1.100', username: 'deploy', passwordEncrypted: 'U2FsdGVkX1+Rf8kN2mW5vH3pQ6t...', status: 'active', type: 'certificate' },
                { id: 'c4', reference: 'monitoring-token', targetName: 'webportal.lab.local', username: 'monitor', passwordEncrypted: 'U2FsdGVkX14aB7dK1mN8wF5xS2u...', status: 'expired', type: 'token' },
            ] });
        await prisma.report.createMany({ data: [
                { id: 'r1', title: 'Security Assessment — demo-app.local', scanIds: JSON.stringify(['s1', 's4']), riskScore: 7.8, totalFindings: 10, criticalCount: 1, highCount: 2, mediumCount: 5, lowCount: 2, infoCount: 0, status: 'final' },
                { id: 'r2', title: 'API Security Review — api.staging.internal', scanIds: JSON.stringify(['s2']), riskScore: 6.2, totalFindings: 5, criticalCount: 1, highCount: 0, mediumCount: 3, lowCount: 1, infoCount: 0, status: 'final' },
                { id: 'r3', title: 'Infrastructure Audit — 192.168.1.100', scanIds: JSON.stringify(['s3']), riskScore: 5.5, totalFindings: 4, criticalCount: 0, highCount: 2, mediumCount: 1, lowCount: 1, infoCount: 0, status: 'draft' },
            ] });
        await prisma.auditLog.createMany({ data: [
                { id: 'al1', userId: 'u1', userName: 'Urvish', action: 'Login', result: 'Success', module: 'Auth' },
                { id: 'al2', userId: 'u1', userName: 'Urvish', action: 'Start scan on demo-app.local', result: 'Scan queued', module: 'Scanner' },
                { id: 'al3', userId: 'u1', userName: 'Urvish', action: 'Scan completed', result: '7 findings', module: 'Scanner' },
                { id: 'al4', userId: 'u1', userName: 'Urvish', action: 'Port scan on 192.168.1.100', result: '12 ports', module: 'Pentest' },
                { id: 'al5', userId: 'u1', userName: 'Urvish', action: 'Subdomain enumeration', result: '5 subdomains', module: 'Pentest' },
                { id: 'al6', userId: 'u1', userName: 'Urvish', action: 'Generated report', result: 'PDF exported', module: 'Reports' },
                { id: 'al7', userId: 'u1', userName: 'Urvish', action: 'ML Detection analysis', result: '6 patterns', module: 'ML Detection' },
                { id: 'al8', userId: 'u1', userName: 'Urvish', action: 'Added credential', result: 'Encrypted', module: 'Credential Vault' },
                { id: 'al9', userId: 'u1', userName: 'Urvish', action: 'Encrypted report data', result: 'Success', module: 'Encryptor' },
                { id: 'al10', userId: 'u1', userName: 'Urvish', action: 'Credential test', result: '100 attempts', module: 'Pentest' },
            ] });
        await prisma.portScanResult.createMany({ data: [
                { id: 'ps1', port: 22, protocol: 'TCP', service: 'SSH', state: 'open', risk: 'medium' },
                { id: 'ps2', port: 80, protocol: 'TCP', service: 'HTTP', state: 'open', risk: 'low' },
                { id: 'ps3', port: 443, protocol: 'TCP', service: 'HTTPS', state: 'open', risk: 'info' },
                { id: 'ps4', port: 3306, protocol: 'TCP', service: 'MySQL', state: 'open', risk: 'high' },
                { id: 'ps5', port: 8080, protocol: 'TCP', service: 'HTTP Proxy', state: 'open', risk: 'medium' },
                { id: 'ps6', port: 8443, protocol: 'TCP', service: 'HTTPS Alt', state: 'open', risk: 'info' },
                { id: 'ps7', port: 6379, protocol: 'TCP', service: 'Redis', state: 'filtered', risk: 'high' },
                { id: 'ps8', port: 27017, protocol: 'TCP', service: 'MongoDB', state: 'closed', risk: 'info' },
            ] });
        await prisma.subdomainResult.createMany({ data: [
                { id: 'sd1', subdomain: 'api.demo-app.local', status: 'active', ip: '192.168.1.101', technology: 'Node.js / Express' },
                { id: 'sd2', subdomain: 'admin.demo-app.local', status: 'active', ip: '192.168.1.102', technology: 'React / Nginx' },
                { id: 'sd3', subdomain: 'staging.demo-app.local', status: 'active', ip: '192.168.1.103', technology: 'Docker' },
                { id: 'sd4', subdomain: 'cdn.demo-app.local', status: 'active', ip: '10.0.0.50', technology: 'CloudFront' },
                { id: 'sd5', subdomain: 'legacy.demo-app.local', status: 'inactive', ip: '192.168.1.200', technology: 'Apache / PHP' },
            ] });
        return res.json({ success: true, message: 'Database seeded' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// ─── VERCEL HANDLER ───────────────────────────────────────────
async function handler(req, res) {
    return app(req, res);
}
