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
- 🎨 **Calm Aesthetic**: Warm serif typography (*Fraunces* + *Plus Jakarta Sans*), grain atmosphere, animated checkmark strokes, and celebratory confetti effects.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State & Storage**: [Zustand](https://github.com/pmndrs/zustand) + [idb-keyval](https://github.com/jakearchibald/idb-keyval) (IndexedDB)
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

---

## 💡 Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| <kbd>N</kbd> or <kbd>/</kbd> | Focus Quick-Add input bar |
| <kbd>Esc</kbd> | Close task detail panel or shortcuts modal |
| <kbd>?</kbd> | Open keyboard shortcuts guide |
| `^today` | Set due date to Today in Quick-Add |
| `^tomorrow` | Set due date to Tomorrow in Quick-Add |
| `!high` | Set High priority in Quick-Add |
| `@listName` | Assign to custom List in Quick-Add |
| `#5pm` | Schedule reminder alert for 5:00 PM |

---

## 📄 License

MIT License. Built with care as a modern personal planner.
