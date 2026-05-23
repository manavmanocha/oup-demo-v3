import { AssessmentItem, BankCapacity, CEFRLevel, ItemType } from './types';

import questionsData from './questions.json';

type ListeningQuestion = (typeof questionsData.listeningQuestionsBase)[number] & {
  audioFile?: string;
};
type ReadingQuestion = (typeof questionsData.readingQuestions)[number];
type WritingQuestion = (typeof questionsData.writingQuestions)[number];
type SpeakingQuestion = (typeof questionsData.speakingQuestions)[number];

const audioFileByTestId = questionsData.audioFileByTestId as Record<string, string>;
const listeningQuestionsBase = questionsData.listeningQuestionsBase as ListeningQuestion[];
const listeningQuestions: ListeningQuestion[] = listeningQuestionsBase.map((question) => ({
  ...question,
  audioFile: audioFileByTestId[question.testId] ?? question.audioFile,
}));
const readingQuestions: ReadingQuestion[] = questionsData.readingQuestions as ReadingQuestion[];
const writingQuestions: WritingQuestion[] = questionsData.writingQuestions as WritingQuestion[];
const speakingQuestions: SpeakingQuestion[] = questionsData.speakingQuestions as SpeakingQuestion[];
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

export const bankCapacityData: BankCapacity[] = [
  { level: 'A1', active: 84, compromised: 6, gapToTarget: 28, target: 118, percentage: 71 },
  { level: 'A2', active: 67, compromised: 13, gapToTarget: 0, target: 80, percentage: 100 },
  { level: 'B1', active: 80, compromised: 5, gapToTarget: 15, target: 100, percentage: 85 },
  { level: 'B2', active: 55, compromised: 0, gapToTarget: 0, target: 55, percentage: 100 },
  { level: 'C1', active: 14, compromised: 0, gapToTarget: 36, target: 50, percentage: 28 },
  { level: 'C2', active: 67, compromised: 3, gapToTarget: 13, target: 83, percentage: 84 },
];

