import { AssessmentItem, BankCapacity, CEFRLevel, Difficulty, ItemType } from './types';
import { isAnyWorkflowState, normalizeWorkflowStateInput, REVIEW_WORKFLOW_STATES } from './workflowState';

import questionsData from './questions.json';

type UnifiedQuestion = (typeof questionsData.questions)[number];
type ListeningQuestion = UnifiedQuestion & {
  skill: 'Listening';
  skillDetails: {
    listening: {
      context?: string;
      audioFile?: string;
      audioAsset?: string | null;
      instructions?: string;
    };
  };
};
type ReadingQuestion = UnifiedQuestion & {
  skill: 'Reading';
  skillDetails: {
    reading: {
      passageText?: string;
      passageTitle?: string;
      instructions?: string;
    };
  };
};
type WritingQuestion = UnifiedQuestion & {
  skill: 'Writing';
  skillDetails: {
    writing: {
      task?: number;
      instructions?: string;
      promptContext?: string;
      rubric?: string;
      visualData?: string;
    };
  };
};
type SpeakingQuestion = UnifiedQuestion & {
  skill: 'Speaking';
  skillDetails: {
    speaking: {
      part?: number;
      instructions?: string;
      cueCard?: string;
      rubric?: string;
      followUpQuestions?: string[];
      rubricCriteria?: string[];
    };
  };
};

const allQuestions: UnifiedQuestion[] = questionsData.questions as UnifiedQuestion[];
const listeningQuestions: ListeningQuestion[] = allQuestions.filter((question): question is ListeningQuestion => question.skill === 'Listening');
const readingQuestions: ReadingQuestion[] = allQuestions.filter((question): question is ReadingQuestion => question.skill === 'Reading');
const writingQuestions: WritingQuestion[] = allQuestions.filter((question): question is WritingQuestion => question.skill === 'Writing');
const speakingQuestions: SpeakingQuestion[] = allQuestions.filter((question): question is SpeakingQuestion => question.skill === 'Speaking');
const INGESTED_ITEMS_STORAGE_KEY = 'ingested-library-items-v1';
const WORKFLOW_OVERRIDES_STORAGE_KEY = 'workflow-item-overrides-v1';

type ScreeningDimensionKey = keyof NonNullable<AssessmentItem['screening']>;
type ScreeningDimensionResult = NonNullable<AssessmentItem['screening']>[ScreeningDimensionKey];
type ScreeningResults = Record<ScreeningDimensionKey, ScreeningDimensionResult>;

export type DifficultyPredictionResult = {
  id: string;
  b: number;
  confidence: number;
  difficulty: Difficulty;
  discrimination: string;
};

type DemoScreeningFixture = {
  screening: ScreeningResults;
  feedback: string;
};

const SCREENING_DIMENSIONS: ScreeningDimensionKey[] = [
  'cefrFit',
  'distractorStrength',
  'clarity',
  'fairness',
  'similarity',
];

const DEMO_SCREENING_FIXTURES: Record<string, DemoScreeningFixture> = {
  'EAS-DEM-RDG-B2-101': {
    screening: {
      cefrFit: 'Pass',
      distractorStrength: 'Fail',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    },
    feedback:
      'Reviewer feedback: The keyed response is valid, but the distractor set is not functioning at an enterprise standard. Options B and D can be ruled out without reading the full message, and option C does not mirror the operational nuance closely enough to compete with the answer. Revise the alternatives so each option reflects a plausible next-step interpretation from the email.',
  },
  'EAS-DEM-WRT-B1-102': {
    screening: {
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Fail',
      fairness: 'Pass',
      similarity: 'Pass',
    },
    feedback:
      'Reviewer feedback: The task intent is commercially realistic, but the brief is ambiguous about audience and register. Candidates could reasonably write either to the customer or to the line manager, and the expected tone ranges from informal update to formal complaint response. Specify recipient, purpose, and response length more tightly before approval.',
  },
  'EAS-DEM-SPK-B2-103': {
    screening: {
      cefrFit: 'Fail',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    },
    feedback:
      'Reviewer feedback: The scenario and prompt are well-constructed, but the CEFR level alignment needs review. The task requires candidates to synthesise multiple sources of evidence and justify prioritisation decisions — cognitive and linguistic demands that sit closer to C1 than B2. Recalibrate the level or simplify the reasoning required before approval.',
  },
  'EAS-DEM-WRT-C1-104': {
    screening: {
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    },
    feedback:
      'Reviewer feedback: Passed all screening checks. The proposal task is well-scoped, cognitively demanding, and suitable for advanced business-writing calibration.',
  },
  'EAS-DEM-SPK-C1-105': {
    screening: {
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    },
    feedback:
      'Reviewer feedback: Passed all screening checks. The client-resolution scenario is authentic, appropriately constrained, and strong enough to move into difficulty estimation.',
  },
};

const DEMO_DP_FIXTURES: Record<string, DifficultyPredictionResult> = {
  'EAS-DEM-SPK-B2-103': {
    id: 'EAS-DEM-SPK-B2-103',
    b: 0.58,
    confidence: 91,
    difficulty: 'Medium',
    discrimination: 'Excellent',
  },
  'EAS-DEM-WRT-C1-104': {
    id: 'EAS-DEM-WRT-C1-104',
    b: 1.08,
    confidence: 54,
    difficulty: 'Hard',
    discrimination: 'Low',
  },
  'EAS-DEM-SPK-C1-105': {
    id: 'EAS-DEM-SPK-C1-105',
    b: 1.02,
    confidence: 89,
    difficulty: 'Hard',
    discrimination: 'Excellent',
  },
};

