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
│       ├── dashboard/route.ts          # GET dashboard stats
│       ├── deficiencies/
│       │   ├── route.ts                # GET list, POST create
│       │   └── [id]/route.ts           # GET one, PUT update, DELETE
│       └── remediation/
│           ├── route.ts                # POST create action
│           └── [id]/route.ts           # PUT update, DELETE
├── components/
│   ├── Navbar.tsx                      # Top navigation bar
│   ├── DeficiencyForm.tsx              # Create/edit form (client component)
│   ├── RemediationActions.tsx          # Remediation action list + add form
│   ├── StatusBadge.tsx                 # Colour-coded badge for status/severity/nature
│   └── DeleteButton.tsx               # Confirm-then-delete button (client component)
├── lib/
│   ├── db.ts                           # SQLite singleton + schema migration
│   └── types.ts                        # Shared TypeScript types and constants
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
  nature          TEXT NOT NULL,          -- 'root_cause' | 'symptom'
  severity        TEXT NOT NULL,          -- 'minor' | 'significant' | 'pervasive'
  status          TEXT NOT NULL DEFAULT 'open',  -- 'open' | 'in_progress' | 'resolved'
  identified_by   TEXT,
  identified_date TEXT,
  created_at      TEXT,
  updated_at      TEXT
)

remediation_actions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  deficiency_id   INTEGER NOT NULL REFERENCES deficiencies(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  assigned_to     TEXT,
  due_date        TEXT,
  completed_date  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed'
  created_at      TEXT
)
```

The database file lives at `data/isqm1.db` (gitignored).

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

These are defined as a `const` array in `lib/types.ts` — update there if IAASB revises the standard.

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

- Server components fetch data from internal API routes via `http://localhost:3000/api/...` with `cache: "no-store"`
- Client components use `fetch` directly in event handlers and call `router.refresh()` after mutations to revalidate server component data

### Client vs Server Components

- Pages and layout are **server components** (no `"use client"` directive)
- Components with interactivity (forms, buttons with handlers) are **client components** marked with `"use client"`
- Keep client components small and at the leaf level

### Styling

- All styles use **Tailwind CSS utility classes**
- Reusable patterns are defined as `@layer components` in `globals.css` (`.btn`, `.btn-primary`, `.card`, `.form-input`, etc.)
- Do not add inline styles or separate CSS files

### TypeScript

- Strict mode is on — no `any` types
- All domain types live in `lib/types.ts`
- Database query results are cast with `as TypeName` after `.get()` / `.all()` since better-sqlite3 returns `unknown`

### No ORM

- Database access uses `better-sqlite3` directly with prepared statements
- No Prisma, Drizzle, or other ORM — keep queries in the API route files

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
- When adding a new ISQM 1 component field or enum value, update **both** `lib/types.ts` (the source of truth) and any affected UI dropdowns
