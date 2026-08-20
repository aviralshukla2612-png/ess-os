# MDZ OS — PRODUCTION UI/UX OVERHAUL MASTER TASK LIST

## Phase 0 — Setup & Planning
- [x] Create `implementation_plan.md` artifact
- [x] Create `UI_OVERHAUL_TASKS.md` task checklist

## Phase 1 — Fixed App Shell Architecture & Layout Refactor
- [x] Refactor `RootLayout` (`src/app/layout.tsx`) to `h-screen overflow-hidden` container
- [x] Remove `RoleSwitcherBanner` from production shell
- [x] Refactor `Sidebar.tsx` to `h-screen overflow-y-auto sticky top-0` fixed sidebar
- [x] Implement parent route-aware active matching in `Sidebar.tsx` (e.g. `/projects/[id]` matches `/projects`)

## Phase 2 — Live Stopwatch Punch & Break Session Engine
- [x] Implement live `HH:MM:SS` stopwatch timer state machine in `Header.tsx`
- [x] Implement `NOT_PUNCHED_IN` $\rightarrow$ `WORKING` $\leftrightarrow$ `BREAK` $\rightarrow$ `PUNCHED_OUT` state transitions
- [x] Add compact punch timer display & quick action buttons in `Header.tsx`

## Phase 3 — Open-Section Architecture Redesign (Remove Box Walls)
- [x] Redesign `globals.css` section utilities & subtle divider lines
- [x] Redesign `PageHeader.tsx` with open subtitle and action buttons
- [x] Redesign `Owner` Dashboard (`/owner`) into editorial open sections
- [x] Redesign `CommandMetrics` 5-metric grid
- [x] Redesign `NeedsAttentionQueue` open list rows
- [x] Redesign `Sales` CRM Dashboard (`/sales`, `/leads`)
- [x] Redesign `Projects` Directory (`/projects`) & Workspace (`/projects/[id]`)
- [x] Redesign `Employee` Desk (`/employee`)
- [x] Redesign `Client` Portal (`/portal/[token]`)
- [x] Redesign HR Directory, Attendance Matrix, Finance, Audit, Settings, Docs

## Phase 4 — Verification & Final QA
- [x] Run `npx tsc --noEmit` to verify 0 TypeScript errors
- [x] Run `next build` to verify 20 static/dynamic routes compile
- [x] Launch local server on port 3015
- [x] Browser QA: Verify fixed sidebar scrolling & main content scroll
- [x] Browser QA: Verify route-aware active navigation
- [x] Browser QA: Verify live stopwatch punch timer
- [x] Browser QA: Verify Light & Dark mode across 1440px and 390px