type ItemWorkflowOverride = {
  id: string;
  patch: Partial<AssessmentItem>;
};

type DifficultyProfile = {
  meanB: number;
  spread: number;
  confidence: number;
};

const LEVEL_DIFFICULTY_PROFILE: Record<CEFRLevel, DifficultyProfile> = {
  A1: { meanB: -1.7, spread: 0.22, confidence: 88 },
  A2: { meanB: -1.1, spread: 0.25, confidence: 84 },
  B1: { meanB: -0.35, spread: 0.28, confidence: 78 },
  B2: { meanB: 0.35, spread: 0.32, confidence: 72 },
  C1: { meanB: 1.05, spread: 0.30, confidence: 64 },
  C2: { meanB: 1.65, spread: 0.26, confidence: 58 },
};

const sumHashString = (value: string) =>
  value.split('').reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0);

const deterministicOffset = (seed: string, spread: number) => {
  const normalized = (sumHashString(seed) % 1000) / 999;
  return (normalized * 2 - 1) * spread;
};

const clampBValue = (value: number) => Math.min(2.5, Math.max(-2.5, value));

const getDifficultyLabelFromB = (b: number): DifficultyPredictionResult['difficulty'] => {
  if (b <= -1.2) return 'Very Easy';
  if (b <= -0.45) return 'Easy';
  if (b <= 0.7) return 'Medium';
  if (b <= 1.35) return 'Hard';
  return 'Very Hard';
};

const getDiscriminationLabel = (confidence: number): string => {
  if (confidence >= 88) return 'Excellent';
  if (confidence >= 75) return 'Good';
  if (confidence >= 58) return 'Moderate';
  return 'Low';
};

const getAlignedDifficultyPrediction = (item: AssessmentItem): DifficultyPredictionResult => {
  const profile = LEVEL_DIFFICULTY_PROFILE[item.level];
  const b = Number(
    clampBValue(profile.meanB + deterministicOffset(`${item.id}:${item.level}`, profile.spread)).toFixed(2),
  );
  const rawConfidence = profile.confidence + deterministicOffset(`${item.id}:confidence`, 22);
  const confidence = Math.round(Math.min(95, Math.max(40, rawConfidence)));

  return {
    id: item.id,
    b,
    confidence,
    difficulty: getDifficultyLabelFromB(b),
    discrimination: getDiscriminationLabel(confidence),
  };
};

const randomScreeningResults = (): ScreeningResults => {
  return SCREENING_DIMENSIONS.reduce<ScreeningResults>((acc, dimension) => {
    acc[dimension] = Math.random() >= 0.2 ? 'Pass' : 'Fail';
    return acc;
  }, {
    cefrFit: 'Pass',
    distractorStrength: 'Pass',
    clarity: 'Pass',
    fairness: 'Pass',
    similarity: 'Pass',
  });
};

const getScreeningFixture = (id: string): DemoScreeningFixture => {
  const predefined = DEMO_SCREENING_FIXTURES[id];

  if (predefined) {
    return predefined;
  }

  const screening = randomScreeningResults();
  const hasFailure = SCREENING_DIMENSIONS.some((dimension) => screening[dimension] === 'Fail');

  return {
    screening,
    feedback: hasFailure
      ? 'Reviewer feedback: This item needs manual review because one or more screening dimensions did not meet the current quality bar.'
      : 'Reviewer feedback: Passed all screening checks and is ready for approval.',
  };
};

export const getMockDifficultyPredictionResult = (id: string): DifficultyPredictionResult => {
  const predefined = DEMO_DP_FIXTURES[id];

  if (predefined) {
    return predefined;
  }

  const matchedItem = getAllItems().find((item) => item.id === id);

  if (matchedItem) {
    return getAlignedDifficultyPrediction(matchedItem);
  }

  const b = Number((Math.random() * 2).toFixed(2));
  const confidence = Math.floor(Math.random() * 55) + 40;
  const difficulty = getDifficultyLabelFromB(b);

  return {
    id,
    b,
    confidence,
    difficulty,
    discrimination: getDiscriminationLabel(confidence),
  };
};

const normalizeWorkflowState = (state: string | undefined): AssessmentItem['workflowState'] => {
  return normalizeWorkflowStateInput(state);
};

const normalizeItemStatus = (status: string | undefined): AssessmentItem['status'] => {
  if (!status) {
    return 'Draft';
  }

  switch (status) {
    case 'Published':
    case 'Draft':
    case 'Retired':
    case 'Compromised':
    case 'In Review':
      return status;
    case 'Active':
    case 'Approved':
    case 'Calibrated':
      return 'Published';
    default:
      return 'Draft';
  }
};

const normalizeItemLifecycle = (item: AssessmentItem): AssessmentItem => {
  return {
    ...item,
    status: normalizeItemStatus(item.status),
    workflowState: normalizeWorkflowState(item.workflowState),
  };
};

const getStoredIngestedItems = (): AssessmentItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(INGESTED_ITEMS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as AssessmentItem[];
  } catch {
    return [];
  }
};

const setStoredIngestedItems = (items: AssessmentItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(INGESTED_ITEMS_STORAGE_KEY, JSON.stringify(items));
};

const getStoredWorkflowOverrides = (): ItemWorkflowOverride[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(WORKFLOW_OVERRIDES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as ItemWorkflowOverride[];
  } catch {
    return [];
  }
};

