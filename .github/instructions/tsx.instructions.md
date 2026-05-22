---
applyTo: "**/*.tsx"
---

# TSX File Instructions

Use these defaults when creating or editing TSX files in this repository.

## Component Style

- Prefer TypeScript function components.
- Keep props typed with a dedicated type or interface.
- Match nearby file style for exports and naming.

## Project Patterns

- Reuse existing UI primitives in src/app/components/ui before creating new low-level UI.
- Keep route changes centralized in src/app/routes.tsx.
- Keep domain models aligned with src/app/data/types.ts when UI relies on item data.

## Imports And Structure

- Prefer @/ import alias for src imports.
- Keep files focused; extract reusable logic into helper functions or small components.
- Avoid large refactors unless explicitly requested.

## Styling And UX

- Prefer existing Tailwind utility patterns used in nearby components.
- Preserve current workflow behavior unless the task explicitly changes it.
- Ensure interactive elements are accessible (labels, keyboard support, clear button text).

## Validation

- After non-trivial TSX changes, run a build check with pnpm build.
