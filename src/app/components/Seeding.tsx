import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getAllItems, moveItemsToSeeded } from '../data/mockData';
import { isWorkflowState } from '../data/workflowState';

const DEFAULT_VISIBLE_RECOMMENDED_ITEMS = 4;
const DEFAULT_VISIBLE_SEEDED_ITEMS = 5;

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

  const recommendedItems = useMemo(
    () => {
      const explicitRecommendations = sortNewestFirst(
        allItems.filter(
          (item) => isWorkflowState(item.workflowState, 'RECOMMENDED_FOR_SEEDING') && (item.confidence ?? 0) < 60,
        ),
      );

      if (explicitRecommendations.length > 0) {
        return explicitRecommendations;
      }

      return sortNewestFirst(
        allItems.filter(
          (item) =>
            isWorkflowState(item.workflowState, 'PENDING_DP_REVIEW') &&
            (item.confidence ?? 0) < 60 &&
            !item.flaggedForReview,
        ),
      ).slice(0, DEFAULT_VISIBLE_RECOMMENDED_ITEMS);
    },
    [allItems],
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
          <span className="text-gray-900">Seeding</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase mb-1">Step 3</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seeding</h1>
            <p className="text-gray-600">
              Choose which items to include in live tests next – prioritised by where the bank needs items most.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Ready to Seed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{recommendedItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Currently Seeded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{currentlySeeded.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Gaps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Bank Gaps by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4 mb-6">
              {[
                { level: 'C1', gap: 36, needed: 'critical' },
                { level: 'B1', gap: 28, needed: 'high' },
                { level: 'A2', gap: 23, needed: 'medium' },
                { level: 'B2', gap: 23, needed: 'medium' },
                { level: 'C2', gap: 4, needed: 'low' },
                { level: 'A1', gap: 3, needed: 'low' },
              ].map((item) => (
                <div key={item.level} className="flex-1 text-center">
                  <div
                    className={`rounded-t mx-auto ${
                      item.needed === 'critical' ? 'bg-red-400' :
                      item.needed === 'high' ? 'bg-orange-400' :
                      item.needed === 'medium' ? 'bg-yellow-400' :
                      'bg-gray-300'
                    }`}
                    style={{ 
                      width: '100%',
                      height: `${Math.max(item.gap * 2, 20)}px`,
                    }}
                  />
                  <div className="text-sm font-bold text-gray-900 mt-2">{item.level}</div>
                  <div className="text-xs text-gray-500">{item.gap} needed</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended for Seeding */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Recommended for Seeding · {recommendedItems.length} items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              Select items to include in the next live test batch.
            </p>

            {recommendedItems.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                No items are currently recommended for seeding.
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
                            {item.id}
                          </Link>
                          <Badge variant="outline">{item.level}</Badge>
                          <Badge variant="outline">{item.skill}</Badge>
                          <Badge variant="outline">{item.itemType}</Badge>
                        </div>

                        <div className="text-sm text-gray-900 mb-3">{item.title}</div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {item.difficulty && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              Difficulty: {item.difficulty}
                            </Badge>
                          )}
                          {item.confidence !== undefined && (
                            <Badge variant="secondary">Confidence: {item.confidence}%</Badge>
                          )}
                        </div>

                        <div className="mt-3 text-xs text-green-600">Passed all screening checks and ready for seeding</div>
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
              {selectedItemIds.length} item{selectedItemIds.length === 1 ? '' : 's'} selected for seeding
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={handleConfirmBatch} disabled={selectedItemIds.length === 0}>Confirm Batch</Button>
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
              These items are already in live testing.
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
                          {item.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.difficulty || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">0 / 200</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.lastEditedDate || 'N/A'}</td>
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

