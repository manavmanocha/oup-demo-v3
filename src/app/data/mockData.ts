import {
  AnalysisApiPayload,
  AssessmentItem,
  BankCapacity,
  CEFRLevel,
  Difficulty,
  ItemAnalysisLogEntry,
  ItemAnalysisResult,
  ItemType,
} from './types';
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
const ANALYSIS_API_ENDPOINT = 'http://13.201.7.229:8765/analyze';
const ANALYSIS_API_TIMEOUT_MS = 180000;
const ANALYSIS_API_MAX_RETRIES = 3;
const ANALYSIS_API_RETRY_DELAY_MS = 1000;

type ScreeningDimensionKey = keyof NonNullable<AssessmentItem['screening']>;
type ScreeningDimensionResult = Exclude<NonNullable<AssessmentItem['screening']>[ScreeningDimensionKey], undefined>;
type ScreeningResults = Record<ScreeningDimensionKey, ScreeningDimensionResult>;
type AnalysisFeedback = NonNullable<ItemAnalysisResult['responseMapped']>['feedback'];

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
      'Reviewer feedback: Passed all screening checks. The client-resolution scenario is authentic, appropriately constrained, and strong enough to move into difficulty estimation.',
  },
};

const DEMO_DP_FIXTURES: Record<string, DifficultyPredictionResult> = {
  'EAS-DEM-SPK-B2-103': {
    id: 'EAS-DEM-SPK-B2-103',
    b: 0.58,
    confidence: 91,
    difficulty: 'Medium',
    discrimination: 'High',
  },
  'EAS-DEM-WRT-C1-104': {
    id: 'EAS-DEM-WRT-C1-104',
    b: 1.08,
    confidence: 58,
    difficulty: 'Hard',
    discrimination: 'Moderate',
  },
  'EAS-DEM-SPK-C1-105': {
    id: 'EAS-DEM-SPK-C1-105',
    b: 1.02,
    confidence: 89,
    difficulty: 'Hard',
    discrimination: 'High',
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
  A1: { meanB: -1.7, spread: 0.18, confidence: 92 },
  A2: { meanB: -1.1, spread: 0.16, confidence: 90 },
  B1: { meanB: -0.35, spread: 0.18, confidence: 88 },
  B2: { meanB: 0.35, spread: 0.2, confidence: 86 },
  C1: { meanB: 1.05, spread: 0.18, confidence: 84 },
  C2: { meanB: 1.65, spread: 0.15, confidence: 82 },
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

const pause = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const toNumericValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const toScreeningResult = (value: unknown): ScreeningDimensionResult => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'pass') return 'Pass';
    if (normalized === 'review') return 'Review';
    if (normalized === 'fail') return 'Fail';
    if (normalized === 'high') return 'Pass';
    if (normalized === 'medium') return 'Pass';
    if (normalized === 'low') return 'Fail';
  }

  if (typeof value === 'boolean') {
    return value ? 'Pass' : 'Fail';
  }

  const numeric = toNumericValue(value);
  if (numeric !== undefined) {
    if (numeric >= 0.75) return 'Pass';
    if (numeric >= 0.45) return 'Review';
    return 'Fail';
  }

  return 'Review';
};

const getRatingValue = (value: unknown): unknown => {
  if (value && typeof value === 'object' && 'rating' in value) {
    const rating = (value as { rating?: unknown }).rating;
    if (rating !== undefined) {
      return rating;
    }
  }

  return value;
};

const ratingToNumeric = (value: unknown): number | undefined => {
  const directNumeric = toNumericValue(value);
  if (directNumeric !== undefined) {
    return directNumeric;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'high') return 0.85;
    if (normalized === 'medium') return 0.55;
    if (normalized === 'low') return 0.3;
  }

  return undefined;
};

const toDiscriminationBand = (value: unknown): string => {
  const numeric = toNumericValue(value);
  if (numeric === undefined) {
    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'high') return 'High';
      if (normalized === 'medium') return 'Moderate';
      if (normalized === 'low') return 'Low';

      return value;
    }

    return 'Moderate';
  }

  if (numeric >= 0.75) return 'High';
  if (numeric >= 0.45) return 'Moderate';
  return 'Low';
};

const defaultScreeningFromAnalysisFailure = (): ScreeningResults => ({
  cefrFit: 'Review',
  distractorStrength: 'Review',
  clarity: 'Review',
  fairness: 'Review',
  similarity: 'Review',
});

