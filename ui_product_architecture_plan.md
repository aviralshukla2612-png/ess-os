# ESS OS — UI PRODUCT ARCHITECTURE PLAN

**Product:** ESS OS  
**Organization:** ESS Company  
**Document Type:** Master UI Product Architecture Plan & Information Architecture Specification  
**Version:** 1.0 (Architecture Phase)  
**Status:** Awaiting Approval  

---

## 1. PRODUCT UNDERSTANDING & CORE VISION

ESS OS is a unified business operating system designed for **ESS Company**. It replaces disconnected CRMs, task trackers, HR spreadsheets, and invoicing tools with a single digital operational memory.

### Core Philosophy
> **"Dashboards are role-based. Data is project/client-based."**

Projects form the operational center of the company. All incoming leads, sales activities, client relationships, employee assignments, work sessions, documentation, discussions, change requests, invoices, and payments attach directly to Projects and Clients.

### The Complete Business Lifecycle
```text
LEAD → SALES → CLIENT → PROJECT → TEAM → EXECUTION → DOCUMENTATION → COMMUNICATION → PAYMENT → DELIVERY → SUPPORT
```

---

## 2. CORRECT ACTOR MODEL

In accordance with the Architect Instruction, ESS OS discards rigid global role switching (e.g., switching between "Developer", "Designer", "QA", "PM"). There are **Four Primary User Contexts**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRIMARY USER CONTEXTS                         │
├───────────────┬───────────────────┬─────────────────────┬───────────────┤
│    OWNER      │       SALES       │      EMPLOYEE       │    CLIENT     │
│ Complete view │ Pipeline & Leads  │ Execution & Projects│ External view │
└───────────────┴───────────────────┴─────────────────────┴───────────────┘
```

### Contextual Project Authority: Team Manager (TM) vs. Team Member
- **Employee Designation** (e.g., Backend Developer, UI Designer, QA) is a profile attribute, NOT a system permission role.
- **Team Manager (TM)** is a **project-specific responsibility**, assigned per project by the Owner.
- **Contextual Behavior**: An employee (e.g., Rahul) can be the **Team Manager (TM)** for *Project ABC* (granting project management controls for Project ABC) while simultaneously acting as a **Team Member** on *Project XYZ* (where standard member controls apply).
- **No Global Role Switcher**: The UI dynamically adapts based on the user's login session and current project context.

---

## 3. CORE ENTITY MAP & RELATIONSHIPS

```text
                               ┌─────────────┐
                               │    LEAD     │
                               └──────┬──────┘
                                      │ (Won)
                                      ▼
                               ┌─────────────┐
                        ┌─────►│   CLIENT    │◄────┐
                        │      └──────┬──────┘     │
                        │             │            │
                        │             ▼            │
                ┌───────┴─────┐┌─────────────┐┌────┴─────────┐
                │  CONTACTS   ││   PROJECT   ││  INVOICES /  │
                └─────────────┘└──────┬──────┘│   PAYMENTS   │
                                      │       └──────────────┘
      ┌───────────────────────────────┼───────────────────────────────┐
      │                               │                               │
      ▼                               ▼                               ▼
┌─────────────┐               ┌─────────────┐               ┌─────────────┐
│ PROJECT TEAM│               │  WORKFLOW / │               │KNOWLEDGE &  │
│(Memberships)│               │  PLAYBOOK   │               │COMMUNICATION│
└──────┬──────┘               └──────┬──────┘               └──────┬──────┘
       │                             │                             │
       ▼                             ▼                             ▼
