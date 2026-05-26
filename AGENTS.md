## Project Structure

- `src/app/components`: page-level UI, feature components, and shared view logic.
- `src/app/data`: runtime data, types, and workflow/state mapping helpers.
- `src/app/context`: shared application context.
- `src/app/api` and `src/app/stores`: data access and state orchestration.
- `tests/unit`: fast unit coverage for data and helper behavior.
- `tests/e2e`: Playwright flows for user journeys.
- `public/`: static assets and sample files.

## State Model

- `status` and `workflowState` are different concepts.
- `status` is the item lifecycle state: `Draft`, `Retired`, `Compromised`, `Published`.
- `workflowState` is the backend processing pipeline state defined in `src/app/data/types.ts`.
- Use the shared helpers in `src/app/data/workflowState.ts` for workflow-state labels and comparisons.
- Avoid ad-hoc string comparisons in components when a shared type or helper exists.

## Source Of Truth

- Backend/logical workflow states are canonical.
- UI labels are presentation-only and must be derived from mapping helpers.
- Do not use ad-hoc workflow-state string literals in components.
- Item status values remain unchanged: Draft, Retired, Compromised, Published.

## Canonical Workflow States

- NOT_STARTED: Item is ingested and not yet put in pre-testing pipeline.
- IN_SCREENING: Item is put into screening queue.
- PENDING_SCREENING_REVIEW: Waiting for human review on AI screening.
- SCREENING_APPROVED: Human approved screening results.
- SCREENING_REJECTED: Human rejected screening results.
- IN_DIFFICULTY_ESTIMATION: Item is put into AI difficulty estimation.
- PENDING_DP_REVIEW: Waiting for human review on difficulty estimation.
- DP_APPROVED: Human approved difficulty estimation results.
- DP_REJECTED: Human rejected difficulty estimation results.
- RECOMMENDED_FOR_SEEDING: Item is recommended for seeding.
- SEEDED: Item is currently seeded.

## UI Copy Policy

- Keep existing UI copy unchanged.
- Convert backend codes to legacy display labels through the shared mapping helper in src/app/data/workflowState.ts.
- If a new UI display is added, use getWorkflowStateLabel(...) instead of rendering raw codes.

## Question Data Policy

- Treat src/app/data/questions.json as the runtime source for mapped item data.
- Do not consume skillDetails.*.extendedData in runtime mapping or UI rendering.
- Keep runtime fields flattened (for example: passageTitle and instructions on skillDetails.reading) instead of reading nested originalItem/sourceData structures.
- Example: prefer flattened item fields in runtime code instead of nested reads such as `item.skillDetails.reading.extendedData.originalItem`.

## Author Policy

- Never use "AI Content Generator" as an item author.
- Use realistic human names from the master author list in src/app/components/IngestItems.tsx (`INGEST_AUTHORS`).
- Apply this policy consistently across src/app/data/questions.json, src/app/data/generatedQuestions.json, and src/app/data/generatedAssessmentItems.json, including nested author fields.