const setStoredWorkflowOverrides = (overrides: ItemWorkflowOverride[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(WORKFLOW_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
};

const mergeItemWithPatch = (baseItem: AssessmentItem, patch: Partial<AssessmentItem>): AssessmentItem => {
  const hasIrt = Boolean(baseItem.irtParameters || patch.irtParameters);
  const mergedWorkflowState = patch.workflowState ?? baseItem.workflowState;
  const mergedStatus = patch.status ?? baseItem.status;

  return {
    ...baseItem,
    ...patch,
    status: normalizeItemStatus(mergedStatus),
    workflowState: normalizeWorkflowState(mergedWorkflowState),
    screening: {
      ...baseItem.screening,
      ...patch.screening,
    },
    irtParameters: hasIrt
      ? {
          b: patch.irtParameters?.b ?? baseItem.irtParameters?.b ?? 0,
          a: patch.irtParameters?.a ?? baseItem.irtParameters?.a ?? 1,
          c: patch.irtParameters?.c ?? baseItem.irtParameters?.c ?? 0,
          sampleSize: patch.irtParameters?.sampleSize ?? baseItem.irtParameters?.sampleSize,
          modelVersion: patch.irtParameters?.modelVersion ?? baseItem.irtParameters?.modelVersion,
          predictionDate: patch.irtParameters?.predictionDate ?? baseItem.irtParameters?.predictionDate,
          calibratedFromFieldTest:
            patch.irtParameters?.calibratedFromFieldTest ?? baseItem.irtParameters?.calibratedFromFieldTest,
          predictedByAI: patch.irtParameters?.predictedByAI ?? baseItem.irtParameters?.predictedByAI,
        }
      : undefined,
  };
};

const upsertItemOverrides = (
  ids: string[],
  buildPatch: (existingItem: AssessmentItem, existingPatch?: Partial<AssessmentItem>) => Partial<AssessmentItem>,
) => {
  if (!ids.length) {
    return;
  }

  const baseItemsById = new Map<string, AssessmentItem>();
  const persistedItems = getStoredIngestedItems();
  [...allMockItems, ...persistedItems].forEach((item) => {
    baseItemsById.set(item.id, item);
  });

  const overrideMap = new Map<string, ItemWorkflowOverride>();
  getStoredWorkflowOverrides().forEach((override) => {
    overrideMap.set(override.id, override);
  });

  ids.forEach((id) => {
    const existingItem = baseItemsById.get(id);
    if (!existingItem) {
      return;
    }

    const existingOverride = overrideMap.get(id);
    const patch = buildPatch(existingItem, existingOverride?.patch);

    overrideMap.set(id, {
      id,
      patch: {
        ...(existingOverride?.patch ?? {}),
        ...patch,
      },
    });
  });

  setStoredWorkflowOverrides(Array.from(overrideMap.values()));
};

export const getIngestedItems = () => getStoredIngestedItems();

export const addIngestedItems = (items: AssessmentItem[]) => {
  if (!items.length) {
    return;
  }

  const existing = getStoredIngestedItems();
  const mergedById = new Map<string, AssessmentItem>();

  existing.forEach((item) => mergedById.set(item.id, item));
  items.forEach((item) => mergedById.set(item.id, item));

  setStoredIngestedItems(Array.from(mergedById.values()));
};

export const queueItemsForScreening = (itemIds: string[]) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowIso = now.toISOString();

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const fixture = getScreeningFixture(item.id);
    const allPassed = SCREENING_DIMENSIONS.every((dimension) => fixture.screening[dimension] === 'Pass');

    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Screening Queue',
        action: allPassed ? 'Screening Auto-Completed (Pass)' : 'Screening Auto-Completed (Needs Review)',
        state: 'PENDING_SCREENING_REVIEW',
        notes: fixture.feedback,
      },
    ];

    return {
      workflowState: 'PENDING_SCREENING_REVIEW',
      status: 'In Review',
      flaggedForReview: !allPassed,
      flagReason: allPassed ? undefined : fixture.feedback,
      screening: fixture.screening,
      reviewHistory: nextHistory,
      lastEditedDate: nowIso,
      lastEditedBy: 'Screening Queue',
    };
  });
};

export const approveScreenedItems = (itemIds: string[]) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowIso = now.toISOString();

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Screening Team',
        action: 'Screening Approved',
        state: 'SCREENING_APPROVED',
      },
    ];

    return {
      workflowState: 'SCREENING_APPROVED',
      flaggedForReview: false,
      flagReason: undefined,
      screening: {
        cefrFit: 'Pass',
        distractorStrength: 'Pass',
        clarity: 'Pass',
        fairness: 'Pass',
        similarity: 'Pass',
      },
      reviewHistory: nextHistory,
      lastEditedDate: nowIso,
      lastEditedBy: 'Screening Team',
    };
  });
};

export const rejectScreenedItems = (itemIds: string[]) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowIso = now.toISOString();

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Screening Team',
        action: 'Screening Rejected',
        state: 'SCREENING_REJECTED',
      },
    ];

    return {
      workflowState: 'SCREENING_REJECTED',
      status: 'Retired',
      flaggedForReview: false,
      reviewHistory: nextHistory,
      lastEditedDate: nowIso,
      lastEditedBy: 'Screening Team',
    };
  });
};