┌─────────────┐               ┌─────────────┐               ┌─────────────┐
│ EMPLOYEES   │               │   STAGES &  │               │ DOCS, NOTES,│
│(Attendance, │               │ CHECKLISTS /│               │ DISCUSSIONS,│
│ Sessions,   │               │   TASKS     │               │   CHANGES   │
│ Help Queue) │               └─────────────┘               └─────────────┘
└─────────────┘
```

### Key Entities
1. **User / Auth**: `User`, `Role`, `UserRole`, `Permission`, `AuditLog`.
2. **Sales**: `Lead`, `LeadFollowup`, `LeadActivity`.
3. **Client**: `Client`, `ClientContact`.
4. **Project Core**: `Project`, `ProjectType`, `ProjectMembership` (with `assigned_at`, `removed_at`, `removal_reason`).
5. **Execution Engine**: `ProjectStage`, `ProjectChecklist`, `Task`, `TaskDependency`.
6. **Knowledge**: `ProjectDocument`, `DocumentVersion`, `ProjectNote`, `ClientDiscussion`, `ChangeRequest`.
7. **Employee & HR**: `Employee`, `Attendance`, `WorkSession`, `EmployeeStatusEvent`, `HelpRequest`.
8. **Finance**: `PaymentMilestone`, `Payment`, `Invoice`.
9. **Client Portal**: `ClientPortalToken`, `ClientUpdate`, `LiveLink`.
10. **System Feeds**: `ActivityEvent`, `Notification`.

---

## 4. MAIN BUSINESS LIFECYCLE STATE MACHINES

### Lead Lifecycle
```text
NEW ──► CONTACTED ──► FOLLOW_UP ──► MEETING ──► PROPOSAL ──► NEGOTIATION ──► WON (Converts to Client + Project)
                                                                        └──► LOST (With reason)
```

### Project Lifecycle
```text
DRAFT ──► PLANNING ──► WAITING_CLIENT ──► IN_PROGRESS ──► IN_REVIEW ──► TESTING ──► UAT ──► DEPLOYMENT ──► COMPLETED
                                                                                                      ├──► ON_HOLD
                                                                                                      └──► CANCELLED
```

### Change Request Lifecycle
```text
DRAFT ──► UNDER_REVIEW ──► WAITING_CLIENT ──► APPROVED (Scope & Milestones update)
                                        └──► REJECTED
```

### Help Request ("Sir Help") Lifecycle
```text
SUBMITTED ──► IN_QUEUE ──► ACKNOWLEDGED (Owner: COME_NOW / WAIT / MESSAGE / REASSIGN) ──► IN_PROGRESS ──► RESOLVED
```

### Payment Milestone Lifecycle
```text
UPCOMING ──► DUE ──► OVERDUE ──► PARTIALLY_PAID ──► PAID
                             └──► CANCELLED
```

---

## 5. LEAD-TO-PROJECT FLOW ARCHITECTURE

When a Sales Lead reaches status `WON`, the system performs a seamless conversion:

```text
[SALES] Lead Marked WON
          │
          ▼
[MODAL] "Convert Lead to Client & Project"
          ├─ Select Existing Client OR Create New Client Profile
          ├─ Project Title & Inherited Scope / Budget
          └─ Target Deadline & Primary Services
          │
          ▼
[SYSTEM] Generates Project Draft & Preserves Original Lead History
          │
          ▼
[OWNER NOTIFICATION] "Project Draft Created for [Client Name]"
          │
          ▼
[OWNER WORKSPACE] Project Setup:
          ├─ Select Project Execution Template (e.g. E-Commerce Playbook)
          ├─ Define Payment Milestones & Contract Value
          ├─ Assign Team Members & Select Team Manager (TM)
          └─ Click [FINALIZE & LAUNCH PROJECT]
          │
          ▼
[TEAM WORKSPACE] Project assigned to Employees & TM. Execution begins.
```

---

## 6. PROJECT-TEAM & TM DYNAMIC FLOW

### Team Assignment UI
- Owner opens **Project Workspace → Team Tab**.
- **Employee Selection Modal**: Multi-select employees with search and filter by skill/designation.
- **TM Selection**: Radio button to designate one employee as **Team Manager (TM)** for this project.

### Dynamic Membership & History Preservation
- When an employee is removed from a project:
  - System prompts for **Removal Reason** (e.g., "Phase completed", "Reassigned to emergency project").
  - Record is **NOT deleted**. `ProjectMembership` row is updated with `removed_at` and `removal_reason`.
- **UI Historical Log Tab**: "Team History" shows current active team as well as past members, active date ranges, and tasks completed while assigned.

---

## 7. PROJECT EXECUTION & PLAYBOOK ENGINE FLOW

### Playbook / Stage Templates
Projects are initialized from standardized playbooks (e.g., *Business Website*, *E-Commerce*, *SaaS*, *Mobile App*).

```text
PLAYBOOK STAGE (e.g. Planning - Weight 10%)
  ├── Stage Checklist Item 1 (Required, Dependency: None)
  ├── Stage Checklist Item 2 (Requires Client Approval)
  └── Stage Checklist Item 3 (Dependency: Item 1)