export const mockItems: AssessmentItem[] = [
  {
    id: 'ITM-RACE-0010',
    title: 'What did the armed men steal on Thursday?',
    content: 'What did the armed men steal on Thursday?',
    level: 'A1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Compromised',
    exposureCount: 188,
    difficulty: 'Easy',
    passageId: 'PSG-RACE-0010',
    passage: 'A passage about a theft that occurred on Thursday...',
    options: [
      { label: 'A', text: 'They stole all the crops from the village.' },
      { label: 'B', text: 'They stole jewelry from the family home.', correct: true },
      { label: 'C', text: 'They stole the village records.' },
      { label: 'D', text: 'They stole several racehorses.' },
    ],
    irtParameters: {
      b: 0.45,
      a: 1.2,
      c: 0.25,
      sampleSize: 1250,
      modelVersion: 'IRT-2.4',
      predictionDate: '2025-01-15',
      calibratedFromFieldTest: true,
      predictedByAI: false,
    },
    subSkill: 'Reading for detail',
    cognitiveLevel: 'L2 Understand',
    contentDomain: 'Humanities',
    languageVariety: 'International',
    enemyItems: ['ITM-RACE-0145'],
    discrimination: 'Moderate',
    confidence: 91,
    screening: {
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Review',
    },
    workflowState: 'Live',
    reviewHistory: [
      { date: '2024-08-16', reviewer: 'Sarah Chen', action: 'Created', state: 'Draft' },
      { date: '2024-09-02', reviewer: 'Michael Torres', action: 'Reviewed', state: 'In Review', notes: 'Approved for field testing' },
      { date: '2024-12-10', reviewer: 'System', action: 'Calibrated', state: 'Calibrated', notes: 'IRT parameters calculated from field test data (n=1250)' },
      { date: '2025-01-08', reviewer: 'Emma Rodriguez', action: 'Flagged', state: 'Live', notes: 'High exposure count detected - item may be compromised' },
    ],
    flaggedForReview: true,
    flagReason: 'High exposure count (188) may compromise item security',
    author: 'Sarah Chen',
    createdDate: '2024-08-16',
    lastEditedDate: '2025-01-08',
    lastEditedBy: 'Emma Rodriguez',
    reviewers: ['Michael Torres', 'Emma Rodriguez'],
  },
  {
    id: 'ITM-RACE-0145',
    title: 'Why did the man give up his job, home and friends?',
    content: 'Why did the man give up his job, home and friends?',
    level: 'A1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Compromised',
    exposureCount: 142,
    difficulty: 'Easy',
    passageId: 'PSG-RACE-0145',
    options: [
      { label: 'A', text: 'To pursue a new career opportunity abroad.' },
      { label: 'B', text: 'To find a suitable training place.', correct: true },
      { label: 'C', text: 'To escape from financial difficulties.' },
      { label: 'D', text: 'To take care of his elderly parents.' },
    ],
    irtParameters: {
      b: 0.52,
      a: 1.15,
      c: 0.23,
      sampleSize: 980,
      modelVersion: 'IRT-2.4',
      predictionDate: '2025-01-12',
      calibratedFromFieldTest: true,
      predictedByAI: false,
    },
    subSkill: 'Reading for detail',
    cognitiveLevel: 'L2 Understand',
    contentDomain: 'Humanities',
    languageVariety: 'International',
    enemyItems: ['ITM-RACE-0010'],
    discrimination: 'Moderate',
    confidence: 89,
    screening: {
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Review',
      similarity: 'Pass',
    },
    workflowState: 'Live',
    reviewHistory: [
      { date: '2024-07-22', reviewer: 'James Liu', action: 'Created', state: 'Draft' },
      { date: '2024-08-14', reviewer: 'Priya Sharma', action: 'Reviewed', state: 'Approved', notes: 'Content validated, approved for calibration' },
      { date: '2024-11-30', reviewer: 'System', action: 'Calibrated', state: 'Calibrated' },
      { date: '2025-01-05', reviewer: 'System', action: 'Auto-flagged', state: 'Live', notes: 'Similarity to ITM-RACE-0010 detected' },
    ],
    flaggedForReview: false,
    author: 'James Liu',
    createdDate: '2024-07-22',
    lastEditedDate: '2024-08-14',
    lastEditedBy: 'Priya Sharma',
    reviewers: ['Priya Sharma'],
  },
  {
    id: 'ITM-GEN-0009',
    title: 'What does the woman want?',
    content: 'What does the woman want?',
    level: 'A1',
    skill: 'Listening',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Easy',
    audioAsset: 'audio_gen_0009.mp3',
    options: [
      { label: 'A', text: 'To schedule a doctor appointment.' },
      { label: 'B', text: 'To reschedule a meeting.', correct: true },
      { label: 'C', text: 'To cancel her reservation.' },
      { label: 'D', text: 'To confirm her travel plans.' },
    ],
    irtParameters: {
      b: 0.38,
      a: 1.35,
      c: 0.22,
      sampleSize: 450,
      modelVersion: 'IRT-LSTM-3.1',
      predictionDate: '2025-03-10',
      calibratedFromFieldTest: false,
      predictedByAI: true,
    },
    subSkill: 'Listening for gist',
    cognitiveLevel: 'L2 Understand',
    contentDomain: 'General',
    languageVariety: 'International',
    discrimination: 'Good',
    confidence: 78,
    screening: {
      cefrFit: 'Pass',
      distractorStrength: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
      similarity: 'Pass',
    },
    workflowState: 'Screening Passed',
    reviewHistory: [
      { date: '2025-02-28', reviewer: 'AI System', action: 'Generated', state: 'Draft', notes: 'Auto-generated by AI model' },
      { date: '2025-03-05', reviewer: 'Lisa Anderson', action: 'Reviewed', state: 'In Review', notes: 'Audio quality verified, distractors are plausible' },
      { date: '2025-03-10', reviewer: 'David Kim', action: 'Approved', state: 'Approved', notes: 'Ready for difficulty prediction' },
    ],
    flaggedForReview: false,
    author: 'AI Content Generator v3.1',
    createdDate: '2025-02-28',
    lastEditedDate: '2025-03-10',
    lastEditedBy: 'David Kim',
    reviewers: ['Lisa Anderson', 'David Kim'],
    aiModelVersion: 'GPT-Assessment-3.1',
    aiPredictionDate: '2025-03-10',
  },
  {
    id: 'ITM-WRITE-0012',
    title: 'Write an essay on the impact of artificial intelligence',
    content: 'Write an essay on the impact of artificial intelligence',
    level: 'C1',
    skill: 'Writing',
    itemType: 'Essay',
    status: 'Published',
    difficulty: 'Hard',
    rubric: `
Scoring Rubric (0-5 scale):
5 - Exceptional: Sophisticated vocabulary, complex structures, coherent argumentation
4 - Strong: Good range of vocabulary, varied sentence structures, clear organization
3 - Adequate: Sufficient vocabulary for task, some variety in structures, basic organization
2 - Limited: Limited vocabulary, simple structures, weak organization
1 - Very Limited: Very limited vocabulary, frequent errors, minimal coherence
0 - No response or completely off-topic
    `,
    irtParameters: {
      b: 1.85,
      a: 0.95,
      c: 0.0,
      sampleSize: 320,
      modelVersion: 'IRT-Rasch-1.2',
      predictionDate: '2025-02-20',
      calibratedFromFieldTest: true,
      predictedByAI: false,
    },
    subSkill: 'Essay writing',
    cognitiveLevel: 'L4 Analyze',
    contentDomain: 'Technology',
    languageVariety: 'International',
    discrimination: 'Moderate',
    confidence: 87,
    screening: {
      cefrFit: 'Pass',
      clarity: 'Pass',
      fairness: 'Review',
    },
    workflowState: 'Live',
    reviewHistory: [
      { date: '2024-10-05', reviewer: 'Robert Martinez', action: 'Created', state: 'Draft' },
      { date: '2024-10-12', reviewer: 'Fatima Al-Hassan', action: 'Reviewed', state: 'In Review', notes: 'Rubric needs minor adjustments for C1 level' },
      { date: '2024-10-15', reviewer: 'Robert Martinez', action: 'Revised', state: 'In Review', notes: 'Updated rubric with more specific C1 criteria' },
      { date: '2024-10-18', reviewer: 'Fatima Al-Hassan', action: 'Approved', state: 'Approved', notes: 'Rubric now aligns with CEFR C1 descriptors' },
      { date: '2025-01-20', reviewer: 'System', action: 'Calibrated', state: 'Calibrated' },
    ],
    flaggedForReview: false,
    author: 'Robert Martinez',
    createdDate: '2024-10-05',
    lastEditedDate: '2024-10-15',
    lastEditedBy: 'Robert Martinez',
    reviewers: ['Fatima Al-Hassan'],
  },
  {
    id: 'ITM-SPEAK-0045',
    title: 'Describe your daily routine',
    content: 'Describe your daily routine. Please speak for 1-2 minutes.',
    level: 'A1',
    skill: 'Speaking',
    itemType: 'Speaking',
    status: 'Published',
    difficulty: 'Easy',
    rubric: `
Scoring Rubric (0-4 scale):
4 - Can describe daily activities with basic time expressions
3 - Can describe some daily activities with occasional errors
2 - Can name individual activities but with limited connection
1 - Can name only 1-2 activities with significant difficulty
0 - No intelligible response
    `,
    irtParameters: {
      b: 0.25,
      a: 1.08,
      c: 0.0,
      sampleSize: 215,
      modelVersion: 'IRT-Rasch-1.2',
      predictionDate: '2025-03-01',
      calibratedFromFieldTest: false,
      predictedByAI: true,
    },
    subSkill: 'Describing daily activities',
    cognitiveLevel: 'L1 Remember',
    contentDomain: 'Personal Life',
    languageVariety: 'International',
    discrimination: 'Moderate',
    confidence: 82,
    screening: {
      cefrFit: 'Pass',
      clarity: 'Pass',
      fairness: 'Pass',
    },
    workflowState: 'Screening Passed',
    reviewHistory: [
      { date: '2025-02-15', reviewer: 'Anna Kowalski', action: 'Created', state: 'Draft' },
      { date: '2025-02-22', reviewer: 'Chen Wei', action: 'Reviewed', state: 'In Review', notes: 'Prompt is clear and appropriate for A1 level' },
      { date: '2025-03-01', reviewer: 'Chen Wei', action: 'Approved', state: 'Approved', notes: 'Ready for field testing' },
    ],
    flaggedForReview: false,
    author: 'Anna Kowalski',
    createdDate: '2025-02-15',
    lastEditedDate: '2025-03-01',
    lastEditedBy: 'Chen Wei',
    reviewers: ['Chen Wei'],
    aiModelVersion: 'Difficulty-Predictor-2.3',
    aiPredictionDate: '2025-03-01',
  },
];