export const applyDifficultyPredictions = (results: DifficultyPredictionResult[]) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowIso = now.toISOString();

  results.forEach((result) => {
    upsertItemOverrides([result.id], (item, existingPatch) => {
      const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
      const nextHistory = [
        ...previousHistory,
        {
          date: today,
          reviewer: 'Estimation Engine',
          action: 'Difficulty Estimation Complete',
          state: 'PENDING_DP_REVIEW',
        },
      ];

      return {
        workflowState: 'PENDING_DP_REVIEW',
        difficulty: result.difficulty,
        confidence: result.confidence,
        discrimination: result.discrimination,
        irtParameters: {
          ...item.irtParameters,
          b: result.b,
          a: item.irtParameters?.a ?? 1.2,
          c: item.irtParameters?.c ?? 0.25,
          predictedByAI: true,
          calibratedFromFieldTest: false,
          modelVersion: 'IRT-v3.1',
          predictionDate: nowIso,
        },
        aiModelVersion: 'IRT-v3.1',
        aiPredictionDate: nowIso,
        reviewHistory: nextHistory,
        lastEditedDate: nowIso,
        lastEditedBy: 'Estimation Engine',
      };
    });
  });
};

export const acceptPredictedItems = (itemIds: string[]) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowIso = now.toISOString();

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Difficulty Review Team',
        action: 'Estimation Accepted',
        state: 'RECOMMENDED_FOR_SEEDING',
      },
    ];

    return {
      workflowState: 'RECOMMENDED_FOR_SEEDING',
      status: 'Published',
      flaggedForReview: false,
      reviewHistory: nextHistory,
      lastEditedDate: nowIso,
      lastEditedBy: 'Difficulty Review Team',
    };
  });
};

export const moveItemsToSeeded = (itemIds: string[]) => {
  const today = new Date().toISOString().slice(0, 10);

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Seeding Team',
        action: 'Added to Seeding Batch',
        state: 'SEEDED',
      },
    ];

    return {
      workflowState: 'SEEDED',
      status: 'Published',
      flaggedForReview: false,
      reviewHistory: nextHistory,
      lastEditedDate: today,
      lastEditedBy: 'Seeding Team',
    };
  });
};

export const bankCapacityTargets: Record<CEFRLevel, number> = {
  A1: 118,
  A2: 80,
  B1: 100,
  B2: 55,
  C1: 50,
  C2: 83,
};

const BANK_CAPACITY_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Derived live from the same item set that powers the Library screen so
// active/compromised counts always reflect questions.json + workflow overrides.
// "Active" mirrors the Library Status definition: items live in the bank
// (status === 'Published'). Draft / Retired items are not yet (or no longer)
// in the bank, so they don't count toward bank fill.
export const getBankCapacity = (): BankCapacity[] => {
  const items = getAllItems();
  const counts: Record<CEFRLevel, { active: number; compromised: number }> = {
    A1: { active: 0, compromised: 0 },
    A2: { active: 0, compromised: 0 },
    B1: { active: 0, compromised: 0 },
    B2: { active: 0, compromised: 0 },
    C1: { active: 0, compromised: 0 },
    C2: { active: 0, compromised: 0 },
  };

  items.forEach((item) => {
    const bucket = counts[item.level];
    if (!bucket) return;
    if (item.status === 'Compromised') {
      bucket.compromised += 1;
    } else if (item.status === 'Published') {
      bucket.active += 1;
    }
  });

  return BANK_CAPACITY_LEVELS.map((level) => {
    const target = bankCapacityTargets[level];
    const { active, compromised } = counts[level];
    const gapToTarget = Math.max(0, target - active);
    const percentage = target > 0 ? Math.min(100, Math.round((active / target) * 100)) : 0;
    return { level, active, compromised, gapToTarget, target, percentage };
  });
};

type QuestionWithMetadata = UnifiedQuestion & {
  workflowState?: AssessmentItem['workflowState'];
  status?: AssessmentItem['status'];
  screening?: AssessmentItem['screening'];
  flaggedForReview?: boolean;
  flagReason?: string;
  reviewHistory?: AssessmentItem['reviewHistory'];
  irtParameters?: AssessmentItem['irtParameters'];
  subSkill?: string;
  cognitiveLevel?: string;
  contentDomain?: string;
  languageVariety?: string;
  topic?: string;
  grammarFocus?: string;
  discrimination?: string;
  confidence?: number;
  author?: string;
  createdDate?: string;
  lastEditedDate?: string;
  lastEditedBy?: string;
  reviewers?: string[];
  exposureCount?: number;
  enemyItems?: string[];
  aiModelVersion?: string;
  aiPredictionDate?: string;
};

const normalizeTopicLabel = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const lower = value.toLowerCase();

  if (lower.includes('travel')) return 'Travel';
  if (lower.includes('educat') || lower.includes('academic')) return 'Education';
  if (lower.includes('business') || lower.includes('economic') || lower.includes('consumer')) return 'Business';
  if (lower.includes('tech')) return 'Technology';
  if (lower.includes('health') || lower.includes('medical')) return 'Health';
  if (lower.includes('environment') || lower.includes('climate') || lower.includes('water') || lower.includes('energy')) return 'Environment';
  if (lower.includes('culture') || lower.includes('history') || lower.includes('tourism')) return 'Culture';
  if (lower.includes('media') || lower.includes('communication')) return 'Media';
  if (lower.includes('work') || lower.includes('professional') || lower.includes('employment')) return 'Work';
  if (lower.includes('life') || lower.includes('relationship') || lower.includes('hobby') || lower.includes('routine') || lower.includes('lifestyle')) return 'Lifestyle';
  if (lower.includes('science') || lower.includes('biology') || lower.includes('neuro')) return 'Science';

  return 'Society';
};

