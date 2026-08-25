# Phase 5 Baseline & Repository Audit

## Current Architecture
- **Framework:** Next.js 14, React 18, TypeScript.
- **Database Architecture:** Prisma ORM with SQLite.
- **Authentication Architecture:** NextAuth.js with Prisma adapter and JWT sessions. Middleware enforces route protection and RBAC (OWNER, SALES, EMPLOYEE). Portal tokens used for isolated client access.
- **Deployment Architecture:** Dockerized deployment with Nginx proxying. Application is served under `basePath: "/ess-os"`.

## Existing Known UX Gaps
- Hardcoded role-routing on login.
- Potential absence of granular loading states and error boundaries in React tree.

## Technical Debt / P3 Issues
- ESLint is currently not configured or enforced.
- Lack of formalized CI workflow.

## Scalability Constraints
- SQLite is used for persistence. Will be evaluated under Phase 5.5.
- Current server-authoritative attendance state machine was built and hardened in Phase 3.

## Operational Gaps
- Backup and restore procedures are tested but need formalized documentation.
- Health endpoint exists but observability could be improved.