// Generate additional mock items for different CEFR levels
const additionalMockItems: Partial<AssessmentItem>[] = [
  {
    id: 'ITM-RACE-0238',
    title: 'If Mary are not free in the daytime, she\'d better call...',
    content: 'If Mary are not free in the daytime, she\'d better call...',
    level: 'A2',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Easy',
    irtParameters: { b: 0.68, a: 1.25, c: 0.25, sampleSize: 820, calibratedFromFieldTest: true },
    workflowState: 'Live',
    screening: { cefrFit: 'Review', distractorStrength: 'Review', clarity: 'Pass', fairness: 'Pass', similarity: 'Pass' },
  },
  {
    id: 'ITM-RACE-0293',
    title: 'Why did the girl long for the house on the hill?',
    content: 'Why did the girl long for the house on the hill?',
    level: 'A2',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Easy',
    irtParameters: { b: 0.72, a: 1.18, c: 0.24, predictedByAI: true, modelVersion: 'IRT-LSTM-3.1' },
    workflowState: 'Screening Passed',
  },
  {
    id: 'ITM-RACE-0244',
    title: 'The little boy cried because...',
    content: 'The little boy cried because...',
    level: 'A2',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Easy',
    irtParameters: { b: 0.55, a: 1.32, c: 0.22, sampleSize: 650, calibratedFromFieldTest: true },
    workflowState: 'Live',
  },
  {
    id: 'ITM-RACE-0048',
    title: 'If you were a housewife/wife, which program would probably interest you most?',
    content: 'If you were a housewife/wife, which program would probably interest you most?',
    level: 'A2',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Medium',
    irtParameters: { b: 0.88, a: 1.05, c: 0.26, predictedByAI: true, modelVersion: 'IRT-LSTM-3.1' },
    workflowState: 'Screening Passed',
    screening: { cefrFit: 'Review', distractorStrength: 'Review', clarity: 'Pass', fairness: 'Fail', similarity: 'Pass' },
    flaggedForReview: true,
    flagReason: 'Potential gender bias in prompt wording',
  },
  {
    id: 'ITM-GEN-0063',
    title: 'If one wants to be a reporter, he must __.',
    content: 'If one wants to be a reporter, he must __.',
    level: 'B1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Medium',
    irtParameters: { b: 0.95, a: 1.22, c: 0.24, sampleSize: 540, calibratedFromFieldTest: true },
    workflowState: 'Live',
  },
  {
    id: 'ITM-GEN-0129',
    title: 'The examiner will show you a picture. Please describe the picture in detail.',
    content: 'The examiner will show you a picture. Please describe the picture in detail.',
    level: 'A1',
    skill: 'Speaking',
    itemType: 'Speaking',
    status: 'Published',
    difficulty: 'Very Easy',
    irtParameters: { b: 0.15, a: 1.12, c: 0.0, predictedByAI: true, modelVersion: 'Difficulty-Predictor-2.3' },
    workflowState: 'Screening Passed',
  },
  {
    id: 'ITM-GEN-0189',
    title: 'Write a card with a top and a bottom. The top has a picture of a clock...',
    content: 'Write a card with a top and a bottom. The top has a picture of a clock and the bottom has a picture of a calendar. Please describe the card in detail.',
    level: 'C1',
    skill: 'Writing',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Very Hard',
    irtParameters: { b: 1.65, a: 1.15, c: 0.23, sampleSize: 380, calibratedFromFieldTest: true },
    workflowState: 'Live',
    screening: { cefrFit: 'Pass', distractorStrength: 'Pass', clarity: 'Review', fairness: 'Pass', similarity: 'Pass' },
  },
  {
    id: 'ITM-GEN-0110',
    title: 'The fisherman\'s initial results were inconclusive, prompting further investigation.',
    content: 'The fisherman\'s initial results were inconclusive, prompting further investigation.',
    level: 'B2',
    skill: 'Writing',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Hard',
    irtParameters: { b: 1.28, a: 1.08, c: 0.25, predictedByAI: true, modelVersion: 'IRT-LSTM-3.1' },
    workflowState: 'Screening Passed',
  },
  {
    id: 'ITM-GEN-0129-B',
    title: 'The examiner will show you a picture. Please describe the picture in detail.',
    content: 'The examiner will show you a picture. Please describe the picture in detail.',
    level: 'A1',
    skill: 'Speaking',
    itemType: 'Speaking',
    status: 'Published',
    difficulty: 'Very Easy',
    irtParameters: { b: 0.18, a: 1.15, c: 0.0, predictedByAI: true, modelVersion: 'Difficulty-Predictor-2.3' },
    workflowState: 'Screening Passed',
  },
  {
    id: 'ITM-RACE-0027',
    title: 'This passage primarily deals with...',
    content: 'This passage primarily deals with...',
    level: 'B1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Medium',
    irtParameters: { b: 0.92, a: 1.18, c: 0.23, sampleSize: 720, calibratedFromFieldTest: true },
    workflowState: 'Live',
  },
  {
    id: 'ITM-RACE-0077',
    title: 'Why did the man decide to quit?',
    content: 'Why did the man decide to quit?',
    level: 'B1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Medium',
    irtParameters: { b: 1.02, a: 1.24, c: 0.22, sampleSize: 890, calibratedFromFieldTest: true },
    workflowState: 'Live',
  },
  {
    id: 'ITM-RACE-0150',
    title: 'How about you? What does the passage mainly tell us?',
    content: 'How about you? What does the passage mainly tell us?',
    level: 'B1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Medium',
    irtParameters: { b: 0.98, a: 1.20, c: 0.24, predictedByAI: true, modelVersion: 'IRT-LSTM-3.1' },
    workflowState: 'Screening Passed',
  },
  {
    id: 'ITM-RACE-0199',
    title: 'What\'s the best title of the passage?',
    content: 'What\'s the best title of the passage?',
    level: 'B1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Published',
    difficulty: 'Medium',
    irtParameters: { b: 1.05, a: 1.16, c: 0.25, sampleSize: 610, calibratedFromFieldTest: true },
    workflowState: 'Live',
  },
];