const normalizeContentDomainLabel = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const lower = value.toLowerCase();

  if (lower.includes('academic') || lower.includes('education')) return 'Academic';
  if (lower.includes('professional') || lower.includes('workplace') || lower.includes('employment') || lower.includes('work')) return 'Professional';
  if (lower.includes('business') || lower.includes('economic') || lower.includes('consumer')) return 'Business';
  if (lower.includes('science') || lower.includes('biology') || lower.includes('neuro') || lower.includes('medical')) return 'Scientific';
  if (lower.includes('media') || lower.includes('communication')) return 'Media';
  if (lower.includes('culture') || lower.includes('history') || lower.includes('tourism') || lower.includes('linguistic')) return 'Culture';
  if (lower.includes('tech') || lower.includes('digital')) return 'Technology';
  if (lower.includes('health')) return 'Health';
  if (lower.includes('personal') || lower.includes('hometown') || lower.includes('daily')) return 'Personal Life';

  return 'General Social';
};

const getQuestionMetadata = (question: UnifiedQuestion): Partial<AssessmentItem> => {
  const q = question as QuestionWithMetadata;
  const normalizedTopic = normalizeTopicLabel(q.topic);
  const normalizedContentDomain = normalizeContentDomainLabel(q.contentDomain ?? q.topic);

  return {
    status: q.status,
    workflowState: q.workflowState,
    screening: q.screening,
    flaggedForReview: q.flaggedForReview,
    flagReason: q.flagReason,
    reviewHistory: q.reviewHistory,
    irtParameters: q.irtParameters,
    subSkill: q.subSkill,
    cognitiveLevel: q.cognitiveLevel,
    contentDomain: normalizedContentDomain,
    languageVariety: q.languageVariety,
    topic: normalizedTopic,
    grammarFocus: q.grammarFocus,
    discrimination: q.discrimination,
    confidence: q.confidence,
    author: q.author,
    createdDate: q.createdDate,
    lastEditedDate: q.lastEditedDate,
    lastEditedBy: q.lastEditedBy,
    reviewers: q.reviewers,
    exposureCount: q.exposureCount,
    enemyItems: q.enemyItems,
    aiModelVersion: q.aiModelVersion,
    aiPredictionDate: q.aiPredictionDate,
  };
};

// Convert listening questions to AssessmentItem format
const listeningItems: AssessmentItem[] = listeningQuestions.map((q) => {
  const metadata = getQuestionMetadata(q);
  const options = Array.isArray(q.options)
    ? q.options.map((opt, idx) => {
        if (typeof opt === 'string') {
          return {
            label: String.fromCodePoint(65 + idx),
            text: opt,
            correct: opt === q.correctAnswer,
          };
        }

        return {
          label: opt.label ?? String.fromCodePoint(65 + idx),
          text: opt.text,
          correct: Boolean(opt.correct),
        };
      })
    : undefined;

  return {
    id: q.id,
    title: q.skillDetails.listening.context,
    content: q.prompt || q.skillDetails.listening.context,
    answerKey: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
    level: q.level as CEFRLevel,
    skill: 'Listening',
    itemType: q.questionType as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    options,
    audioTitle: q.skillDetails.listening.audioTitle,
    audioAsset: q.skillDetails.listening.audioAsset || q.skillDetails.listening.audioFile,
    passage: q.skillDetails.listening.transcript,
    instructions: q.skillDetails.listening.instructions,
    subSkill: metadata.subSkill,
    cognitiveLevel: metadata.cognitiveLevel,
    contentDomain: metadata.contentDomain,
    languageVariety: metadata.languageVariety,
    topic: metadata.topic,
    grammarFocus: metadata.grammarFocus,
    discrimination: metadata.discrimination,
    confidence: metadata.confidence,
    workflowState: metadata.workflowState,
    screening: metadata.screening,
    flaggedForReview: metadata.flaggedForReview,
    flagReason: metadata.flagReason,
    author: metadata.author,
    createdDate: metadata.createdDate,
    lastEditedDate: metadata.lastEditedDate,
    lastEditedBy: metadata.lastEditedBy,
    reviewers: metadata.reviewers,
    reviewHistory: metadata.reviewHistory,
    irtParameters: metadata.irtParameters,
    exposureCount: metadata.exposureCount,
    enemyItems: metadata.enemyItems,
    aiModelVersion: metadata.aiModelVersion,
    aiPredictionDate: metadata.aiPredictionDate,
  };
});

// Convert speaking questions to AssessmentItem format
const speakingItems: AssessmentItem[] = speakingQuestions.map((q) => {
  const metadata = getQuestionMetadata(q);
  const speakingDetails = q.skillDetails.speaking;
  const followUpQuestions = speakingDetails.followUpQuestions ?? [];
  const rubricCriteria = speakingDetails.rubricCriteria ?? [];

  return {
    id: q.id,
    title: speakingDetails.context || q.prompt,
    content: speakingDetails.context ? q.prompt : undefined,
    passageTitle: speakingDetails.passageTitle,
    passage: speakingDetails.passage || speakingDetails.transcript,
    answerKey: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
    level: q.level as CEFRLevel,
    skill: 'Speaking',
    itemType: 'Speaking' as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    instructions: speakingDetails.instructions,
    imageTitle: speakingDetails.imageTitle,
    imageAsset: speakingDetails.imageAsset,
    imageAltText: speakingDetails.imageAltText,
    audioTitle: speakingDetails.audioTitle,
    audioAsset: speakingDetails.audioAsset || speakingDetails.audioFile,
    followUpQuestions,
    rubric: speakingDetails.rubric
      ?? (rubricCriteria.length > 0 ? `Assessment Criteria:\n${rubricCriteria.join('\n')}` : undefined),
    subSkill: metadata.subSkill,
    cognitiveLevel: metadata.cognitiveLevel,
    contentDomain: metadata.contentDomain,
    languageVariety: metadata.languageVariety,
    topic: metadata.topic,
    grammarFocus: metadata.grammarFocus,
    discrimination: metadata.discrimination,
    confidence: metadata.confidence,
    workflowState: metadata.workflowState,
    screening: metadata.screening,
    flaggedForReview: metadata.flaggedForReview,
    flagReason: metadata.flagReason,
    author: metadata.author,
    createdDate: metadata.createdDate,
    lastEditedDate: metadata.lastEditedDate,
    lastEditedBy: metadata.lastEditedBy,
    reviewers: metadata.reviewers,
    reviewHistory: metadata.reviewHistory,
    irtParameters: metadata.irtParameters,
    exposureCount: metadata.exposureCount,
    enemyItems: metadata.enemyItems,
    aiModelVersion: metadata.aiModelVersion,
    aiPredictionDate: metadata.aiPredictionDate,
  };
});