const toCompleteScreeningResults = (
  screening: Partial<ScreeningResults> | undefined,
): ScreeningResults => ({
  cefrFit: screening?.cefrFit ?? 'Review',
  distractorStrength: screening?.distractorStrength ?? 'Review',
  clarity: screening?.clarity ?? 'Review',
  fairness: screening?.fairness ?? 'Review',
  similarity: screening?.similarity ?? 'Review',
});

const buildFailureFeedback = (
  screening: ScreeningResults,
  feedback: AnalysisFeedback | undefined,
): string | undefined => {
  const failedReasons = [
    screening.cefrFit === 'Fail' && feedback?.cefrFit ? `CEFR Fit: ${feedback.cefrFit}` : undefined,
    screening.distractorStrength === 'Fail' && feedback?.distractorStrength
      ? `Distractor Strength: ${feedback.distractorStrength}`
      : undefined,
    screening.clarity === 'Fail' && feedback?.clarity ? `Clarity: ${feedback.clarity}` : undefined,
    screening.fairness === 'Fail' && feedback?.fairness ? `Fairness: ${feedback.fairness}` : undefined,
  ].filter(Boolean);

  return failedReasons.length ? failedReasons.join(' ') : undefined;
};

const computeConfidenceFromScreening = (screening: ScreeningResults): number => {
  const weights: Record<ScreeningDimensionResult, number> = {
    Pass: 100,
    Review: 70,
    Fail: 40,
  };

  const total = SCREENING_DIMENSIONS.reduce((sum, key) => sum + weights[screening[key]], 0);
  return Math.round(total / SCREENING_DIMENSIONS.length);
};

const extractQuestionPrompts = (item: AssessmentItem): string[] => {
  if (item.followUpQuestions?.length) {
    return item.followUpQuestions.filter((question) => question.trim().length > 0);
  }

  const prompt = item.content?.trim() || item.title?.trim() || item.id;
  return [prompt];
};

const extractOptionSets = (item: AssessmentItem, questionCount: number): string[][] => {
  if (!item.options?.length) {
    return Array.from({ length: questionCount }, () => []);
  }

  const optionTexts = item.options.map((option) => option.text);
  return Array.from({ length: questionCount }, () => optionTexts);
};

const resolveAnswerIndex = (item: AssessmentItem, options: string[]): number => {
  const correctOptionIndex = item.options?.findIndex((option) => option.correct) ?? -1;
  if (correctOptionIndex >= 0) {
    return correctOptionIndex;
  }

  const normalizedAnswerKey = item.answerKey?.trim().toLowerCase();
  if (!normalizedAnswerKey) {
    return -1;
  }

  const byText = options.findIndex((option) => option.trim().toLowerCase() === normalizedAnswerKey);
  if (byText >= 0) {
    return byText;
  }

  const letterCharCode = normalizedAnswerKey.codePointAt(0);
  if (letterCharCode && letterCharCode >= 97 && letterCharCode <= 122) {
    const byLabel = letterCharCode - 97;
    if (byLabel >= 0 && byLabel < options.length) {
      return byLabel;
    }
  }

  const numeric = Number(normalizedAnswerKey);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric < options.length) {
    return numeric;
  }

  return -1;
};

const buildAnalysisPayload = (item: AssessmentItem): AnalysisApiPayload => {
  const questions = extractQuestionPrompts(item);
  const options = extractOptionSets(item, questions.length);
  const answers = options.map((optionSet) => resolveAnswerIndex(item, optionSet));

  return {
    id: item.id,
    article: item.passage?.trim() || item.content?.trim() || item.title,
    questions,
    options,
    answers,
  };
};

