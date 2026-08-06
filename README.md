# Lumen — Calm, Time-Aware Personal Planner

**Lumen** is a local-first, time-aware personal productivity and planning web application. Designed around focus, clarity, and intentional workload management, Lumen combines task capture, nested checklists, smart reminders, and a 7-day week planning canvas into a calm, responsive interface.

---

## ✨ Features

- 📥 **Inbox & Custom Lists**: Capture undated tasks instantly into the Inbox or group them into custom color-coded project lists.
- ☀️ **Today & Overdue Focus**: Automatic grouping for tasks due today, with prominent alerts for overdue items.
- 🗓️ **Week Planner Canvas**: 7-day timeline view (Monday to Sunday) for distributing and scheduling workload across the week.
- ⚡ **Smart Quick-Add Command Bar (`N` or `/`)**: Natural language text parser that auto-tags metadata in real-time:
  - `^today` or `^tomorrow` $\rightarrow$ Sets due date
  - `!high`, `!medium`, `!low` $\rightarrow$ Assigns priority level
  - `@work`, `@personal` $\rightarrow$ Categorizes into matching list
  - `#5pm` $\rightarrow$ Schedules a reminder time
- ✅ **Nested Checklist Subtasks**: Add interactive subtasks to any todo with completion progress tracking (`3/5`).
- 🔔 **Reminders & Browser Alerts**: Native browser Web Notifications plus interactive floating toast alerts when scheduled reminders trigger.
- ⌨️ **Keyboard Shortcuts (`?`)**:
  - `N` or `/`: Focus Quick-Add input bar
  - `Esc`: Close detail panel or modal
  - `?`: Toggle keyboard shortcuts guide
- 🔒 **Local-First & Offline**: Data is stored securely on device using IndexedDB (`idb-keyval`) — instant response with no external login required.
- 📆 **Calendar Export (iCal)**: Download a `.ics` snapshot anytime, or (when signed in) subscribe via a private feed URL in Apple Calendar / Google Calendar / Outlook.
- 📱 **Installable PWA**: Add Lumen to your home screen; the app shell is cached offline via Serwist while task data stays in IndexedDB.
- 🎨 **Calm Aesthetic**: Warm serif typography (_Fraunces_ + _Plus Jakarta Sans_), grain atmosphere, animated checkmark strokes, and celebratory confetti effects.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State & Storage**: [Zustand](https://github.com/pmndrs/zustand) + [idb-keyval](https://github.com/jakearchibald/idb-keyval) (IndexedDB)
- **Auth / Sync**: [Supabase](https://supabase.com) (optional)
- **PWA**: [Serwist](https://serwist.pages.dev) (`@serwist/turbopack` for Next.js 16)
- **Icons**: Lucide React
- **Micro-interactions**: Canvas Confetti

---

## 📁 Project Structure

```
lumen/
├── src/
│   ├── app/
│   │   ├── globals.css          # Custom animations, grain atmosphere & Tailwind setup
│   │   ├── layout.tsx           # Google Fonts & Root layout shell
│   │   └── page.tsx             # Home page workspace layout & view filtering
│   ├── components/
│   │   ├── Sidebar.tsx          # 240px navigation rail (views, lists, reminder status)
│   │   ├── MainHeader.tsx       # Dynamic view header, search bar & status filter tabs
│   │   ├── QuickAdd.tsx         # Smart command bar with inline tag parser
│   │   ├── TodoGroup.tsx        # Collapsible task section buckets
│   │   ├── TodoRow.tsx          # Animated task row with metadata badges
│   │   ├── DetailPanel.tsx      # 360px slide-over panel (notes, subtasks, reminder picker)
│   │   ├── WeekView.tsx         # 7-day timeline planner grid
│   │   ├── ShortcutsModal.tsx   # Keyboard shortcuts cheatsheet modal
│   │   └── ReminderListener.tsx # Background reminder polling & alert toast
│   └── lib/
│       ├── types.ts             # TypeScript interface definitions
│       ├── store.ts             # Zustand store & IndexedDB persistence logic
│       ├── dates.ts             # ISO date utilities & 7-day calculations
│       └── reminders.ts         # Notification API permission & trigger helpers
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v24.11.1 (or v24+)
- npm / yarn / pnpm

### Installation

1. Clone the repository and navigate into the folder:

   ```bash
   cd lumen
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Code quality hooks

Husky runs these checks on every commit (`npm run precommit`):

1. **Format** — Prettier (`npm run format`)
2. **Lint** — ESLint (`npm run lint`)
3. **Build** — Next.js production build (`npm run build`)

If any step fails, the commit is blocked.

> **Backlog:** Add a proper local testing framework (unit/integration) and wire it into a **pre-push** hook so tests run before pushing changes.

### Calendar subscribe feed (optional)

1. In Supabase SQL Editor, run [`supabase/migration_calendar_feed.sql`](supabase/migration_calendar_feed.sql).
2. Add a **server-only** secret to `.env.local` (and Vercel):

   ```env
   SUPABASE_SECRET_KEY=your-secret-key-here
   ```

3. Sign in → open **Account & Sync** → copy the subscribe URL or use **Open in Calendar**.
4. Guests can still use **Export .ics** from the sidebar footer (one-time download).

### Install as a PWA

1. Deploy over HTTPS (or use `localhost`).
2. In Chrome/Edge: install from the address bar, or use the **Install app** hint in the sidebar when offered.
3. On iOS Safari: Share → **Add to Home Screen**.

---

## 💡 Keyboard Shortcuts

| Shortcut                     | Description                                |
| :--------------------------- | :----------------------------------------- |
| <kbd>N</kbd> or <kbd>/</kbd> | Focus Quick-Add input bar                  |
| <kbd>Esc</kbd>               | Close task detail panel or shortcuts modal |
| <kbd>?</kbd>                 | Open keyboard shortcuts guide              |
| `^today`                     | Set due date to Today in Quick-Add         |
| `^tomorrow`                  | Set due date to Tomorrow in Quick-Add      |
| `!high`                      | Set High priority in Quick-Add             |
| `@listName`                  | Assign to custom List in Quick-Add         |
| `#5pm`                       | Schedule reminder alert for 5:00 PM        |

---

## 📄 License

MIT License. Built with care as a modern personal planner.
