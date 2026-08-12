<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 💧 PWA Corporate Identity (CI) & System Guidelines

Application standards for **Provincial Waterworks Authority (การประปาส่วนภูมิภาค - กปภ.)** fullstack web platform.

## 🎨 1. PWA Official Color Palette & Aesthetics

- **PWA Primary Water Blue (`pwa-blue`)**: `#0072BC` / HSL `(204, 100%, 37%)` — Core brand color representing clean water services.
- **PWA Deep Navy (`pwa-navy`)**: `#003366` / HSL `(210, 100%, 20%)` — Enterprise Dark theme background & primary accents.
- **PWA Water Cyan (`pwa-cyan`)**: `#00A8FF` / HSL `(200, 100%, 50%)` — Accent highlights, active states, and glowing indicators.
- **PWA Logo Gold (`pwa-gold`)**: `#E5A823` / HSL `(42, 80%, 52%)` — Secondary accent for badges, alerts, and emblem accents.
- **Backgrounds**: Crisp white `#FFFFFF` / Soft Light `#F8FAFC` (Light mode) / Deep abyss navy `#0B192C` (Dark mode).

---

## 🛠️ 2. Technology Stack & Framework Specs

- **Framework**: Next.js 16.x (App Router)
- **Runtime & Package Manager**: Bun v1.x (`bun@1.3.x`)
- **Database**: PostgreSQL 15+ / 16+ (`pg` connection pool)
- **ORM**: Drizzle ORM (`drizzle-orm/pg-core` & `drizzle-kit`)
- **Language**: TypeScript 5.x (Strict mode)
- **Styling**: Tailwind CSS v4 + PWA CI Customized Theme
- **UI Component Library**: Shadcn UI (Radix UI primitives + CVA)
- **Fonts**: Google Fonts `Prompt` (Web UI) & `Sarabun` (Official Documents) via `next/font/google`
- **Validation**: Zod
- **Authentication**: Stateful Database Sessions (`sessions` table in PostgreSQL)

---

## 🏗️ 3. Architecture & Coding Conventions

- **UI Component Layer**: All reusable base UI components (`Button`, `Dialog`, `Card`, `Input`, `Textarea`, `Badge`, `Select`, etc.) MUST reside in `components/ui/` leveraging Shadcn UI / Radix UI primitives with PWA CI styling.
- **Dynamic Styling Guard**: Always use `cn(...)` from `@/lib/utils` (`clsx` + `tailwind-merge`) when concatenating or overriding Tailwind CSS class names.
- **Tailwind v4 Semantic Theme Rules**: Utilize mapped semantic utility classes (`bg-card`, `text-card-foreground`, `bg-primary`, `border-border`, `ring-ring`) from `@theme inline` in `app/globals.css` to maintain strict UI consistency.
- **Data Fetching (Read)**: Use React Server Components (RSC) inside `server/queries/` with type-safe Drizzle queries.
- **Data Mutations (Write)**: Use Next.js Server Actions (`'use server'`) inside `server/actions/` validated with Zod schemas.
- **Database Layer**: Declare schemas in `db/schema/index.ts`. Export inferred types (`$inferSelect`, `$inferInsert` or `InferSelectModel`, `InferInsertModel`) and relations.
- **Error Handling**: Graceful error handling with descriptive Thai user messages and logging.

---

## 🗄️ 4. Database & Drizzle ORM Guidelines

- **Schema Definition**: All table definitions MUST use `drizzle-orm/pg-core` constructs (`pgTable`, `serial`, `varchar`, `timestamp`, `pgEnum`, etc.) in `@/db/schema/index.ts`.
- **Database Operations CLI**: Always execute database management commands via Bun:
  - Generate migrations: `bun db:generate`
  - Push schema changes: `bun db:push`
  - Seed database: `bun db:seed`
  - Open Drizzle Studio: `bun db:studio`
- **Type Imports**: Always export and consume type definitions (`User`, `Asset`, `BorrowRequest`, etc.) directly from `@/db/schema`.

---

## 🔐 5. Security & Production Rules

