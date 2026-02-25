# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Repository Status

This is a **newly initialized repository** with no source code committed yet. The remote is hosted at `http://local_proxy@127.0.0.1:32031/git/nabzzmaka/makelele`.

---

## Git Workflow

### Branch Conventions

- Feature/AI work branches follow the pattern: `claude/<task-id>`
- The current working branch for AI-generated changes: `claude/claude-md-mm268w0digzn0sg8-4weP6`
- Never push directly to `main` or `master` without explicit permission
- Always use `git push -u origin <branch-name>` when pushing a new branch

### Commit Messages

Write clear, descriptive commit messages:
- Use the imperative mood: "Add feature" not "Added feature"
- Keep the subject line under 72 characters
- Reference issue numbers where applicable (e.g., `Fix login bug (#42)`)

### Push Procedure

1. Commit all changes with descriptive messages
2. Push using: `git push -u origin <branch-name>`
3. If push fails due to network error, retry with exponential backoff: 2s, 4s, 8s, 16s
4. Do **not** force-push to shared branches without explicit user approval

---

## Development Guidelines for AI Assistants

### General Principles

- **Read before modifying**: Always read a file before editing it
- **Minimal changes**: Only make changes that are directly requested or clearly necessary
- **No over-engineering**: Avoid adding features, abstractions, or error handling beyond the immediate need
- **Security first**: Never introduce command injection, XSS, SQL injection, or other OWASP Top 10 vulnerabilities
- **No speculative cleanup**: Do not refactor, add comments, or improve surrounding code unless asked

### File Operations

- Prefer editing existing files over creating new ones
- Do not create documentation files (`.md`, `README`) unless explicitly requested
- Do not add `.env` files containing secrets to version control

### Code Style (to be defined when stack is chosen)

When the project's technology stack is established, update this section with:
- Linting/formatting tools and configuration (e.g., ESLint, Prettier, Black, gofmt)
- Naming conventions (variables, functions, files, directories)
- Import ordering rules
- Maximum line length
- Comment and documentation standards

---

## Project Structure (to be defined)

Once the project is initialized, document the directory layout here. Example:

```
/
├── src/           # Application source code
├── tests/         # Test files
├── docs/          # Documentation
├── scripts/       # Utility and build scripts
└── ...
```

---

## Testing

### Running Tests (to be defined)

When a testing framework is chosen, document here:
- How to run all tests
- How to run a single test file
- How to run tests in watch mode
- Coverage thresholds and reporting

### Test Conventions

- Test files should live next to source files or in a dedicated `tests/` directory
- Name test files consistently (e.g., `*.test.ts`, `*_test.go`, `test_*.py`)
- Write tests before marking a task complete

---

## Environment Setup (to be defined)

When the project is set up, document:
- Prerequisites (Node.js version, Python version, Go version, etc.)
- Installation steps (`npm install`, `pip install -r requirements.txt`, etc.)
- Environment variables required (list names, not values — never commit secrets)
- How to run the development server
- How to build for production

---

## Key Conventions (to be defined)

Once development begins, record discovered conventions here:
- API design patterns (REST, GraphQL, RPC)
- State management approach
- Error handling patterns
- Logging conventions
- Database migration workflow

---

## Updating This File

This CLAUDE.md should be updated whenever:
- The technology stack is chosen
- New tooling or conventions are established
- The project structure changes significantly
- New development workflows are adopted

Keep this file accurate and concise — it is the primary reference for AI assistants working in this codebase.