// Convert writing questions to AssessmentItem format
const writingItems: AssessmentItem[] = writingQuestions.map((q) => {
  const metadata = getQuestionMetadata(q);
  const writingDetails = q.skillDetails.writing;

  return {
    id: q.id,
    title: writingDetails.promptContext || q.prompt,
    content: q.prompt,
    answerKey: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
    level: q.level as CEFRLevel,
    skill: 'Writing',
    itemType: 'Essay' as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    instructions: writingDetails.instructions,
    imageTitle: writingDetails.imageTitle,
    imageAsset: writingDetails.imageAsset,
    imageAltText: writingDetails.imageAltText,
    rubric: writingDetails.rubric,
    passage: writingDetails.visualData,
    subSkill: metadata.subSkill,
    cognitiveLevel: metadata.cognitiveLevel,
    contentDomain: metadata.contentDomain,
    languageVariety: metadata.languageVariety,
    topic: metadata.topic,
    grammarFocus: metadata.grammarFocus,
    discrimination: metadata.discrimination,
    confidence: metadata.confidence,
    workflowState: metadata.workflowState,
    screening: metadata.screening,
    flaggedForReview: metadata.flaggedForReview,
    flagReason: metadata.flagReason,
    author: metadata.author,
    createdDate: metadata.createdDate,
    lastEditedDate: metadata.lastEditedDate,
    lastEditedBy: metadata.lastEditedBy,
    reviewers: metadata.reviewers,
    reviewHistory: metadata.reviewHistory,
    irtParameters: metadata.irtParameters,
    exposureCount: metadata.exposureCount,
    enemyItems: metadata.enemyItems,
    aiModelVersion: metadata.aiModelVersion,
    aiPredictionDate: metadata.aiPredictionDate,
  };
});

// Convert reading questions to AssessmentItem format
const readingItems: AssessmentItem[] = readingQuestions.map((q) => {
  const metadata = getQuestionMetadata(q);
  const readingDetails = q.skillDetails.reading;
  const options = Array.isArray(q.options)
    ? q.options.map((opt, idx) => {
        if (typeof opt === 'string') {
          return {
            label: String.fromCodePoint(65 + idx),
            text: opt,
            correct: opt === q.correctAnswer,
          };
        }

        return {
          label: opt.label ?? String.fromCodePoint(65 + idx),
          text: opt.text,
          correct: typeof opt.correct === 'boolean' ? opt.correct : undefined,
        };
      })
    : undefined;

  return {
    id: q.id,
    title: q.prompt,
    content: q.prompt,
    answerKey: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
    level: q.level as CEFRLevel,
    skill: 'Reading',
    itemType: q.questionType as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    passage: readingDetails.passageText,
    passageTitle: readingDetails.passageTitle,
    instructions: readingDetails.instructions,
    passageId: `PSG-${q.id}`,
    options,
    subSkill: metadata.subSkill,
    cognitiveLevel: metadata.cognitiveLevel,
    contentDomain: metadata.contentDomain,
    languageVariety: metadata.languageVariety,
    topic: metadata.topic,
    grammarFocus: metadata.grammarFocus,
    discrimination: metadata.discrimination,
    confidence: metadata.confidence,
    workflowState: metadata.workflowState,
    screening: metadata.screening,
    flaggedForReview: metadata.flaggedForReview,
    flagReason: metadata.flagReason,
    author: metadata.author,
    createdDate: metadata.createdDate,
    lastEditedDate: metadata.lastEditedDate,
    lastEditedBy: metadata.lastEditedBy,
    reviewers: metadata.reviewers,
    reviewHistory: metadata.reviewHistory,
    irtParameters: metadata.irtParameters,
    exposureCount: metadata.exposureCount,
    enemyItems: metadata.enemyItems,
    aiModelVersion: metadata.aiModelVersion,
    aiPredictionDate: metadata.aiPredictionDate,
  };
});

const mappedItemsById = new Map<string, AssessmentItem>();
[...listeningItems, ...speakingItems, ...writingItems, ...readingItems].forEach((item) => {
  mappedItemsById.set(item.id, item);
});

const GRAMMAR_FOCUS_CATEGORIES: string[] = [
  'Present Simple',
  'Past Simple',
  'Past Perfect',
  'Passive Voice',
  'Conditionals',
  'Reported Speech',
];

const LANGUAGE_VARIETY_CATEGORIES: string[] = [
  'British English',
  'American English',
  'Australian English',
  'Canadian English',
  'Indian English',
  'International English',
  'Formal English',
  'Informal English',
];

const ASSIGNMENT_TARGET_COUNT = 70;

const assignmentHashString = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + (value.codePointAt(index) ?? 0)) >>> 0;
  }

  return hash;
};

