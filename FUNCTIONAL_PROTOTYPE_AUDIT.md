# EMPEROR OS — FUNCTIONAL PRODUCT PROTOTYPE AUDIT & DEFECT RECOVERY PLAN

## Executive Summary
This document serves as the master audit and execution log for turning Emperor OS from a visual screen prototype into a fully interconnected, interactive business operating system prototype.

---

## Identified Critical P0 Defects & Systemic Requirements

### 1. P0 Mobile Hamburger Menu Defect
- **Defect**: Mobile menu toggle in header opens backdrop but drawer is hidden, clipped, or under backdrop due to z-index / fixed position issues in `AppShell.tsx` and `Sidebar.tsx`.
- **Root Cause**: `Sidebar.tsx` contains `hidden md:flex` which conflicts with mobile drawer toggle logic when `isMobileOpen` is true; `Header` toggle handler was passing state up but z-index and portal stacking context were blocked.
- **Fix**: Refactor `Sidebar.tsx` into clean mobile drawer primitive with fixed z-50 overlay, proper slide-in animation, backdrop click dismiss, body scroll lock, and touch targets (`≥ 44px`).

### 2. P0 Branding & Identity Overhaul
- **Defect**: Generic purple tile with gold/crown icon (`👑`).
- **Fix**: Remove crown/purple tiles entirely. Create clean, high-end SaaS wordmark `EMPEROR OS` with crisp typography and subtle monogram `E` for mobile headers.

### 3. P0 Theme Inconsistency & Hardcoded Light Cards in Dark Mode
- **Defect**: `bg-white` hardcoded across `/clients`, `/projects`, `/sales`, `/leads`, `/finance`, `/help-queue`, `/attendance`, `/employees`, `/audit` causing bright white cards inside dark theme.
- **Fix**: Audit all surfaces globally. Standardize on semantic tokens `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100`.

### 4. P0 Duplicate Icon / Text Formatting ("+ + New Client")
- **Defect**: Buttons like `+ + New Client`, `+ + New Lead`, `+ + New Project` have double pluses.
- **Fix**: Standardize button primitives to render clean single icon + label without text duplication.

### 5. P0 Route Transition & Universal Navigation Feedback Bar
- **Defect**: Clicking navigation items or entity links gives no top visual feedback during page transitions.
- **Fix**: Build lightweight top loading bar indicator (`TopLoadingBar.tsx`) in `AppShell.tsx` that triggers an elegant 1.5px indigo progress line on route navigation.

---

## 360° Entity-First Product Architecture

Every entity in Emperor OS must be inspectable and interconnected:

1. **Leads (`/leads` & `/leads/[id]`)**:
   - **Cards/Rows**: Clicking lead opens `/leads/[id]` (Lead 360°).
   - **Lead 360°**: Company info, primary contact, deal value, stage, probability, next follow-up, Call/WhatsApp/Email triggers, Add Note, Schedule Call, Stage change, Activity Timeline, Convert to Client & Project workspace.

2. **Clients (`/clients` & `/clients/[id]`)**:
   - **Cards/Rows**: Clicking client opens `/clients/[id]` (Client 360°).
   - **Client 360°**: Overview, Active/Completed Projects, Financial Ledger, Invoices, Portal credentials, Activity Log.
   - **Import Workflow**: Polished 5-step CSV/XLSX import modal (Upload $\rightarrow$ Column Mapping $\rightarrow$ Validation $\rightarrow$ Execution $\rightarrow$ Result).

3. **Employees (`/employees` & `/employees/[id]`)**:
   - **Cards/Rows**: Clicking employee opens `/employees/[id]` (Employee 360°).
   - **Employee 360°**: Current work status, punched-in timer, today's step-by-step work history timeline, assigned projects, attendance record, break log, Sir Help requests history.

4. **Projects (`/projects` & `/projects/[id]`)**:
   - **Projects Directory**: Clean responsive list/card view with weighted progress (72%), TM assignment, and health status.
   - **Project Workspace (`/projects/[id]`)**: 9 interactive tabs (Overview, Workflow Playbook, Task Stack, Team & Removal History, Living Docs v2, Notes, Client Calls, Change Requests, Payments & Milestones).

5. **Universal Global Search (`GlobalSearchModal.tsx`)**:
   - Functional searching across Leads, Clients, Projects, Employees with instant entity 360° navigation.

---

## Task Execution Order (P0 to P9)

- [ ] **Task 1 (P0)**: Fix Mobile Hamburger Drawer in `Sidebar.tsx` & `AppShell.tsx`
- [ ] **Task 2 (P0)**: Redesign Brand Wordmark (Remove crown tiles, minimalist `EMPEROR OS` typography)
- [ ] **Task 3 (P0)**: Universal Route Loading Progress Bar (`TopLoadingBar.tsx`)
- [ ] **Task 4 (P0)**: Fix Double CTA text (`+ + New Client` $\rightarrow$ `+ New Client`)
- [ ] **Task 5 (P0)**: Centralized Interconnected Prototype Store (`src/lib/prototypeStore.tsx`)
- [ ] **Task 6 (P1)**: Lead 360° Detail View (`/leads/[id]`) with Activity History & Conversion Workflow
- [ ] **Task 7 (P1)**: Client 360° Detail View (`/clients/[id]`) & Step-by-Step CSV/XLS Import Workflow
- [ ] **Task 8 (P1)**: Employee 360° Detail View (`/employees/[id]`) with Granular Work Log Timeline
- [ ] **Task 9 (P2)**: Project Workspace (`/projects/[id]`) Deep Tabs & Team Removal History
- [ ] **Task 10 (P2)**: Universal Search Integration in `GlobalSearchModal.tsx`
- [ ] **Task 11 (P3)**: Global Theme Audit (Zero hardcoded white cards in Dark Mode)
- [ ] **Task 12 (P4)**: End-to-End Build & Visual Workflow QA
