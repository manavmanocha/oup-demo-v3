
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Headphones,
  Play,
  Pause,
  FileText,
  Volume2,
  Archive,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Info,
  Image,
} from 'lucide-react';
import { getItemById } from '../data/mockData';
import { AssessmentItem, CEFRLevel } from '../data/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { getWorkflowStateLabel } from '../data/workflowState';

export function ItemDetailRedesign() {
  const { itemId } = useParams<{ level: CEFRLevel; itemId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const previewItems = useMemo<AssessmentItem[]>(() => {
    if (globalThis.window === undefined) {
      return [];
    }

    try {
      const previewItemsRaw = localStorage.getItem('ingest-preview-items-v1');
      if (!previewItemsRaw) {
        return [];
      }

      const parsed = JSON.parse(previewItemsRaw);
      return Array.isArray(parsed) ? (parsed as AssessmentItem[]) : [];
    } catch {
      return [];
    }
  }, []);
  const previewItem = previewItems.find((candidate) => candidate.id === itemId);
  const item = getItemById(itemId ?? '') ?? previewItem;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [passageExpanded, setPassageExpanded] = useState(true);
  const [expandedScreeningReasons, setExpandedScreeningReasons] = useState<Record<string, boolean>>({});

  const isListening = item?.skill === 'Listening';
  const locationState = location.state as { fromWorkflow?: boolean; backTo?: string } | null;
  const fromWorkflowState = locationState?.fromWorkflow;
  const fromWorkflowQuery = new URLSearchParams(location.search).get('from') === 'workflow';
  const isPreviewMode = new URLSearchParams(location.search).get('mode') === 'preview';
  const isFromIngest = new URLSearchParams(location.search).get('from') === 'ingest';
  const isFromWorkflow = Boolean(fromWorkflowState || fromWorkflowQuery);
  const fallbackBackPath = isFromIngest
    ? '/library/ingest'
    : isFromWorkflow
      ? '/workflows/pre-testing-pipeline/stages'
      : '/library';
  const hasOptionAnswers = Boolean(item?.options && item.options.length > 0);
  const hasMatchingAnswerKey = Boolean(item?.itemType === 'Matching' && item?.answerKey,
  );
  const isNoteCompletion = item?.itemType === 'Note Completion';
  const hasNoteCompletionAnswer = Boolean(isNoteCompletion && item?.answerKey);
  const isSentenceCompletion = item?.itemType === 'Sentence Completion';
  const hasSentenceCompletionAnswer = Boolean(isSentenceCompletion && item?.answerKey);
  const isTrueFalseNotGiven = item?.itemType === 'True/False/Not Given';
  const hasTrueFalseNotGivenAnswer = Boolean(isTrueFalseNotGiven && item?.answerKey);
  const isShortAnswer = item?.itemType === 'Short Answer';
  const hasShortAnswerAnswer = Boolean(isShortAnswer && item?.answerKey);
  const isEssay = item?.itemType === 'Essay';
  const hasEssaySample = Boolean(isEssay && (item?.answerKey || item?.rubric));
  const isSpeakingQuestion = item?.itemType === 'Speaking';
  const hasSpeakingSample = Boolean(isSpeakingQuestion && (item?.answerKey || item?.rubric));

  const splitExpectedAnswers = (rawValue?: string) => {
    if (!rawValue) {
      return [];
    }

    return rawValue
      .split(/;|\||,/)
      .map((value) => value.trim())
      .filter(Boolean);
  };

  const speakingPrompts = useMemo(() => {
    if (!isSpeakingQuestion || !item) {
      return [];
    }

    const rawText = (item.content || item.title || '').split(/Follow-up questions:/i)[0].trim();
    return rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [isSpeakingQuestion, item]);

  const speakingFollowUpQuestions = useMemo(() => {
    if (!isSpeakingQuestion || !item) {
      return [];
    }

    if (Array.isArray(item.followUpQuestions) && item.followUpQuestions.length > 0) {
      return item.followUpQuestions.map((question) => question.trim()).filter(Boolean);
    }

    const followUpMatch = (item.content || item.title || '').match(/Follow-up questions:\s*([\s\S]*)$/i);
    if (!followUpMatch) {
      return [];
    }

    return followUpMatch[1]
      .split(/\r?\n/)
      .map((question) => question.replace(/^\d+[.)-]\s*/, '').trim())
      .filter(Boolean);
  }, [isSpeakingQuestion, item]);

  const noteCompletionData = useMemo(() => {
    if (!isNoteCompletion || !item) {
      return null;
    }

    const rawNoteText = item.content || item.title || '';
    if (!rawNoteText.trim()) {
      return null;
    }

    const lines = rawNoteText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const fallbackLines = lines.length > 0 ? lines : [rawNoteText.trim()];

    const blankPattern = /_{2,}|\[\s*\]|\(\s*\)/g;
    let blankCounter = 0;

    const renderedLines = fallbackLines.map((line) => {
      const parts: Array<
        | { kind: 'text'; value: string }
        | { kind: 'blank'; index: number }
      > = [];

      let cursor = 0;
      let match: RegExpExecArray | null = blankPattern.exec(line);
      while (match) {
        if (match.index > cursor) {
          parts.push({ kind: 'text', value: line.slice(cursor, match.index) });
        }

        blankCounter += 1;
        parts.push({ kind: 'blank', index: blankCounter });
        cursor = match.index + match[0].length;
        match = blankPattern.exec(line);
      }

      if (cursor < line.length) {
        parts.push({ kind: 'text', value: line.slice(cursor) });
      }

      if (!parts.some((part) => part.kind === 'blank')) {
        blankCounter += 1;
        parts.push({ kind: 'text', value: line });
        parts.push({ kind: 'text', value: ' ' });
        parts.push({ kind: 'blank', index: blankCounter });
      }

      return parts;
    });

    const parsedAnswers = (item.answerKey ?? '')
      .split(/;|\||,/)
      .map((answer) => answer.trim())
      .filter(Boolean);

    return {
      renderedLines,
      parsedAnswers,
      blankCount: blankCounter,
    };
  }, [isNoteCompletion, item]);
  const sentenceCompletionData = useMemo(() => {
    if (!isSentenceCompletion || !item) {
      return null;
    }

    const rawText = item.content || item.title || '';
    if (!rawText.trim()) {
      return null;
    }

    const trimmedText = rawText.trim();
    const promptPrefixRegex = /^((?:complete|fill in)\b[^:]*):\s*(.+)$/i;
    const promptPrefixMatch = promptPrefixRegex.exec(trimmedText);
    const taskLabel = promptPrefixMatch ? promptPrefixMatch[1].trim() : 'Sentence Completion';
    const stemText = promptPrefixMatch ? promptPrefixMatch[2].trim() : trimmedText;

    const lines = stemText.split(/\r?\n/);
    const fallbackLines = lines.length > 0 ? lines : [stemText];
    const blankPattern = /_{2,}|\[\s*\]|\(\s*\)/g;
    let blankCounter = 0;

    const renderedLines = fallbackLines.map((line) => {
      if (!line.trim()) {
        return [{ kind: 'spacer' as const, value: '' }];
      }

      const parts: Array<
        | { kind: 'text'; value: string }
        | { kind: 'blank'; index: number }
        | { kind: 'spacer'; value: string }
      > = [];

      let cursor = 0;
      let match: RegExpExecArray | null = blankPattern.exec(line);
      while (match) {
        if (match.index > cursor) {
          parts.push({ kind: 'text', value: line.slice(cursor, match.index) });
        }

        blankCounter += 1;
        parts.push({ kind: 'blank', index: blankCounter });
        cursor = match.index + match[0].length;
        match = blankPattern.exec(line);
      }

      if (cursor < line.length) {
        parts.push({ kind: 'text', value: line.slice(cursor) });
      }

      if (!parts.some((part) => part.kind === 'blank')) {
        blankCounter += 1;
        parts.push({ kind: 'text', value: line });
        parts.push({ kind: 'text', value: ' ' });
        parts.push({ kind: 'blank', index: blankCounter });
      }

      return parts;
    });

    return {
      taskLabel,
      renderedLines,
      parsedAnswers: splitExpectedAnswers(item.answerKey),
      blankCount: blankCounter,
    };
  }, [isSentenceCompletion, item]);
  const matchingData = useMemo(() => {
    if (!hasMatchingAnswerKey || !item?.answerKey || !item?.id) {
      return null;
    }

    const pairs = item.answerKey
      .split(';')
      .map((rawPair) => {
        const pair = rawPair.trim();
        if (!pair) {
          return null;
        }

        const separatorIndex = pair.indexOf('-');
        if (separatorIndex <= 0 || separatorIndex >= pair.length - 1) {
          return null;
        }

        const left = pair.slice(0, separatorIndex).trim();
        const right = pair.slice(separatorIndex + 1).trim();

        if (!left || !right) {
          return null;
        }

        return { left, right };
      })
      .filter((pair): pair is { left: string; right: string } => Boolean(pair));

    if (pairs.length === 0) {
      return null;
    }

    const stableHash = (value: string) => {
      let hash = 0;
      for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
      }
      return hash;
    };

    const choices = pairs
      .map((pair) => pair.right)
      .sort((a, b) => stableHash(`${item.id}:choice:${a}`) - stableHash(`${item.id}:choice:${b}`));

    const choiceLabelByValue = new Map<string, string>();
    choices.forEach((choice, index) => {
      choiceLabelByValue.set(choice, String.fromCodePoint(65 + index));
    });

    const mappings = pairs.map((pair, index) => ({
      promptIndex: index + 1,
      prompt: pair.left,
      choice: pair.right,
      choiceLabel: choiceLabelByValue.get(pair.right) ?? '?',
    }));

    return {
      prompts: pairs.map((pair) => pair.left),
      choices,
      mappings,
    };
  }, [hasMatchingAnswerKey, item?.answerKey, item?.id]);
  const noteAnswerRows = useMemo(() => {
    if (!hasNoteCompletionAnswer || !noteCompletionData) {
      return [];
    }

    const maxCount = Math.max(noteCompletionData.blankCount, noteCompletionData.parsedAnswers.length);
    return Array.from({ length: maxCount }).map((_, index) => {
      const blankIndex = index + 1;
      const expected = noteCompletionData.parsedAnswers[index] ?? '';
      return { blankIndex, expected };
    });
  }, [hasNoteCompletionAnswer, noteCompletionData]);

  const sentenceAnswerRows = useMemo(() => {
    if (!hasSentenceCompletionAnswer || !sentenceCompletionData) {
      return [];
    }

    const maxCount = Math.max(sentenceCompletionData.blankCount, sentenceCompletionData.parsedAnswers.length);
    return Array.from({ length: maxCount }).map((_, index) => {
      const blankIndex = index + 1;
      const expected = sentenceCompletionData.parsedAnswers[index] ?? '';
      return { blankIndex, expected };
    });
  }, [hasSentenceCompletionAnswer, sentenceCompletionData]);

  const trueFalseExpectedAnswer = splitExpectedAnswers(item?.answerKey)[0] ?? '';

  const shortAnswerExpectedValues = splitExpectedAnswers(item?.answerKey);
  const screeningEntries = item?.screening
    ? [
        { key: 'cefrFit', label: 'CEFR Fit', value: item.screening.cefrFit },
        { key: 'distractorStrength', label: 'Distractor Strength', value: item.screening.distractorStrength },
        { key: 'clarity', label: 'Clarity', value: item.screening.clarity },
        { key: 'fairness', label: 'Fairness', value: item.screening.fairness },
        { key: 'similarity', label: 'Similarity', value: item.screening.similarity },
      ].filter((entry) => Boolean(entry.value))
    : [];
  const failedScreeningDimensions = screeningEntries.filter((entry) => entry.value === 'Fail');
  const screeningFailureReasonByKey = useMemo(() => {
    if (!item || failedScreeningDimensions.length === 0) {
      return new Map<string, string>();
    }

    const sharedReviewerReason = item.flagReason
      ?? [...(item.reviewHistory ?? [])]
        .reverse()
        .find((entry) => entry.state === 'PENDING_SCREENING_REVIEW' && entry.notes)
        ?.notes
      ?? '';

    const defaultReasons: Record<string, string> = {
      cefrFit: 'The prompt appears misaligned with the targeted CEFR level and needs level calibration.',
      distractorStrength: 'The distractors are too weak or predictable and need stronger competing alternatives.',
      clarity: 'The wording is ambiguous and should be revised for clearer task intent and response expectations.',
      fairness: 'Potential bias or accessibility concerns were detected and should be addressed before approval.',
      similarity: 'The item is too similar to existing content and needs differentiation to avoid overlap.',
    };

    return new Map(
      failedScreeningDimensions.map((entry) => [
        entry.key,
        failedScreeningDimensions.length === 1 && sharedReviewerReason
          ? sharedReviewerReason
          : defaultReasons[entry.key],
      ]),
    );
  }, [item, failedScreeningDimensions]);

  const toggleScreeningReason = (dimensionKey: string) => {
    setExpandedScreeningReasons((prev) => ({
      ...prev,
      [dimensionKey]: !prev[dimensionKey],
    }));
  };

  const formatAudioTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudioPlayback = async () => {
    if (!audioRef.current) {
      return;
    }

    if (audioPlaying) {
      audioRef.current.pause();
      return;
    }

    try {
      setAudioError(null);
      await audioRef.current.play();
    } catch {
      setAudioError('Unable to play this audio file. Please verify the format and file path.');
      setAudioPlaying(false);
    }
  };

  const handleAudioSeek = (nextTime: number) => {
    if (!audioRef.current || !Number.isFinite(nextTime)) {
      return;
    }

    audioRef.current.currentTime = nextTime;
    setAudioCurrentTime(nextTime);
  };

  const handleBack = () => {
    if (locationState?.backTo) {
      navigate(locationState.backTo);
      return;
    }

    if (location.key !== 'default') {
      navigate(-1);
      return;
    }

    navigate(fallbackBackPath);
  };

  useEffect(() => {
    if (!audioRef.current || (!isListening && !isSpeakingQuestion) || !item?.audioAsset) {
      return;
    }

    const audioEl = audioRef.current;

    const handleTimeUpdate = () => setAudioCurrentTime(audioEl.currentTime || 0);
    const handleLoadedMetadata = () => setAudioDuration(audioEl.duration || 0);
    const handleEnded = () => setAudioPlaying(false);
    const handlePlay = () => setAudioPlaying(true);
    const handlePause = () => setAudioPlaying(false);
    const handleError = () => {
      setAudioError('Unable to load this audio file. Please verify the file exists in public/audio.');
      setAudioPlaying(false);
    };

    setAudioCurrentTime(0);
    setAudioDuration(0);
    setAudioError(null);

    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.load();

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);
    audioEl.addEventListener('error', handleError);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('pause', handlePause);
      audioEl.removeEventListener('error', handleError);
    };
  }, [isListening, isSpeakingQuestion, item?.audioAsset]);

  if (!item) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="mx-auto">
          <p className="text-gray-600">Item not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-8 pt-3 pb-4">
          <div className="max-w-5xl mx-auto space-y-3">
            {/* Breadcrumb row */}
            <div className="flex items-center justify-between gap-3">
              <nav className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                <Link to="/item-bank" className="hover:text-gray-700">Item Bank</Link>
                <span className="text-gray-300">/</span>
                <Link to={`/item-bank/${item.level}`} className="hover:text-gray-700">{item.level}</Link>
                <span className="text-gray-300">/</span>
                <span className="font-mono text-gray-700 truncate">{item.id}</span>
              </nav>
              {isPreviewMode && <Badge variant="secondary">Preview Mode</Badge>}
            </div>

            {/* Title row */}
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="-ml-2 flex-shrink-0 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 font-mono truncate">{item.id}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="border-gray-300 text-gray-700 font-normal">
                    {item.skill}
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-700 font-normal">
                    {item.level}
                  </Badge>
                  {item.workflowState && (
                    <Badge variant="outline" className="border-gray-300 text-gray-700 font-normal">
                      {getWorkflowStateLabel(item.workflowState)}
                    </Badge>
                  )}
                  {item.status === 'Compromised' && (
                    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 font-normal">
                      Compromised
                    </Badge>
                  )}
                  {item.passageTitle && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-600 truncate">{item.passageTitle}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="space-y-6">
            {isPreviewMode && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-900">Preview Mode</div>
                    <div className="text-sm text-blue-800">
                      This item is being previewed from the ingest workflow and has not been permanently added yet.
                    </div>
                  </div>
                  <Link to="/library/ingest">
                    <Button variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-100">
                      Back to Ingest Items
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Compromised Warning */}
            {item.status === 'Compromised' && (
              <Card className="border-orange-300 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Compromised — High exposure</div>
                      <div className="text-sm text-gray-700">
                        High exposure count ({item.exposureCount ?? 'N/A'}) may compromise item security. Consider retiring this item.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Player for Listening Items */}
            {(isListening || isSpeakingQuestion) && item.audioAsset && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <audio ref={audioRef} src={item.audioAsset} preload="metadata" />
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-4">{item.audioTitle}</h3>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={toggleAudioPlayback}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {audioPlaying ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Play Audio
                            </>
                          )}
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Volume2 className="w-4 h-4" />
                          <input
                            type="range"
                            min={0}
                            max={audioDuration || 0}
                            step={0.1}
                            value={Math.min(audioCurrentTime, audioDuration || 0)}
                            onChange={(event) => handleAudioSeek(Number(event.target.value))}
                            className="w-40 accent-blue-600 cursor-pointer"
                            disabled={!audioDuration}
                            aria-label="Seek audio"
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                        </span>
                      </div>
                      {audioError && (
                        <p className="text-sm text-red-600 mt-2">{audioError}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prompt Image */}
            {item.imageAsset && (
              <Card className="overflow-hidden border-blue-200 shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Image className="w-5 h-5 text-blue-600" />
                    Reference Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {item.imageTitle && (
                    <h3 className="text-base font-semibold text-gray-900">
                      {item.imageTitle}
                    </h3>
                  )}
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img
                      src={item.imageAsset}
                      alt={item.imageAltText || item.title || 'Reference image for this item'}
                      className="block w-full h-auto max-h-[420px] object-contain mx-auto"
                    />
                  </div>
                  {item.imageAltText && (
                    <p className="text-sm text-gray-600">{item.imageAltText}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Passage/Context */}
            {item.passage && (
              <Collapsible open={passageExpanded} onOpenChange={setPassageExpanded}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="text-xs uppercase tracking-wide text-gray-500">
                            {(isListening || item?.audioAsset) ? 'Transcript' : isSpeakingQuestion ? 'Speaking Prompt' : 'Reading Passage'}
                          </div>
                          {item.passageTitle && (
                            <CardTitle className="text-base mt-1 truncate">{item.passageTitle}</CardTitle>
                          )}
                        </div>
                        {passageExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {item.passage}
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Main Question */}
            <Card>
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="mb-6">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Question</div>
                  {!isSentenceCompletion && (
                    <p className="text-lg text-gray-900 leading-relaxed">
                      {item.title}
                    </p>
                  )}
                  {isSentenceCompletion && sentenceCompletionData && (
                    <p className="text-lg text-gray-900 leading-relaxed">
                      {sentenceCompletionData.taskLabel}
                    </p>
                  )}

                  {/* Short Answer Layout */}
                {(isShortAnswer && isListening || (isEssay && item?.content) || (isSpeakingQuestion && item?.content)) && (
                  <div className="text-lg text-gray-800 leading-relaxed">
                        {item.content}
                  </div>
                )}
                  {(item.instructions || true) && (
                    <p className="mt-3 text-sm italic text-gray-500">
                      {item.instructions || 'Review the question and use the answer explanation panel for reference.'}
                    </p>
                  )}
                </div>

                {/* Answer Options */}
                {(hasOptionAnswers || isTrueFalseNotGiven) && (
                  <div className="space-y-3">
                    {(item.options ?? []).map((option) => (
                      <div
                        key={option.label}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          showExplanation && option.correct
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : showExplanation
                              ? 'border-gray-200 bg-gray-50 opacity-75'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                            showExplanation && option.correct
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {option.label}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-gray-700">{option.text}</p>
                          </div>
                          {showExplanation && option.correct && (
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                          )}
                          {showExplanation && !option.correct && (
                            <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matching Question Layout */}
                {hasMatchingAnswerKey && matchingData && (
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500 uppercase mb-3">Statements</div>
                        <div className="space-y-2">
                          {matchingData.prompts.map((prompt, index) => (
                            <div key={`${prompt}-${index}`} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </span>
                              <p className="text-sm text-gray-800 leading-relaxed">{prompt}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500 uppercase mb-3">Choices</div>
                        <div className="space-y-2">
                          {matchingData.choices.map((choice, index) => (
                            <div key={`${choice}-${index}`} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                                {String.fromCodePoint(65 + index)}
                              </span>
                              <p className="text-sm text-gray-800 leading-relaxed">{choice}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Match each statement with the best choice.</p>
                  </div>
                )}

                {/* Note Completion Layout */}
                {isNoteCompletion && noteCompletionData && (
                  <div className="mt-6">                   

                      <div className="space-y-3">
                        {noteCompletionData.renderedLines.map((lineParts, lineIndex) => (
                          <div
                            key={`note-line-${lineIndex}`}
                            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                          >
                            <p className="text-gray-800 leading-relaxed flex flex-wrap items-center gap-2">
                              {lineParts.map((part, partIndex) => {
                                if (part.kind === 'text') {
                                  return (
                                    <span key={`text-${lineIndex}-${partIndex}`}>{part.value}</span>
                                  );
                                }

                                return (
                                  <span
                                    key={`blank-${lineIndex}-${partIndex}`}
                                    className="inline-flex items-center gap-2"
                                  >
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                                      {part.index}
                                    </span>
                                    <span
                                      className="h-9 w-40 max-w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-500 shadow-sm inline-flex items-center"
                                      aria-label={`Blank ${part.index}`}
                                    >
                                      Blank
                                    </span>
                                  </span>
                                );
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                  </div>
                )}

                {/* Sentence Completion Layout */}
                {isSentenceCompletion && sentenceCompletionData && (
                  <div className="mt-6">
                      <div className="space-y-3">
                        {sentenceCompletionData.renderedLines.map((lineParts, lineIndex) => (
                          <div
                            key={`sentence-line-${lineIndex}`}
                            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                          >
                            <p className="text-sm text-gray-800 leading-relaxed flex flex-wrap items-center gap-2">
                              {lineParts.map((part, partIndex) => {
                                if (part.kind === 'spacer') {
                                  return <span key={`spacer-${lineIndex}-${partIndex}`} className="block h-4 w-full" />;
                                }

                                if (part.kind === 'text') {
                                  return <span key={`text-${lineIndex}-${partIndex}`}>{part.value}</span>;
                                }

                                return (
                                  <span key={`blank-${lineIndex}-${partIndex}`} className="inline-flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                                      {part.index}
                                    </span>
                                    <span
                                      className={`h-9 w-40 max-w-full rounded-md border px-3 text-sm shadow-sm inline-flex items-center ${
                                        showExplanation
                                          ? 'border-green-300 bg-green-50 text-green-800'
                                          : 'border-gray-300 bg-white text-gray-500'
                                      }`}
                                      aria-label={`Sentence blank ${part.index}`}
                                    >
                                      {showExplanation
                                        ? sentenceCompletionData.parsedAnswers[part.index - 1] ?? '—'
                                        : 'Blank'}
                                    </span>
                                  </span>
                                );
                              })}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Speaking Layout */}
                {isSpeakingQuestion && speakingFollowUpQuestions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Follow-up Questions</h3>
                      {speakingFollowUpQuestions.length > 0 && (
                        
                          <div className="space-y-2">
                            {speakingFollowUpQuestions.map((question, index) => (
                              <div key={`${question}-${index}`} className="rounded-md border border-gray-100 bg-white px-3 py-3">
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  <span className="font-semibold text-gray-700 mr-2">Follow-up {index + 1}.</span>
                                  {question}
                                </p>
                              </div>
                            ))}
                          </div>
                        
                      )}
                  </div>
                )}

                {/* Rubric for Speaking/Writing */}
                {item.rubric && (item.skill === 'Speaking' || item.skill === 'Writing') && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Assessment Criteria</h3>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {item.rubric}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Show Answer toggle */}
                {!showExplanation && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExplanation(true)}
                      className="text-gray-700"
                    >
                      <Lightbulb className="w-4 h-4 mr-2 text-gray-500" />
                      Show answer key
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Explanation Section */}
            {showExplanation && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-green-900">
                      Answer Explanation
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Correct Answer</h4>
                    {hasMatchingAnswerKey ? (
                      <div className="rounded-xl border border-green-100 bg-green-50/50 p-3">

                        <div className="space-y-2">
                          {matchingData?.mappings.map((mapping) => (
                            <div
                              key={`${mapping.promptIndex}-${mapping.choice}`}
                              className="rounded-lg border border-green-100 bg-white px-3 py-3"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:items-center">
                                <div className="flex items-start gap-3 min-w-0">
                                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                                    {mapping.promptIndex}
                                  </span>
                                  <p className="text-sm text-gray-800 leading-relaxed">{mapping.prompt}</p>
                                </div>

                                <div className="flex items-center justify-center text-gray-400 text-sm font-semibold">
                                  <span className="hidden md:inline">→</span>
                                  <span className="md:hidden">matches</span>
                                </div>

                                <div className="flex items-start gap-3 min-w-0">
                                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                                    {mapping.choiceLabel}
                                  </span>
                                  <p className="text-sm text-gray-800 leading-relaxed">{mapping.choice}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : hasNoteCompletionAnswer ? (
                      <div className="rounded-xl border border-green-100 bg-green-50/50 p-3">
                        <div className="space-y-2">
                          {noteAnswerRows.map((row) => (
                            <div
                              key={`note-answer-${row.blankIndex}`}
                              className="flex items-center gap-3 rounded-lg border border-green-100 bg-white px-3 py-2"
                            >
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                                {row.blankIndex}
                              </span>
                              <p className="text-sm text-gray-800">{row.expected || '—'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : hasSentenceCompletionAnswer ? (
                      <div className="rounded-xl border border-green-100 bg-green-50/50 p-3">
                        <div className="space-y-2">
                          {sentenceAnswerRows.map((row) => (
                            <div
                              key={`sentence-answer-${row.blankIndex}`}
                              className="flex items-center gap-3 rounded-lg border border-green-100 bg-white px-3 py-2"
                            >
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                                {row.blankIndex}
                              </span>
                              <p className="text-sm text-gray-800">{row.expected || '—'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : hasTrueFalseNotGivenAnswer ? (
                            <p className="text-gray-700">{trueFalseExpectedAnswer || '—'}</p>
                    ) : hasShortAnswerAnswer ? (
                              <p className="text-gray-700">{shortAnswerExpectedValues.join(' / ') || '—'}</p>
                    ) : hasEssaySample ? (
                      <div className="space-y-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.answerKey || 'Answer is not available for this item.'}</p>
                      </div>
                    ) : hasSpeakingSample ? (
                      <div className="space-y-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.answerKey || 'Answer is not available for this item.'}</p>
                      </div>
                    ) : (
                      <p className="text-gray-700">
                        {item.options?.find(o => o.correct)?.text || 'Answer explanation not available'}
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Why This Answer?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      This is the correct answer because it directly addresses the main question in the {item.skill.toLowerCase()} exercise.
                      {isListening && ' The audio recording provides clear evidence supporting this choice.'}
                    </p>
                  </div>

                  {item.subSkill && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Learning Focus</h4>
                      <p className="text-gray-700">
                        This question tests your ability in <strong>{item.subSkill}</strong> at the {item.level} level.
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowExplanation(false)}
                    className="w-full border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Hide Explanation
                  </Button>
                </CardContent>
              </Card>
            )}

            
            {/* Psychometrics Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Psychometrics</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="text-sm">
                          <strong>IRT (Item Response Theory)</strong> parameters describe item characteristics:
                          <br />• <strong>b</strong> (difficulty): Higher values = harder items
                          <br />• <strong>a</strong> (discrimination): How well item separates ability levels
                          <br />• <strong>c</strong> (guessing): Probability of correct guess
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                {item.irtParameters ? (
                  <div className="space-y-4">
                    {/* IRT Source */}
                    

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Difficulty (b-parameter)</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {item.irtParameters.b.toFixed(2)}
                        </div>
                        {item.difficulty && (
                          <div className="text-xs text-gray-500 mt-1">
                            Qualitative: {item.difficulty}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Discrimination (a-parameter)</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {item.irtParameters.a.toFixed(2)}
                        </div>
                        {item.discrimination && (
                          <div className="text-xs text-gray-500 mt-1">{item.discrimination}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Guessing (c-parameter)</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {item.irtParameters.c.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-6">
                      {item.irtParameters.sampleSize && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Sample Size</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {item.irtParameters.sampleSize.toLocaleString()}
                          </div>
                        </div>
                      )}

                      {item.irtParameters.modelVersion && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Model Version</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {item.irtParameters.modelVersion}
                          </div>
                        </div>
                      )}

                      {item.irtParameters.predictionDate && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            {item.irtParameters.calibratedFromFieldTest ? 'Calibration Date' : 'Estimation Date'}
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {new Date(item.irtParameters.predictionDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      )}

                      {item.confidence !== undefined && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Confidence</div>
                          <div className="text-lg font-semibold text-gray-900">{item.confidence}%</div>
                        </div>
                      )}
                    </div>

                    {/* Manual Override */}
                    {item.manualOverride && item.manualOverrideReason && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-blue-900">Manual Override Applied</div>
                            <div className="text-sm text-blue-700 mt-1">{item.manualOverrideReason}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No psychometric parameters available for this item.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Item Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Item Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Sub-Skill</div>
                    <div className="font-medium text-gray-900">{item.subSkill || 'N/A'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Cognitive Level</div>
                    <div className="font-medium text-gray-900">{item.cognitiveLevel || 'N/A'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Content Domain</div>
                    <div className="font-medium text-gray-900">{item.contentDomain || 'N/A'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Language Variety</div>
                    <div className="font-medium text-gray-900">{item.languageVariety || 'N/A'}</div>
                  </div>

                  {item.exposureCount !== undefined && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        Exposure Count
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3 h-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">Number of times this item has been administered</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className={`font-bold ${item.exposureCount > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.exposureCount}
                      </div>
                      {item.lastEditedDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last: {new Date(item.lastEditedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  )}

                  {item.enemyItems && item.enemyItems.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        Enemy Items
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3 h-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">
                                <strong>Enemy items</strong> should not appear together in the same test form,
                                typically due to content overlap or shared context.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="space-y-1">
                        {item.enemyItems.map((enemyId) => (
                          <Badge key={enemyId} variant="outline" className="text-xs">
                            {enemyId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {isFromWorkflow && screeningEntries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm tracking-[0.12em] uppercase text-slate-500">Screening</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {screeningEntries.map((entry) => {
                      const isFailed = entry.value === 'Fail';
                      const isExpanded = Boolean(expandedScreeningReasons[entry.key]);

                      return (
                        <div
                          key={entry.label}
                          className={`overflow-hidden rounded-xl border ${
                            entry.value === 'Review'
                              ? 'border-amber-200 bg-amber-50/70'
                              : entry.value === 'Pass'
                                ? 'border-green-200 bg-green-50/70'
                                : 'border-red-200 bg-red-50/70'
                          }`}
                        >
                       
                          <div
                            className={`flex items-center justify-between gap-3 px-4 py-3 ${isFailed ? 'cursor-pointer' : ''}`}
                            onClick={isFailed ? () => toggleScreeningReason(entry.key) : undefined}
                            role={isFailed ? 'button' : undefined}
                            tabIndex={isFailed ? 0 : undefined}
                            onKeyDown={isFailed ? (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleScreeningReason(entry.key);
                              }
                            } : undefined}
                            aria-expanded={isFailed ? isExpanded : undefined}
                          >
                            <div className="text-base font-semibold leading-tight text-gray-900 sm:text-md">
                              {entry.label}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  entry.value === 'Fail'
                                    ? 'destructive'
                                    : entry.value === 'Review'
                                      ? 'secondary'
                                      : 'outline'
                                }
                                className={`rounded-full px-4 py-1 text-xs font-semibold tracking-wide uppercase ${
                                  entry.value === 'Pass'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : entry.value === 'Review'
                                      ? 'bg-amber-200/80 text-amber-800 border-amber-300'
                                      : ''
                                }`}
                              >
                                {entry.value}
                              </Badge>
                              {/* {isFailed && (
                                <span className="text-xs font-medium text-red-700">
                                  {isExpanded ? 'Hide reason' : 'Show reason'}
                                </span>
                              )} */}
                            </div>
                          </div>
                          {isFailed && isExpanded && (
                            <div className="border-t border-red-200 bg-white/80 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-red-700">Failure Reason</p>
                              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                                {screeningFailureReasonByKey.get(entry.key)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Current State */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Current State</div>
                  <Badge className="bg-gray-600 text-white px-3 py-1">
                    {getWorkflowStateLabel(item.workflowState)}
                  </Badge>
                </div>

                {/* Timeline */}
                {item.reviewHistory && item.reviewHistory.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <div className="text-sm font-medium text-gray-700">Timeline</div>
                    {item.reviewHistory.map((entry, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          {index < item.reviewHistory!.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gray-300 my-1" style={{ minHeight: '2rem' }} />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{entry.action}</span>
                            <Badge variant="outline" className="text-xs">{getWorkflowStateLabel(entry.state)}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {entry.reviewer} · {new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Authorship */}
                <Separator className="my-6" />
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Author</div>
                    <div className="font-medium text-gray-900">{item.author || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Last Edited</div>
                    <div className="font-medium text-gray-900">
                      {item.lastEditedDate
                        ? new Date(item.lastEditedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </div>
                    {item.lastEditedBy && (
                      <div className="text-xs text-gray-500 mt-1">by {item.lastEditedBy}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Reviewers</div>
                    {item.reviewers && item.reviewers.length > 0 ? (
                      <div className="space-y-1">
                        {item.reviewers.map((reviewer, index) => (
                          <div key={index} className="text-sm font-medium text-gray-900">
                            {reviewer}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">None</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3">
                  {item.status === 'Compromised' ? (
                    <>
                      <Button variant="outline" className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Restore to Active
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50">
                        <Archive className="w-4 h-4" />
                        Retire Item
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Mark as Compromised
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50">
                        <Archive className="w-4 h-4" />
                        Retire Item
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}


