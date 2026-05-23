import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Download, FileText, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { taxonomies } from '../data/taxonomy';
import { addIngestedItems, getAllItems } from '../data/mockData';
import { AssessmentItem, CEFRLevel, Difficulty, ItemType, Skill } from '../data/types';

type ParsedUploadItem = {
  id: string;
  content: string;
  level: string;
  skill: string;
  type: string;
  answerKey: string;
  distractors: string;
  audioAsset?: string;
  issues: string[];
};

const allowedItemTypes: ItemType[] = [
  'Multiple Choice',
  'Essay',
  'Speaking',
  'Form Completion',
  'Note Completion',
  'Table Completion',
  'Flow Chart',
  'Map Labeling',
  'Matching',
  'Short Answer',
  'Sentence Completion',
  'True/False/Not Given',
  'Yes/No/Not Given',
  'Matching Headings',
  'Summary Completion',
  'Matching Information',
];

const allowedLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const allowedSkills: Skill[] = ['Reading', 'Writing', 'Listening', 'Speaking'];

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const parseCsv = (input: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && char === ',') {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if (!insideQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }

      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.length > 0));
};

const resolveItemType = (typeText: string, fallbackLabel: string): ItemType => {
  const source = (typeText || fallbackLabel).trim().toLowerCase();
  const mappedTypeByAlias: Record<string, ItemType> = {
    mcq: 'Multiple Choice',
    multiplechoice: 'Multiple Choice',
    'multiple choice': 'Multiple Choice',
    composition: 'Essay',
    essay: 'Essay',
    speaking: 'Speaking',
    formcompletion: 'Form Completion',
    'form completion': 'Form Completion',
    notecompletion: 'Note Completion',
    'note completion': 'Note Completion',
    tablecompletion: 'Table Completion',
    'table completion': 'Table Completion',
    flowchart: 'Flow Chart',
    'flow chart': 'Flow Chart',
    maplabeling: 'Map Labeling',
    'map labeling': 'Map Labeling',
    matching: 'Matching',
    shortanswer: 'Short Answer',
    'short answer': 'Short Answer',
    sentencecompletion: 'Sentence Completion',
    'sentence completion': 'Sentence Completion',
    'true/false/not given': 'True/False/Not Given',
    'yes/no/not given': 'Yes/No/Not Given',
    matchingheadings: 'Matching Headings',
    'matching headings': 'Matching Headings',
    summarycompletion: 'Summary Completion',
    'summary completion': 'Summary Completion',
    matchinginformation: 'Matching Information',
    'matching information': 'Matching Information',
  };

  return mappedTypeByAlias[source] ?? 'Multiple Choice';
};

const resolveLevel = (levelText: string): CEFRLevel | null => {
  const normalized = levelText.trim().toUpperCase();
  return allowedLevels.find((level) => level === normalized) ?? null;
};

const resolveSkill = (skillText: string): Skill | null => {
  const normalized = skillText.trim().toLowerCase();
  const mappedSkillByAlias: Record<string, Skill> = {
    reading: 'Reading',
    writing: 'Writing',
    listening: 'Listening',
    speaking: 'Speaking',
  };

  return mappedSkillByAlias[normalized] ?? null;
};

const mapLevelToDifficulty = (level: string): Difficulty => {
  if (level === 'A1' || level === 'A2') return 'Easy';
  if (level === 'B1' || level === 'B2') return 'Medium';
  return 'Hard';
};

const toTitleFromText = (content: string) => {
  const trimmed = content.trim();
  return trimmed.length <= 120 ? trimmed : `${trimmed.slice(0, 117)}...`;
};

const INGEST_AUTHORS = ['Aisha Verma', 'Daniel Brooks', 'Neha Kapoor', 'Rohan Mehta', 'Elena Petrova'];
const INGEST_REVIEWERS = ['Maya Thompson', 'Arjun Nair', 'Sofia Martinez', 'Kabir Singh', 'Liam O\'Connell'];
const INGEST_PREVIEW_ITEMS_STORAGE_KEY = 'ingest-preview-items-v1';

const hashFromId = (id: string) =>
  id.split('').reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0);

