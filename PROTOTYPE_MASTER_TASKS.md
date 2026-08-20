# MDZ OS — AUTONOMOUS MOBILE-FIRST PROTOTYPE MASTER TASK LIST

## P0 — Broken Prototype & Audit Pass
- [x] Inspect codebase, existing routes, layout structure, and auth logic
- [x] Create `PROTOTYPE_MASTER_TASKS.md` task tracking system
- [x] Verify zero 404s across all navigation routes (`/owner`, `/sales`, `/leads`, `/clients`, `/projects`, `/employees`, `/attendance`, `/help-queue`, `/finance`, `/audit`, `/settings`, `/docs`, `/portal/demo-token-abc`, `/login`)

## P1 — Mobile-First Foundation & Safe-Area Tokens
- [x] Add mobile safe-area CSS utility variables and mobile app layout classes in `globals.css`
- [x] Configure touch targets (`min-h-[44px]`, `min-w-[44px]`) and mobile thumb-friendly active states
- [x] Create mobile-first bottom sheets and drawer primitives (`src/components/ui/BottomSheet.tsx`)

## P2 — Design System & Neutral Slate/Indigo Color Tokens
- [x] Ensure full support for Light, Dark, and System modes in `globals.css` and `ThemeToggle.tsx`
- [x] Remove any remaining gold/yellow remnants across all views
- [x] Implement subtle 150-250ms motion transitions for sheets, drawers, tabs, and theme switching

## P3 — Authentication UX & Prototype Session Simulation
- [x] Create complete production-grade Login screen (`src/app/login/page.tsx`) with email/employee ID input, show/hide password, loading state, error feedback, and forgot password modal
- [x] Implement client-side prototype session provider (`src/lib/prototypeSession.tsx`) to manage active user identity, persistent session, and login/logout routing

## P4 — App Shell & Mobile/Desktop Dual Navigation System
- [x] Refactor `Header.tsx` into a compact mobile/desktop app header with quick role context indicator, search shortcut, notifications panel, and theme toggle
- [x] Build Mobile Bottom Navigation Bar (`src/components/layout/MobileBottomNav.tsx`) for `EMPLOYEE`, `SALES`, `OWNER`, `CLIENT` roles (e.g. Home, Projects, Work, Activity, More)
- [x] Refactor Desktop `Sidebar.tsx` to remain fixed (`h-screen overflow-y-auto`) with route-aware active parent matching
- [x] Build compact sticky global work status pill (`● Working · 02:14:37`) that opens session details sheet on tap

## P5 — Employee Mobile Experience (390px Optimized)
- [x] Redesign Employee Home Desk (`/employee`) for one-handed mobile use:
  - Punch In / Stopwatch Work Session / Break picker bottom sheet
  - Today Task Stack & Action buttons (Start, Pause, Complete, Blocked, Add Note, Ask for Help)
  - Quick Note creation bottom sheet with instant local state updates
  - "Sir Help" request drawer with real-time status tracker ("Waiting for approval · 4 min")
- [x] Redesign Employee Work Sessions page (`/attendance`) with live stopwatch history and break logs

## P6 — Owner Experience (Executive Decision-Oriented)
- [x] Redesign Owner Command Center (`/owner`) for mobile & desktop with open-section architecture:
  - Top 5 Key Metric pills (Pipeline, Collections, Overdue, Projects, Team Present)
  - Needs Attention Exception Queue rows with one-tap action buttons
  - Real-time Team Status and MDZ AI Executive Assistant

## P7 — Sales Experience (CRM on Mobile)
- [x] Redesign Sales Dashboard (`/sales`, `/leads`, `/sales/followups`) for mobile and desktop:
  - Mobile Lead Pipeline stage switcher + 8-Stage Kanban on desktop
  - Quick "New Lead" mobile sheet/modal with instant local state addition
  - Follow-ups scheduler with call reminders and one-tap action triggers

## P8 — Project & Team Manager (TM) Experience
- [x] Redesign Project Directory (`/projects`) and Project Workspace (`/projects/[id]`):
  - Mobile project overview hero, current task card, and blocked items banner
  - Clean secondary tab navigation (Overview, Checklists, Tasks, Team, Docs, Notes, Calls, Changes, Payments) using bottom sheet/dropdown on mobile
  - Immutable Removal History Log and Living Docs version diffs

## P9 — Client Experience (Simplified & Calmer Portal)
- [x] Redesign Tokenized Client Portal (`/portal/[token]`) for mobile & desktop:
  - Clean progress hero, milestone statuses, published updates, and staging link
  - Simplified payment invoices view

## P10 — Responsive Desktop & Tablet Scaling
- [x] Verify responsive scaling across 360px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px
- [x] Ensure structured mobile data cards on small screens instead of overflowing horizontal tables

## P11 — Prototype Data & Interactive Local State
- [x] Ensure all mock interactions (Punch timer, Note addition, Lead creation, Help request, Checklist toggle, Theme change) modify prototype local state with immediate visual feedback

## P12 — UX Polish & Feedback System
- [x] Refine compact feedback toasts (`✓ Note added`, `✓ Lead converted`)
- [x] Implement Notification Center drawer in Header

## P13 — Complete Browser QA & Walkthrough
- [x] Run `npx tsc --noEmit` and `next build` to verify 100% build compilation
- [x] Perform full visual & interactive QA using browser subagent at 390px (mobile) and 1440px (desktop)
- [x] Generate comprehensive `walkthrough.md` artifact

