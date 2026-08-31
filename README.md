# USAP — Unified Security Assessment Platform

A professional cybersecurity SaaS platform combining vulnerability scanning, penetration testing, encryption/decryption, ML-assisted detection, credential management, and comprehensive reporting.

## Features

- **Authentication & RBAC** — Admin, Pentester, Viewer roles with JWT tokens
- **Security Overview Dashboard** — Real-time metrics, risk scores, and recent activity
- **Target Management** — Add, manage, and track authorized lab/test targets
- **Vulnerability Scanner** — Automated checks for SQLi, XSS, security headers, outdated libraries, SSL/TLS, open ports
- **Pentest Toolkit** — Port/service scanner, subdomain enumeration, controlled credential testing
- **ML Detection** — Anomaly detection on traffic/logs using pattern analysis
- **Encryptor/Decryptor** — AES-256-GCM encryption with RSA key exchange
- **Credential Vault** — Secure encrypted storage of credentials for authorized testing
- **Reports & Risk** — Consolidated findings with risk scores, CVSS, and export (PDF/HTML)
- **Scan History** — Complete audit trail of all assessments
- **Settings & Role Management** — User management and system configuration

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Development

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Set up database
npm run db:push
npm run db:seed

# 3. Start both server and frontend
npm run dev          # Frontend on http://localhost:3000
npm run dev:server   # Backend on http://localhost:3001
```

Or run both concurrently (requires `concurrently`):
```bash
npx concurrently "npm run dev:server" "npm run dev"
```

### Login Credentials

| Username  | Password     | Role      |
|-----------|-------------|-----------|
| urvish    | urvish123   | Admin     |
| pentester | urvish123   | Pentester |
| viewer    | urvish123   | Viewer    |

### Production Build

```bash
# Build frontend
npm run build

# Build server (optional — for compiled JS output)
npm run build:server

# Start server (serves built frontend + API)
cd server
node dist/index.js
```

## Architecture

```
usap/
├── src/                    # React frontend (Vite + TypeScript + Tailwind)
│   ├── api/client.ts       # API client with JWT auth
│   ├── context/            # React context for global state
│   ├── components/         # Layout and Sidebar
│   ├── pages/              # All 13 wireframe screens
│   ├── data/               # Seed data
│   └── types.ts            # TypeScript interfaces
├── server/                 # Express API server
│   └── src/
│       ├── index.ts        # All API routes
│       └── seed.ts         # Database seed script
├── prisma/                 # Prisma schema and SQLite database
│   └── schema.prisma       # Database models
├── vite.config.ts          # Vite config with API proxy
└── package.json
```

## Database

### Local Development (SQLite)
Uses SQLite by default — no database server required.

```bash
npm run db:push    # Apply schema
npm run db:seed    # Load demo data
npm run db:reset   # Reset + reseed
```

### Production (PostgreSQL)
Update `server/.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/usap
```

Update `server/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then re-run `db:push` and `db:seed`.

## Environment Variables

### Frontend (.env)
| Variable | Description | Default |
|----------|------------|---------|
| VITE_API_URL | Backend API URL (empty = same origin) | `""` |
| VITE_ENCRYPTION_KEY | Encryption key for client-side crypto | `USAP-DEMO-KEY-2026-SECURE` |

### Backend (server/.env)
| Variable | Description | Default |
|----------|------------|---------|
| DATABASE_URL | Database connection string | `file:../prisma/dev.db` |
| PORT | Server port | `3001` |
| JWT_SECRET | JWT signing secret | `usap-dev-secret-...` |
| NODE_ENV | Environment mode | `development` |

## Deployment

### Vercel (Serverless)
The project includes `vercel.json` for Vercel deployment.

### Docker
```bash
docker build -t usap .
docker run -p 3001:3001 -e DATABASE_URL="postgresql://..." usap
```

### Railway / Render
1. Set environment variables in the dashboard
2. Connect your PostgreSQL database
3. Run `npm run db:push && npm run db:seed`
4. Start with `node server/dist/index.js`

## Security Notes

- All scanning is simulated/controlled — designed for authorized lab environments
- Credentials are encrypted before storage (AES-256-GCM simulation)
- JWT tokens expire after 24 hours
- Role-based access: Viewer (read-only), Pentester (assessment tools), Admin (full access)
- Never deploy with default JWT secrets or encryption keys
