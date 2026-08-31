import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.USAP_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'usap-dev-secret-change-in-production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
}

// ─── Auth Middleware ───────────────────────────────────────────
interface AuthRequest extends express.Request {
  userId?: string;
  userRole?: string;
}

function authMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role-based access middleware
function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// ─── AUTH ROUTES ──────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await prisma.user.findFirst({
      where: { email: username },
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── USERS ROUTES ─────────────────────────────────────────────
app.get('/api/users', authMiddleware, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.patch('/api/users/:id/role', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'pentester', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ─── TARGETS ROUTES ───────────────────────────────────────────
app.get('/api/targets', authMiddleware, async (_req, res) => {
  try {
    const targets = await prisma.target.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(targets);
  } catch {
    res.status(500).json({ error: 'Failed to fetch targets' });
  }
});

app.post('/api/targets', authMiddleware, requireRole('admin', 'pentester'), async (req, res) => {
  try {
    const { name, url, type, status } = req.body;
    const target = await prisma.target.create({
      data: { name, url, type, status: status || 'active' },
    });
    res.status(201).json(target);
  } catch {
    res.status(500).json({ error: 'Failed to create target' });
  }
});

app.delete('/api/targets/:id', authMiddleware, requireRole('admin', 'pentester'), async (req, res) => {
  try {
    await prisma.target.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete target' });
  }
});

// ─── SCANS ROUTES ─────────────────────────────────────────────
app.get('/api/scans', authMiddleware, async (_req, res) => {
  try {
    const scans = await prisma.scan.findMany({ orderBy: { startedAt: 'desc' } });
    res.json(scans.map(s => ({ ...s, checks: typeof s.checks === 'string' ? JSON.parse(s.checks) : s.checks })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

app.get('/api/scans/:id', authMiddleware, async (req, res) => {
  try {
    const scan = await prisma.scan.findUnique({ where: { id: req.params.id } });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ ...scan, checks: typeof scan.checks === 'string' ? JSON.parse(scan.checks) : scan.checks });
  } catch {
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});

app.post('/api/scans', authMiddleware, requireRole('admin', 'pentester'), async (req: AuthRequest, res) => {
  try {
    const { targetId, checks } = req.body;
    const target = await prisma.target.findUnique({ where: { id: targetId } });
    if (!target) return res.status(404).json({ error: 'Target not found' });

    const scan = await prisma.scan.create({
      data: {
        targetId,
        targetName: target.name,
        type: 'vulnerability',
        status: 'running',
        checks: JSON.stringify(checks || []),
        progress: 0,
      },
    });

    // Simulate scan progress asynchronously
    simulateScan(scan.id, target, checks || []);

    res.status(201).json({ ...scan, checks: typeof scan.checks === 'string' ? JSON.parse(scan.checks) : scan.checks });
  } catch {
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

async function simulateScan(scanId: string, target: any, checks: string[]) {
  try {
    const progressSteps = [10, 25, 40, 55, 70, 85, 95, 100];

    for (const progress of progressSteps) {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
      await prisma.scan.update({
        where: { id: scanId },
        data: { progress },
      });
    }

    const findingTemplates: Record<string, any[]> = {
      'SQL Injection': [
        { title: 'SQL Injection in Login Form', severity: 'critical', cvss: 9.8, category: 'SQL Injection', description: 'User input is concatenated directly into SQL queries without parameterization.', evidence: 'POST /api/auth/login\n{"username": "admin\' OR 1=1--"}\n\nResponse: 200 OK with valid JWT token.', remediation: 'Implement parameterized queries (prepared statements). Use an ORM that automatically escapes user input.', recommendation: 'Deploy WAF as defense layer. Conduct full code review of database query construction.' },
      ],
      'XSS': [
        { title: 'Cross-Site Scripting (XSS) in Search', severity: 'high', cvss: 7.5, category: 'XSS', description: 'Search endpoint reflects user input in HTML response without output encoding.', evidence: 'GET /api/search?q=<script>alert(document.cookie)</script>\n\nHTML response includes unescaped script tag.', remediation: 'Implement CSP headers. Encode all user input using HTML entity encoding before rendering.', recommendation: 'Use auto-escaping templates. Validate inputs on client and server side.' },
      ],
      'Security Headers': [
        { title: 'Missing Content-Security-Policy Header', severity: 'medium', cvss: 5.3, category: 'Security Headers', description: 'Application does not set CSP header, allowing inline script execution.', evidence: 'Missing headers: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options', remediation: "Configure web server to return CSP header. Start with default-src 'self'.", recommendation: 'Add X-Content-Type-Options: nosniff and X-Frame-Options: DENY.' },
        { title: 'Missing X-Content-Type-Options Header', severity: 'low', cvss: 3.1, category: 'Security Headers', description: 'Browser may MIME-sniff responses without this header.', evidence: 'HTTP response missing: X-Content-Type-Options: nosniff', remediation: 'Add "X-Content-Type-Options: nosniff" to all HTTP responses.', recommendation: 'Implement all recommended security headers.' },
      ],
      'Outdated JavaScript Libraries': [
        { title: 'Outdated JavaScript Library: jQuery 3.3.1', severity: 'medium', cvss: 6.1, category: 'Outdated Libraries', description: 'jQuery 3.3.1 has known CVEs including prototype pollution.', evidence: 'CVE-2019-11358: Object.prototype pollution\nCVE-2020-11022: XSS via HTML manipulation', remediation: 'Update jQuery to 3.7.1+ or migrate to modern framework.', recommendation: 'Implement automated dependency scanning with Dependabot or Snyk.' },
      ],
      'SSL/TLS Configuration': [
        { title: 'Weak SSL/TLS: TLS 1.0 Enabled', severity: 'high', cvss: 7.4, category: 'SSL/TLS Configuration', description: 'Server accepts deprecated TLS 1.0, vulnerable to BEAST/POODLE.', evidence: 'TLS 1.0: ENABLED\nTLS 1.1: ENABLED\nWeak cipher suites detected', remediation: 'Disable TLS 1.0/1.1. Accept only TLS 1.2+ connections.', recommendation: 'Use Mozilla SSL Configuration Generator. Enable HSTS.' },
      ],
      'Open Ports': [
        { title: 'Open SSH Port Exposed (22/tcp)', severity: 'medium', cvss: 5.0, category: 'Open Ports', description: 'SSH accessible from external networks with known vulnerabilities.', evidence: '22/tcp open ssh OpenSSH 8.2\nKnown CVEs: CVE-2021-28041, CVE-2021-41617', remediation: 'Restrict SSH to known IPs. Use key-based auth only.', recommendation: 'Use bastion host or VPN for admin access.' },
      ],
    };

    const numFindings = Math.floor(Math.random() * 4) + 3;
    const selectedChecks = checks.length > 0 ? checks : Object.keys(findingTemplates);

    const newFindings: any[] = [];
    for (let i = 0; i < numFindings; i++) {
      const cat = selectedChecks[Math.floor(Math.random() * selectedChecks.length)];
      const templates = findingTemplates[cat] || [{ title: `${cat} issue detected`, severity: 'medium', cvss: 5.0, category: cat, description: `A ${cat} issue was detected.`, evidence: 'Scan analysis output.', remediation: `Address the ${cat} issue.`, recommendation: `Implement ${cat} best practices.` }];
      const template = templates[0];

      newFindings.push({
        scanId,
        targetId: target.id,
        targetName: target.name,
        title: template.title,
        severity: template.severity,
        cvss: template.cvss,
        category: template.category || cat,
        status: 'open',
        description: template.description,
        evidence: template.evidence,
        remediation: template.remediation,
        recommendation: template.recommendation,
      });
    }

    if (newFindings.length > 0) {
      await prisma.finding.createMany({ data: newFindings });
    }

    const highCritical = newFindings.filter(f => f.severity === 'critical' || f.severity === 'high').length;
    const riskScore = Math.min(10, (newFindings.length * 1.5) + (highCritical * 2));

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        findingCount: newFindings.length,
        highCriticalCount: highCritical,
        riskScore: Math.round(riskScore * 10) / 10,
      },
    });

    await prisma.target.update({
      where: { id: target.id },
      data: { lastScanned: new Date() },
    });
  } catch (err) {
    console.error('simulateScan error:', err);
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'failed', progress: 0 },
    }).catch(() => {});
  }
}

// ─── FINDINGS ROUTES ──────────────────────────────────────────
app.get('/api/findings', authMiddleware, async (req, res) => {
  try {
    const { scanId, targetId, severity } = req.query;
    const where: any = {};
    if (scanId) where.scanId = scanId;
    if (targetId) where.targetId = targetId;
    if (severity) where.severity = severity;

    const findings = await prisma.finding.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
    });
    res.json(findings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

app.get('/api/findings/:id', authMiddleware, async (req, res) => {
  try {
    const finding = await prisma.finding.findUnique({ where: { id: req.params.id } });
    if (!finding) return res.status(404).json({ error: 'Finding not found' });
    res.json(finding);
  } catch {
    res.status(500).json({ error: 'Failed to fetch finding' });
  }
});

app.patch('/api/findings/:id', authMiddleware, requireRole('admin', 'pentester'), async (req, res) => {
  try {
    const { status } = req.body;
    const finding = await prisma.finding.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(finding);
  } catch {
    res.status(500).json({ error: 'Failed to update finding' });
  }
});

// ─── ML DETECTIONS ROUTES ─────────────────────────────────────
app.get('/api/ml-detections', authMiddleware, async (_req, res) => {
  try {
    const detections = await prisma.mLDetection.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(detections.map(d => ({ ...d, features: typeof d.features === 'string' ? JSON.parse(d.features) : d.features })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch ML detections' });
  }
});

app.post('/api/ml-detections', authMiddleware, requireRole('admin', 'pentester'), async (req, res) => {
  try {
    const { input, pattern, detection, status, confidence, features, explanation } = req.body;
    const mlDetection = await prisma.mLDetection.create({
      data: { input, pattern, detection, status, confidence, features: JSON.stringify(features || []), explanation },
    });
    res.status(201).json({ ...mlDetection, features: features || [] });
  } catch {
    res.status(500).json({ error: 'Failed to create ML detection' });
  }
});

// ─── CREDENTIALS ROUTES ───────────────────────────────────────
app.get('/api/credentials', authMiddleware, async (_req, res) => {
  try {
    const credentials = await prisma.credential.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(credentials);
  } catch {
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

app.post('/api/credentials', authMiddleware, requireRole('admin', 'pentester'), async (req, res) => {
  try {
    const { reference, targetId, targetName, username, password, status, type } = req.body;
    const passwordEncrypted = 'U2FsdGVkX1+' + Buffer.from(password).toString('base64').substring(0, 30) + '...';

    const credential = await prisma.credential.create({
      data: {
        reference,
        targetId: targetId || null,
        targetName,
        username,
        passwordEncrypted,
        status: status || 'active',
        type: type || 'password',
      },
    });
    res.status(201).json(credential);
  } catch {
    res.status(500).json({ error: 'Failed to create credential' });
  }
});

app.delete('/api/credentials/:id', authMiddleware, requireRole('admin', 'pentester'), async (req, res) => {
  try {
    await prisma.credential.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

// ─── REPORTS ROUTES ───────────────────────────────────────────
app.get('/api/reports', authMiddleware, async (_req, res) => {
  try {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(reports.map(r => ({ ...r, scanIds: typeof r.scanIds === 'string' ? JSON.parse(r.scanIds) : r.scanIds })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.post('/api/reports', authMiddleware, requireRole('admin', 'pentester'), async (req, res) => {
  try {
    const { scanIds } = req.body;

    const scans = await prisma.scan.findMany({ where: { id: { in: scanIds } } });
    const findings = await prisma.finding.findMany({ where: { scanId: { in: scanIds } } });

    const report = await prisma.report.create({
      data: {
        title: `Security Assessment — ${scans[0]?.targetName || 'Multiple Targets'}`,
        scanIds: JSON.stringify(scanIds),
        riskScore: scans.reduce((max, s) => Math.max(max, s.riskScore), 0),
        totalFindings: findings.length,
        criticalCount: findings.filter(f => f.severity === 'critical').length,
        highCount: findings.filter(f => f.severity === 'high').length,
        mediumCount: findings.filter(f => f.severity === 'medium').length,
        lowCount: findings.filter(f => f.severity === 'low').length,
        infoCount: findings.filter(f => f.severity === 'info').length,
        status: 'draft',
      },
    });

    for (const scanId of scanIds) {
      await prisma.report.update({
        where: { id: report.id },
        data: { scans: { connect: { id: scanId } } },
      });
    }

    res.status(201).json(report);
  } catch {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.patch('/api/reports/:id', authMiddleware, requireRole('admin', 'pentester'), async (req, res) => {
  try {
    const { status } = req.body;
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status, exportedAt: status === 'final' ? new Date() : undefined },
    });
    res.json(report);
  } catch {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// ─── AUDIT LOGS ROUTES ────────────────────────────────────────
app.get('/api/audit-logs', authMiddleware, async (_req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

app.post('/api/audit-logs', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const log = await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        userName: user?.name || 'System',
        action: req.body.action,
        target: req.body.target,
        result: req.body.result,
        module: req.body.module,
      },
    });
    res.status(201).json(log);
  } catch {
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// ─── PORT SCAN & SUBDOMAIN RESULTS ────────────────────────────
app.get('/api/port-scan-results', authMiddleware, async (_req, res) => {
  try {
    const results = await prisma.portScanResult.findMany();
    res.json(results);
  } catch {
    res.status(500).json({ error: 'Failed to fetch port scan results' });
  }
});

app.get('/api/subdomain-results', authMiddleware, async (_req, res) => {
  try {
    const results = await prisma.subdomainResult.findMany();
    res.json(results);
  } catch {
    res.status(500).json({ error: 'Failed to fetch subdomain results' });
  }
});

// ─── DASHBOARD STATS ──────────────────────────────────────────
app.get('/api/dashboard/stats', authMiddleware, async (_req, res) => {
  try {
    const [targetCount, scanCount, findingCount, highCriticalCount] = await Promise.all([
      prisma.target.count(),
      prisma.scan.count({ where: { status: 'completed' } }),
      prisma.finding.count(),
      prisma.finding.count({ where: { severity: { in: ['critical', 'high'] } } }),
    ]);

    const recentScans = await prisma.scan.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        targetName: true,
        type: true,
        findingCount: true,
        status: true,
        riskScore: true,
        startedAt: true,
      },
    });

    const avgRisk = await prisma.scan.aggregate({
      where: { status: 'completed' },
      _avg: { riskScore: true },
    });

    res.json({
      targetCount,
      scanCount,
      findingCount,
      highCriticalCount,
      riskScore: Math.round((avgRisk._avg.riskScore || 0) * 10) / 10,
      recentScans,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ─── SETTINGS ─────────────────────────────────────────────────
app.get('/api/settings', authMiddleware, async (_req, res) => {
  res.json({
    database: 'SQLite (local) / PostgreSQL (production)',
    reporting: 'PDF / HTML',
    encryption: 'AES-256-GCM + RSA',
    environment: process.env.NODE_ENV || 'development',
    platform: 'USAP v1.0',
  });
});

// ─── SPA FALLBACK ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 USAP API server running on http://localhost:${PORT}`);
});
