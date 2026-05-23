# TaskFlow

A premium, dark-themed task management workspace inspired by Linear, Notion, and ClickUp — built on React + TanStack Start with a fully managed cloud backend (Postgres + Auth + RLS + Edge Functions).

## Features

**Authentication**
- Email + password sign up / sign in
- Persistent session, protected routes
- Forgot password + reset flow

**Roles**
- `admin` and `user` (stored in a dedicated `user_roles` table — never on `profiles`, to prevent privilege escalation)

**For users**
- Create / edit / delete tasks
- Status (Todo / In progress / Done) · Priority (Low → Urgent) · Due dates
- Search, filter, sort
- Kanban board with column-to-column moves
- Personal dashboard with charts (status pie, weekly created vs completed)
- Activity feed of your own actions

**For admins**
- Workspace overview with KPIs and a 14-day velocity chart
- User management table — activate/deactivate, grant/revoke admin, remove
- Workspace-wide activity stream

**Activity logging** — login, signup, task created/updated/deleted/status changed, user activated/deactivated, role changed.

## Tech

- React 19 + TanStack Start + TanStack Router (file-based)
- Tailwind CSS v4 + shadcn/ui
- Framer Motion (animation), Recharts (charts), sonner (toasts), lucide-react (icons)
- Lovable Cloud (Postgres + Auth + Row Level Security)
- TypeScript end-to-end

## Project structure

```
src/
├── components/
│   ├── auth/require-auth.tsx
│   ├── layout/app-shell.tsx
│   ├── tasks/task-modal.tsx
│   ├── ui/            # shadcn primitives
│   └── ui-ext/        # StatCard, badges
├── context/auth-context.tsx
├── integrations/supabase/   # auto-generated client + types — do not edit
├── lib/activity.ts
├── routes/            # file-based routes
│   ├── index.tsx              landing
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   ├── dashboard.tsx
│   ├── tasks.tsx              list view
│   ├── board.tsx              kanban
│   ├── activity.tsx
│   └── admin/
│       ├── index.tsx          admin overview
│       └── users.tsx          user management
├── styles.css         design tokens
└── types/task.ts
```

## Database

Tables: `profiles`, `user_roles`, `tasks`, `activity_logs`.
Enums: `app_role`, `task_status`, `task_priority`, `activity_action`.
Triggers: auto-create profile + assign default role on signup, auto-touch `updated_at`, auto-set `completed_at` when a task moves to `done`.
Helpers: `has_role(uuid, app_role)`, `is_admin(uuid)` — `SECURITY DEFINER`, fixed `search_path`.

Row Level Security: all four tables are RLS-on. Users see only their own data; admins see everything (via the `is_admin` helper inside policies).

## Running locally

```bash
bun install
bun dev
```

Build: `bun run build`. Preview: `bun run preview`.

 
