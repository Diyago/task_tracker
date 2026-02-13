# Manager's Hybrid Kanban

A hybrid kanban board tailored for data science leads. It separates strategic work, planned work, urgent focus, and operational noise while tracking due dates and workload totals.

<img width="1064" height="722" alt="image" src="https://github.com/user-attachments/assets/e9ee1074-261d-4ea4-beb8-3c7a30d20c67" />


## Features

- Drag and drop tasks across columns
- Column workload totals with an urgent overload warning
- Due dates and lightweight task metadata
- Local persistence via `localStorage`
- Export-ready data (XLSX)

## Tech Stack

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Zustand

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Run as PWA (Installable App)

PWA is enabled only in production builds.

1. Build:

```bash
npm run build
```

2. Start the production server:

```bash
npm run start
```

3. Open http://127.0.0.1:3000 in Chrome/Edge and click the Install icon in the address bar.

Notes:
- PWA is disabled in dev (`npm run dev`) by `next-pwa` to avoid cache issues.
- The manifest is generated from `src/app/manifest.ts` and referenced in `src/app/layout.tsx`.

### Install via Conda/Pip-only permissions

If you can only install software through `conda`/`pip`, use conda to get Node.js (which includes `npm`), then install project deps:

```bash
conda create -n kanban-node -y nodejs=20
conda activate kanban-node
npm install
```

Then run:

```bash
npm run dev
```

## Scripts

- `npm run dev` Start the dev server
- `npm run build` Build for production
- `npm run start` Run the production server
- `npm run lint` Lint the project

## Notes

- Drag tasks across columns to reprioritize work.
- Each column shows a Total Time badge; the Urgent column warns when over 6 hours.
- Updates persist to `localStorage`.