const mapAnalysisResponse = (responseRaw: unknown): ItemAnalysisResult['responseMapped'] => {
  type QualityDimension = {
    rating?: unknown;
    justification?: unknown;
  };

  const response = (responseRaw ?? {}) as {
    results?: Array<{
      id?: string;
      quality_evaluation?: {
        cefr_fit?: QualityDimension | unknown;
        distractor_quality?: QualityDimension | unknown;
        clarity?: QualityDimension | unknown;
        fairness?: QualityDimension | unknown;
        discrimination_power?: QualityDimension | unknown;
      };
      numeric_difficulty?: unknown;
    }>;
    quality_evaluation?: {
      cefr_fit?: QualityDimension | unknown;
      distractor_quality?: QualityDimension | unknown;
      clarity?: QualityDimension | unknown;
      fairness?: QualityDimension | unknown;
      discrimination_power?: QualityDimension | unknown;
    };
    numeric_difficulty?: unknown;
  };

  const firstResult = response.results?.[0];
  const quality = firstResult?.quality_evaluation ?? response.quality_evaluation ?? {};
  const numericDifficulty = toNumericValue(firstResult?.numeric_difficulty ?? response.numeric_difficulty);
  const discriminationRating = getRatingValue(quality.discrimination_power);
  const discriminationPower = ratingToNumeric(discriminationRating);

  const getJustification = (value: unknown): string | undefined => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const justification = (value as { justification?: unknown }).justification;
    if (typeof justification === 'string' && justification.trim()) {
      return justification.trim();
    }

    return undefined;
  };

  const feedback = {
    cefrFit: getJustification(quality.cefr_fit),
    distractorStrength: getJustification(quality.distractor_quality),
    clarity: getJustification(quality.clarity),
    fairness: getJustification(quality.fairness),
    discrimination: getJustification(quality.discrimination_power),
  };

  const combinedFeedback = [
    feedback.cefrFit ? `CEFR Fit: ${feedback.cefrFit}` : undefined,
    feedback.distractorStrength ? `Distractor Strength: ${feedback.distractorStrength}` : undefined,
    feedback.clarity ? `Clarity: ${feedback.clarity}` : undefined,
    feedback.fairness ? `Fairness: ${feedback.fairness}` : undefined,
    feedback.discrimination ? `Discrimination: ${feedback.discrimination}` : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    screening: {
      cefrFit: toScreeningResult(getRatingValue(quality.cefr_fit)),
      distractorStrength: toScreeningResult(getRatingValue(quality.distractor_quality)),
      clarity: toScreeningResult(getRatingValue(quality.clarity)),
      fairness: toScreeningResult(getRatingValue(quality.fairness)),
      similarity: 'Pass',
    },
    feedback: {
      ...feedback,
      combined: combinedFeedback || undefined,
    },
    numericDifficulty,
    discriminationPower,
    difficultyBand: numericDifficulty !== undefined ? getDifficultyLabelFromB(numericDifficulty) : undefined,
    discriminationBand: toDiscriminationBand(discriminationRating),
  };
};

const runAnalysisForItem = async (item: AssessmentItem): Promise<ItemAnalysisResult> => {
  const payload = buildAnalysisPayload(item);
  const logs: ItemAnalysisLogEntry[] = [];

  for (let attempt = 1; attempt <= ANALYSIS_API_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ANALYSIS_API_TIMEOUT_MS);

    try {
      const response = await fetch(ANALYSIS_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const timestamp = new Date().toISOString();
      const text = await response.text();
      const json = text ? JSON.parse(text) : {};

      if (!response.ok) {
        const message = `Analysis API returned HTTP ${response.status}`;
        logs.push({
          timestamp,
          attempt,
          status: 'failed',
          httpStatus: response.status,
          message,
        });

        if (attempt < ANALYSIS_API_MAX_RETRIES) {
          await pause(attempt * ANALYSIS_API_RETRY_DELAY_MS);
          continue;
        }

        return {
          status: 'failed',
          attempts: attempt,
          requestPayload: payload,
          responseRaw: json,
          lastAttemptAt: timestamp,
          error: message,
          logs,
        };
      }

      logs.push({
        timestamp,
        attempt,
        status: 'success',
        httpStatus: response.status,
        message: 'Analysis API call succeeded',
      });

      return {
        status: 'completed',
        attempts: attempt,
        requestPayload: payload,
        responseRaw: json,
        responseMapped: mapAnalysisResponse(json),
        lastAttemptAt: timestamp,
        completedAt: timestamp,
        logs,
      };
    } catch (error) {
      clearTimeout(timeout);
      const timestamp = new Date().toISOString();
      const message = error instanceof Error ? error.message : 'Unexpected analysis API error';
      logs.push({
        timestamp,
        attempt,
        status: 'failed',
        message,
      });

      if (attempt < ANALYSIS_API_MAX_RETRIES) {
        await pause(attempt * ANALYSIS_API_RETRY_DELAY_MS);
        continue;
      }

      return {
        status: 'failed',
        attempts: attempt,
        requestPayload: payload,
        lastAttemptAt: timestamp,
        error: message,
        logs,
      };
    }
  }

  return {
    status: 'failed',
    attempts: ANALYSIS_API_MAX_RETRIES,
    requestPayload: payload,
    lastAttemptAt: new Date().toISOString(),
    error: 'Analysis API retries exhausted',
    logs,
  };
};

