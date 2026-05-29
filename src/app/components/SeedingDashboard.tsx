import { useMemo } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { getAllItems } from '../data/mockData';
import { isWorkflowState } from '../data/workflowState';

const RECENT_SEEDING_RUNS = [
  { id: 'SEED-0031', date: '26 May 2026', items: 12, confirmedBy: 'G. Pearson' },
  { id: 'SEED-0030', date: '21 May 2026', items: 5, confirmedBy: 'M. Khan' },
  { id: 'SEED-0029', date: '14 May 2026', items: 8, confirmedBy: 'G. Pearson' },
];

const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export function SeedingDashboard() {
  const allItems = useMemo(() => getAllItems(), []);

  const readyToSeedItems = useMemo(
    () => allItems.filter((item) => isWorkflowState(item.workflowState, 'RECOMMENDED_FOR_SEEDING')),
    [allItems],
  );

  const currentlySeededItems = useMemo(
    () =>
      [...allItems.filter((item) => isWorkflowState(item.workflowState, 'SEEDED'))].sort(
        (a, b) =>
          Math.max(toTimestamp(b.lastEditedDate), toTimestamp(b.createdDate)) -
          Math.max(toTimestamp(a.lastEditedDate), toTimestamp(a.createdDate)),
      ),
    [allItems],
  );

  const waitingForPrioritisationCount = useMemo(
    () =>
      allItems.filter(
        (item) =>
          isWorkflowState(item.workflowState, 'PENDING_DP_REVIEW') && (item.confidence ?? 0) < 60,
      ).length,
    [allItems],
  );

  const readyToSeed = readyToSeedItems.length;
  const currentlySeeded = currentlySeededItems.length;
  const visibleSeeded = currentlySeededItems.slice(0, 5);
  const hiddenSeededCount = Math.max(currentlySeeded - visibleSeeded.length, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows" className="hover:underline">Workflows</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pre-Testing Pipeline</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Seeding</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
          <div>
            <div className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-2">Stage 3 · Seeding</div>
            <p className="text-gray-600 max-w-xl">
              Allocate calibrated items to live test forms. The model ranks candidates by bank gap,
              item confidence, and skill coverage so the highest-impact items get field data first.
            </p>
          </div>
          {readyToSeed > 0 && (
            <div className="flex-shrink-0">
              <Link to="/workflows/pre-testing-pipeline/seeding/start">
                <Button size="lg" className="gap-2">
                  Start seeding run
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Link
            to="/workflows/pre-testing-pipeline/seeding/start"
            className="block focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
          >
            <Card className="hover:border-gray-300 transition-colors h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ready to Seed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{readyToSeed}</div>
                <p className="text-sm text-gray-500 mt-1">Estimation accepted, awaiting allocation</p>
              </CardContent>
            </Card>
          </Link>

          <a href="#currently-seeded" className="block focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg">
            <Card className="hover:border-gray-300 transition-colors h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Currently Seeded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{currentlySeeded}</div>
                <p className="text-sm text-gray-500 mt-1">Items live in field-test forms</p>
              </CardContent>
            </Card>
          </a>

          <Link
            to="/workflows/pre-testing-pipeline/difficulty-prediction"
            className="block focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
          >
            <Card className="hover:border-gray-300 transition-colors h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Awaiting Prioritisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{waitingForPrioritisationCount}</div>
                <p className="text-sm text-gray-500 mt-1">Estimation complete, confidence below threshold</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Empty-state panel when nothing is ready */}
        {readyToSeed === 0 && (
          <Card className="mb-8 border-gray-200 bg-gray-50">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-semibold text-gray-900 mb-1">No items ready to seed</p>
                <p className="text-sm text-gray-600">
                  {waitingForPrioritisationCount > 0
                    ? `${waitingForPrioritisationCount} item${waitingForPrioritisationCount === 1 ? '' : 's'} awaiting prioritisation in Difficulty Estimation.`
                    : 'Items will appear here once their difficulty estimates have been accepted.'}
                </p>
              </div>
              {waitingForPrioritisationCount > 0 && (
                <Link to="/workflows/pre-testing-pipeline/difficulty-prediction" className="flex-shrink-0">
                  <Button variant="outline" className="gap-2">
                    Review queue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Currently in field test */}
        <Card className="mb-8" id="currently-seeded">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700 mb-1">
                  Currently in field test
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Items embedded in live forms, accruing response data toward calibration.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentlySeeded === 0 ? (
              <p className="text-sm text-gray-500">No items are currently in field test.</p>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Responses</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Seeded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {visibleSeeded.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              to={`/item-bank/${item.level}/${item.id}`}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              {item.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate" title={item.title}>
                            {item.title}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{item.level}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.difficulty || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">0 / 200</td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{item.lastEditedDate || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hiddenSeededCount > 0 && (
                  <div className="mt-4 text-right">
                    <Link
                      to="/workflows/pre-testing-pipeline/seeding/start"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View all {currentlySeeded} seeded items →
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent seeding runs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Recent seeding runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Confirmed by</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {RECENT_SEEDING_RUNS.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{run.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{run.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{run.items}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{run.confirmedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
