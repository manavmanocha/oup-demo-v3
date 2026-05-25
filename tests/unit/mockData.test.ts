import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acceptPredictedItems,
  addIngestedItems,
  applyDifficultyPredictions,
  getAllItems,
  moveItemsToSeeded,
  queueItemsForScreening,
  approveScreenedItems,
  rejectScreenedItems,
} from '../../src/app/data/mockData';
import type { AssessmentItem } from '../../src/app/data/types';

describe('mockData workflow mutations', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('queues items for screening and records screening results', () => {
    const target = getAllItems().find((item) => item.workflowState === 'NOT_STARTED');
    expect(target).toBeDefined();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.95);

    queueItemsForScreening([target!.id]);

    const queued = getAllItems().find((item) => item.id === target!.id);
    expect(queued?.workflowState).toBe('PENDING_SCREENING_REVIEW');
    expect(queued?.flaggedForReview).toBe(true);
    expect(queued?.screening).toMatchObject({
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    });
    expect(queued?.reviewHistory?.at(-1)?.action).toContain('Screening Auto-Completed');
  });

  it('approves and rejects screened items with expected lifecycle updates', () => {
    const target = getAllItems().find((item) => item.workflowState === 'NOT_STARTED');
    expect(target).toBeDefined();

    vi.spyOn(Math, 'random').mockReturnValue(0.95);
    queueItemsForScreening([target!.id]);

    approveScreenedItems([target!.id]);
    const approved = getAllItems().find((item) => item.id === target!.id);
    expect(approved?.workflowState).toBe('SCREENING_APPROVED');
    expect(approved?.flaggedForReview).toBe(false);
    expect(approved?.screening).toMatchObject({
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    });

    rejectScreenedItems([target!.id]);
    const rejected = getAllItems().find((item) => item.id === target!.id);
    expect(rejected?.workflowState).toBe('SCREENING_REJECTED');
    expect(rejected?.status).toBe('Retired');
  });

  it('applies, accepts, and seeds difficulty predictions', () => {
    const target = getAllItems().find((item) => item.workflowState === 'SCREENING_APPROVED');
    expect(target).toBeDefined();

    applyDifficultyPredictions([
      {
        id: target!.id,
        b: 0.7,
        confidence: 82,
        difficulty: 'Medium',
        discrimination: 'High',
      },
    ]);

    const predicted = getAllItems().find((item) => item.id === target!.id);
    expect(predicted?.workflowState).toBe('PENDING_DP_REVIEW');
    expect(predicted?.irtParameters?.b).toBe(0.7);
    expect(predicted?.irtParameters?.predictedByAI).toBe(true);

    acceptPredictedItems([target!.id]);
    const accepted = getAllItems().find((item) => item.id === target!.id);
    expect(accepted?.workflowState).toBe('RECOMMENDED_FOR_SEEDING');
    expect(accepted?.status).toBe('Published');

    moveItemsToSeeded([target!.id]);
    const seeded = getAllItems().find((item) => item.id === target!.id);
    expect(seeded?.workflowState).toBe('SEEDED');
    expect(seeded?.status).toBe('Published');
  });

  it('merges ingested items and normalizes overridden lifecycle fields', () => {
    const ingested: AssessmentItem = {
      id: 'TEST-INGEST-001',
      title: 'Test item',
      content: 'Test content',
      level: 'A2',
      skill: 'Reading',
      itemType: 'Multiple Choice',
      status: 'Draft',
      workflowState: 'NOT_STARTED',
    };

    addIngestedItems([ingested]);

    const base = getAllItems().find((item) => item.id === ingested.id);
    expect(base).toBeDefined();
    expect(base?.status).toBe('Draft');

    localStorage.setItem(
      'workflow-item-overrides-v1',
      JSON.stringify([
        {
          id: ingested.id,
          patch: {
            status: 'Approved',
            workflowState: 'In Review',
          },
        },
      ]),
    );

    const normalized = getAllItems().find((item) => item.id === ingested.id);
    expect(normalized?.status).toBe('Published');
    expect(normalized?.workflowState).toBe('PENDING_SCREENING_REVIEW');
  });
});