const getAlignedDifficultyPrediction = (item: AssessmentItem): DifficultyPredictionResult => {
  const profile = LEVEL_DIFFICULTY_PROFILE[item.level];
  const b = Number(
    clampBValue(profile.meanB + deterministicOffset(`${item.id}:${item.level}`, profile.spread)).toFixed(2),
  );
  const confidence = Math.round(
    Math.min(99, Math.max(70, profile.confidence + deterministicOffset(`${item.id}:confidence`, 4))),
  );

  return {
    id: item.id,
    b,
    confidence,
    difficulty: getDifficultyLabelFromB(b),
    discrimination: confidence >= 90 ? 'High' : confidence >= 80 ? 'Moderate' : 'Low',
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
  const confidence = Math.floor(Math.random() * 30) + 70;
  const difficulty = getDifficultyLabelFromB(b);

  return {
    id,
    b,
    confidence,
    difficulty,
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
  const hasAnalysis = Boolean(baseItem.analysis || patch.analysis);

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
    analysis: hasAnalysis
      ? {
          ...(baseItem.analysis ?? { status: 'pending', attempts: 0 }),
          ...(patch.analysis ?? {}),
          responseMapped: patch.analysis?.responseMapped ?? baseItem.analysis?.responseMapped,
          logs: patch.analysis?.logs ?? baseItem.analysis?.logs,
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

export const queueItemsForScreening = async (itemIds: string[]) => {
  if (!itemIds.length) {
    return;
  }

  const currentItemsById = new Map<string, AssessmentItem>();
  getAllItems().forEach((item) => {
    currentItemsById.set(item.id, item);
  });

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowIso = now.toISOString();

  const analysisById = new Map<string, ItemAnalysisResult>();

  await Promise.all(
    itemIds.map(async (itemId) => {
      const item = currentItemsById.get(itemId);
      if (!item) {
        return;
      }

      const analysis = await runAnalysisForItem(item);
      analysisById.set(itemId, analysis);
    }),
  );

  upsertItemOverrides(itemIds, (item, existingPatch) => {
    const analysis = analysisById.get(item.id);
    const mappedScreening = analysis?.responseMapped?.screening;
    const fallbackFixture = getScreeningFixture(item.id);
    const screeningBase = analysis?.status === 'completed'
      ? toCompleteScreeningResults(mappedScreening)
      : fallbackFixture.screening ?? defaultScreeningFromAnalysisFailure();
    const screening: ScreeningResults = item.itemType === 'Essay'
      ? {
          ...screeningBase,
          distractorStrength: 'Pass',
        }
      : screeningBase;
    const allPassed = SCREENING_DIMENSIONS.every((dimension) => screening[dimension] === 'Pass');
    const confidence = computeConfidenceFromScreening(screening);
    const mappedFeedback = buildFailureFeedback(screening, analysis?.responseMapped?.feedback);
    const apiFeedback = analysis?.status === 'completed'
      ? allPassed
        ? 'Reviewer feedback: Analysis API completed successfully. All screening dimensions passed.'
        : `Reviewer feedback: ${mappedFeedback ?? 'Analysis API completed. One or more screening dimensions require review.'}`
      : `Reviewer feedback: Analysis API failed after ${analysis?.attempts ?? 0} attempt(s). ${analysis?.error ?? 'Unknown error'}`;

    const previousHistory = existingPatch?.reviewHistory ?? item.reviewHistory ?? [];
    const nextHistory = [
      ...previousHistory,
      {
        date: today,
        reviewer: 'Screening Queue',
        action: allPassed ? 'Screening Auto-Completed (Pass)' : 'Screening Auto-Completed (Needs Review)',
        state: 'PENDING_SCREENING_REVIEW',
        notes: apiFeedback,
      },
    ];

    return {
      workflowState: 'PENDING_SCREENING_REVIEW',
      flaggedForReview: !allPassed,
      flagReason: allPassed ? undefined : apiFeedback,
      screening,
      confidence,
      difficulty: analysis?.responseMapped?.difficultyBand ?? item.difficulty,
      discrimination: analysis?.responseMapped?.discriminationBand ?? item.discrimination,
      analysis: {
        ...(existingPatch?.analysis ?? item.analysis),
        ...(analysis ?? {
          status: 'failed',
          attempts: 0,
          error: 'Analysis result not available',
          lastAttemptAt: nowIso,
        }),
      },
      irtParameters: analysis?.responseMapped?.numericDifficulty !== undefined
        ? {
            ...item.irtParameters,
            b: analysis.responseMapped.numericDifficulty,
            a: analysis.responseMapped.discriminationPower ?? item.irtParameters?.a ?? 1,
            c: item.irtParameters?.c ?? 0.2,
            predictedByAI: true,
            calibratedFromFieldTest: false,
            modelVersion: 'analysis-api-v1',
            predictionDate: nowIso,
          }
        : item.irtParameters,
      aiModelVersion: analysis?.status === 'completed' ? 'analysis-api-v1' : item.aiModelVersion,
      aiPredictionDate: analysis?.status === 'completed' ? nowIso : item.aiPredictionDate,
      reviewHistory: nextHistory,
      lastEditedDate: nowIso,
      lastEditedBy: 'Screening Queue',
    };
  });
};

const getStoredAnalysisDifficultyPrediction = (item: AssessmentItem): DifficultyPredictionResult | undefined => {
  const mapped = item.analysis?.responseMapped;
  if (!mapped || mapped.numericDifficulty === undefined) {
    return undefined;
  }

  const b = Number(mapped.numericDifficulty.toFixed(2));
  const difficulty = mapped.difficultyBand ?? getDifficultyLabelFromB(b);
  const screening = toCompleteScreeningResults(mapped.screening);
  const confidence = screening ? computeConfidenceFromScreening(screening) : (item.confidence ?? 80);
  const discrimination = mapped.discriminationBand ?? toDiscriminationBand(mapped.discriminationPower);

  return {
    id: item.id,
    b,
    confidence,
    difficulty,
    discrimination,
  };
};

export const getDifficultyPredictionResultForItem = (id: string): DifficultyPredictionResult => {
  const item = getAllItems().find((entry) => entry.id === id);
  if (item) {
    const fromStoredAnalysis = getStoredAnalysisDifficultyPrediction(item);
    if (fromStoredAnalysis) {
      return fromStoredAnalysis;
    }
  }

  return getMockDifficultyPredictionResult(id);
};

export const getDifficultyPredictionResultForItemAsync = async (id: string): Promise<DifficultyPredictionResult> => {
  const item = getAllItems().find((entry) => entry.id === id);
  if (!item) {
    return getMockDifficultyPredictionResult(id);
  }

  const fromStoredAnalysis = getStoredAnalysisDifficultyPrediction(item);
  if (fromStoredAnalysis) {
    return fromStoredAnalysis;
  }

  const nowIso = new Date().toISOString();
  const analysis = await runAnalysisForItem(item);

  upsertItemOverrides([id], (existingItem, existingPatch) => ({
    analysis: {
      ...(existingPatch?.analysis ?? existingItem.analysis),
      ...(analysis ?? {
        status: 'failed',
        attempts: 0,
        error: 'Analysis result not available',
        lastAttemptAt: nowIso,
      }),
    },
    difficulty: analysis?.responseMapped?.difficultyBand ?? existingItem.difficulty,
    discrimination: analysis?.responseMapped?.discriminationBand ?? existingItem.discrimination,
    irtParameters: analysis?.responseMapped?.numericDifficulty !== undefined
      ? {
          ...existingItem.irtParameters,
          b: analysis.responseMapped.numericDifficulty,
          a: analysis.responseMapped.discriminationPower ?? existingItem.irtParameters?.a ?? 1,
          c: existingItem.irtParameters?.c ?? 0.2,
          predictedByAI: true,
          calibratedFromFieldTest: false,
          modelVersion: 'analysis-api-v1',
          predictionDate: nowIso,
        }
      : existingItem.irtParameters,
    aiModelVersion: analysis?.status === 'completed' ? 'analysis-api-v1' : existingItem.aiModelVersion,
    aiPredictionDate: analysis?.status === 'completed' ? nowIso : existingItem.aiPredictionDate,
    lastEditedDate: nowIso,
    lastEditedBy: 'Prediction Engine',
  }));

  const refreshedItem = getAllItems().find((entry) => entry.id === id);
  if (refreshedItem) {
    const refreshedFromAnalysis = getStoredAnalysisDifficultyPrediction(refreshedItem);
    if (refreshedFromAnalysis) {
      return refreshedFromAnalysis;
    }
  }

  return getMockDifficultyPredictionResult(id);
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

