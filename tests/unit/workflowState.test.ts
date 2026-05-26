import { describe, expect, it } from 'vitest';
import {
  getWorkflowStateLabel,
  isAnyWorkflowState,
  isWorkflowState,
  normalizeWorkflowStateInput,
  REVIEW_WORKFLOW_STATES,
} from '../../src/app/data/workflowState';

describe('workflowState helpers', () => {
  it('normalizes canonical and legacy workflow values', () => {
    expect(normalizeWorkflowStateInput('PENDING_SCREENING_REVIEW')).toBe('PENDING_SCREENING_REVIEW');
    expect(normalizeWorkflowStateInput('In Review')).toBe('PENDING_SCREENING_REVIEW');
    expect(normalizeWorkflowStateInput('Approved')).toBe('SCREENING_APPROVED');
    expect(normalizeWorkflowStateInput('Calibrated')).toBe('PENDING_DP_REVIEW');
    expect(normalizeWorkflowStateInput('Retired')).toBe('SCREENING_REJECTED');
    expect(normalizeWorkflowStateInput(undefined)).toBeUndefined();
    expect(normalizeWorkflowStateInput('Not A Workflow State')).toBeUndefined();
  });

  it('resolves workflow labels for canonical and unknown values', () => {
    expect(getWorkflowStateLabel('SCREENING_APPROVED')).toBe('Screening Passed');
    expect(getWorkflowStateLabel('Unknown State')).toBe('Unknown State');
    expect(getWorkflowStateLabel(undefined)).toBe('Unknown');
  });

  it('checks exact and any-match workflow state helpers', () => {
    expect(isWorkflowState('In Review', 'PENDING_SCREENING_REVIEW')).toBe(true);
    expect(isWorkflowState('Retired', 'SCREENING_REJECTED')).toBe(true);
    expect(isAnyWorkflowState('PENDING_DP_REVIEW', REVIEW_WORKFLOW_STATES)).toBe(true);
    expect(isAnyWorkflowState('SCREENING_APPROVED', REVIEW_WORKFLOW_STATES)).toBe(false);
    expect(isAnyWorkflowState(undefined, REVIEW_WORKFLOW_STATES)).toBe(false);
  });
});
