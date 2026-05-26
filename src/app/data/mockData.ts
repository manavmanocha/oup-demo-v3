import { AssessmentItem, BankCapacity, CEFRLevel, ItemType } from './types';
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
  difficulty: AssessmentItem['difficulty'];
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
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    },
    feedback:
      'Reviewer feedback: Passed all screening checks. The scenario is clear, level-appropriate, and aligned with workplace decision-making tasks used in operational speaking assessments.',
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
      'Reviewer feedback: Passed all screening checks. The client-resolution scenario is authentic, appropriately constrained, and strong enough to move into difficulty prediction.',
  },
};

const DEMO_DP_FIXTURES: Record<string, DifficultyPredictionResult> = {
  'EAS-DEM-SPK-B2-103': {
    id: 'EAS-DEM-SPK-B2-103',
    b: 0.88,
    confidence: 91,
    difficulty: 'Medium',
    discrimination: 'High',
  },
  'EAS-DEM-WRT-C1-104': {
    id: 'EAS-DEM-WRT-C1-104',
    b: 1.36,
    confidence: 58,
    difficulty: 'Hard',
    discrimination: 'Moderate',
  },
  'EAS-DEM-SPK-C1-105': {
    id: 'EAS-DEM-SPK-C1-105',
    b: 1.18,
    confidence: 89,
    difficulty: 'Medium',
    discrimination: 'High',
  },
};

type ItemWorkflowOverride = {
  id: string;
  patch: Partial<AssessmentItem>;
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

  const b = Number((Math.random() * 2).toFixed(2));
  const confidence = Math.floor(Math.random() * 30) + 70;

  return {
    id,
    b,
    confidence,
    difficulty: b < 0.4 ? 'Easy' : b < 1.2 ? 'Medium' : 'Hard',
    discrimination: confidence >= 90 ? 'High' : confidence >= 80 ? 'Moderate' : 'Low',
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
      return status;
    case 'In Review':
      return 'Draft';
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
          reviewer: 'Prediction Engine',
          action: 'Difficulty Predicted',
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
          modelVersion: 'IRT-LSTM-3.1',
          predictionDate: nowIso,
        },
        aiModelVersion: 'IRT-LSTM-3.1',
        aiPredictionDate: nowIso,
        reviewHistory: nextHistory,
        lastEditedDate: nowIso,
        lastEditedBy: 'Prediction Engine',
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
        action: 'DP Approved',
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

export const bankCapacityData: BankCapacity[] = [
  { level: 'A1', active: 84, compromised: 6, gapToTarget: 28, target: 118, percentage: 71 },
  { level: 'A2', active: 67, compromised: 13, gapToTarget: 0, target: 80, percentage: 100 },
  { level: 'B1', active: 80, compromised: 5, gapToTarget: 15, target: 100, percentage: 85 },
  { level: 'B2', active: 55, compromised: 0, gapToTarget: 0, target: 55, percentage: 100 },
  { level: 'C1', active: 14, compromised: 0, gapToTarget: 36, target: 50, percentage: 28 },
  { level: 'C2', active: 67, compromised: 3, gapToTarget: 13, target: 83, percentage: 84 },
];

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

const getQuestionMetadata = (question: UnifiedQuestion): Partial<AssessmentItem> => {
  const q = question as QuestionWithMetadata;

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
    contentDomain: q.contentDomain,
    languageVariety: q.languageVariety,
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
    title: q.prompt,
    content: q.skillDetails.listening.context || q.prompt,
    answerKey: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
    level: q.level as CEFRLevel,
    skill: 'Listening',
    itemType: q.questionType as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    options,
    audioAsset: q.skillDetails.listening.audioAsset || q.skillDetails.listening.audioFile,
    passage: q.skillDetails.listening.transcript,
    instructions: q.skillDetails.listening.instructions,
    subSkill: metadata.subSkill,
    cognitiveLevel: metadata.cognitiveLevel,
    contentDomain: metadata.contentDomain,
    languageVariety: metadata.languageVariety,
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
  const cueCard = speakingDetails.cueCard?.trim();

  const contentParts = [q.prompt];
  if (cueCard) {
    contentParts.push(`Cue card:\n${cueCard}`);
  }
  if (followUpQuestions.length > 0) {
    contentParts.push(`Follow-up questions:\n${followUpQuestions.join('\n')}`);
  }

  return {
    id: q.id,
    title: q.prompt,
    content: contentParts.join('\n\n'),
    answerKey: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
    level: q.level as CEFRLevel,
    skill: 'Speaking',
    itemType: 'Speaking' as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    instructions: speakingDetails.instructions,
    rubric: speakingDetails.rubric
      ?? (rubricCriteria.length > 0 ? `Assessment Criteria:\n${rubricCriteria.join('\n')}` : undefined),
    subSkill: metadata.subSkill,
    cognitiveLevel: metadata.cognitiveLevel,
    contentDomain: metadata.contentDomain,
    languageVariety: metadata.languageVariety,
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
    title: q.prompt,
    content: writingDetails.promptContext || q.prompt,
    answerKey: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
    level: q.level as CEFRLevel,
    skill: 'Writing',
    itemType: 'Essay' as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    instructions: writingDetails.instructions,
    rubric: writingDetails.rubric,
    passage: writingDetails.visualData,
    subSkill: metadata.subSkill,
    cognitiveLevel: metadata.cognitiveLevel,
    contentDomain: metadata.contentDomain,
    languageVariety: metadata.languageVariety,
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

export const allMockItems: AssessmentItem[] = allQuestions
  .map((question) => mappedItemsById.get(question.id))
  .filter((item): item is AssessmentItem => Boolean(item));

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

