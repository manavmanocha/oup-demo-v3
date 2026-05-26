export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Skill = 'Reading' | 'Writing' | 'Listening' | 'Speaking';
export type ItemType = 'Multiple Choice' | 'Essay' | 'Speaking' | 'Form Completion' | 'Note Completion' | 'Table Completion' | 'Flow Chart' | 'Map Labeling' | 'Matching' | 'Short Answer' | 'Sentence Completion' | 'True/False/Not Given' | 'Yes/No/Not Given' | 'Matching Headings' | 'Summary Completion' | 'Matching Information';
export type ItemStatus = 'Draft' | 'Retired' | 'Compromised' | 'Published';
export type WorkflowState =
  | 'NOT_STARTED'
  | 'IN_SCREENING'
  | 'PENDING_SCREENING_REVIEW'
  | 'SCREENING_APPROVED'
  | 'SCREENING_REJECTED'
  | 'IN_DIFFICULTY_ESTIMATION'
  | 'PENDING_DP_REVIEW'
  | 'DP_APPROVED'
  | 'DP_REJECTED'
  | 'RECOMMENDED_FOR_SEEDING'
  | 'SEEDED';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Easy' | 'Very Hard';

export interface IRTParameters {
  b: number; // difficulty (b-parameter)
  a: number; // discrimination (a-parameter)  
  c: number; // guessing (c-parameter)
  sampleSize?: number;
  modelVersion?: string;
  predictionDate?: string;
  calibratedFromFieldTest?: boolean;
  predictedByAI?: boolean;
}

export interface ItemOption {
  label: string;
  text: string;
  correct?: boolean;
}

export interface ReviewHistoryEntry {
  date: string;
  reviewer: string;
  action: string;
  state: string;
  notes?: string;
}

export interface AssessmentItem {
  id: string;
  title: string;
  content?: string;
  answerKey?: string;
  level: CEFRLevel;
  skill: Skill;
  itemType: ItemType;
  status: ItemStatus;
  exposureCount?: number;
  difficulty?: Difficulty;
  
  // IRT Parameters
  irtParameters?: IRTParameters;
  
  // Item-specific fields
  options?: ItemOption[];
  rubric?: string;
  audioTitle?: string;
  audioAsset?: string;
  imageTitle?: string;
  imageAsset?: string;
  imageAltText?: string;
  passage?: string;
  passageTitle?: string;
  instructions?: string;
  followUpQuestions?: string[];
  passageId?: string;
  
  // Item Properties
  subSkill?: string;
  cognitiveLevel?: string;
  contentDomain?: string;
  languageVariety?: string;
  topic?: string;
  grammarFocus?: string;
  enemyItems?: string[];
  
  // Discrimination & Confidence
  discrimination?: string;
  confidence?: number;
  
  // Screening results
  screening?: {
    cefrFit?: 'Pass' | 'Review' | 'Fail';
    distractorStrength?: 'Pass' | 'Review' | 'Fail';
    clarity?: 'Pass' | 'Review' | 'Fail';
    fairness?: 'Pass' | 'Review' | 'Fail';
    similarity?: 'Pass' | 'Review' | 'Fail';
  };
  
  // Workflow tracking
  workflowState?: WorkflowState;
  reviewHistory?: ReviewHistoryEntry[];
  flaggedForReview?: boolean;
  flagReason?: string;
  
  // Authorship & versioning
  author?: string;
  createdDate?: string;
  lastEditedDate?: string;
  lastEditedBy?: string;
  reviewers?: string[];
  
  // AI Model info
  aiModelVersion?: string;
  aiPredictionDate?: string;
  manualOverride?: boolean;
  manualOverrideReason?: string;
}

export interface BankCapacity {
  level: CEFRLevel;
  active: number;
  compromised: number;
  gapToTarget: number;
  target: number;
  percentage: number;
}