const workflowStageCycle: AssessmentItem['workflowState'][] = [
  'Draft',
  'Screening Review',
  'Screening Passed',
  'Difficulty Prediction Review',
];

const getStageByIndex = (index: number): AssessmentItem['workflowState'] => {
  return workflowStageCycle[index % workflowStageCycle.length];
};

const getLifecycleByStage = (stage: AssessmentItem['workflowState']) => {
  const baseDate = '2026-05-21';

  if (stage === 'Draft') {
    return {
      status: 'Draft' as AssessmentItem['status'],
      reviewHistory: [{ date: baseDate, reviewer: 'System', action: 'Created', state: 'Draft' }],
    };
  }

  if (stage === 'Screening Review') {
    return {
      status: 'Draft' as AssessmentItem['status'],
      flaggedForReview: true,
      flagReason: 'Needs manual screening review.',
      screening: {
        cefrFit: 'Pass' as const,
        distractorStrength: 'Review' as const,
        clarity: 'Review' as const,
        fairness: 'Pass' as const,
        similarity: 'Pass' as const,
      },
      reviewHistory: [{ date: baseDate, reviewer: 'Screening Engine', action: 'Flagged', state: 'Screening Review' }],
    };
  }

  if (stage === 'Screening Passed') {
    return {
      status: 'Draft' as AssessmentItem['status'],
      flaggedForReview: false,
      screening: {
        cefrFit: 'Pass' as const,
        distractorStrength: 'Pass' as const,
        clarity: 'Pass' as const,
        fairness: 'Pass' as const,
        similarity: 'Pass' as const,
      },
      reviewHistory: [{ date: baseDate, reviewer: 'Screening Team', action: 'Approved', state: 'Screening Passed' }],
    };
  }

  return {
    status: 'Draft' as AssessmentItem['status'],
    flaggedForReview: false,
    screening: {
      cefrFit: 'Pass' as const,
      distractorStrength: 'Pass' as const,
      clarity: 'Pass' as const,
      fairness: 'Pass' as const,
      similarity: 'Pass' as const,
    },
    reviewHistory: [{ date: baseDate, reviewer: 'Prediction Engine', action: 'Difficulty Predicted', state: 'Difficulty Prediction Review' }],
  };
};

