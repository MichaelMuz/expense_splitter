# Expense Splitter

Split expenses with friends. Type-safe, self-hosted.

## Tech Stack

Bun + Express + Prisma + PostgreSQL + React + Tailwind

## Quick Start

```bash
bun install
bun run db:start              # Start PostgreSQL
bun run prisma:migrate        # Create database tables
bun run dev                   # Start frontend + backend
```

Frontend: http://localhost:5173
Backend: http://localhost:3000/api

## Scripts

- `bun run dev` - Run both servers
- `bun run server` - Backend only
- `bun run client` - Frontend only
- `bun run prisma:studio` - Database GUI
