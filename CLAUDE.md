# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

---

## Project Overview

**ISQM 1 Quality Deficiency Register** — A full-stack web application for registering and tracking quality deficiencies in accordance with ISQM 1 (International Standard on Quality Management 1), issued by the IAASB.

The app covers all four required capabilities:
1. Register / log deficiencies against one of the 8 ISQM 1 components
2. Classify each deficiency as a **root cause** or **symptom**
3. Track **remediation actions** with owners, due dates, and statuses
4. **Dashboard** with summary stats and breakdowns by component and severity

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 |
| Database | SQLite via `better-sqlite3` (no ORM) |
| Runtime | Node.js |

---

## Project Structure

```
/
├── app/
│   ├── layout.tsx                      # Root layout (Navbar + body)
│   ├── globals.css                     # Tailwind directives + component classes
│   ├── page.tsx                        # Dashboard (/)
│   ├── deficiencies/
│   │   ├── page.tsx                    # Deficiency list with filters (/deficiencies)
│   │   ├── new/page.tsx                # Register new deficiency
│   │   └── [id]/
│   │       ├── page.tsx                # Deficiency detail + remediation actions
│   │       └── edit/page.tsx           # Edit deficiency
│   └── api/
│       ├── dashboard/route.ts          # GET dashboard stats (used by client components)
│       ├── deficiencies/
│       │   ├── route.ts                # GET list, POST create
│       │   └── [id]/route.ts           # GET one, PUT update, DELETE
│       └── remediation/
│           ├── route.ts                # POST create action
│           └── [id]/route.ts           # PUT update, DELETE
├── components/
│   ├── Navbar.tsx                      # Top navigation bar (client component)
│   ├── DeficiencyForm.tsx              # Create/edit form (client component)
│   ├── RemediationActions.tsx          # Remediation action list + add form (client component)
│   ├── StatusBadge.tsx                 # Colour-coded badge for status/severity/nature (server component)
│   └── DeleteButton.tsx               # Confirm-then-delete button (client component)
├── lib/
│   ├── db.ts                           # SQLite singleton + schema migration
│   └── types.ts                        # Shared TypeScript types and constants
├── .claude/
│   └── hooks/
│       └── session-start.sh            # Runs npm install on remote (web) sessions
├── data/                               # Auto-created at runtime; holds isqm1.db
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.js
```

---

## Database Schema

Two tables, auto-created on first startup via `lib/db.ts`:

```sql
deficiencies (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  description     TEXT,
  component       TEXT NOT NULL,          -- one of the 8 ISQM 1 components
  nature          TEXT NOT NULL CHECK (nature IN ('root_cause', 'symptom')),
  severity        TEXT NOT NULL CHECK (severity IN ('minor', 'significant', 'pervasive')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  identified_by   TEXT,
  identified_date TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
)

remediation_actions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  deficiency_id   INTEGER NOT NULL REFERENCES deficiencies(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  assigned_to     TEXT,
  due_date        TEXT,
  completed_date  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
)
```

The database file lives at `data/isqm1.db` (gitignored). WAL journal mode and foreign key enforcement are enabled via pragmas in `lib/db.ts`.

---

## ISQM 1 Components

The 8 quality management components tracked by this app:

| Code | Component |
|---|---|
| GL | Governance and Leadership |
| ER | Relevant Ethical Requirements |
| AC | Acceptance and Continuance of Client Relationships and Specific Engagements |
| EP | Engagement Performance |
| RE | Resources |
| IC | Information and Communication |
| RA | Risk Assessment Process |
| MR | Monitoring and Remediation Process |

These are defined as a `const` array in `lib/types.ts` — update there if IAASB revises the standard. The `ISQM1_COMPONENT_CODES` record in the same file maps full names to their two-letter codes for display in tables and badges.

---

## Development Workflow

### Setup

```bash
npm install
npm run dev        # starts on http://localhost:3000
```

The SQLite database and `data/` directory are created automatically on first request.

### Build & Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Session Start Hook

A `.claude/hooks/session-start.sh` script runs automatically at the start of remote (Claude Code on the web) sessions. It runs `npm install` to ensure dependencies are present. It is a no-op in local environments (checks `CLAUDE_CODE_REMOTE`).