const buildPreviewItem = (
  item: ParsedUploadItem,
  fileName: string,
  defaultCognitiveLevelLabel: string,
  defaultGrammarLabel: string,
  defaultContentDomainLabel: string,
  defaultLanguageVarietyLabel: string,
  defaultTopicLabel: string,
): AssessmentItem => {
  const fallbackId = item.id || 'ITM-INGEST-PREVIEW';
  const itemHash = hashFromId(fallbackId);
  const author = INGEST_AUTHORS[itemHash % INGEST_AUTHORS.length];
  const reviewer = INGEST_REVIEWERS[itemHash % INGEST_REVIEWERS.length];
  const createdDate = new Date().toISOString().slice(0, 10);
  const resolvedType = resolveItemType(item.type, item.type);
  const isMCQ = resolvedType === 'Multiple Choice';
  const distractors = item.distractors
    .split(/[|;]/)
    .map((value) => value.trim())
    .filter(Boolean);

  const optionTexts = isMCQ
    ? [item.answerKey, ...distractors].filter((value, idx2, arr) => arr.indexOf(value) === idx2)
    : [];

  const options = isMCQ
    ? optionTexts.map((text, idx2) => ({
        label: String.fromCodePoint(65 + idx2),
        text,
        correct: text === item.answerKey,
      }))
    : undefined;

  return {
    id: item.id,
    title: toTitleFromText(item.content || item.id),
    content: item.content,
    level: resolveLevel(item.level) ?? 'B1',
    skill: resolveSkill(item.skill) ?? 'Reading',
    itemType: resolvedType,
    status: 'Draft',
    difficulty: mapLevelToDifficulty(resolveLevel(item.level) ?? 'B1'),
    options,
    audioAsset: item.skill === 'Listening' ? item.audioAsset : undefined,
    subSkill: item.skill,
    cognitiveLevel: defaultCognitiveLevelLabel || 'L2 Understand',
    contentDomain: defaultContentDomainLabel || 'General',
    languageVariety: defaultLanguageVarietyLabel || 'International',
    topic: defaultTopicLabel || undefined,
    grammarFocus: defaultGrammarLabel || undefined,
    discrimination: 'Moderate',
    confidence: 80,
    workflowState: 'Draft',
    author,
    createdDate,
    lastEditedDate: createdDate,
    lastEditedBy: reviewer,
    reviewers: [reviewer],
    reviewHistory: [
      {
        date: createdDate,
        reviewer,
        action: 'Ingested',
        state: 'Draft',
        notes: `Imported from ${fileName}`,
      },
    ],
  } as AssessmentItem;
};

