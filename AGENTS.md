# EstacionamientosApp - AI Agent Instructions

You are working on **EstacionamientosApp**, a parking marketplace MVP built with Next.js 14, TypeScript, PostgreSQL, Prisma, and TailwindCSS. Launch target: 7 days.

## Project Context

- **Type**: Marketplace de estacionamientos (Chile, CLP)
- **Stack**: Next.js 14 (App Router) + TypeScript + PostgreSQL + Prisma + TailwindCSS + NextAuth
- **Deploy**: Vercel + Supabase
- **Timeline**: 7-day MVP sprint

Full project plan: See `PHASES.md`

## Skill System

Skills are loaded automatically from `.opencode/skills/`. Invoke them with the `skill` tool when the task matches their description.

### Core Skills (always available)

| Skill | When to Use |
|-------|-------------|
| `parking-app-dev` | Any feature related to parking, vehicles, pricing, workers, subscribers, or the marketplace |
| `react-best-practices` | Writing React/Next.js components, server actions, data fetching, or performance optimization |
| `nextjs-developer` | Next.js App Router patterns, routing, server components, middleware |
| `typescript-pro` | TypeScript types, generics, utility types, strict patterns |
| `postgres-pro` | PostgreSQL queries, indexing, performance, Prisma schema |
| `test-driven-development` | Implementing any logic, fixing bugs, or changing behavior |
| `test-master` | Writing tests, test coverage, edge cases, test architecture |
| `spec-driven-development` | Planning new features before coding |
| `frontend-ui-engineering` | Building UI components, layouts, or responsive design |
| `debugging-and-error-recovery` | When something breaks or behaves unexpectedly |
| `incremental-implementation` | Building features step by step |
| `planning-and-task-breakdown` | Breaking down complex tasks |
| `api-and-interface-design` | Designing API routes, server actions, or interfaces |
| `security-and-hardening` | Auth, data validation, or security concerns |
| `security-reviewer` | Security audit, vulnerability scanning, secure code review |
| `code-review-and-quality` | Reviewing code before committing |
| `code-reviewer` | Deep code review with severity classification |
| `shipping-and-launch` | Deploy, release checklist, or launch prep |
| `composition-patterns` | Component architecture and patterns |
| `web-design-guidelines` | UI/UX design decisions |
| `deploy-to-vercel` | Deployment to Vercel |
| `self-improvement` | Log errors, corrections, and learnings for continuous improvement |

## Development Workflow

### 1. Before Coding
- Read `PHASES.md` to understand the current phase
- Check existing code patterns in the codebase
- Load relevant skills with the `skill` tool

### 2. During Coding
- Follow `react-best-practices` for all React/Next.js code
- Use `test-driven-development` for logic implementation
- Apply `security-and-hardening` for auth and data handling
- Follow the project structure defined in `PHASES.md`

### 3. After Coding
- Run `code-review-and-quality` before considering a task done
- Verify no TypeScript errors
- Ensure the feature matches the phase requirements

## Code Conventions

- **Components**: PascalCase, in `components/`
- **Pages/Routes**: kebab-case, in `app/`
- **API/Server Actions**: camelCase, in `lib/actions/`
- **Utils**: camelCase, in `lib/`
- **Types**: PascalCase, in `types/`
- **Prisma schema**: `prisma/schema.prisma`
- **No comments** unless explicitly requested
- **TypeScript strict mode** always

## Business Rules (Critical)

1. Cost = `duration * rate` based on billing_mode (CLP)
2. Never exceed `total_spots` capacity
3. Unique license plate per active parking session
4. Only authenticated workers/admins can register entries/exits
5. Payment required before freeing spot (except subscribers)
6. Subscribers enter/exit without individual charges
7. Active subscription required for admin to operate
8. Only `is_public = true` parkings appear in marketplace
9. Auto-notification when `available_spots == 0`
10. Receipt with unique consecutive number on payment
11. Chilean plate format: ABCD12 or AB·CD-12

## Communication

- Respond in Spanish unless code/technical terms require English
- Be concise - no unnecessary explanations
- When stuck, load the relevant skill and follow its workflow
- Report progress against the phase checklist in `PHASES.md`

## Self-Improvement Workflow

This project uses `.learnings/` for continuous improvement across sessions.

### When to Log

| Trigger | Log To |
|---------|--------|
| Command or operation fails | `.learnings/ERRORS.md` |
| User corrects you ("No, that's wrong...") | `.learnings/LEARNINGS.md` (category: correction) |
| User requests missing feature | `.learnings/FEATURE_REQUESTS.md` |
| Knowledge was outdated | `.learnings/LEARNINGS.md` (category: knowledge_gap) |
| Found better approach | `.learnings/LEARNINGS.md` (category: best_practice) |

### Before Major Tasks

1. Review `.learnings/LEARNINGS.md` for relevant past learnings
2. Check `.learnings/ERRORS.md` for known issues in the area
3. Apply lessons learned before starting work

### After Resolving Issues

1. Log the issue and solution
2. If broadly applicable, promote to this `AGENTS.md` as a rule
3. Mark entry as `resolved` with commit reference

### Never Log

- Secrets, tokens, API keys, or environment variables
- Full source/config files (use summaries instead)