---

## Key Conventions

### Next.js 15/16 Async Params

`params` and `searchParams` in page components and API route handlers are **Promises** in Next.js 15+. Always `await` them:

```ts
// Page component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}

// API route handler
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}
```

### Data Fetching

Server pages **call `getDb()` directly** — they do not make HTTP requests to their own API routes. This avoids the network round-trip and the localhost URL dependency that caused crashes in serverless/web environments.

```ts
// Correct pattern for server pages
import getDb from "@/lib/db";

async function getDeficiency(id: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM deficiencies WHERE id = ?").get(id) as Deficiency | undefined;
}
```

Client components (those marked `"use client"`) **use `fetch()`** to hit the API routes (e.g. `POST /api/deficiencies`, `PUT /api/remediation/:id`) and call `router.refresh()` after mutations to re-render the server component tree.

### Client vs Server Components

- Pages and layout are **server components** (no `"use client"` directive)
- `Navbar.tsx` is a **client component** because it uses `usePathname()` for active-link highlighting
- `DeficiencyForm.tsx`, `RemediationActions.tsx`, and `DeleteButton.tsx` are **client components** (they manage form state and trigger mutations)
- `StatusBadge.tsx` is a **server component** (pure rendering, no interactivity)
- Keep client components small and at the leaf level

### Styling

- All styles use **Tailwind CSS utility classes**
- Reusable patterns are defined as `@layer components` in `globals.css`:
  - `.btn` — base button (flex, rounded, focus ring, disabled state)
  - `.btn-primary` — blue filled button
  - `.btn-secondary` — white bordered button
  - `.btn-danger` — red filled button
  - `.card` — white rounded bordered card with shadow
  - `.form-label` — small medium-weight label
  - `.form-input` — standard text/date input
  - `.form-select` — dropdown (extends `.form-input`)
  - `.form-textarea` — resizable textarea (extends `.form-input`)
- The `tailwind.config.ts` extends the theme with a `brand` colour palette (blue-800 range) — use standard Tailwind blue utilities unless targeting the brand palette specifically
- Do not add inline styles or separate CSS files

### TypeScript

- Strict mode is on — no `any` types
- All domain types live in `lib/types.ts`
- Database query results are cast with `as TypeName` after `.get()` / `.all()` since `better-sqlite3` returns `unknown`
- The path alias `@/*` maps to the project root (configured in `tsconfig.json`) — use it for all internal imports

### No ORM

- Database access uses `better-sqlite3` directly with prepared statements
- No Prisma, Drizzle, or other ORM — keep queries inline in the page or API route files
- Always use parameterised queries (`?` placeholders) — never interpolate user input into SQL strings

---

## Git Workflow

### Branch Conventions

- Feature/AI work branches follow the pattern: `claude/<task-id>`
- Never push directly to `main` or `master` without explicit permission
- Always use `git push -u origin <branch-name>` when pushing a new branch

### Commit Messages

- Use the imperative mood: "Add feature" not "Added feature"
- Keep the subject line under 72 characters

### Push Procedure

1. Commit all changes with descriptive messages
2. Push using: `git push -u origin <branch-name>`
3. If push fails due to network error, retry with exponential backoff: 2s, 4s, 8s, 16s

---

## AI Assistant Guidelines

- **Read before modifying**: Always read a file before editing it
- **Minimal changes**: Only make changes that are directly requested or clearly necessary
- **No over-engineering**: Avoid adding features, abstractions, or error handling beyond the immediate need
- **Security**: Never introduce SQL injection, XSS, or other vulnerabilities — use prepared statements for all DB queries
- **Async params**: Remember to `await params` and `await searchParams` in Next.js 15+ (see above)
- **Database migrations**: If adding columns to existing tables, use `ALTER TABLE` — do not drop and recreate tables
- **Data fetching**: Server pages call `getDb()` directly; only client components use `fetch()` to hit API routes
- When adding a new ISQM 1 component field or enum value, update **both** `lib/types.ts` (the source of truth) and any affected UI dropdowns