```

### Weighted Progress Calculation Engine
Progress is calculated using stage weightings rather than simple checkbox counts:
$$\text{Stage Progress } (S_i) = \frac{\text{Completed Checklist Items}}{\text{Total Checklist Items}} \times 100\%$$
$$\text{Project Progress } (P) = \sum_{i=1}^{n} \left( S_i \times \text{Stage Weight}_i \right)$$

*Example Progress Breakdown:*
- Planning (10% weight): 100% complete $\rightarrow$ 10.0%
- Design (20% weight): 100% complete $\rightarrow$ 20.0%
- Development (40% weight): 50% complete $\rightarrow$ 20.0%
- Testing (15% weight): 0% complete $\rightarrow$ 0.0%
- Deployment (10% weight): 0% complete $\rightarrow$ 0.0%
- Handover (5% weight): 0% complete $\rightarrow$ 0.0%
- **Total Calculated Progress**: **50.0%**

---

## 8. EMPLOYEE DAILY WORKFLOW ARCHITECTURE

The Employee view focuses entirely on execution:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Punch In / Out] | Status: [WORKING ▼] | Active Task: Razorpay │
├─────────────────────────────────────────────────────────────────────────┤
│ [REQUEST HELP 🔴]                                                        │
│                                                                         │
│ MY CURRENT WORKSPACE                                                    │
│ ┌─────────────────────────┐ ┌─────────────────────────────────────────┐ │
│ │ CURRENT TASKS & STACK   │ │ MY ACTIVE PROJECTS                      │ │
│ │ ☑ Razorpay Integration  │ │ • ABC E-Commerce [72%] (Role: TM)      │ │
│ │ ☐ Checkout Testing      │ │ • XYZ Mobile App [45%] (Role: Member)   │ │
│ │ ☐ API Bugfix #402       │ │                                         │ │
│ └─────────────────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Punch In/Out & Status State Machine
- **Punch In**: Starts daily attendance timer. Status defaults to `WORKING`.
- **Status Selector**: Switch between `WORKING`, `BREAK`, `LUNCH`, `CLIENT_CALL`, `INTERNAL_MEETING`, `OUTSIDE_WORK`.
- **Work Session Tracker**: Connects active working time to a specific Project + Task.

### "Sir Help" / Request Help Queue Drawer
- Employee clicks **[REQUEST HELP]**.
- Selects Project, Task, Urgency (Low, Medium, Blocker), and description.
- Submits request to Owner's real-time **Help Queue**.
- Receives status updates (e.g., *"Owner requested: Come to cabin"* or *"Owner assigned Meet to assist"*).

---

## 9. SALES WORKFLOW ARCHITECTURE

### Pipeline & Follow-up View
- **Dual Mode View**: Toggle between **Kanban Board** (New $\rightarrow$ Contacted $\rightarrow$ Follow-up $\rightarrow$ Meeting $\rightarrow$ Proposal $\rightarrow$ Negotiation $\rightarrow$ Won/Lost) and **List Table**.
- **Follow-ups Engine**: Surfacing Overdue, Today's, and Upcoming follow-ups categorized by type (`CALL`, `WHATSAPP`, `EMAIL`, `MEETING`, `VIDEO_CALL`).
- **Quick Action Drawer**: Single-click action to log call outcomes, add notes, and schedule the next follow-up date/time.

---

## 10. CLIENT PORTAL WORKFLOW ARCHITECTURE

### Isolated & Secure External View
- Accessed via secure magic URL token (`/portal/[token]`).
- **Data Isolation Filter**:

```text
┌───────────────────────────────────────┬───────────────────────────────────────┐
│           CLIENT VISIBLE              │            INTERNAL ONLY              │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ • Overall Weighted Progress %         │ • Developer internal notes            │
│ • Client-Safe Stage Statuses          │ • Hourly work sessions & attendance   │
│ • Published Project Updates           │ • Employee salary & financial cost    │
│ • Change Requests needing approval     │ • Raw debug/bug notes                 │
│ • Invoices & Payment Milestones       │ • Internal meeting discussion notes   │
│ • Live Preview / Staging URLs         │ • Internal assignment history logs    │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 11. OWNER WORKFLOW & EXCEPTION ENGINE ARCHITECTURE

