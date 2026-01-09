# Expense Splitter

A type-safe expense splitting application built with the most LLM-friendly TypeScript stack.

## Stack

- **Runtime**: Bun (runs TypeScript natively, no build step)
- **Frontend**: React 19 + Vite + Tailwind CSS + TanStack Query
- **Backend**: Express + Prisma + PostgreSQL
- **Type Safety**: Zod schemas + Prisma auto-generated types

See [STACK.md](./STACK.md) for detailed architecture documentation.

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Podman](https://podman.io) or [Docker](https://docker.com)
- PostgreSQL 16 (via Podman/Docker)

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Start the Database

```bash
bun run db:start
```

This starts a PostgreSQL 16 container using Podman.

### 3. Run Database Migrations

```bash
bun run prisma:migrate
```

This creates all the database tables from your Prisma schema.

### 4. Start the Development Servers

**Option A: Run both frontend and backend together**
```bash
bun run dev
```

**Option B: Run them separately**

In one terminal:
```bash
bun run server
```

In another terminal:
```bash
bun run client
```

### 5. Open the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## Available Scripts

### Development
- `bun run dev` - Run both frontend and backend concurrently
- `bun run server` - Run Express backend only (hot reload enabled)
- `bun run client` - Run Vite dev server only
- `bun run build` - Build frontend for production
- `bun run preview` - Preview production build locally

### Database
- `bun run db:start` - Start PostgreSQL container
- `bun run db:stop` - Stop and remove PostgreSQL container
- `bun run prisma:migrate` - Run database migrations
- `bun run prisma:generate` - Regenerate Prisma Client types
- `bun run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
expense-splitter/
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   └── migrations/            # Auto-generated SQL migrations
│
├── src/
│   ├── server/
│   │   ├── index.ts           # Express app entry
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Auth, validation middleware
│   │   └── lib/               # Server utilities
│   │
│   ├── client/
│   │   ├── main.tsx           # React entry point
│   │   ├── App.tsx            # Router setup
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/               # API client, utilities
│   │
│   └── shared/
│       ├── schemas/           # Zod validation schemas
│       └── types/             # Shared TypeScript types
│
├── public/                    # Static assets
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS config
└── tsconfig.json              # TypeScript config
```

## Database Schema

The app uses Prisma ORM with the following models:

- **User**: User accounts with authentication
- **Group**: Expense groups with unique invite codes
- **GroupMembership**: Many-to-many relationship between users and groups
- **Expense**: Individual expenses with amount and fee tracking
- **ExpenseSplit**: How each expense is split among group members

See `prisma/schema.prisma` for the full schema definition.

## Environment Variables

Copy `.env` to configure your environment:

```bash
POSTGRES_PASSWORD=postgres
POSTGRES_DB=expense_splitter
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expense_splitter
```

## Type Safety Features

### Database → Backend
1. Edit `prisma/schema.prisma`
2. Run `bun run prisma:migrate`
3. TypeScript types auto-generated in `@prisma/client`

### Backend → Frontend
1. Define Zod schemas in `src/shared/schemas/`
2. Export inferred types: `z.infer<typeof schema>`
3. Use types in TanStack Query hooks

### End-to-End Type Safety
```typescript
// 1. Prisma schema defines DB structure
// 2. Prisma generates TypeScript types
// 3. Zod schemas validate API I/O
// 4. TanStack Query uses typed API client
// 5. React components get fully typed data
```

## Development Tips

### Adding a New Feature
1. Update Prisma schema if needed
2. Run migrations: `bun run prisma:migrate`
3. Create Zod schemas in `src/shared/schemas/`
4. Build Express routes with validation
5. Create React Query hooks
6. Build UI components

### Viewing the Database
```bash
bun run prisma:studio
```
Opens a web UI at http://localhost:5555 to browse your database.

### Hot Reload
- Backend: Bun's `--watch` flag auto-restarts on file changes
- Frontend: Vite's HMR updates instantly

## Deployment

### Building for Production
```bash
bun run build
```

### Running in Production
1. Start PostgreSQL
2. Run migrations: `bun run prisma:migrate`
3. Serve built frontend from Express
4. Run: `bun run src/server/index.ts`

## Troubleshooting

### Database Connection Fails
```bash
# Check if database is running
podman ps

# Start database if not running
bun run db:start

# Check connection
curl http://localhost:3000/api/db-test
```

### Prisma Client Not Found
```bash
# Regenerate Prisma Client
bun run prisma:generate
```

### Port Already in Use
- Backend uses port 3000
- Frontend dev server uses port 5173
- Database uses port 5432

Kill processes or change ports in config files.

## Features

- ✅ User authentication with JWT
- ✅ Create and join expense groups
- ✅ Split expenses (fixed amount, percentage, even split)
- ✅ Track who paid and who owes
- ✅ Fee distribution (tax, tips)
- ✅ Real-time balance calculations
- 🚧 Receipt OCR (planned)
- 🚧 Automatic reminders (planned)

## Why This Stack?

- **Bun**: Fast, runs TypeScript natively, no build complexity
- **Prisma**: Best-in-class ORM with auto-generated types
- **Express**: Most documented, LLM-friendly framework
- **React + TanStack Query**: Standard patterns, great docs
- **Tailwind**: Utility-first CSS, easy for LLMs to generate
- **Zod**: Runtime validation + compile-time types

Built for type safety lovers and Python devs who want a simple, powerful TypeScript stack.