const buildCategoryAssignments = (
  items: AssessmentItem[],
  categories: string[],
  seed: string,
): Map<string, string> => {
  const assignmentCount = Math.min(items.length, ASSIGNMENT_TARGET_COUNT);
  const assignmentPool = Array.from({ length: assignmentCount }, (_, idx) => categories[idx % categories.length]);

  // Deterministically shuffle category assignments so the split appears random while remaining stable.
  for (let index = assignmentPool.length - 1; index > 0; index -= 1) {
    const swapIndex = assignmentHashString(`${seed}:${index}`) % (index + 1);
    [assignmentPool[index], assignmentPool[swapIndex]] = [assignmentPool[swapIndex], assignmentPool[index]];
  }

  const sortedItems = [...items].sort((left, right) => assignmentHashString(`${seed}:${left.id}`) - assignmentHashString(`${seed}:${right.id}`));
  const assignments = new Map<string, string>();

  sortedItems.slice(0, assignmentCount).forEach((item, index) => {
    assignments.set(item.id, assignmentPool[index]);
  });

  return assignments;
};

const mappedMockItems: AssessmentItem[] = allQuestions
  .map((question) => mappedItemsById.get(question.id))
  .filter((item): item is AssessmentItem => Boolean(item));

const grammarFocusAssignments = buildCategoryAssignments(mappedMockItems, GRAMMAR_FOCUS_CATEGORIES, 'grammar-focus');
const languageVarietyAssignments = buildCategoryAssignments(mappedMockItems, LANGUAGE_VARIETY_CATEGORIES, 'language-variety');

export const allMockItems: AssessmentItem[] = mappedMockItems.map((item) => ({
  ...item,
  grammarFocus: grammarFocusAssignments.get(item.id) ?? item.grammarFocus,
  languageVariety: languageVarietyAssignments.get(item.id) ?? item.languageVariety,
}));

export const getItemsByLevel = (level: CEFRLevel) => {
  return getAllItems().filter(item => item.level === level);
};

export const getItemById = (id: string) => {
  return getAllItems().find(item => item.id === id);
};

export const getCompromisedItems = () => {
  return getAllItems().filter(item => item.status === 'Compromised');
};

export const getFlaggedItems = () => {
  return getAllItems().filter(item => item.flaggedForReview);
};

export const getItemsForReview = () => {
  return getAllItems().filter(item =>
    isAnyWorkflowState(item.workflowState, REVIEW_WORKFLOW_STATES) ||
    item.flaggedForReview ||
    item.screening?.similarity === 'Review' ||
    item.screening?.similarity === 'Fail' ||
    item.screening?.cefrFit === 'Review' ||
    item.screening?.cefrFit === 'Fail' ||
    item.screening?.distractorStrength === 'Review' ||
    item.screening?.distractorStrength === 'Fail' ||
    item.screening?.fairness === 'Review' ||
    item.screening?.fairness === 'Fail' ||
    item.screening?.clarity === 'Review' ||
    item.screening?.clarity === 'Fail'
  );
};

export const getAllItems = () => {
  const persistedItems = getStoredIngestedItems();
  const combinedById = new Map<string, AssessmentItem>();
  allMockItems.forEach((item) => combinedById.set(item.id, normalizeItemLifecycle(item)));
  persistedItems.forEach((item) => combinedById.set(item.id, normalizeItemLifecycle(item)));

  const overrides = getStoredWorkflowOverrides();
  if (!overrides.length) {
    return Array.from(combinedById.values());
  }

  const overrideMap = new Map<string, Partial<AssessmentItem>>();
  overrides.forEach((override) => {
    overrideMap.set(override.id, override.patch);
  });

  return Array.from(combinedById.values()).map((item) => {
    const patch = overrideMap.get(item.id);
    if (!patch) {
      return normalizeItemLifecycle(item);
    }

    return normalizeItemLifecycle(mergeItemWithPatch(item, patch));
  });
};

// -----------------------------------------------------------------------------
// Pipeline run derivations
//
// The Pre-Testing Pipeline screens (Pre-Testing overview, Screening,
// Difficulty Estimation, Seeding) need to surface "recent run" tables and
// "last run" timestamps. Rather than hand-rolling these as local arrays in
// each component, we derive them from the reviewHistory entries on the items
// that originate from questions.json (the same data source that powers the
// Library screen).
// -----------------------------------------------------------------------------

export type PipelineStage = 'Screening' | 'Difficulty Estimation' | 'Seeding';

export type PipelineRun = {
  id: string;
  stage: PipelineStage;
  date: string; // ISO date (YYYY-MM-DD)
  items: number;
  flagged: number;
  status: 'Complete' | 'Running' | 'Needs review';
  reviewer?: string;
};

const PIPELINE_STAGE_BY_HISTORY_STATE: Record<string, PipelineStage> = {
  'In Screening': 'Screening',
  'Screening Review': 'Screening',
  PENDING_SCREENING_REVIEW: 'Screening',
  SCREENING_APPROVED: 'Screening',
  'In Difficulty Estimation': 'Difficulty Estimation',
  'Difficulty Estimation Review': 'Difficulty Estimation',
  PENDING_DP_REVIEW: 'Difficulty Estimation',
  DP_APPROVED: 'Difficulty Estimation',
  'Recommended for Seeding': 'Seeding',
  RECOMMENDED_FOR_SEEDING: 'Seeding',
  Seeded: 'Seeding',
  SEEDED: 'Seeding',
};

const STAGE_RUN_PREFIX: Record<PipelineStage, string> = {
  Screening: 'SCR',
  'Difficulty Estimation': 'EST',
  Seeding: 'SEED',
};

const toIsoDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  // Some entries are full ISO timestamps; pull off the date portion only.
  const datePortion = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePortion) ? datePortion : undefined;
};

const formatRunIdSuffix = (date: string, sequence: number): string => {
  const compact = date.replace(/-/g, '').slice(2); // YYMMDD
  return `${compact}-${String(sequence).padStart(2, '0')}`;
};

type StageRunBucket = {
  stage: PipelineStage;
  date: string;
  itemIds: Set<string>;
  flaggedIds: Set<string>;
  reviewers: Map<string, number>;
  hasOpenReview: boolean;
};

const collectStageRunBuckets = (): Map<string, StageRunBucket> => {
  const buckets = new Map<string, StageRunBucket>();
  const items = getAllItems();

  items.forEach((item) => {
    (item.reviewHistory ?? []).forEach((entry) => {
      const stage = PIPELINE_STAGE_BY_HISTORY_STATE[entry.state] ?? PIPELINE_STAGE_BY_HISTORY_STATE[entry.action];
      if (!stage) return;

      const date = toIsoDate(entry.date);
      if (!date) return;

      const key = `${stage}|${date}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          stage,
          date,
          itemIds: new Set(),
          flaggedIds: new Set(),
          reviewers: new Map(),
          hasOpenReview: false,
        };
        buckets.set(key, bucket);
      }

      bucket.itemIds.add(item.id);

      const isFlagged =
        item.flaggedForReview === true ||
        Object.values(item.screening ?? {}).some((result) => result === 'Fail' || result === 'Review');
      if (isFlagged) {
        bucket.flaggedIds.add(item.id);
      }

      if (entry.reviewer) {
        bucket.reviewers.set(entry.reviewer, (bucket.reviewers.get(entry.reviewer) ?? 0) + 1);
      }

      if (/Review$/.test(entry.state) || entry.state === 'PENDING_SCREENING_REVIEW' || entry.state === 'PENDING_DP_REVIEW') {
        bucket.hasOpenReview = true;
      }
    });
  });

  return buckets;
};

const bucketToRun = (bucket: StageRunBucket, sequence: number): PipelineRun => {
  const itemCount = bucket.itemIds.size;
  const flagged = bucket.flaggedIds.size;
  const topReviewer = [...bucket.reviewers.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  let status: PipelineRun['status'] = 'Complete';
  if (bucket.hasOpenReview) status = flagged > 0 ? 'Needs review' : 'Running';

  return {
    id: `${STAGE_RUN_PREFIX[bucket.stage]}-${formatRunIdSuffix(bucket.date, sequence)}`,
    stage: bucket.stage,
    date: bucket.date,
    items: itemCount,
    flagged,
    status,
    reviewer: topReviewer,
  };
};

const sortBucketsNewestFirst = (buckets: StageRunBucket[]): StageRunBucket[] => {
  return [...buckets].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return a.stage.localeCompare(b.stage);
  });
};

export const getPipelineRuns = (limit?: number): PipelineRun[] => {
  const buckets = sortBucketsNewestFirst(Array.from(collectStageRunBuckets().values()));
  const perDateStageSequence = new Map<string, number>();

  const runs = buckets.map((bucket) => {
    const seqKey = bucket.date;
    const next = (perDateStageSequence.get(seqKey) ?? 0) + 1;
    perDateStageSequence.set(seqKey, next);
    return bucketToRun(bucket, next);
  });

  return typeof limit === 'number' ? runs.slice(0, limit) : runs;
};

export const getLastRunDateByStage = (): Record<PipelineStage, string | undefined> => {
  const buckets = collectStageRunBuckets();
  const latest: Record<PipelineStage, string | undefined> = {
    Screening: undefined,
    'Difficulty Estimation': undefined,
    Seeding: undefined,
  };

  buckets.forEach((bucket) => {
    const current = latest[bucket.stage];
    if (!current || bucket.date > current) {
      latest[bucket.stage] = bucket.date;
    }
  });

  return latest;
};

export const getSeedingRuns = (limit?: number): PipelineRun[] => {
  const runs = getPipelineRuns().filter((run) => run.stage === 'Seeding');
  return typeof limit === 'number' ? runs.slice(0, limit) : runs;
};

// Derive a deterministic "responses accrued so far" value for seeded items.
// questions.json does not currently carry an exposureCount, so we approximate
// it from how long the item has been seeded. The figure ramps up linearly
// across the 200-response field-test target and stays stable across renders.
const RESPONSE_TARGET = 200;
const RESPONSES_PER_DAY = 8;

export const getSeededResponsesAccrued = (item: AssessmentItem, referenceDate: Date = new Date()): number => {
  if (typeof item.exposureCount === 'number') {
    return Math.min(RESPONSE_TARGET, Math.max(0, item.exposureCount));
  }

  const seededEntry = [...(item.reviewHistory ?? [])]
    .reverse()
    .find((entry) => entry.state === 'Seeded' || entry.state === 'SEEDED' || entry.action === 'Seeded');
  const seededDateRaw = seededEntry?.date ?? item.lastEditedDate;
  const seededDate = seededDateRaw ? new Date(seededDateRaw) : null;
  if (!seededDate || Number.isNaN(seededDate.getTime())) {
    return 0;
  }

  const days = Math.max(0, Math.floor((referenceDate.getTime() - seededDate.getTime()) / 86_400_000));
  return Math.min(RESPONSE_TARGET, days * RESPONSES_PER_DAY);
};

export const SEEDED_RESPONSE_TARGET = RESPONSE_TARGET;

