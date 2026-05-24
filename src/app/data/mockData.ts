import { AssessmentItem, BankCapacity, CEFRLevel, ItemType } from './types';

import questionsData from './questions.json';

type UnifiedQuestion = (typeof questionsData.questions)[number];
type ListeningQuestion = UnifiedQuestion & {
  skill: 'Listening';
  skillDetails: {
    listening: {
      section?: number;
      context?: string;
      audioFile?: string;
      audioAsset?: string | null;
    };
  };
};
type ReadingQuestion = UnifiedQuestion & {
  skill: 'Reading';
  skillDetails: {
    reading: {
      passageText?: string;
    };
  };
};
type WritingQuestion = UnifiedQuestion & {
  skill: 'Writing';
  skillDetails: {
    writing: {
      task?: number;
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

type ItemWorkflowOverride = {
  id: string;
  patch: Partial<AssessmentItem>;
};

const normalizeWorkflowState = (state: string | undefined): AssessmentItem['workflowState'] => {
  if (!state) {
    return undefined;
  }

  switch (state) {
    case 'Draft':
    case 'In Screening':
    case 'Screening Review':
    case 'Screening Passed':
    case 'In Difficulty Prediction':
    case 'Difficulty Prediction Review':
    case 'Seeded':
    case 'Live':
      return state;
    case 'In Review':
      return 'Screening Review';
    case 'Approved':
      return 'Screening Passed';
    case 'Calibrated':
      return 'Difficulty Prediction Review';
    case 'Retired':
      return 'Screening Review';
    default:
      return undefined;
  }
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
    irtParameters: patch.irtParameters ?? baseItem.irtParameters,
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
  const today = new Date().toISOString().slice(0, 10);

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const dimensions: Array<'cefrFit' | 'distractorStrength' | 'clarity' | 'fairness' | 'similarity'> = [
      'cefrFit',
      'distractorStrength',
      'clarity',
      'fairness',
      'similarity',
    ];

    const randomResults = dimensions.reduce<Record<string, 'Pass' | 'Fail'>>((acc, dimension) => {
      acc[dimension] = Math.random() >= 0.2 ? 'Pass' : 'Fail';
      return acc;
    }, {});

    const allPassed = Object.values(randomResults).every((result) => result === 'Pass');

    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Screening Queue',
        action: allPassed ? 'Screening Auto-Passed' : 'Screening Auto-Failed',
        state: allPassed ? 'Screening Passed' : 'Screening Review',
      },
    ];

    return {
      workflowState: allPassed ? 'Screening Passed' : 'Screening Review',
      flaggedForReview: !allPassed,
      screening: {
        cefrFit: randomResults.cefrFit,
        distractorStrength: randomResults.distractorStrength,
        clarity: randomResults.clarity,
        fairness: randomResults.fairness,
        similarity: randomResults.similarity,
      },
      reviewHistory: nextHistory,
    };
  });
};

export const approveScreenedItems = (itemIds: string[]) => {
  const today = new Date().toISOString().slice(0, 10);

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Screening Team',
        action: 'Screening Approved',
        state: 'Screening Passed',
      },
    ];

    return {
      workflowState: 'Screening Passed',
      flaggedForReview: false,
      screening: {
        cefrFit: 'Pass',
        distractorStrength: 'Pass',
        clarity: 'Pass',
        fairness: 'Pass',
        similarity: 'Pass',
      },
      reviewHistory: nextHistory,
    };
  });
};

export const rejectScreenedItems = (itemIds: string[]) => {
  const today = new Date().toISOString().slice(0, 10);

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Screening Team',
        action: 'Screening Rejected',
        state: 'Screening Review',
      },
    ];

    return {
      workflowState: 'Screening Review',
      status: 'Retired',
      flaggedForReview: false,
      reviewHistory: nextHistory,
    };
  });
};

type DifficultyPredictionResult = {
  id: string;
  b: number;
  confidence: number;
  difficulty: AssessmentItem['difficulty'];
  discrimination: string;
};

export const applyDifficultyPredictions = (results: DifficultyPredictionResult[]) => {
  const today = new Date().toISOString().slice(0, 10);

  results.forEach((result) => {
    upsertItemOverrides([result.id], (item, existingPatch) => {
      const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
      const nextHistory = [
        ...previousHistory,
        {
          date: today,
          reviewer: 'Prediction Engine',
          action: 'Difficulty Predicted',
          state: 'Difficulty Prediction Review',
        },
      ];

      return {
        workflowState: 'Difficulty Prediction Review',
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
          predictionDate: today,
        },
        aiModelVersion: 'IRT-LSTM-3.1',
        aiPredictionDate: today,
        reviewHistory: nextHistory,
      };
    });
  });
};

