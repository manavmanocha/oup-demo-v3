import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SEEDED_RESPONSE_TARGET, getAllItems, getBankCapacity, getSeededResponsesAccrued, moveItemsToSeeded } from '../data/mockData';
import { AssessmentItem } from '../data/types';
import { isWorkflowState } from '../data/workflowState';

const DEFAULT_VISIBLE_RECOMMENDED_ITEMS = 4;
const DEFAULT_VISIBLE_SEEDED_ITEMS = 5;

const LOW_CONFIDENCE_THRESHOLD = 75;

const formatSeededDate = (iso?: string): string => {
  if (!iso) return 'N/A';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatItemIdForDisplay = (id: string): string => {
  return id.startsWith('ITMBK-') ? id.slice('ITMBK-'.length) : id;
};

// Bank-aware priority score for ordering seeding candidates.
// Items in heavily under-supplied CEFR levels are pushed up; among items at the
// same level, lower model confidence breaks ties (those benefit most from field
// evidence). Higher score = higher priority.
const getSeedingPriorityScore = (
  item: Pick<AssessmentItem, 'level' | 'confidence'>,
  gapByLevel: Record<string, number>,
): number => {
  const gap = gapByLevel[item.level] ?? 0;
  const confidence = item.confidence ?? 100;
  return gap * 2 + (100 - confidence);
};

const buildSeedingRationale = (
  item: Pick<AssessmentItem, 'id' | 'level' | 'skill' | 'confidence'>,
  gapByLevel: Record<string, number>,
): string => {
  const confidence = item.confidence ?? 0;
  const gap = gapByLevel[item.level] ?? 0;

  if (gap >= 20) {
    return `Bank gap at ${item.level} ${item.skill} — ${gap} item${gap === 1 ? '' : 's'} below target (priority fill)`;
  }

  if (confidence > 0 && confidence < LOW_CONFIDENCE_THRESHOLD) {
    return `Low model confidence (${confidence}%) — field evidence required before bank entry`;
  }

  if (gap > 0) {
    return `Bank gap at ${item.level} ${item.skill} — ${gap} item${gap === 1 ? '' : 's'} below target`;
  }

  return `${item.level} ${item.skill} coverage on target — refresh exposure pool`;
};

const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortNewestFirst = <T extends { id: string; createdDate?: string; lastEditedDate?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const aTime = Math.max(toTimestamp(a.lastEditedDate), toTimestamp(a.createdDate));
    const bTime = Math.max(toTimestamp(b.lastEditedDate), toTimestamp(b.createdDate));

    if (bTime !== aTime) {
      return bTime - aTime;
    }

    return b.id.localeCompare(a.id);
  });
};

