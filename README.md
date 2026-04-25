# Multi-Tenant File Protocol SaaS

A Next.js + TypeScript application that provides a unified interface for SFTP, FTP, and SMB connections using the Strategy pattern.

## Features

- Strategy-based protocol abstraction via `FileSystemProvider`
- Protocol implementations for SFTP, FTP, and SMB
- AES-256-GCM encryption for stored connection passwords
- NextAuth credentials authentication with RBAC (`admin`, `member`)
- Protocol-agnostic REST APIs for connection management and file operations
- Audit logging for successful file operations
- Fully containerized setup with Docker Compose

## Quick Start

1. Copy `.env.example` to `.env`.
2. Fill in `ENCRYPTION_KEY` and `NEXTAUTH_SECRET`:

```bash
openssl rand -hex 32
```

3. Start all services:

```bash
docker-compose up --build
```

4. Open http://localhost:3000

## Test Credentials

Credentials are also available in `submission.json`:

- Admin: `admin@example.com` / `adminpass123`
- Member: `member@example.com` / `memberpass123`

## Architecture

- `src/lib/FileSystemProvider.ts`: Common provider interface
- `src/lib/providers/*.ts`: Concrete protocol strategies
- `src/lib/providers/ProviderFactory.ts`: Factory for provider selection
- `src/lib/repositories/*.ts`: Data access layer
- `src/app/api/*`: Protocol-agnostic API routes

## API Endpoints

- `POST /api/connections`
- `GET /api/connections`
- `POST /api/connections/test`
- `GET /api/fs/list?connectionId=<id>&path=/`
- `GET /api/fs/download?connectionId=<id>&path=/file.txt`
- `GET /api/audit` (admin only)
- `GET /api/health`

## Database

Tables created automatically on startup:

- `users`
- `connections`
- `audit_log`

Seeding runs on startup and creates admin/member users and sample connections.

## Security Notes

- Connection passwords are encrypted with AES-256-GCM before insert.
- Plaintext connection passwords are never persisted.
- Unified error mapping prevents protocol-specific errors from leaking.
- Paths are validated to prevent basic traversal attempts.
