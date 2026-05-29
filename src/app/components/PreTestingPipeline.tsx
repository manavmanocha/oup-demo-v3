import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight } from 'lucide-react';
import { getAllItems, getLastRunDateByStage, getPipelineRuns } from '../data/mockData';
import { isWorkflowState } from '../data/workflowState';

const RECENT_RUNS_LIMIT = 6;

const formatRunDate = (iso?: string): string => {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function PreTestingPipeline() {
  const allItems = getAllItems();
  const inReviewItems = allItems.filter((item) => item.status === 'In Review');
  const screeningQueueCount = inReviewItems.filter((item) => isWorkflowState(item.workflowState, 'PENDING_SCREENING_REVIEW')).length;
  const predictionQueueCount = inReviewItems.filter((item) =>
    isWorkflowState(item.workflowState, 'SCREENING_APPROVED') ||
    isWorkflowState(item.workflowState, 'IN_DIFFICULTY_ESTIMATION') ||
    isWorkflowState(item.workflowState, 'PENDING_DP_REVIEW'),
  ).length;
  const seedingQueueCount = allItems.filter((item) => isWorkflowState(item.workflowState, 'RECOMMENDED_FOR_SEEDING')).length;
  const lastRunByStage = getLastRunDateByStage();

  const stageCards = [
    {
      step: 'Stage 1',
      lastRun: formatRunDate(lastRunByStage.Screening),
      title: 'Screening',
      description:
        'Automated quality checks on new and revised items, covering CEFR fit, distractor strength, clarity, fairness, and similarity.',
      queueCount: screeningQueueCount,
      queueLabel: 'Draft items awaiting screening',
      to: '/workflows/pre-testing-pipeline/screening',
    },
    {
      step: 'Stage 2',
      lastRun: formatRunDate(lastRunByStage['Difficulty Estimation']),
      title: 'Difficulty Estimation',
      description:
        'Estimates item difficulty and CEFR level so items can be calibrated before live trialling.',
      queueCount: predictionQueueCount,
      queueLabel: 'Screened items awaiting difficulty estimation',
      to: '/workflows/pre-testing-pipeline/difficulty-prediction',
    },
    {
      step: 'Stage 3',
      lastRun: formatRunDate(lastRunByStage.Seeding),
      title: 'Seeding',
      description:
        'Assigns calibrated items to live test forms, prioritised by item-bank coverage and estimate confidence.',
      queueCount: seedingQueueCount,
      queueLabel: 'Calibrated items awaiting seeding',
      to: '/workflows/pre-testing-pipeline/seeding',
    },
  ];

  const recentRuns = getPipelineRuns(RECENT_RUNS_LIMIT).map((run) => {
    const isSeedingRun = run.stage === 'Seeding';
    const actionCount = run.flagged;

    return {
      ...run,
      displayDate: formatRunDate(run.date),
      actionSummary: isSeedingRun
        ? (actionCount > 0 ? `${actionCount} deferred` : '—')
        : `${actionCount} flagged`,
    };
  });

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows" className="hover:underline">Workflows</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Pre-Testing Pipeline</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Testing Pipeline</h1>
          <p className="text-gray-600">
            A three-stage quality pipeline that moves authored items from draft to live-bank readiness.
          </p>
        </div>

        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stageCards.map((stage) => (
            <Link key={stage.step} to={stage.to} className="group block h-full">
              <Card className="h-full transition-all hover:shadow-md hover:border-blue-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div>
                      <div className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-2">
                        {stage.step}
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {stage.title}
                      </CardTitle>
                    </div>
                    <div className="shrink-0 text-xs text-gray-500 text-right">
                      <div className="uppercase tracking-wide">Last run</div>
                      <div className="text-gray-700">{stage.lastRun}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {stage.description}
                  </p>

                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gray-900">{stage.queueCount}</div>
                    <div className="text-sm text-gray-600">in queue</div>
                    <div className="text-xs text-gray-500">{stage.queueLabel}</div>
                  </div>

                  <div className="flex items-center justify-end text-sm font-medium text-blue-600">
                    Open stage
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Runs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Needs Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-blue-600">{run.id}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{run.stage}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{run.items}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{run.actionSummary}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-gray-700 font-normal">
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{run.displayDate}</td>
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