const stagedWorkflowItems: AssessmentItem[] = [
  // Draft
  {
    id: 'ITM-READ-001',
    title: 'Identify the main idea of the short passage',
    content: 'Read the passage and choose the best summary sentence.',
    level: 'B1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Draft',
    author: 'Workflow Seeder',
    createdDate: '2026-05-20',
    lastEditedDate: '2026-05-20',
    reviewHistory: [{ date: '2026-05-20', reviewer: 'System', action: 'Created', state: 'Draft' }],
  },
  {
    id: 'ITM-LISTEN-001',
    title: 'Choose the speaker\'s intention',
    content: 'Listen to the short dialogue and select the speaker\'s intention.',
    level: 'A2',
    skill: 'Listening',
    itemType: 'Multiple Choice',
    status: 'Draft',
    difficulty: 'Easy',
    workflowState: 'Draft',
    audioAsset: 'audio_stage_listen_draft_001.mp3',
    author: 'Workflow Seeder',
    createdDate: '2026-05-20',
    lastEditedDate: '2026-05-20',
    reviewHistory: [{ date: '2026-05-20', reviewer: 'System', action: 'Created', state: 'Draft' }],
  },
  {
    id: 'ITM-WRITE-001',
    title: 'Write a short opinion paragraph',
    content: 'Write 120-150 words on whether schools should start later in the day.',
    level: 'B2',
    skill: 'Writing',
    itemType: 'Essay',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Draft',
    rubric: 'Clarity, organization, vocabulary range, and grammar accuracy.',
    author: 'Workflow Seeder',
    createdDate: '2026-05-20',
    lastEditedDate: '2026-05-20',
    reviewHistory: [{ date: '2026-05-20', reviewer: 'System', action: 'Created', state: 'Draft' }],
  },
  {
    id: 'ITM-SPEAK-001',
    title: 'Describe your ideal workspace',
    content: 'Speak for 1-2 minutes about your ideal workspace and why it suits you.',
    level: 'B1',
    skill: 'Speaking',
    itemType: 'Speaking',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Draft',
    rubric: 'Fluency, pronunciation, coherence, and lexical control.',
    author: 'Workflow Seeder',
    createdDate: '2026-05-20',
    lastEditedDate: '2026-05-20',
    reviewHistory: [{ date: '2026-05-20', reviewer: 'System', action: 'Created', state: 'Draft' }],
  },

  // Screening Review
  {
    id: 'ITM-READ-SR-001',
    title: 'Infer author attitude from context clues',
    content: 'Read the passage and infer the author\'s attitude toward urban transport policy.',
    level: 'B2',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Draft',
    difficulty: 'Hard',
    workflowState: 'Screening Review',
    flaggedForReview: true,
    flagReason: 'Clarity and fairness checks need manual review.',
    screening: { cefrFit: 'Pass', distractorStrength: 'Review', clarity: 'Review', fairness: 'Review', similarity: 'Pass' },
    author: 'Workflow Seeder',
    createdDate: '2026-05-19',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Screening Engine', action: 'Flagged', state: 'Screening Review' }],
  },
  {
    id: 'ITM-LISTEN-SR-001',
    title: 'Identify missing details from an announcement',
    content: 'Listen to the station announcement and identify the missing timetable detail.',
    level: 'A2',
    skill: 'Listening',
    itemType: 'Multiple Choice',
    status: 'Draft',
    difficulty: 'Easy',
    workflowState: 'Screening Review',
    flaggedForReview: true,
    flagReason: 'Potential distractor overlap in options.',
    screening: { cefrFit: 'Pass', distractorStrength: 'Fail', clarity: 'Pass', fairness: 'Pass', similarity: 'Pass' },
    audioAsset: 'audio_stage_listen_sr_001.mp3',
    author: 'Workflow Seeder',
    createdDate: '2026-05-19',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Screening Engine', action: 'Flagged', state: 'Screening Review' }],
  },
  {
    id: 'ITM-WRITE-SR-001',
    title: 'Discuss the impact of remote work',
    content: 'Write 200-250 words discussing one advantage and one drawback of remote work.',
    level: 'B2',
    skill: 'Writing',
    itemType: 'Essay',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Screening Review',
    flaggedForReview: true,
    flagReason: 'Prompt may be too broad for target level.',
    screening: { cefrFit: 'Review', distractorStrength: 'Pass', clarity: 'Review', fairness: 'Pass', similarity: 'Pass' },
    rubric: 'Task response, coherence, lexical resource, grammar.',
    author: 'Workflow Seeder',
    createdDate: '2026-05-19',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Screening Engine', action: 'Flagged', state: 'Screening Review' }],
  },
  {
    id: 'ITM-SPEAK-SR-001',
    title: 'Talk about a challenging decision',
    content: 'Speak about a difficult decision you made and explain the outcome.',
    level: 'C1',
    skill: 'Speaking',
    itemType: 'Speaking',
    status: 'Draft',
    difficulty: 'Hard',
    workflowState: 'Screening Review',
    flaggedForReview: true,
    flagReason: 'Similarity check triggered with existing speaking prompts.',
    screening: { cefrFit: 'Pass', distractorStrength: 'Pass', clarity: 'Pass', fairness: 'Pass', similarity: 'Review' },
    rubric: 'Content development, coherence, fluency, and pronunciation.',
    author: 'Workflow Seeder',
    createdDate: '2026-05-19',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Screening Engine', action: 'Flagged', state: 'Screening Review' }],
  },

  // Screening Passed
  {
    id: 'ITM-READ-SP-001',
    title: 'Match paragraph headings to sections',
    content: 'Read the text and match each paragraph with the best heading.',
    level: 'B1',
    skill: 'Reading',
    itemType: 'Matching Headings',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Screening Passed',
    screening: { cefrFit: 'Pass', distractorStrength: 'Pass', clarity: 'Pass', fairness: 'Pass', similarity: 'Pass' },
    author: 'Workflow Seeder',
    createdDate: '2026-05-18',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Screening Team', action: 'Approved', state: 'Screening Passed' }],
  },
  {
    id: 'ITM-LISTEN-SP-001',
    title: 'Complete notes from a short lecture',
    content: 'Listen once and complete the missing keywords in the lecture notes.',
    level: 'B1',
    skill: 'Listening',
    itemType: 'Note Completion',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Screening Passed',
    screening: { cefrFit: 'Pass', distractorStrength: 'Pass', clarity: 'Pass', fairness: 'Pass', similarity: 'Pass' },
    audioAsset: 'audio_stage_listen_sp_001.mp3',
    author: 'Workflow Seeder',
    createdDate: '2026-05-18',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Screening Team', action: 'Approved', state: 'Screening Passed' }],
  },
  {
    id: 'ITM-WRITE-SP-001',
    title: 'Write a formal complaint email',
    content: 'Write a formal email complaining about a delayed online delivery.',
    level: 'B1',
    skill: 'Writing',
    itemType: 'Essay',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Screening Passed',
    screening: { cefrFit: 'Pass', distractorStrength: 'Pass', clarity: 'Pass', fairness: 'Pass', similarity: 'Pass' },
    rubric: 'Purpose, structure, register, grammar and accuracy.',
    author: 'Workflow Seeder',
    createdDate: '2026-05-18',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Screening Team', action: 'Approved', state: 'Screening Passed' }],
  },
  {
    id: 'ITM-SPEAK-SP-001',
    title: 'Describe a memorable journey',
    content: 'Speak for up to two minutes about a memorable journey and what you learned.',
    level: 'B2',
    skill: 'Speaking',
    itemType: 'Speaking',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Screening Passed',
    screening: { cefrFit: 'Pass', distractorStrength: 'Pass', clarity: 'Pass', fairness: 'Pass', similarity: 'Pass' },
    rubric: 'Fluency, lexical resource, pronunciation and coherence.',
    author: 'Workflow Seeder',
    createdDate: '2026-05-18',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Screening Team', action: 'Approved', state: 'Screening Passed' }],
  },

  // Difficulty Prediction Review
  {
    id: 'ITM-READ-DPR-001',
    title: 'Determine implication in the final paragraph',
    content: 'Read the passage and choose the option that best reflects the implied meaning.',
    level: 'C1',
    skill: 'Reading',
    itemType: 'Multiple Choice',
    status: 'Draft',
    difficulty: 'Hard',
    workflowState: 'Difficulty Prediction Review',
    confidence: 82,
    discrimination: 'Moderate',
    irtParameters: { b: 1.42, a: 1.19, c: 0.24, predictedByAI: true, modelVersion: 'IRT-LSTM-3.1', predictionDate: '2026-05-21' },
    author: 'Workflow Seeder',
    createdDate: '2026-05-17',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Prediction Engine', action: 'Difficulty Predicted', state: 'Difficulty Prediction Review' }],
  },
  {
    id: 'ITM-LISTEN-DPR-001',
    title: 'Identify the speaker\'s conclusion',
    content: 'Listen to the final segment and select the speaker\'s conclusion.',
    level: 'B2',
    skill: 'Listening',
    itemType: 'Multiple Choice',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Difficulty Prediction Review',
    confidence: 79,
    discrimination: 'Moderate',
    audioAsset: 'audio_stage_listen_dpr_001.mp3',
    irtParameters: { b: 0.96, a: 1.17, c: 0.23, predictedByAI: true, modelVersion: 'IRT-LSTM-3.1', predictionDate: '2026-05-21' },
    author: 'Workflow Seeder',
    createdDate: '2026-05-17',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Prediction Engine', action: 'Difficulty Predicted', state: 'Difficulty Prediction Review' }],
  },
  {
    id: 'ITM-WRITE-DPR-001',
    title: 'Evaluate a policy proposal in writing',
    content: 'Write 220-260 words evaluating a city policy proposal from two perspectives.',
    level: 'C1',
    skill: 'Writing',
    itemType: 'Essay',
    status: 'Draft',
    difficulty: 'Hard',
    workflowState: 'Difficulty Prediction Review',
    confidence: 84,
    discrimination: 'High',
    rubric: 'Argument quality, cohesion, lexical precision, and grammatical control.',
    irtParameters: { b: 1.36, a: 1.28, c: 0.0, predictedByAI: true, modelVersion: 'IRT-LSTM-3.1', predictionDate: '2026-05-21' },
    author: 'Workflow Seeder',
    createdDate: '2026-05-17',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Prediction Engine', action: 'Difficulty Predicted', state: 'Difficulty Prediction Review' }],
  },
  {
    id: 'ITM-SPEAK-DPR-001',
    title: 'Explain a problem-solving strategy',
    content: 'Speak for 2 minutes explaining a strategy you use to solve unfamiliar problems.',
    level: 'B2',
    skill: 'Speaking',
    itemType: 'Speaking',
    status: 'Draft',
    difficulty: 'Medium',
    workflowState: 'Difficulty Prediction Review',
    confidence: 81,
    discrimination: 'Moderate',
    rubric: 'Task completion, coherence, fluency, and pronunciation.',
    irtParameters: { b: 1.02, a: 1.14, c: 0.0, predictedByAI: true, modelVersion: 'IRT-LSTM-3.1', predictionDate: '2026-05-21' },
    author: 'Workflow Seeder',
    createdDate: '2026-05-17',
    lastEditedDate: '2026-05-21',
    reviewHistory: [{ date: '2026-05-21', reviewer: 'Prediction Engine', action: 'Difficulty Predicted', state: 'Difficulty Prediction Review' }],
  },
];