export function IngestItems() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'metadata' | 'validate' | 'success'>('upload');
  const [fileName, setFileName] = useState('');
  const [itemCount, setItemCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedUploadItem[]>([]);
  const [ingestedCount, setIngestedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import configuration state
  const [defaultCognitiveLevel, setDefaultCognitiveLevel] = useState('');
  const [defaultGrammar, setDefaultGrammar] = useState('');
  const [defaultContentDomain, setDefaultContentDomain] = useState('');
  const [defaultLanguageVariety, setDefaultLanguageVariety] = useState('');
  const [defaultTopic, setDefaultTopic] = useState('');

  const cognitiveLevelsTaxonomy = taxonomies.find((taxonomy) => taxonomy.id === 'cognitiveLevels');
  const grammarTaxonomy = taxonomies.find((taxonomy) => taxonomy.id === 'grammar');
  const contentDomainsTaxonomy = taxonomies.find((taxonomy) => taxonomy.id === 'contentDomains');
  const languageVarietiesTaxonomy = taxonomies.find((taxonomy) => taxonomy.id === 'languageVarieties');
  const topicsTaxonomy = taxonomies.find((taxonomy) => taxonomy.id === 'topics');

  const defaultCognitiveLevelLabel = cognitiveLevelsTaxonomy?.tree.find((node) => node.id === defaultCognitiveLevel)?.label ?? '';
  const defaultGrammarLabel = grammarTaxonomy?.tree.find((node) => node.id === defaultGrammar)?.label ?? '';
  const defaultContentDomainLabel = contentDomainsTaxonomy?.tree.find((node) => node.id === defaultContentDomain)?.label ?? '';
  const defaultLanguageVarietyLabel = languageVarietiesTaxonomy?.tree.find((node) => node.id === defaultLanguageVariety)?.label ?? '';
  const defaultTopicLabel = topicsTaxonomy?.tree.find((node) => node.id === defaultTopic)?.label ?? '';

  const parsedLevels = useMemo(
    () => Array.from(new Set(parsedItems.map((item) => item.level).filter(Boolean))),
    [parsedItems],
  );
  const parsedSkills = useMemo(
    () => Array.from(new Set(parsedItems.map((item) => item.skill).filter(Boolean))),
    [parsedItems],
  );
  const parsedItemTypes = useMemo(
    () => Array.from(new Set(parsedItems.map((item) => item.type).filter(Boolean))),
    [parsedItems],
  );

  const validItemsCount = useMemo(
    () => parsedItems.filter((item) => item.issues.length === 0).length,
    [parsedItems],
  );
  const invalidItemsCount = parsedItems.length - validItemsCount;

  const supportedItemTypes = [
    {
      name: 'MCQ',
      description: 'Multiple choice question activity with selectable answer options.',
    },
    {
      name: 'Composition',
      description: 'Writing-based activity for evaluating composition and language skills.',
    },
    {
      name: 'Fill in the Blanks',
      description: 'Interactive activity where learners complete missing words or phrases.',
    },
    {
      name: 'Match the Following',
      description: 'Matching activity that connects related items, terms, or concepts.',
    },
    {
      name: 'Reading Comprehension',
      description: 'Passage-based activity designed to assess reading and understanding skills.',
    },
    {
      name: 'Drag and Drop',
      description: 'Interactive activity where users drag items into the correct positions.',
    },
    {
      name: 'Vocabulary',
      description: 'Word and meaning based activity focused on vocabulary building.',
    },
    {
      name: 'Listening Comprehension',
      description: 'Audio-based activity to evaluate listening and comprehension abilities.',
    },
    {
      name: 'Short Answer',
      description: 'Open-ended activity requiring brief written responses from learners.',
    },
  ];

  const handleFileUpload = async (file: File) => {
    setUploadError('');

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      setUploadError('Only CSV upload is supported in the frontend ingest flow. Please use the sample CSV format.');
      return;
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      setUploadError('No data rows found. Please upload a CSV with headers and at least one item row.');
      return;
    }

    const headers = rows[0].map((header) => normalizeHeader(header));
    const idIndex = headers.findIndex((h) => h === 'itemid' || h === 'id');
    const contentIndex = headers.findIndex((h) => h === 'content' || h === 'question' || h === 'title');
    const levelIndex = headers.findIndex((h) => h === 'cefrlevel' || h === 'level');
    const skillIndex = headers.findIndex((h) => h === 'skill');
    const typeIndex = headers.findIndex((h) => h === 'type' || h === 'itemtype');
    const answerIndex = headers.findIndex((h) => h === 'answerkey' || h === 'answer' || h === 'correctanswer');
    const distractorIndex = headers.findIndex((h) => h === 'distractors' || h === 'options');
    const audioIndex = headers.findIndex((h) => h === 'audio' || h === 'audiofile' || h === 'audioasset');

    if (contentIndex < 0 || levelIndex < 0 || skillIndex < 0 || typeIndex < 0) {
      setUploadError('CSV is missing one or more required columns: content, cefrLevel, skill, itemType/type.');
      return;
    }

    const parsed = rows.slice(1).map((row, idx) => {
      const id = (idIndex >= 0 ? row[idIndex] : '').trim() || `ITM-INGEST-${String(idx + 1).padStart(4, '0')}`;
      const content = (row[contentIndex] ?? '').trim();
      const level = (row[levelIndex] ?? '').trim();
      const skill = (row[skillIndex] ?? '').trim();
      const type = (typeIndex >= 0 ? row[typeIndex] : '').trim();
      const answerKey = (answerIndex >= 0 ? row[answerIndex] : '').trim();
      const distractors = (distractorIndex >= 0 ? row[distractorIndex] : '').trim();
      const audioAsset = audioIndex >= 0 ? (row[audioIndex] ?? '').trim() : '';

      const issues: string[] = [];
      if (!content) issues.push('Missing content');
      if (!level) issues.push('Missing CEFR level');
      if (!skill) issues.push('Missing skill');
      if (!type) issues.push('Missing item type');
      if (!answerKey) issues.push('Missing answer key');

      const resolvedLevel = resolveLevel(level);
      const resolvedSkill = resolveSkill(skill);
      const resolvedType = resolveItemType(type, type);

      if (!resolvedLevel) {
        issues.push('Unsupported CEFR level');
      }

      if (!resolvedSkill) {
        issues.push('Unsupported skill');
      }

      if (!allowedItemTypes.includes(resolvedType)) {
        issues.push('Unsupported item type');
      }

      return {
        id,
        content,
        level: resolvedLevel ?? level,
        skill: resolvedSkill ?? skill,
        type: resolvedType,
        answerKey,
        distractors,
        audioAsset: audioAsset || undefined,
        issues,
      };
    });

    if (parsed.length > 500) {
      setUploadError('Maximum 500 items per upload. Please split your file and try again.');
      return;
    }

    setParsedItems(parsed);
    setFileName(file.name);
    setItemCount(parsed.length);
    setStep('metadata');
  };

  const handleMetadataSubmit = () => {
    if (parsedItems.length > 0) {
      const previewItems = parsedItems.map((item) =>
        buildPreviewItem(
          item,
          fileName,
          defaultCognitiveLevelLabel,
          defaultGrammarLabel,
          defaultContentDomainLabel,
          defaultLanguageVarietyLabel,
          defaultTopicLabel,
        ),
      );
      localStorage.setItem(INGEST_PREVIEW_ITEMS_STORAGE_KEY, JSON.stringify(previewItems));
      setStep('validate');
    }
  };

  const handleValidationSubmit = () => {
    setValidationError('');
    const existingIds = new Set(getAllItems().map((item) => item.id));

    const validItems = parsedItems.filter((item) => item.issues.length === 0);
    const duplicateIds = validItems
      .map((item) => item.id)
      .filter((id) => id && existingIds.has(id));

    if (duplicateIds.length > 0) {
      setValidationError(
        `The following item IDs already exist and cannot be re-ingested: ${duplicateIds.join(', ')}. Please remove or rename them in your CSV and try again.`
      );
      return;
    }

    const itemsToIngest: AssessmentItem[] = validItems
      .map((item, index) => {
        const baseId = item.id || `ITM-INGEST-${String(index + 1).padStart(4, '0')}`;
        const uniqueId = baseId;
        existingIds.add(uniqueId);

        const resolvedType = resolveItemType(item.type, item.type);
        const isMCQ = resolvedType === 'Multiple Choice';
        const distractors = item.distractors
          .split(/[|;]/)
          .map((value) => value.trim())
          .filter(Boolean);

        const optionTexts = isMCQ
          ? [item.answerKey, ...distractors].filter((value, idx2, arr) => arr.indexOf(value) === idx2)
          : [];

        const options = isMCQ
          ? optionTexts.map((text, idx2) => ({
              label: String.fromCodePoint(65 + idx2),
              text,
              correct: text === item.answerKey,
            }))
          : undefined;

        const createdDate = new Date().toISOString().slice(0, 10);
        const itemHash = hashFromId(uniqueId);
        const author = INGEST_AUTHORS[itemHash % INGEST_AUTHORS.length];
        const reviewer = INGEST_REVIEWERS[itemHash % INGEST_REVIEWERS.length];

        return {
          id: uniqueId,
          title: toTitleFromText(item.content),
          content: item.content,
          level: item.level as AssessmentItem['level'],
          skill: item.skill as Skill,
          itemType: resolvedType,
          status: 'Draft',
          difficulty: mapLevelToDifficulty(item.level),
          options,
          audioAsset: item.skill === 'Listening' ? item.audioAsset : undefined,
          subSkill: item.skill,
          cognitiveLevel: defaultCognitiveLevelLabel || 'L2 Understand',
          contentDomain: defaultContentDomainLabel || 'General',
          languageVariety: defaultLanguageVarietyLabel || 'International',
          topic: defaultTopicLabel || undefined,
          grammarFocus: defaultGrammarLabel || undefined,
          discrimination: 'Moderate',
          confidence: 80,
          workflowState: 'Draft',
          author,
          createdDate,
          lastEditedDate: createdDate,
          lastEditedBy: reviewer,
          reviewers: [reviewer],
          reviewHistory: [
            {
              date: createdDate,
              reviewer,
              action: 'Ingested',
              state: 'Draft',
              notes: `Imported from ${fileName}`,
            },
          ],
        } as AssessmentItem;
      });

    addIngestedItems(itemsToIngest);
    setIngestedCount(itemsToIngest.length);
    setStep('success');
  };

  const handleFinish = () => {
    navigate('/library');
  };

  const handleBack = () => {
    if (step === 'metadata') setStep('upload');
    else if (step === 'validate') { setValidationError(''); setStep('metadata'); }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/library" className="hover:underline">Library</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Ingest Items</span>
        </div>

        {step === 'upload' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ingest New Items</h1>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Upload Items File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Upload your assessment items via CSV or Excel file. You will be able to configure metadata, preview, and validate your items before adding them to the global library.
                  </p>

                  {uploadError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {uploadError}
                    </div>
                  )}

                  <a
                    href="/samples/item-ingest-sample.csv"
                    download
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Sample CSV Template
                  </a>

                  <div
                    className={`border-2 border-dashed rounded-lg mt-4 cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        void handleFileUpload(file);
                      }
                    }}
                  >
                    <div className="pt-12 pb-12 px-6">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className={`w-16 h-16 mb-4 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                        <p className="text-gray-700 mb-4">
                          <span className="font-medium">Drag and drop your file here</span>, or{' '}
                          <span className="text-blue-600 hover:underline">browse</span>
                        </p>
                        <p className="text-sm text-gray-500">Supported formats: CSV, XLSX, XLS</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              void handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-1">File Requirements</p>
                          <ul className="text-blue-700 space-y-1 list-disc list-inside">
                            <li>Required columns: itemId, content, cefrLevel, skill, itemType, answerKey</li>
                            <li>Optional columns: distractors, audioAsset</li>
                            <li>Maximum 500 items per upload</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Right Column - Supported Item Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Supported Item Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-6">
                    Following item types are supported for ingestion.
                  </p>

                  <div className="space-y-4">
                    {supportedItemTypes.map((itemType, index) => (
                      <div key={index} className="flex gap-3">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            {itemType.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {itemType.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/library')}
                className="cursor-pointer"
              >
                Back to Library
              </Button>
            </div>
          </>
        )}

        {step === 'metadata' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure Metadata</h1>
              <p className="text-gray-600">
                Configure batch-level import details for {itemCount} items from <span className="font-medium">{fileName}</span>
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  File Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">File Name</div>
                    <div className="text-sm font-medium text-gray-900">{fileName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Items Detected</div>
                    <div className="text-sm font-medium text-gray-900">{itemCount} items</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">CEFR Levels in CSV</div>
                    <div className="text-sm font-medium text-gray-900">{parsedLevels.join(', ') || 'None'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Skills in CSV</div>
                    <div className="text-sm font-medium text-gray-900">{parsedSkills.join(', ') || 'None'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  Default Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    CEFR level, skill, and item type are now read directly from each CSV row. Use the sample template and provide these columns for every item.
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Cognitive Level
                  </label>
                  <Select value={defaultCognitiveLevel || '__none__'} onValueChange={(value) => setDefaultCognitiveLevel(value === '__none__' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional default cognitive level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {cognitiveLevelsTaxonomy?.tree.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Grammar
                  </label>
                  <Select value={defaultGrammar || '__none__'} onValueChange={(value) => setDefaultGrammar(value === '__none__' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional default grammar focus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {grammarTaxonomy?.tree.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Content Domain
                  </label>
                  <Select value={defaultContentDomain || '__none__'} onValueChange={(value) => setDefaultContentDomain(value === '__none__' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional default content domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {contentDomainsTaxonomy?.tree.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Language Variety
                  </label>
                  <Select value={defaultLanguageVariety || '__none__'} onValueChange={(value) => setDefaultLanguageVariety(value === '__none__' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional default language variety" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {languageVarietiesTaxonomy?.tree.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Topic
                  </label>
                  <Select value={defaultTopic || '__none__'} onValueChange={(value) => setDefaultTopic(value === '__none__' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional default topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {topicsTaxonomy?.tree.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBack} className="cursor-pointer">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/library')} className="cursor-pointer">
                  Cancel
                </Button>
                <Button
                  onClick={handleMetadataSubmit}
                  className="cursor-pointer"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'validate' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation & Preview</h1>
              <p className="text-gray-600">
                Review the items before adding them to the global library.
              </p>
            </div>

            {/* Validation Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{itemCount}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{validItemsCount}</div>
                    <div className="text-sm text-gray-600">Valid</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">{invalidItemsCount}</div>
                    <div className="text-sm text-gray-600">Issues Found</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metadata Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  Applied Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">CEFR Levels: {parsedLevels.join(', ') || 'None'}</Badge>
                  <Badge variant="outline">Skills: {parsedSkills.join(', ') || 'None'}</Badge>
                  <Badge variant="outline">Types: {parsedItemTypes.join(', ') || 'None'}</Badge>
                  {defaultCognitiveLevelLabel && <Badge variant="outline">Cognitive Level: {defaultCognitiveLevelLabel}</Badge>}
                  {defaultGrammarLabel && <Badge variant="outline">Grammar: {defaultGrammarLabel}</Badge>}
                  {defaultContentDomainLabel && <Badge variant="outline">Content Domain: {defaultContentDomainLabel}</Badge>}
                  {defaultLanguageVarietyLabel && <Badge variant="outline">Language Variety: {defaultLanguageVarietyLabel}</Badge>}
                  {defaultTopicLabel && <Badge variant="outline">Topic: {defaultTopicLabel}</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Items Preview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  Items Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {parsedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg ${
                        item.issues.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{item.id}</span>
                          <Badge variant="outline" className="text-xs">{item.type}</Badge>
                          {item.issues.length === 0 && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <Link to={`/item-bank/${resolveLevel(item.level) ?? 'B1'}/${item.id}?mode=preview&from=ingest`}>
                          <Button variant="outline" size="sm">Preview</Button>
                        </Link>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                      {item.issues.length > 0 && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-white border border-orange-200 rounded">
                          <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-orange-800">
                            {item.issues.map((issue, idx) => (
                              <div key={idx}>{issue}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {invalidItemsCount > 0 && (
              <Card className="bg-orange-50 border-orange-200 mb-8">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-900">
                      <p className="font-medium mb-1">Issues Detected</p>
                      <p className="text-orange-700">
                        {invalidItemsCount} item(s) have validation issues. You can proceed to ingest valid items only, or cancel and fix the issues.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {validationError && (
              <Card className="bg-red-50 border-red-200 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-900">
                      <p className="font-medium mb-1">Duplicate IDs Found</p>
                      <p className="text-red-700">{validationError}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBack} className="cursor-pointer">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/library')} className="cursor-pointer">
                  Cancel
                </Button>
                <Button onClick={handleValidationSubmit} className="cursor-pointer">
                  Ingest {validItemsCount} Item(s)
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Items Ingested Successfully
              </h1>
              <p className="text-gray-600">
                {ingestedCount} items have been added to the global library.
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Ingestion Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Added:</span>
                    <span className="font-semibold text-gray-900">{ingestedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Skipped:</span>
                    <span className="font-semibold text-gray-900">{invalidItemsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CEFR Level:</span>
                    <span className="font-semibold text-gray-900">{parsedLevels.join(', ') || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skill:</span>
                    <span className="font-semibold text-gray-900">{parsedSkills.join(', ') || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cognitive Level:</span>
                    <span className="font-semibold text-gray-900">{defaultCognitiveLevelLabel || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grammar:</span>
                    <span className="font-semibold text-gray-900">{defaultGrammarLabel || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Content Domain:</span>
                    <span className="font-semibold text-gray-900">{defaultContentDomainLabel || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language Variety:</span>
                    <span className="font-semibold text-gray-900">{defaultLanguageVarietyLabel || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Topic:</span>
                    <span className="font-semibold text-gray-900">{defaultTopicLabel || 'Not set'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200 mb-8">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Next Steps</p>
                    <p className="text-blue-700">
                      Your items are now in the global library with "Draft" status. You can review them in the Library and add them to the Pre-Testing Pipeline for screening and difficulty prediction.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => {
                setStep('upload');
                setFileName('');
                setItemCount(0);
                setUploadError('');
                setParsedItems([]);
                setIngestedCount(0);
                setDefaultCognitiveLevel('');
                setDefaultGrammar('');
                setDefaultContentDomain('');
                setDefaultLanguageVariety('');
                setDefaultTopic('');
              }} className="cursor-pointer">
                Ingest More Items
              </Button>
              <Button onClick={handleFinish} className="cursor-pointer">
                Go to Library
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
