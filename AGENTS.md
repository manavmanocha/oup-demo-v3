# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Snapshot

- Stack: React 18 + Vite 6 + React Router 7 + Tailwind CSS 4 + shadcn/ui (Radix).
- App type: single-page assessment workflow demo.
- Data source: local mock data files under `src/app/data` (no backend integration in this repo).

Reference docs:
- [README.md](README.md)
- [guidelines/Guidelines.md](guidelines/Guidelines.md)
- [ATTRIBUTIONS.md](ATTRIBUTIONS.md)

## Commands

Prefer `pnpm` in this repo.

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`

Notes:
- There are no configured `test`, `lint`, or `typecheck` scripts in `package.json`.
- Validate changes by running `pnpm build` after non-trivial edits.

## Architecture Map

- Entry: `src/main.tsx`
- App shell: `src/app/App.tsx`
- Routing: `src/app/routes.tsx`
- Auth/session demo context: `src/app/context/AuthContext.tsx`
- Domain types and mock dataset: `src/app/data/types.ts`, `src/app/data/mockData.ts`
- UI primitives: `src/app/components/ui/*`
- Feature screens: `src/app/components/*`

## Conventions To Follow

- Use TypeScript React function components and existing export style in nearby files.
- Keep route additions centralized in `src/app/routes.tsx`.
- Reuse existing UI primitives from `src/app/components/ui` before introducing new patterns.
- Prefer existing import alias style with `@/` where appropriate.
- Keep changes scoped and avoid broad refactors unless requested.

## Build System Gotchas

- Do not remove the React and Tailwind plugins from `vite.config.ts`; both are required for this project setup.
- Do not break `figma:asset/...` imports; `vite.config.ts` contains a custom resolver for them.
- Keep `assetsInclude` restrictions in `vite.config.ts` intact unless there is a clear requirement.

## Data And Behavior Gotchas

- Many screens rely on the shape of `AssessmentItem`; keep `src/app/data/types.ts` and data producers in sync.
- `AuthContext` uses hardcoded demo credentials and `localStorage`; do not treat it as production auth.
- This is a demo app with mock workflows; preserve existing UX flows unless a task explicitly changes them.

## When Unsure

- Prefer linking to and following [README.md](README.md) and [guidelines/Guidelines.md](guidelines/Guidelines.md) over duplicating large guidance blocks.
- If a change impacts multiple workflows, call out impacted routes and components in your summary.
