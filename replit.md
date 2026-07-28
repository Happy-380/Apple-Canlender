# Apple Calendar

A full-featured Apple Calendar clone for the web — supporting Day, Week, Month, Year, and Schedule views with event CRUD, categories, tags, and reminders. Styled in Apple Liquid Glass design language.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port auto-assigned)
- `pnpm --filter @workspace/apple-calendar run dev` — run the frontend (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, framer-motion, react-day-picker
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — Drizzle schema (events, categories, tags, event_tags, reminders, relations)
- `artifacts/api-server/src/routes/` — Express route handlers (events, categories, tags, reminders, summary)
- `artifacts/apple-calendar/src/` — React frontend
  - `context/calendar-context.tsx` — global calendar state (current date, view, hidden categories, tag filter)
  - `components/header.tsx` — top bar with view switcher, nav arrows, Today, New Event
  - `components/sidebar.tsx` — mini calendar, category/tag lists
  - `components/views/` — DayView, WeekView, MonthView, YearView, ScheduleView
  - `components/event-modal.tsx` — create/edit event modal

## Architecture decisions

- Calendar view switching uses React state (not router routes) — all 5 views are in one page component.
- `useListEvents` is called with `startDate`/`endDate` scoped to the visible window to keep queries efficient.
- Tags only support create/delete (no PATCH endpoint) — editing a tag's name/color requires delete + recreate.
- All event mutations invalidate the `getListEventsQueryKey` cache so views refresh automatically.
- The `event_tags` join table uses a composite primary key `(event_id, tag_id)`.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run codegen before using new hooks.
- After changing `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs` so API server sees fresh types.
- `react-day-picker` v9 uses `Chevron` component (not `IconLeft`/`IconRight`) for navigation customization.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