The Owner Command Center prioritizes **exceptions requiring management attention**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ESS COMMAND CENTER                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ METRICS: Pipeline: ₹14.8L | Collections: ₹3.2L | Outstanding: ₹1.4L      │
├─────────────────────────────────────────────────────────────────────────┤
│ 🚨 NEEDS ATTENTION QUEUE                                                 │
│  🔴 Project ABC: Deadline risk (2 days behind, backend blocked)          │
│  🟠 XYZ Pvt Ltd: ₹30,000 Overdue (Due 3 days ago)                       │
│  🟡 Rahul Patel: Help Request waiting (8 mins - Payment API Blocker)    │
│  🟡 Lead Won: "DEF Retail" needs Project Draft & Team setup             │
├─────────────────────────────────────────────────────────────────────────┤
│ 👥 REAL-TIME TEAM VIEW                                                  │
│  • Rahul Patel: Project ABC (Working - 1h 42m)                           │
│  • Priya Desai: XYZ App (Client Call - 14m)                              │
│  • Meet Shah: Break (Lunch - 22m)                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. CROSS-MODULE DEPENDENCIES GRAPH

```text
[Sales Lead WON] ──► Creates Client & Draft Project ──► Triggers Owner Setup Alert
                                                                │
[Owner Assigns Team & TM] ──► Notifies Employees ──► Appears in Employee Workspace
                                                                │
[Employee Starts Work Session] ──► Updates Real-time Team View ──► Feeds Project Activity Log
                                                                │
[Employee Logs Client Call] ──► Generates Action Item ──► Creates Task & Document Note
                                                                │
[Client Requests New Feature] ──► Creates Change Request ──► Owner Approves ──► Updates Scope & Milestone
                                                                │
[Stage Checklist Item Completed] ──► Recalculates Weighted Progress ──► Updates Client Portal
```

---

## 13. CONTEXTUAL PERMISSION MODEL MATRIX

| Action / Permission Domain | Owner | Sales | Employee (Member) | Employee (TM Context) | Client Portal |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Lead Management** (Create/Update/Delete) | Full | Assigned Only | No | No | No |
| **Convert Lead to Project** | Full | Initiate | No | No | No |
| **Client Management** | Full | View | No | No | Self Profile |
| **Project Creation & Template Setup** | Full | No | No | No | No |
| **Assign / Remove Project Team** | Full | No | No | Recommend | No |
| **Designate Team Manager (TM)** | Full | No | No | No | No |
| **Complete Stage Checklist Items** | Full | No | Assigned Items | All Stage Items | No |
| **Edit Living Project Documentation** | Full | No | Assigned Sections| All Sections | View Published |
| **Submit Scope Change Request** | Full | No | Create Draft | Create Draft | View / Approve |
| **Approve Scope Change Request** | Full | No | No | No | Approve (If Client) |
| **Punch In/Out & Work Sessions** | Full | Self | Self | Self | No |
| **Respond to Help Queue** | Full | No | No | Assist | No |
| **View Financials & Invoices** | Full | Pipeline Only | No | No | Self Invoices |
| **View Audit Feeds & History** | Full | No | Project Activity | Project Activity | Client Updates |

---

## 14. NAVIGATION ARCHITECTURE & SYSTEM SHELL

### Global Header Bar
- Brand Identity: **ESS OS**
- Global Search Trigger (`Cmd/Ctrl + K`)
- Active Punch Status & Timer Widget
- Real-Time Notification Bell & Drawer Trigger
- User Profile & Context Badge

### Left Sidebar (Adapts Contextually)
- **Owner**: Command Center, Sales & CRM, Clients, Projects, Team & HR, Attendance, Help Queue, Finance, Reports, Settings.
- **Sales**: Sales Dashboard, Lead Pipeline, Follow-ups, Activity History.
- **Employee**: My Desk, My Projects, My Work Sessions, Attendance & Leave, Help Queue, Salary Slips.
- **Client**: Project Overview, Scope & Milestones, Project Updates, Change Approvals, Payments & Invoices.

