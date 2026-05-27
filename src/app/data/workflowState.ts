import { WorkflowState } from './types';

const WORKFLOW_LABELS: Record<WorkflowState, string> = {
  NOT_STARTED: 'Draft',
  IN_SCREENING: 'In Screening',
  PENDING_SCREENING_REVIEW: 'Screening Review',
  SCREENING_APPROVED: 'Screening Passed',
  SCREENING_REJECTED: 'Screening Review',
  IN_DIFFICULTY_ESTIMATION: 'In Difficulty Estimation',
  PENDING_DP_REVIEW: 'Difficulty Estimation Review',
  DP_APPROVED: 'Live',
  DP_REJECTED: 'Difficulty Estimation Review',
  RECOMMENDED_FOR_SEEDING: 'Difficulty Estimation Review',
  SEEDED: 'Seeded',
};

const LEGACY_TO_WORKFLOW: Record<string, WorkflowState> = {
  Draft: 'NOT_STARTED',
  'In Screening': 'IN_SCREENING',
  'Screening Review': 'PENDING_SCREENING_REVIEW',
  'Screening Passed': 'SCREENING_APPROVED',
  'In Difficulty Prediction': 'IN_DIFFICULTY_ESTIMATION',
  'In Difficulty Estimation': 'IN_DIFFICULTY_ESTIMATION',
  'Difficulty Prediction Review': 'PENDING_DP_REVIEW',
  'Difficulty Estimation Review': 'PENDING_DP_REVIEW',
  Live: 'DP_APPROVED',
  Seeded: 'SEEDED',
  'In Review': 'PENDING_SCREENING_REVIEW',
  Approved: 'SCREENING_APPROVED',
  Calibrated: 'PENDING_DP_REVIEW',
  Retired: 'SCREENING_REJECTED',
};

export const REVIEW_WORKFLOW_STATES: WorkflowState[] = ['PENDING_SCREENING_REVIEW', 'PENDING_DP_REVIEW'];
export const PIPELINE_WORKFLOW_STATES: WorkflowState[] = [
  'NOT_STARTED',
  'IN_SCREENING',
  'PENDING_SCREENING_REVIEW',
  'SCREENING_APPROVED',
  'IN_DIFFICULTY_ESTIMATION',
  'PENDING_DP_REVIEW',
  'RECOMMENDED_FOR_SEEDING',
];

export const normalizeWorkflowStateInput = (state: string | undefined): WorkflowState | undefined => {
  if (!state) {
    return undefined;
  }

  if (state in WORKFLOW_LABELS) {
    return state as WorkflowState;
  }

  return LEGACY_TO_WORKFLOW[state];
};

export const getWorkflowStateLabel = (state: string | undefined): string => {
  if (!state) {
    return 'Unknown';
  }

  const normalized = normalizeWorkflowStateInput(state);
  if (!normalized) {
    return state;
  }

  return WORKFLOW_LABELS[normalized];
};

export const isWorkflowState = (state: string | undefined, target: WorkflowState): boolean => {
  return normalizeWorkflowStateInput(state) === target;
};

export const isAnyWorkflowState = (state: string | undefined, states: WorkflowState[]): boolean => {
  const normalized = normalizeWorkflowStateInput(state);
  return normalized ? states.includes(normalized) : false;
};