// Convert listening questions to AssessmentItem format
const listeningItems: AssessmentItem[] = listeningQuestions.map((q, index) => {
  const workflowState = getStageByIndex(index);
  const lifecycle = getLifecycleByStage(workflowState);

  return {
    id: q.id,
    title: q.question,
    content: q.context || q.question,
    level: q.level as CEFRLevel,
    skill: 'Listening',
    itemType: q.questionType as ItemType,
    status: lifecycle.status,
    difficulty: q.difficulty,
    options: q.options ? q.options.map((opt, idx) => ({
      label: String.fromCharCode(65 + idx),
      text: opt,
      correct: opt === q.correctAnswer
    })) : undefined,
    audioAsset: q.audioFile,
    passage: q.context,
    subSkill: q.skill,
    cognitiveLevel: q.difficulty === 'Easy' ? 'L2 Understand' : q.difficulty === 'Medium' ? 'L3 Apply' : 'L4 Analyze',
    contentDomain: q.topic,
    languageVariety: 'International',
    discrimination: q.difficulty === 'Easy' ? 'Low' : q.difficulty === 'Medium' ? 'Moderate' : 'High',
    confidence: q.difficulty === 'Easy' ? 75 : q.difficulty === 'Medium' ? 85 : 92,
    workflowState,
    screening: lifecycle.screening,
    flaggedForReview: lifecycle.flaggedForReview,
    flagReason: lifecycle.flagReason,
    author: 'Content Team',
    createdDate: '2024-09-01',
    lastEditedDate: '2024-10-15',
    reviewHistory: lifecycle.reviewHistory,
    irtParameters: {
      b: q.difficulty === 'Easy' ? 0.3 : q.difficulty === 'Medium' ? 0.8 : 1.3,
      a: 1.2,
      c: q.options ? 0.25 : 0.0,
      sampleSize: 500,
      modelVersion: 'IRT-2.4',
      calibratedFromFieldTest: true,
    }
  };
});