---

## 15. COMPLETE SCREEN INVENTORY

### 1. Global / Auth Screens
- `SCR-001`: Login / Authentication Screen
- `SCR-002`: Password Reset & Account Activation Screen

### 2. Owner Screens
- `SCR-101`: Owner Command Center (Metrics, Needs Attention Queue, Real-time Team View)
- `SCR-102`: Sales CRM Master View (All Leads & Conversion Control)
- `SCR-103`: Client Directory & Client Profile Hub
- `SCR-104`: Project Directory (Filtered by Status, Risk, Deadline)
- `SCR-105`: Project Setup & Team Assignment Workspace
- `SCR-106`: Master Employee Directory & HR Overview
- `SCR-107`: Company Attendance & Work Status Matrix
- `SCR-108`: Master Help Queue ("Sir Help" Control Drawer)
- `SCR-109`: Financial Overview & Milestone Payment Tracker
- `SCR-110`: Audit Log & Activity Stream

### 3. Sales Screens
- `SCR-201`: Sales Dashboard (My Pipeline, Follow-ups Today, Won/Lost Stats)
- `SCR-202`: Lead Pipeline Board (Kanban & List View)
- `SCR-203`: Lead Detail & Communication History View
- `SCR-204`: Follow-up Scheduler & Outcome Modal

### 4. Employee Screens
- `SCR-301`: Employee Workspace ("My Desk", Active Tasks, Work Session Widget)
- `SCR-302`: My Projects Directory (Badge indicators for TM vs Member)
- `SCR-303`: Project Workspace - Team Member View (Checklist, Tasks, Notes)
- `SCR-304`: Project Workspace - TM Management View (Stage control, Blocker tracking)
- `SCR-305`: Project Living Documentation Editor (With Version History)
- `SCR-306`: Client Call & Meeting Recorder Modal
- `SCR-307`: Attendance, Work Sessions & Leave Request View
- `SCR-308`: "Sir Help" Request Drawer

### 5. Client Portal Screens
- `SCR-401`: Client Portal Landing Page (`/portal/[token]`)
- `SCR-402`: Client Safe Progress & Milestones View
- `SCR-403`: Change Request Review & Approval Screen
- `SCR-404`: Invoices & Payment Portal View

---

## 16. IMPORTANT SCREEN STATES MATRIX

| Screen / View | Loading State | Empty State | Populated State | Blocked / Error State | Waiting Approval State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Owner Command Center** | Pulse skeleton grid | "All clear! No pending items needing attention." | Prioritized alert cards & real-time team | Server connection error banner | N/A |
| **Lead Pipeline Board** | Skeleton columns | "No leads in this stage. Drag or add new lead." | Interactive lead cards with overdue badges | Validation error on drop | N/A |
| **Project Playbook View** | Skeleton progress ring & checklists | "No template applied. Select project template." | Weighted progress ring, stage accordion | "Stage blocked by incomplete dependency: Scope Approval" | "Waiting for Client Scope Approval" badge |
| **Employee My Desk** | Skeleton task stack | "No active tasks assigned. Check project workspace." | Task cards, punch timer widget, notes stack | "Punch In Required to start work session" alert | "Help Request Submitted - Waiting for Owner" |
| **Client Portal** | Safe branded loading spinner | "Project initializing. Check back soon!" | Progress bar, published updates timeline, live preview links | Access token expired / unauthorized alert | "Action Required: Approve Change Request #02" |

---

## 17. REUSABLE UI COMPONENT INVENTORY

1. **`StatusBadge`**: Color-coded indicators for Lead Stage, Project Status, Task Status, and Urgency.
2. **`WeightedProgressBar`**: Visual stage progress bar with percentage tooltip and weight label.
3. **`ProjectRoleBadge`**: Contextual badge displaying `TM` (Gold) or `Team Member` (Slate).
4. **`PunchWidget`**: Punch In/Out header button with live timer and status dropdown selector.
5. **`NeedsAttentionCard`**: High-priority alert item card for Owner exception queue.
6. **`VersionDiffViewer`**: Markdown documentation revision history diff viewer.
7. **`ChangeRequestCard`**: Comparison card highlighting *Original Requirement* vs *Requested Change* vs *Cost/Timeline Impact*.
8. **`ClientVisibilityToggle`**: Eye icon toggle (`INTERNAL` vs `CLIENT_VISIBLE`) for notes, updates, and files.

