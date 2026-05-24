# Agent Status Conventions

This document defines canonical backend workflow states for this repository.

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