- **Zero Hardcoded Credentials**: Never write hardcoded fallback database URLs or passwords in code files (`db/index.ts` or `drizzle.config.ts`). Always require `process.env.DATABASE_URL`.
- **Server Isolation Guard**: Always import `'server-only'` at the top of server-only modules (`db/index.ts`, `server/queries/`, `server/actions/`) to prevent client-side leaks.
- **Git Safety**: Ensure all `.env*` files are strictly gitignored in `.gitignore`.
- **SQL Injection Prevention**: Rely strictly on Drizzle ORM parameterized queries; avoid raw SQL concatenations.

---

## 🛡️ 6. Stateful Database Authentication & RBAC Rules

- **Mandatory Login Policy**: Every application route (`/`, `/assets`, `/borrow`, `/admin/*`) MUST require a valid authenticated database session. Unauthenticated requests MUST automatically redirect to `/login`.
- **Stateful PostgreSQL Session Store**: All active sessions MUST be stored in the PostgreSQL `sessions` table (`id`, `user_id`, `expires_at`). Revoking a session record from `sessions` MUST invalidate access immediately.
- **Secure Cookie Standard**: Session tokens MUST be transmitted exclusively via `HttpOnly`, `SameSite=Lax` cookies (`pwa_session_id`).
- **Role-Based Access Control (RBAC)**:
  - **`user` (พนักงานทั่วไป)**: Can search assets, submit borrow requests, and view personal borrowing history (`/borrow`). Strictly blocked from `/admin/*`.
  - **`admin` (เจ้าหน้าที่ IT)**: Full access to the Admin Approval Center (`/admin/requests`), request approval/rejection, asset handover, and return processing.
- **Server Action Authorization Guards**: Every administrative Server Action MUST call `getCurrentUserSession()` and verify `userSession.role === 'admin'` before mutating data.

---

## ⚡ 7. Server Actions & Standard Response Pattern

- **Action Response Contract**: All Server Actions MUST return a predictable response pattern:
  ```ts
  type ActionResponse<T = undefined> = {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
  };
  ```
- **Zod Validation**: Input parameters MUST be validated using Zod schemas before performing database queries.
- **Error Response Safeguard**: Return user-friendly Thai error messages on caught exceptions instead of unhandled server crashes.

---

## 🎨 8. Clean Minimal Light Aesthetics & UX Guidelines

- **Clean Light Theme Priority**: Every application page MUST use a clean, minimal, bright light theme (`bg-[#F8FAFC]` or `bg-slate-50`) that is extremely comfortable on the eyes. Avoid dark, heavy card backgrounds on internal pages.
- **Pure White Cards (`bg-white`)**: Content containers MUST be pure white cards with soft rounded corners (`rounded-3xl`), light borders (`border-slate-200/70`), and soft drop shadows (`shadow-xl shadow-slate-200/30`).
- **Compact & High-Contrast Typography**: Headings must use bold, crisp typography with PWA Primary Blue (`#0072BC`) or Deep Navy (`#003366`). Sub-boxes must use soft gray backgrounds (`bg-slate-50 border-slate-100`) with vibrant, readable metric numbers.
- **User Feedback & Loading States**: Provide responsive interactive states (`useTransition`, disabled/pending buttons) and informative localized feedback during async operations.
- **No Redundant Navigation Buttons**: Page body content MUST NOT contain redundant navigation buttons that duplicate the main top Navbar links.

---

## 🌿 9. Git & Version Control Standards

- **Conventional Commit Messages**: All git commits MUST follow the Conventional Commits specification:
  - `feat:` New features or UI components
  - `fix:` Bug fixes or schema corrections
  - `docs:` Documentation & rule updates (`AGENTS.md`, `README.md`)
  - `refactor:` Code refactoring without behavior changes
  - `style:` Formatting, UI style tweaks, or Tailwind updates
  - `chore:` Dependency, build script, or `.gitignore` maintenance
- **Git Safety & Credentials Guard**: NEVER commit `.env`, `.env.local`, or any file containing database credentials, tokens, or secret keys. Ensure `.env*` remains strictly gitignored in `.gitignore`.
- **Clean Working Tree Policy**: Verify that code builds without errors before committing and pushing to `main` or feature branches.

