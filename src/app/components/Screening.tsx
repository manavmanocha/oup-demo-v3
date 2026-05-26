import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { approveScreenedItems, getAllItems, rejectScreenedItems } from '../data/mockData';
import { AssessmentItem } from '../data/types';
import { isWorkflowState } from '../data/workflowState';

const DEFAULT_VISIBLE_ITEMS = 5;

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

const hasScreeningFailure = (item: AssessmentItem) => {
  return Object.values(item.screening ?? {}).includes('Fail');
};

const getScreeningFeedback = (item: AssessmentItem) => {
  if (item.flagReason) {
    return item.flagReason;
  }

  const queuedEntry = [...(item.reviewHistory ?? [])]
    .reverse()
    .find((entry) => entry.state === 'PENDING_SCREENING_REVIEW' && entry.notes);

  return queuedEntry?.notes ?? 'Reviewer feedback: Passed all screening checks and is ready for approval.';
};

const renderScreeningBadges = (item: AssessmentItem) => {
  const dimensions: Array<{ key: keyof NonNullable<AssessmentItem['screening']>; label: string }> = [
    { key: 'cefrFit', label: 'CEFR Fit' },
    { key: 'distractorStrength', label: 'Distractor Strength' },
    { key: 'clarity', label: 'Clarity' },
    { key: 'fairness', label: 'Fairness' },
    { key: 'similarity', label: 'Similarity' },
  ];

  const badges = dimensions
    .map(({ key, label }) => {
      const result = item.screening?.[key];

      if (result === 'Fail') {
        return <Badge key={key} variant="destructive">{label}: Fail</Badge>;
      }

      if (result === 'Review') {
        return <Badge key={key} variant="secondary">{label}: Review</Badge>;
      }

      return null;
    })
    .filter(Boolean);

  if (badges.length > 0) {
    return <div className="flex flex-wrap gap-2 mb-4">{badges}</div>;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">All 5 Dimensions: Pass</Badge>
    </div>
  );
};

const ScreeningQueueSection = ({
  title,
  description,
  items,
  feedbackClassName,
  emptyMessage,
  onApprove,
  onReject,
}: {
  title: string;
  description: string;
  items: AssessmentItem[];
  feedbackClassName: string;
  emptyMessage: string;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = isExpanded ? items : items.slice(0, DEFAULT_VISIBLE_ITEMS);
  const hiddenCount = Math.max(items.length - DEFAULT_VISIBLE_ITEMS, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500 uppercase">
          {title} · {items.length} items
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-6">{description}</p>

        <div className="space-y-6">
          {visibleItems.map((item) => (
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
                  <Badge variant="outline">{item.skill}</Badge>
                  <Badge variant="outline">{item.itemType}</Badge>
                </div>
              </div>

              <div className="text-sm text-gray-900 mb-4">{item.content}</div>

              {renderScreeningBadges(item)}

              <div className={feedbackClassName}>{getScreeningFeedback(item)}</div>

              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" onClick={() => onApprove(item.id)}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => onReject(item.id)}>Reject</Button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-sm text-gray-600 border rounded-lg p-6 bg-gray-50">
              {emptyMessage}
            </div>
          )}

          {!isExpanded && hiddenCount > 0 && (
            <Button variant="outline" onClick={() => setIsExpanded(true)}>
              Show {hiddenCount} more item{hiddenCount === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function Screening() {
  const [refreshKey, setRefreshKey] = useState(0);

  const allItems = useMemo(() => getAllItems(), [refreshKey]);

  const screeningQueue = useMemo(
    () => sortNewestFirst(allItems.filter((item) => isWorkflowState(item.workflowState, 'PENDING_SCREENING_REVIEW'))),
    [allItems],
  );

  const failedItems = useMemo(
    () => screeningQueue.filter((item) => item.flaggedForReview || hasScreeningFailure(item)),
    [screeningQueue],
  );

  const passedPendingItems = useMemo(
    () => screeningQueue.filter((item) => !item.flaggedForReview && !hasScreeningFailure(item)),
    [screeningQueue],
  );

  const awaitingScreening = allItems.filter((item) => isWorkflowState(item.workflowState, 'NOT_STARTED')).length;
  const flaggedCount = failedItems.length;
  const passedCount = passedPendingItems.length;

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
              <div className="text-3xl font-bold text-gray-900">{flaggedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Passed (All Clear)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{passedCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ScreeningQueueSection
            title="Failed / Needs Review"
            description="These items have one or more failed screening dimensions and need a reviewer decision before they can move forward."
            items={failedItems}
            feedbackClassName="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-gray-700"
            emptyMessage="No failed screening items are currently awaiting review."
            onApprove={handleApprove}
            onReject={handleReject}
          />

          <ScreeningQueueSection
            title="Passed / Ready to Approve"
            description="These items passed all screening checks but are still awaiting reviewer approval before difficulty prediction."
            items={passedPendingItems}
            feedbackClassName="p-3 bg-green-50 border border-green-200 rounded text-sm text-gray-700"
            emptyMessage="No all-clear screening items are waiting for approval."
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>
    </div>
  );
}
