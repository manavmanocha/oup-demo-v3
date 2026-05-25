import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acceptPredictedItems,
  addIngestedItems,
  applyDifficultyPredictions,
  getAllItems,
  getMockDifficultyPredictionResult,
  moveItemsToSeeded,
  queueItemsForScreening,
  approveScreenedItems,
  rejectScreenedItems,
} from '../../src/app/data/mockData';
import type { AssessmentItem } from '../../src/app/data/types';

const createIngestedItem = (overrides: Partial<AssessmentItem> & Pick<AssessmentItem, 'id'>): AssessmentItem => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  content: overrides.content ?? 'Demo workflow item',
  answerKey: overrides.answerKey,
  level: overrides.level ?? 'B2',
  skill: overrides.skill ?? 'Reading',
  itemType: overrides.itemType ?? 'Multiple Choice',
  status: overrides.status ?? 'Draft',
  workflowState: overrides.workflowState ?? 'NOT_STARTED',
  ...overrides,
});

describe('mockData workflow mutations', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('queues items for screening and records screening results', () => {
    const target = getAllItems().find((item) => item.workflowState === 'NOT_STARTED');
    expect(target).toBeDefined();
    if (!target) throw new Error('Expected a NOT_STARTED item for screening test');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.95);

    queueItemsForScreening([target.id]);

    const queued = getAllItems().find((item) => item.id === target.id);
    expect(queued?.workflowState).toBe('PENDING_SCREENING_REVIEW');
    expect(queued?.flaggedForReview).toBe(false);
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
    if (!target) throw new Error('Expected a NOT_STARTED item for approval test');

    vi.spyOn(Math, 'random').mockReturnValue(0.95);
    queueItemsForScreening([target.id]);

    approveScreenedItems([target.id]);
    const approved = getAllItems().find((item) => item.id === target.id);
    expect(approved?.workflowState).toBe('SCREENING_APPROVED');
    expect(approved?.flaggedForReview).toBe(false);
    expect(approved?.screening).toMatchObject({
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    });

    rejectScreenedItems([target.id]);
    const rejected = getAllItems().find((item) => item.id === target.id);
    expect(rejected?.workflowState).toBe('SCREENING_REJECTED');
    expect(rejected?.status).toBe('Retired');
  });

  it('applies, accepts, and seeds difficulty predictions', () => {
    const target = getAllItems().find((item) => item.workflowState === 'SCREENING_APPROVED');
    expect(target).toBeDefined();
    if (!target) throw new Error('Expected a SCREENING_APPROVED item for DP test');

    applyDifficultyPredictions([
      {
        id: target.id,
        b: 0.7,
        confidence: 82,
        difficulty: 'Medium',
        discrimination: 'High',
      },
    ]);

    const predicted = getAllItems().find((item) => item.id === target.id);
    expect(predicted?.workflowState).toBe('PENDING_DP_REVIEW');
    expect(predicted?.irtParameters?.b).toBe(0.7);
    expect(predicted?.irtParameters?.predictedByAI).toBe(true);

    acceptPredictedItems([target.id]);
    const accepted = getAllItems().find((item) => item.id === target.id);
    expect(accepted?.workflowState).toBe('RECOMMENDED_FOR_SEEDING');
    expect(accepted?.status).toBe('Published');

    moveItemsToSeeded([target.id]);
    const seeded = getAllItems().find((item) => item.id === target.id);
    expect(seeded?.workflowState).toBe('SEEDED');
    expect(seeded?.status).toBe('Published');
  });

  it('uses deterministic screening fixtures for the predefined demo IDs', () => {
    addIngestedItems([
      createIngestedItem({
        id: 'EAS-DEM-RDG-B2-101',
        content: 'Reading demo item',
      }),
      createIngestedItem({
        id: 'EAS-DEM-WRT-B1-102',
        content: 'Writing demo item',
        level: 'B1',
        skill: 'Writing',
        itemType: 'Essay',
      }),
      createIngestedItem({
        id: 'EAS-DEM-SPK-B2-103',
        content: 'Speaking demo item',
        skill: 'Speaking',
        itemType: 'Speaking',
      }),
    ]);

    queueItemsForScreening(['EAS-DEM-RDG-B2-101', 'EAS-DEM-WRT-B1-102', 'EAS-DEM-SPK-B2-103']);

    const failedDistractor = getAllItems().find((item) => item.id === 'EAS-DEM-RDG-B2-101');
    const failedClarity = getAllItems().find((item) => item.id === 'EAS-DEM-WRT-B1-102');
    const passed = getAllItems().find((item) => item.id === 'EAS-DEM-SPK-B2-103');

    expect(failedDistractor?.workflowState).toBe('PENDING_SCREENING_REVIEW');
    expect(failedDistractor?.flaggedForReview).toBe(true);
    expect(failedDistractor?.screening?.distractorStrength).toBe('Fail');
    expect(failedDistractor?.flagReason).toContain('distractor set');
    expect(failedDistractor?.reviewHistory?.at(-1)?.notes).toContain('distractor set');

    expect(failedClarity?.flaggedForReview).toBe(true);
    expect(failedClarity?.screening?.clarity).toBe('Fail');
    expect(failedClarity?.flagReason).toContain('ambiguous');

    expect(passed?.flaggedForReview).toBe(false);
    expect(passed?.screening).toMatchObject({
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    });
    expect(passed?.reviewHistory?.at(-1)?.notes).toContain('Passed all screening checks');
  });

  it('uses deterministic difficulty prediction fixtures for the predefined demo IDs', () => {
    addIngestedItems([
      createIngestedItem({
        id: 'EAS-DEM-SPK-B2-103',
        skill: 'Speaking',
        itemType: 'Speaking',
        workflowState: 'SCREENING_APPROVED',
      }),
      createIngestedItem({
        id: 'EAS-DEM-WRT-C1-104',
        level: 'C1',
        skill: 'Writing',
        itemType: 'Essay',
        workflowState: 'SCREENING_APPROVED',
      }),
      createIngestedItem({
        id: 'EAS-DEM-SPK-C1-105',
        level: 'C1',
        skill: 'Speaking',
        itemType: 'Speaking',
        workflowState: 'SCREENING_APPROVED',
      }),
    ]);

    const results = [
      getMockDifficultyPredictionResult('EAS-DEM-SPK-B2-103'),
      getMockDifficultyPredictionResult('EAS-DEM-WRT-C1-104'),
      getMockDifficultyPredictionResult('EAS-DEM-SPK-C1-105'),
    ];

    expect(results).toEqual([
      {
        id: 'EAS-DEM-SPK-B2-103',
        b: 0.88,
        confidence: 91,
        difficulty: 'Medium',
        discrimination: 'High',
      },
      {
        id: 'EAS-DEM-WRT-C1-104',
        b: 1.36,
        confidence: 58,
        difficulty: 'Hard',
        discrimination: 'Moderate',
      },
      {
        id: 'EAS-DEM-SPK-C1-105',
        b: 1.18,
        confidence: 89,
        difficulty: 'Medium',
        discrimination: 'High',
      },
    ]);

    applyDifficultyPredictions(results);

    const lowConfidence = getAllItems().find((item) => item.id === 'EAS-DEM-WRT-C1-104');
    const highConfidenceOne = getAllItems().find((item) => item.id === 'EAS-DEM-SPK-B2-103');
    const highConfidenceTwo = getAllItems().find((item) => item.id === 'EAS-DEM-SPK-C1-105');

    expect(lowConfidence?.workflowState).toBe('PENDING_DP_REVIEW');
    expect(lowConfidence?.confidence).toBe(58);
    expect(lowConfidence?.irtParameters?.b).toBe(1.36);
    expect(highConfidenceOne?.confidence).toBe(91);
    expect(highConfidenceTwo?.confidence).toBe(89);
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