export const acceptPredictedItems = (itemIds: string[]) => {
  const today = new Date().toISOString().slice(0, 10);

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Difficulty Review Team',
        action: 'DP Approved',
        state: 'Live',
      },
    ];

    return {
      workflowState: 'Live',
      status: 'Published',
      flaggedForReview: false,
      reviewHistory: nextHistory,
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
        state: 'Seeded',
      },
    ];

    return {
      workflowState: 'Seeded',
      status: 'Published',
      flaggedForReview: false,
      reviewHistory: nextHistory,
      lastEditedDate: today,
      lastEditedBy: 'Seeding Team',
    };
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
  const hasOptions = Array.isArray(q.options) && q.options.length > 0;
  const options = hasOptions
    ? q.options.map((opt, idx) => {
        if (typeof opt === 'string') {
          return {
            label: String.fromCharCode(65 + idx),
            text: opt,
            correct: opt === q.correctAnswer,
          };
        }

        return {
          label: opt.label ?? String.fromCharCode(65 + idx),
          text: opt.text,
          correct: Boolean(opt.correct),
        };
      })
    : undefined;

  return {
    id: q.id,
    title: q.prompt,
    content: q.skillDetails.listening.context || q.prompt,
    level: q.level as CEFRLevel,
    skill: 'Listening',
    itemType: q.questionType as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    options,
    audioAsset: q.skillDetails.listening.audioAsset || q.skillDetails.listening.audioFile,
    passage: q.skillDetails.listening.context,
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
  const followUpQuestions = q.skillDetails.speaking.followUpQuestions ?? [];
  const rubricCriteria = q.skillDetails.speaking.rubricCriteria ?? [];

  return {
    id: q.id,
    title: q.prompt,
    content: q.prompt + (followUpQuestions.length > 0 ? '\n\nFollow-up questions:\n' + followUpQuestions.join('\n') : ''),
    level: q.level as CEFRLevel,
    skill: 'Speaking',
    itemType: 'Speaking' as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    rubric: rubricCriteria.length > 0 ? `Assessment Criteria:\n${rubricCriteria.join('\n')}` : undefined,
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

  return {
    id: q.id,
    title: q.prompt,
    content: q.prompt,
    level: q.level as CEFRLevel,
    skill: 'Writing',
    itemType: 'Essay' as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    rubric: q.skillDetails.writing.rubric,
    passage: q.skillDetails.writing.visualData,
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
  const hasOptions = Array.isArray(q.options) && q.options.length > 0;
  const options = hasOptions
    ? q.options.map((opt, idx) => {
        if (typeof opt === 'string') {
          return {
            label: String.fromCharCode(65 + idx),
            text: opt,
            correct: opt === q.correctAnswer,
          };
        }

        return {
          label: opt.label ?? String.fromCharCode(65 + idx),
          text: opt.text,
          correct: typeof opt.correct === 'boolean' ? opt.correct : undefined,
        };
      })
    : undefined;

  return {
    id: q.id,
    title: q.prompt,
    content: q.prompt,
    level: q.level as CEFRLevel,
    skill: 'Reading',
    itemType: q.questionType as ItemType,
    status: metadata.status as AssessmentItem['status'],
    difficulty: q.difficulty as AssessmentItem['difficulty'],
    passage: q.skillDetails.reading.passageText,
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

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CEFR_LEVEL_TARGET = 75;

export const bankCapacityData: BankCapacity[] = CEFR_LEVELS.map((level) => {
  const levelItems = allMockItems.filter((item) => item.level === level);
  const compromised = levelItems.filter((item) => item.status === 'Compromised').length;
  const active = levelItems.length - compromised;
  const target = CEFR_LEVEL_TARGET;
  const gapToTarget = Math.max(target - active, 0);
  const percentage = Math.round((active / target) * 100);

  return {
    level,
    active,
    compromised,
    gapToTarget,
    target,
    percentage,
  };
});

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
    item.workflowState === 'Screening Review' ||
    item.workflowState === 'Difficulty Prediction Review' ||
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