// Convert speaking questions to AssessmentItem format
const speakingItems: AssessmentItem[] = speakingQuestions.map((q, index) => {
  const workflowState = getStageByIndex(index);
  const lifecycle = getLifecycleByStage(workflowState);

  return {
    id: q.id,
    title: q.question,
    content: q.question + (q.followUpQuestions ? '\n\nFollow-up questions:\n' + q.followUpQuestions.join('\n') : ''),
    level: q.level as CEFRLevel,
    skill: 'Speaking',
    itemType: 'Speaking' as ItemType,
    status: lifecycle.status,
    difficulty: q.difficulty,
    rubric: q.rubricCriteria ? `Assessment Criteria:\n${q.rubricCriteria.join('\n')}` : undefined,
    subSkill: q.skill,
    cognitiveLevel: q.part === 1 ? 'L2 Understand' : q.part === 2 ? 'L3 Apply' : 'L4 Analyze',
    contentDomain: q.topic,
    languageVariety: 'International',
    discrimination: q.difficulty === 'Easy' ? 'Low' : q.difficulty === 'Medium' ? 'Moderate' : 'High',
    confidence: q.difficulty === 'Easy' ? 75 : q.difficulty === 'Medium' ? 85 : 92,
    workflowState,
    screening: lifecycle.screening,
    flaggedForReview: lifecycle.flaggedForReview,
    flagReason: lifecycle.flagReason,
    author: 'Speaking Team',
    createdDate: '2024-10-01',
    lastEditedDate: '2024-11-15',
    reviewHistory: lifecycle.reviewHistory,
    irtParameters: {
      b: q.difficulty === 'Easy' ? 0.4 : q.difficulty === 'Medium' ? 0.9 : 1.4,
      a: 1.1,
      c: 0.0,
      sampleSize: 450,
      modelVersion: 'IRT-2.4',
      calibratedFromFieldTest: true,
    }
  };
});

// Convert writing questions to AssessmentItem format
const writingItems: AssessmentItem[] = writingQuestions.map((q, index) => {
  const workflowState = getStageByIndex(index);
  const lifecycle = getLifecycleByStage(workflowState);

  return {
    id: q.id,
    title: q.question,
    content: q.question,
    level: q.level as CEFRLevel,
    skill: 'Writing',
    itemType: 'Essay' as ItemType,
    status: lifecycle.status,
    difficulty: q.difficulty,
    rubric: q.rubric,
    passage: q.visualData,
    subSkill: q.skill,
    cognitiveLevel: q.task === 1 ? 'L3 Apply' : 'L4 Analyze',
    contentDomain: q.topic,
    languageVariety: 'International',
    discrimination: q.difficulty === 'Easy' ? 'Low' : q.difficulty === 'Medium' ? 'Moderate' : 'High',
    confidence: q.difficulty === 'Easy' ? 75 : q.difficulty === 'Medium' ? 85 : 92,
    workflowState,
    screening: lifecycle.screening,
    flaggedForReview: lifecycle.flaggedForReview,
    flagReason: lifecycle.flagReason,
    author: 'Writing Team',
    createdDate: '2024-10-15',
    lastEditedDate: '2024-12-01',
    reviewHistory: lifecycle.reviewHistory,
    irtParameters: {
      b: q.difficulty === 'Easy' ? 0.5 : q.difficulty === 'Medium' ? 1.0 : 1.5,
      a: 1.3,
      c: 0.0,
      sampleSize: 400,
      modelVersion: 'IRT-2.4',
      calibratedFromFieldTest: true,
    }
  };
});

