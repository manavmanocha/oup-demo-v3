import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Info } from 'lucide-react';
import { acceptPredictedItems, getAllItems } from '../data/mockData';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';
import { isWorkflowState } from '../data/workflowState';

const DEFAULT_VISIBLE_ITEMS = 5;

const metricHelpText = {
  confidence: 'The model\'s estimated reliability for this prediction, expressed as a percentage. Values below 85% are flagged for manual review before the item can proceed.',
  difficulty: 'How difficult the item is predicted to be for candidates at the target level. Higher values mean harder items.',
  discrimination: 'How sharply the item distinguishes between candidates of different ability levels. Higher discrimination means the item gives more diagnostic information.',
};

function MetricValueWithTooltip({
  label,
  value,
  helpText,
  valueClassName = 'font-semibold text-gray-900',
}: {
  label: string;
  value: string;
  helpText: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className={valueClassName}>{value}</div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`${label} info`}
            >
              <Info className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{helpText}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export function DifficultyPrediction() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [showAllNeedsReview, setShowAllNeedsReview] = useState(false);
  const [showAllReadyToAccept, setShowAllReadyToAccept] = useState(false);
  const [selectedReadyIds, setSelectedReadyIds] = useState<string[]>([]);
  const allItems = useMemo(() => getAllItems(), [refreshVersion]);
  const inReviewItems = useMemo(() => allItems.filter((item) => item.status === 'In Review'), [allItems]);
  const waitingForPrediction = inReviewItems.filter((item) => isWorkflowState(item.workflowState, 'SCREENING_APPROVED'));

  const calibratedItems = useMemo(
    () => inReviewItems
      .filter((item) => isWorkflowState(item.workflowState, 'PENDING_DP_REVIEW'))
      .map((item) => ({
        id: item.id,
        item: item.title,
        level: item.level,
        skill: item.skill,
        itemType: item.itemType,
        content: item.content,
        confidence: item.confidence ?? 0,
        difficulty: item.difficulty ?? 'Medium',
        discrimination: item.discrimination ?? 'Moderate',
        recencyTimestamp: Math.max(
          toTimestamp(item.aiPredictionDate),
          toTimestamp(item.irtParameters?.predictionDate),
          toTimestamp(item.lastEditedDate),
          toTimestamp(item.createdDate),
        ),
      }))
      .sort((a, b) => {
        if (b.recencyTimestamp !== a.recencyTimestamp) {
          return b.recencyTimestamp - a.recencyTimestamp;
        }

        return b.id.localeCompare(a.id);
      }),
    [inReviewItems],
  );

  const needsReview = calibratedItems.filter((item) => item.confidence < 85);
  const readyToAccept = calibratedItems.filter((item) => item.confidence >= 85);
  const visibleNeedsReview = showAllNeedsReview ? needsReview : needsReview.slice(0, DEFAULT_VISIBLE_ITEMS);
  const visibleReadyToAccept = showAllReadyToAccept ? readyToAccept : readyToAccept.slice(0, DEFAULT_VISIBLE_ITEMS);
  const hiddenNeedsReviewCount = Math.max(needsReview.length - DEFAULT_VISIBLE_ITEMS, 0);
  const hiddenReadyToAcceptCount = Math.max(readyToAccept.length - DEFAULT_VISIBLE_ITEMS, 0);

  const toggleReadyItem = (itemId: string) => {
    setSelectedReadyIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleAllReady = () => {
    if (selectedReadyIds.length === readyToAccept.length) {
      setSelectedReadyIds([]);
    } else {
      setSelectedReadyIds(readyToAccept.map((item) => item.id));
    }
  };

  const handleAcceptItem = (itemId: string) => {
    acceptPredictedItems([itemId]);
    setSelectedReadyIds((prev) => prev.filter((id) => id !== itemId));
    setRefreshVersion((prev) => prev + 1);
  };

  const handleAcceptAll = () => {
    if (!selectedReadyIds.length) {
      return;
    }

    acceptPredictedItems(selectedReadyIds);
    setSelectedReadyIds([]);
    setRefreshVersion((prev) => prev + 1);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows" className="hover:underline">Workflows</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pre-Testing Pipeline</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Difficulty Estimation</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-2">Stage 2</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Difficulty Estimation</h1>
            <p className="text-gray-600">
              Estimates item difficulty, CEFR alignment and discrimination from prior pre-test data, so items can be calibrated before live trialling.
            </p>
          </div>
          <Link to="/workflows/pre-testing-pipeline/difficulty-prediction/start">
            <Button>Run Estimation</Button>
          </Link>
        </div>

        {/* Summary Cards — ordered upstream → current work */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">In Estimation</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{waitingForPrediction.length + needsReview.length + readyToAccept.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Waiting for Estimation</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{waitingForPrediction.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Needs Your Review</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{needsReview.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Ready to Accept</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{readyToAccept.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Needs Your Review */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                Needs Your Review · {needsReview.length} items
              </CardTitle>
              <span className="text-xs text-gray-500">Confidence below 85%</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              These estimates fell below the confidence threshold. Review each item and override any parameter that does not match your judgement.
            </p>

            <div className="space-y-4">
              {visibleNeedsReview.map((item) => (
                <div key={item.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        to={`/item-bank/${item.level}/${item.id}`}
                        state={{ fromWorkflow: true }}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {item.id}
                      </Link>
                      <Badge variant="outline">{item.level}</Badge>
                      <Badge variant="outline">
                        {item.skill === item.itemType ? item.skill : `${item.skill} · ${item.itemType}`}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm text-gray-900 mb-4">{item.content}</div>

                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <MetricValueWithTooltip
                      label="Confidence"
                      value={`${item.confidence}%`}
                      helpText={metricHelpText.confidence}
                    />
                    <MetricValueWithTooltip
                      label="Difficulty"
                      value={item.difficulty}
                      helpText={metricHelpText.difficulty}
                    />
                    <MetricValueWithTooltip
                      label="Discrimination"
                      value={item.discrimination}
                      helpText={metricHelpText.discrimination}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleAcceptItem(item.id)}>Override estimate</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAcceptItem(item.id)}>Accept as-is</Button>
                    <Button size="sm" variant="outline">Reject</Button>
                  </div>
                </div>
              ))}

              {needsReview.length === 0 && (
                <div className="text-sm text-gray-600 border rounded-lg p-6 bg-gray-50">
                  No items currently below the confidence threshold — all recent estimations passed automatically.
                </div>
              )}

              {hiddenNeedsReviewCount > 0 && (
                <Button variant="outline" onClick={() => setShowAllNeedsReview((prev) => !prev)}>
                  {showAllNeedsReview
                    ? 'Show fewer items'
                    : `Show ${hiddenNeedsReviewCount} more item${hiddenNeedsReviewCount === 1 ? '' : 's'}`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ready to Accept */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                Ready to Accept · {readyToAccept.length} items
              </CardTitle>
              <span className="text-xs text-gray-500">Confidence 85% or above</span>
            </div>
            {selectedReadyIds.length > 0 && (
              <Button size="sm" onClick={handleAcceptAll}>
                Accept {selectedReadyIds.length} selected
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              These items met the confidence threshold and can be calibrated without further review.
            </p>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <Checkbox
                        checked={readyToAccept.length > 0 && selectedReadyIds.length === readyToAccept.length}
                        onCheckedChange={toggleAllReady}
                        aria-label="Select all ready items"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="inline-flex items-center gap-1.5">
                        <span>Confidence</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Confidence info">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p className="text-sm">{metricHelpText.confidence}</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="inline-flex items-center gap-1.5">
                        <span>Difficulty</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Difficulty info">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p className="text-sm">{metricHelpText.difficulty}</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="inline-flex items-center gap-1.5">
                        <span>Discrimination</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Discrimination info">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p className="text-sm">{metricHelpText.discrimination}</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleReadyToAccept.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedReadyIds.includes(item.id)}
                          onCheckedChange={() => toggleReadyItem(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/item-bank/${item.level}/${item.id}`}
                          state={{ fromWorkflow: true }}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {item.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate" title={item.item}>{item.item}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.confidence}%</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.difficulty}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.discrimination}</td>
                    </tr>
                  ))}
                  {readyToAccept.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No items currently meet the confidence threshold — check back after the next estimation run.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hiddenReadyToAcceptCount > 0 && (
              <div className="mt-4">
                <Button variant="outline" onClick={() => setShowAllReadyToAccept((prev) => !prev)}>
                  {showAllReadyToAccept
                    ? 'Show fewer items'
                    : `Show ${hiddenReadyToAcceptCount} more item${hiddenReadyToAcceptCount === 1 ? '' : 's'}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

