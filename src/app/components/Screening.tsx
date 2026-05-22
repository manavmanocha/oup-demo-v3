import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { approveScreenedItems, getAllItems, rejectScreenedItems } from '../data/mockData';

const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortNewestFirst = <T extends { createdDate?: string; lastEditedDate?: string; id: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const aTime = Math.max(toTimestamp(a.createdDate), toTimestamp(a.lastEditedDate));
    const bTime = Math.max(toTimestamp(b.createdDate), toTimestamp(b.lastEditedDate));

    if (bTime !== aTime) {
      return bTime - aTime;
    }

    return b.id.localeCompare(a.id);
  });
};

export function Screening() {
  const [refreshKey, setRefreshKey] = useState(0);

  const allItems = useMemo(() => getAllItems(), [refreshKey]);

  const screeningQueue = useMemo(
    () => sortNewestFirst(allItems.filter((item) => item.workflowState === 'Screening Review')),
    [allItems],
  );

  const flaggedItems = useMemo(
    () =>
      screeningQueue.filter((item) =>
        item.screening?.similarity === 'Review' ||
        item.screening?.similarity === 'Fail' ||
        item.screening?.cefrFit === 'Review' ||
        item.screening?.cefrFit === 'Fail' ||
        item.screening?.distractorStrength === 'Review' ||
        item.screening?.distractorStrength === 'Fail' ||
        item.screening?.fairness === 'Review' ||
        item.screening?.fairness === 'Fail' ||
        item.screening?.clarity === 'Fail' ||
        item.screening?.clarity === 'Review',
      ),
    [screeningQueue],
  );

  const awaitingScreening = allItems.filter((item) => item.workflowState === 'Draft').length;
  const flaggedCount = flaggedItems.length;
  const passedCount = allItems.filter((item) => item.workflowState === 'Screening Passed').length;

  const handleApprove = (itemId: string) => {
    approveScreenedItems([itemId]);
    setRefreshKey((prev) => prev + 1);
  };

  const handleReject = (itemId: string) => {
    rejectScreenedItems([itemId]);
    setRefreshKey((prev) => prev + 1);
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
          <span className="text-gray-900">Screening</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3">
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase mb-1">Step 1</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Screening</h1>
            <p className="text-gray-600">
              AI checks each item across 5 dimensions: CEFR fit, distractor strength, clarity, fairness, and similarity.
            </p>
          </div>
          <Link to="/workflows/pre-testing-pipeline/screening/start">
            <Button>+ Start Screening</Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Awaiting Screening</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{awaitingScreening}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{flaggedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Passed (All Clear)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{passedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Flagged Items · {flaggedItems.length} items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              These items have potential issues identified by the AI. Please review and decide whether to approve, reject.
            </p>

            <div className="space-y-6">
              {flaggedItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/item-bank/${item.level}/${item.id}`}
                        state={{ fromWorkflow: true }}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {item.id}
                      </Link>
                      <Badge variant="outline">{item.level}</Badge>
                      <Badge variant="outline">{item.skill}</Badge>
                      <Badge variant="outline">{item.itemType}</Badge>
                    </div>
                  </div>

                  <div className="text-sm text-gray-900 mb-4">{item.content}</div>

                  {/* Screening Issues */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.screening?.cefrFit === 'Review' && (
                      <Badge variant="secondary">CEFR Fit: Review</Badge>
                    )}
                    {item.screening?.cefrFit === 'Fail' && (
                      <Badge variant="destructive">CEFR Fit: Fail</Badge>
                    )}
                    {item.screening?.distractorStrength === 'Review' && (
                      <Badge variant="secondary">Distractor: Review</Badge>
                    )}
                    {item.screening?.distractorStrength === 'Fail' && (
                      <Badge variant="destructive">Distractor: Fail</Badge>
                    )}
                    {item.screening?.fairness === 'Review' && (
                      <Badge variant="secondary">Fairness: Review</Badge>
                    )}
                    {item.screening?.fairness === 'Fail' && (
                      <Badge variant="destructive">Fairness: Fail</Badge>
                    )}
                    {item.screening?.clarity === 'Review' && (
                      <Badge variant="secondary">Clarity: Review</Badge>
                    )}
                    {item.screening?.clarity === 'Fail' && (
                      <Badge variant="destructive">Clarity: Fail</Badge>
                    )}
                    {item.screening?.similarity === 'Review' && (
                      <Badge variant="secondary">Similarity: Review</Badge>
                    )}
                    {item.screening?.similarity === 'Fail' && (
                      <Badge variant="destructive">Similarity: Fail</Badge>
                    )}
                  </div>

                  {/* AI Feedback */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-gray-700">
                    {index === 0 && "The grammar in the stem 'If Mary are not free' is incorrect and should be 'If Mary is not free'."}
                    {index === 1 && "The correct answer is not explicitly stated but requires some inference, and the distractors could be more plausible."}
                    {index === 2 && "The phrase 'housewife' may be considered culturally insensitive or outdated. Consider using gender-neutral language like 'homemaker'."}
                    {index === 3 && "This item is very similar to ITM-SPEAK-0002 already in the bank - consider revising the prompt."}
                    {index === 4 && "This item is too difficult for C1 level based on vocabulary complexity and semantic requirements."}
                    {index === 5 && "The grammar and punctuation in the answer options need correction for clarity."}
                    {"Screening failed on this item due to issues with the content."}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" onClick={() => handleApprove(item.id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(item.id)}>Reject</Button>
                  </div>
                </div>
              ))}

              {flaggedItems.length === 0 && (
                <div className="text-sm text-gray-600 border rounded-lg p-6 bg-gray-50">
                  No items are currently awaiting manual screening review.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