export function Seeding() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [showAllSeeded, setShowAllSeeded] = useState(false);

  const allItems = useMemo(() => getAllItems(), [refreshVersion]);

  const gapByLevel = useMemo(
    () => getBankCapacity().reduce<Record<string, number>>((acc, row) => {
      acc[row.level] = row.gapToTarget;
      return acc;
    }, {}),
    [refreshVersion],
  );

  const recommendedItems = useMemo(
    () => {
      const candidates = allItems.filter((item) =>
        isWorkflowState(item.workflowState, 'RECOMMENDED_FOR_SEEDING'),
      );

      return [...candidates].sort((a, b) => {
        const scoreDiff = getSeedingPriorityScore(b, gapByLevel) - getSeedingPriorityScore(a, gapByLevel);
        if (scoreDiff !== 0) return scoreDiff;

        const aTime = Math.max(toTimestamp(a.lastEditedDate), toTimestamp(a.createdDate));
        const bTime = Math.max(toTimestamp(b.lastEditedDate), toTimestamp(b.createdDate));
        if (bTime !== aTime) return bTime - aTime;
        return b.id.localeCompare(a.id);
      });
    },
    [allItems, gapByLevel],
  );

  const currentlySeeded = useMemo(
    () => sortNewestFirst(allItems.filter((item) => isWorkflowState(item.workflowState, 'SEEDED'))),
    [allItems],
  );
  const visibleRecommendedItems = showAllRecommended
    ? recommendedItems
    : recommendedItems.slice(0, DEFAULT_VISIBLE_RECOMMENDED_ITEMS);
  const visibleSeededItems = showAllSeeded ? currentlySeeded : currentlySeeded.slice(0, DEFAULT_VISIBLE_SEEDED_ITEMS);
  const hiddenRecommendedCount = Math.max(recommendedItems.length - DEFAULT_VISIBLE_RECOMMENDED_ITEMS, 0);
  const hiddenSeededCount = Math.max(currentlySeeded.length - DEFAULT_VISIBLE_SEEDED_ITEMS, 0);

  const toggleSelected = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const handleConfirmBatch = () => {
    if (selectedItemIds.length === 0) {
      return;
    }

    moveItemsToSeeded(selectedItemIds);
    setSelectedItemIds([]);
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
          <Link to="/workflows/pre-testing-pipeline/stages" className="hover:underline">Pipeline Stages</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline/seeding" className="hover:underline">Seeding</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Recommended Items</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Stage 3 · Seeding</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recommended Items</h1>
            <p className="text-gray-600 max-w-xl">
              Items ranked by bank gap and model confidence. Select and confirm to allocate to the next live test batch.
            </p>
          </div>
        </div>

        {/* Recommended for Seeding */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Recommended for Seeding · {recommendedItems.length} items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              Ranked by bank gap and model confidence. Select the items to include in this batch, then confirm.
            </p>

            {recommendedItems.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                No items are currently queued for seeding. Run a difficulty estimation to generate candidates.
              </div>
            ) : (
              <div className="space-y-4">
                {visibleRecommendedItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Link
                            to={`/item-bank/${item.level}/${item.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {formatItemIdForDisplay(item.id)}
                          </Link>
                          <Badge variant="outline">{item.level}</Badge>
                          <Badge variant="outline">{item.skill}</Badge>
                          <Badge variant="outline">{item.itemType}</Badge>
                        </div>

                        <div className="text-sm text-gray-900 mb-3">{item.title}</div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {item.difficulty && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {item.difficulty}
                            </Badge>
                          )}
                          {item.confidence !== undefined && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              Confidence: {item.confidence}%
                            </Badge>
                          )}
                          <Badge variant="secondary" className="bg-amber-50 text-amber-800 border border-amber-200">
                            {buildSeedingRationale(item, gapByLevel)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {!showAllRecommended && hiddenRecommendedCount > 0 && (
                  <Button variant="outline" onClick={() => setShowAllRecommended(true)}>
                    Show {hiddenRecommendedCount} more item{hiddenRecommendedCount === 1 ? '' : 's'}
                  </Button>
                )}
              </div>
            )}

            <div className="mt-6 p-3 bg-gray-50 border rounded text-sm text-gray-600">
              {selectedItemIds.length} item{selectedItemIds.length === 1 ? '' : 's'} selected
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={handleConfirmBatch} disabled={selectedItemIds.length === 0}>
                Confirm Seeding Batch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Currently Seeded */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Currently Seeded · {currentlySeeded.length} items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              These items are embedded in live test forms and accruing response data.
            </p>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seeded</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleSeededItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/item-bank/${item.level}/${item.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {formatItemIdForDisplay(item.id)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.difficulty || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getSeededResponsesAccrued(item)} / {SEEDED_RESPONSE_TARGET}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatSeededDate(item.lastEditedDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!showAllSeeded && hiddenSeededCount > 0 && (
              <div className="mt-4">
                <Button variant="outline" onClick={() => setShowAllSeeded(true)}>
                  Show {hiddenSeededCount} more item{hiddenSeededCount === 1 ? '' : 's'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