---

## 18. NOTIFICATIONS & ATTENTION SYSTEM

### Alert Priority Channels
1. **CRITICAL (Red Alert)**: Immediate Owner notification for overdue payments > 3 days, project deadline breaches, and emergency Help Requests.
2. **HIGH (Orange Alert)**: New Help Request submitted, Change Request requiring approval, Lead WON needing project creation.
3. **MEDIUM (Yellow Alert)**: Task assignment, client call recorded, document updated, upcoming follow-up due in 30 mins.
4. **INFO (Blue Notification)**: Stage checklist completed, leave request status update.

---

## 19. CLIENT VS. INTERNAL INFORMATION VISIBILITY RULES

```text
┌───────────────────────────────┬─────────────────┬─────────────────┐
│ ENTITY / FIELD                │ INTERNAL USERS  │ CLIENT PORTAL   │
├───────────────────────────────┼─────────────────┼─────────────────┤
│ Project Name & Summary        │ Visible         │ Visible         │
│ Weighted Progress %           │ Visible         │ Visible         │
│ Playbook Stage Name           │ Visible         │ Safe Alias Only │
│ Internal Employee Notes       │ Visible         │ HIDDEN          │
│ Published Project Updates     │ Visible         │ Visible         │
│ Contract Total & Financials   │ Owner/Acct Only │ Client Invoices │
│ Developer Hourly Work Sessions│ Visible         │ HIDDEN          │
│ Live / Staging URLs           │ Visible         │ Visible         │
│ Change Request Cost Impact    │ Visible         │ Client Total    │
│ Raw Activity Audit Logs       │ Visible         │ HIDDEN          │
└───────────────────────────────┴─────────────────┴─────────────────┘
```

---

## 20. IDENTIFIED REQUIREMENT CONFLICTS & RESOLUTIONS

- **Conflict 1 (Roles)**: Older PRD listed 11 static roles (Developer, QA, PM, etc.), whereas the new instruction specifies 4 primary user contexts and contextual project TM authority.
  - **Resolution**: Implemented the 4 primary contexts (`OWNER`, `SALES`, `EMPLOYEE`, `CLIENT`) with `TM` authority evaluated dynamically per project.
- **Conflict 2 (Role Switcher)**: Older references suggested a role switcher dropdown.
  - **Resolution**: Removed all production role switching UI. User experience adapts strictly based on session and project context.

---

## 21. EXPLICIT ARCHITECTURAL ASSUMPTIONS

1. **Primary Currency & Region**: Default currency is INR (₹) with Indian Standard Time (IST) work schedules.
2. **Device Target**: Owner, PM, Sales, and Accounting interfaces are optimized for Desktop / Tablet. Punch In/Out, Help Requests, and Follow-up logging are mobile-first responsive.
3. **Documentation Engine**: Living documentation uses Markdown with revision diff tracking.

---

## 22. PRODUCT DECISION LOG

- **`DEC-001`**: Simplified system to 4 Primary User Contexts (`OWNER`, `SALES`, `EMPLOYEE`, `CLIENT`).
- **`DEC-002`**: Team Manager (`TM`) defined as a project-level responsibility, not a global role.
- **`DEC-003`**: Eliminated user-facing role switching dropdowns in favor of automatic contextual adaptation.
- **`DEC-004`**: Project progress uses weighted stage progression ($P = \sum S_i \times W_i$).
- **`DEC-005`**: Preserved project history through immutable membership and activity audit logging.
- **`DEC-006`**: Built "Sir Help" Queue directly into Owner Exception Center.

---

## 23. GENUINE CLARIFYING QUESTIONS

*No blocking questions currently exist. The UI Architecture Plan is complete, consistent, and ready for review.*

---

### VERIFICATION STATEMENT
> This UI Product Architecture Plan strictly enforces all guidelines from the AI Product Architect Instruction. **No backend code, database migrations, API routes, or React UI components have been generated.** Execution is paused pending your review and approval.
