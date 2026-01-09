# Expense Splitter - Tech Stack

## Philosophy
- **Type Safety First**: End-to-end type safety from database to UI
- **LLM-Friendly**: Popular, well-documented technologies with lots of examples
- **Python Dev Friendly**: Familiar patterns, minimal JavaScript complexity
- **Bun-Powered**: No compilation, fast, simple

## Stack Overview

### Runtime & Package Manager
- **Bun** - Fast JavaScript runtime that runs TypeScript natively
  - No build step needed for development
  - Built-in package manager
  - Handles TypeScript without configuration

### Database
- **PostgreSQL** - Battle-tested relational database
- **Prisma** - Modern ORM with amazing type safety
  - Auto-generates TypeScript types from schema
  - Migration system built-in
  - Prisma Studio for database GUI

### Backend
- **Express** - Most popular Node.js framework
  - Like Flask but for TypeScript
  - Massive ecosystem
  - Most documented in LLM training data
- **Zod** - TypeScript-first schema validation
  - Runtime validation + compile-time types
  - Perfect for API input/output validation
  - Shares types with frontend
- **JWT** - Simple token-based authentication

### Frontend
- **React 19** - Most popular UI framework
  - Excellent LLM support
  - Huge ecosystem
- **Vite** - Fast build tool optimized for modern web
  - Works perfectly with Bun
- **TanStack Query (React Query)** - Industry standard data fetching
  - Handles caching, loading states, refetching
  - Type-safe API calls
- **React Router** - Standard routing solution
- **Tailwind CSS** - Utility-first CSS framework
  - Easy to generate with LLMs
  - No CSS files needed
  - Responsive by default

## Type Safety Architecture

```
Database Schema (Prisma)
    ↓ (auto-generates)
TypeScript Types
    ↓ (used by)
Zod Schemas (API validation)
    ↓ (shared with)
Frontend Types
    ↓ (validated by)
TanStack Query (type-safe fetching)
```

### Type Flow Example
1. Define database schema in `prisma/schema.prisma`
2. Prisma auto-generates TypeScript types
3. Create Zod schemas for API validation in `src/shared/schemas`
4. Export types from Zod schemas: `z.infer<typeof schema>`
5. Frontend uses these types with TanStack Query
6. End-to-end type safety from DB → API → UI

## Project Structure

```
expense-splitter/
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   └── migrations/            # Auto-generated migrations
│
├── src/
│   ├── server/
│   │   ├── index.ts           # Express app entry
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation
│   │   └── lib/               # Utilities
│   │
│   ├── client/
│   │   ├── main.tsx           # React entry
│   │   ├── App.tsx            # Router setup
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/               # API client, utils
│   │
│   └── shared/
│       ├── schemas/           # Zod schemas (shared types)
│       └── types/             # Common TypeScript types
│
├── public/                    # Static assets
├── package.json              # Single package.json
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind config
└── vite.config.ts            # Vite config
```

## Development Workflow

### Database Changes
1. Edit `prisma/schema.prisma`
2. Run `bun prisma migrate dev` - creates migration & updates types
3. TypeScript types automatically updated
4. Use new types in backend/frontend

### Adding a New Feature
1. Define API schema in `src/shared/schemas/`
2. Create Express route with Zod validation
3. Create React Query hook in frontend
4. Build UI with type-safe data

### Running the App
```bash
# Start PostgreSQL (Podman/Docker)
bun run db:start

# Run Prisma migrations
bun prisma migrate dev

# Start backend (Express)
bun run server

# Start frontend (Vite)
bun run client

# Or run both concurrently
bun run dev
```

## Key Dependencies

**Backend:**
- `express` - Web framework
- `@prisma/client` - Database ORM
- `zod` - Schema validation
- `jsonwebtoken` - JWT auth
- `bcrypt` - Password hashing

**Frontend:**
- `react` & `react-dom` - UI framework
- `@tanstack/react-query` - Data fetching
- `react-router-dom` - Routing
- `tailwindcss` - Styling
- `zod` - Schema validation (shared with backend)

**Dev Tools:**
- `typescript` - Type checking
- `prisma` - Database toolkit
- `vite` - Build tool
- `@types/*` - Type definitions

## Why This Stack?

### For LLMs
- **Express**: Most examples in training data
- **Prisma**: Clear, declarative schema language
- **React + TanStack Query**: Standard patterns everywhere
- **Tailwind**: Easy to generate utility classes

### For Type Safety Lovers
- **Prisma**: Database types auto-generated
- **Zod**: Runtime validation + static types
- **TypeScript**: Strict mode everywhere
- **Shared schemas**: One source of truth

### For Python Devs
- **Express**: Like Flask (simple, explicit)
- **Prisma**: Like SQLAlchemy (ORM with migrations)
- **Bun**: Like Python (just run it, no build complexity)
- **Straightforward**: No JavaScript quirks to learn

### For Self-Hosting
- **PostgreSQL**: Standard, reliable database
- **Single build**: Just bundle frontend, serve with Express
- **Simple deploy**: One process, one database
- **No serverless**: Everything runs on your homelab

## Comparison to Old Stack

| Component | Old | New | Why Change |
|-----------|-----|-----|------------|
| Runtime | Node.js + tsx | Bun | Faster, runs TS natively |
| Backend | Koa | Express | More popular, more docs |
| ORM | TypeORM | Prisma | Better DX, auto-generates types |
| Validation | Manual | Zod | Type-safe runtime validation |
| Frontend State | TanStack Query (unused) | TanStack Query (used!) | Proper data fetching patterns |
| Styling | Plain CSS | Tailwind | Faster development |
| Structure | Monorepo with workspaces | Simple monolith | Less complexity |

## Migration Notes

All existing features will be preserved:
- ✅ User registration & JWT auth
- ✅ Groups with invite codes
- ✅ Expense splitting (fixed, percentage, even)
- ✅ Fee distribution
- ✅ Balance tracking

But with:
- 🎯 Better type safety
- 🎯 Better validation
- 🎯 Better data fetching patterns
- 🎯 Better developer experience