// Convert reading questions to AssessmentItem format
const readingItems: AssessmentItem[] = readingQuestions.map((q, index) => {
  const workflowState = getStageByIndex(index);
  const lifecycle = getLifecycleByStage(workflowState);

  return {
    id: q.id,
    title: q.question,
    content: q.question,
    level: q.level as CEFRLevel,
    skill: 'Reading',
    itemType: q.questionType as ItemType,
    status: lifecycle.status,
    difficulty: q.difficulty,
    passage: q.passageText,
    passageId: `PSG-${q.id}`,
    options: q.options,
    subSkill: q.subSkill,
    cognitiveLevel: q.difficulty === 'Easy' ? 'L2 Understand' : q.difficulty === 'Medium' ? 'L3 Apply' : 'L4 Analyze',
    contentDomain: q.topic,
    languageVariety: 'International',
    discrimination: q.difficulty === 'Easy' ? 'Low' : q.difficulty === 'Medium' ? 'Moderate' : 'High',
    confidence: q.difficulty === 'Easy' ? 75 : q.difficulty === 'Medium' ? 85 : 92,
    workflowState,
    screening: lifecycle.screening,
    flaggedForReview: lifecycle.flaggedForReview,
    flagReason: lifecycle.flagReason,
    author: 'Reading Team',
    createdDate: '2024-11-01',
    lastEditedDate: '2024-12-15',
    reviewHistory: lifecycle.reviewHistory,
    irtParameters: {
      b: q.difficulty === 'Easy' ? 0.35 : q.difficulty === 'Medium' ? 0.85 : 1.35,
      a: 1.25,
      c: q.options ? 0.25 : 0.0,
      sampleSize: 550,
      modelVersion: 'IRT-2.4',
      calibratedFromFieldTest: true,
    }
  };
});

// Merge and export all items
const REALISTIC_AUTHORS = [
  'Aisha Verma',
  'Daniel Brooks',
  'Neha Kapoor',
  'Rohan Mehta',
  'Elena Petrova',
];

const REALISTIC_REVIEWERS = [
  'Maya Thompson',
  'Arjun Nair',
  'Sofia Martinez',
  'Kabir Singh',
  'Liam O\'Connell',
];

const hashFromId = (id: string) =>
  id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

const assignRealisticPeople = (item: AssessmentItem): AssessmentItem => {
  const hash = hashFromId(item.id);
  const author = REALISTIC_AUTHORS[hash % REALISTIC_AUTHORS.length];
  const reviewerOne = REALISTIC_REVIEWERS[hash % REALISTIC_REVIEWERS.length];
  const reviewerTwo = REALISTIC_REVIEWERS[(hash + 2) % REALISTIC_REVIEWERS.length];
  const reviewers = reviewerOne === reviewerTwo ? [reviewerOne] : [reviewerOne, reviewerTwo];

  const reviewHistory = (item.reviewHistory ?? []).map((entry, index) => {
    const assignedReviewer = REALISTIC_REVIEWERS[(hash + index) % REALISTIC_REVIEWERS.length];
    return {
      ...entry,
      reviewer: assignedReviewer,
    };
  });

  const lastEditedBy = item.lastEditedBy
    ? REALISTIC_REVIEWERS[(hash + 1) % REALISTIC_REVIEWERS.length]
    : undefined;

  return {
    ...item,
    author,
    reviewers,
    reviewHistory,
    lastEditedBy,
  };
};

export const allMockItems: AssessmentItem[] = [
  ...mockItems,
  ...additionalMockItems.map((item, index) => ({
    ...item,
    options: item.options || [
      { label: 'A', text: 'Option A' },
      { label: 'B', text: 'Option B', correct: true },
      { label: 'C', text: 'Option C' },
      { label: 'D', text: 'Option D' },
    ],
    subSkill: item.subSkill || 'Reading comprehension',
    cognitiveLevel: item.cognitiveLevel || 'L2 Understand',
    contentDomain: item.contentDomain || 'General',
    languageVariety: item.languageVariety || 'International',
    discrimination: item.discrimination || 'Moderate',
    confidence: item.confidence || 85,
    author: item.author || 'Content Team',
    createdDate: item.createdDate || '2024-06-15',
    lastEditedDate: item.lastEditedDate || '2024-08-20',
    reviewHistory: item.reviewHistory || [
      { date: '2024-06-15', reviewer: 'System', action: 'Created', state: 'Draft' },
      { date: '2024-08-20', reviewer: 'Reviewer', action: 'Approved', state: 'Approved' },
    ],
  })) as AssessmentItem[],
  ...stagedWorkflowItems,
  ...listeningItems,
  ...speakingItems,
  ...writingItems,
  ...readingItems,
].map(assignRealisticPeople);

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
  const seededTestingItems: AssessmentItem[] = [];
  const persistedItems = getStoredIngestedItems();
  const combinedById = new Map<string, AssessmentItem>();
  allMockItems.forEach((item) => combinedById.set(item.id, normalizeItemLifecycle(item)));
  seededTestingItems.forEach((item) => combinedById.set(item.id, normalizeItemLifecycle(item)));
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

