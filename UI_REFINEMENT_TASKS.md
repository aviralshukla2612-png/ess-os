# MDZ OS — UI REFINEMENT MASTER TASKS (DUAL THEME & ZERO GOLD)

## Phase 0 — Application Audit & Setup
- [x] Inspect existing codebase & theme architecture
- [x] Create `UI_REFINEMENT_TASKS.md` execution tracker
- [x] Identify all gold/yellow instances for complete removal
- [x] Verify all 20 routes resolve cleanly without 404s

## Phase 1 — Design System Foundation (Dual Light/Dark Theme)
- [x] Implement Light mode CSS variables (`#F8FAFC` bg, `#FFFFFF` surface, `#E2E8F0` border, `#0F172A` text, Indigo primary `#4F46E5`)
- [x] Implement Dark mode CSS variables (`#090E18` bg, `#111827` surface, `#1E293B` border, `#F8FAFC` text, Indigo primary `#6366F1`)
- [x] Remove all gold/yellow gradient text, buttons, and utility classes
- [x] Configure `ThemeProvider` / system theme detection & localStorage persistence without theme flashing

## Phase 2 — Shared UI Primitives Refinement
- [x] Create `ThemeToggle` component (Light / Dark / System)
- [x] Refine `PageHeader` component with neutral/indigo accents
- [x] Refine `Card` primitive to support both Light & Dark modes cleanly
- [x] Refine `Button` primitive (Indigo/Blue primary, neutral secondary, ghost, danger)
- [x] Refine Status Badges (Semantic: Green=Success, Red=Danger/Overdue, Amber=Warning, Blue=Info)
- [x] Refine Input & Select form controls with focus rings

## Phase 3 — Application Shell Transformation
- [x] Refine Header with theme switcher & clean indigo MDZ OS branding (Header.tsx)
- [x] Refine Sidebar with theme support & clean active states (Sidebar.tsx)
- [x] Remove top `DEMO MULTI-ROLE SWITCHER` from default shell layout (or collapse into compact menu)

## Phase 4 — Owner Command Center Refinement
- [x] Redesign Owner Header & Greeting ("Good morning, Rahul")
- [x] Redesign Command Metrics (Pipeline, Collections, Overdue, Projects, Team Present)
- [x] Redesign Needs Attention Exception Queue (Light & Dark mode support)
- [x] Redesign Real-Time Team View & MDZ AI Assistant

## Phase 5 — Sales CRM Refinement
- [x] Redesign Sales Dashboard Header & KPI Cards
- [x] Redesign 8-Stage Sales Pipeline Kanban Board
- [x] Refine Lead Cards & ConvertLeadModal
- [x] Redesign Sales Follow-ups Scheduler (`/sales/followups`)

## Phase 6 — Project Operating Workspace Refinement
- [x] Redesign Project Workspace Header & Weighted Progress Bar
- [x] Redesign 10-Tab secondary navigation for Light & Dark mode
- [x] Redesign Stage Playbook & Checklist Execution UI
- [x] Redesign Team & Immutable Removal History Log
- [x] Redesign Living Docs version diffs & Change Requests

## Phase 7 — Employee Desk Refinement
- [x] Redesign Employee Desk Header & Greeting ("Good morning, Dev")
- [x] Redesign Punch Status Widget & Work Session Timer
- [x] Redesign Today Task Stack & Assigned Projects cards
- [x] Redesign Employee "Sir Help" Request Drawer & History

## Phase 8 — Client Portal Refinement
- [x] Redesign Tokenized Client Portal Header (`/portal/[token]`)
- [x] Redesign Client Project Overview & Overall Progress Hero
- [x] Redesign Milestone Statuses & Latest Updates

## Phase 9 — Workforce HR, Attendance & System Operations Refinement
- [x] Redesign Employees & HR Directory (`/employees`)
- [x] Redesign Attendance & Work Sessions Matrix (`/attendance`)
- [x] Redesign Financial Milestones & Invoices (`/finance`)
- [x] Redesign Audit & System Event Feed (`/audit`)
- [x] Redesign Company Settings & Playbooks (`/settings`)
- [x] Redesign Living Documentation Hub (`/docs`)

## Phase 10 — Mobile Responsiveness & Final QA
- [x] Verify Mobile Drawer & Responsiveness at 360px, 390px, 768px, 1440px
- [x] Test theme switching across all 20 pages (Light $\leftrightarrow$ Dark)
- [x] Run TypeScript compilation (`npx tsc --noEmit`) with 0 errors
- [x] Run production Next.js build (`next build`)
- [x] Verify local server execution

