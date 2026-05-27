import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight } from 'lucide-react';
import { getAllItems } from '../data/mockData';
import { isWorkflowState } from '../data/workflowState';

export function PreTestingPipeline() {
  const allItems = getAllItems();
  const screeningQueueCount = allItems.filter((item) => isWorkflowState(item.workflowState, 'NOT_STARTED')).length;
  const predictionQueueCount = allItems.filter((item) => isWorkflowState(item.workflowState, 'SCREENING_APPROVED')).length;
  const seedingQueueCount = allItems.filter((item) => isWorkflowState(item.workflowState, 'RECOMMENDED_FOR_SEEDING')).length;

  const stageCards = [
    {
      step: 'Step 1',
      status: '• Complete',
      title: 'Screening',
      description: 'AI quality checks for new and modified items across 5 dimensions.',
      queueCount: screeningQueueCount,
      queueLabel: 'Draft items waiting for screening',
      to: '/workflows/pre-testing-pipeline/screening',
    },
    {
      step: 'Step 2',
      status: '• Complete',
      title: 'Difficulty Estimation',
      description: 'ML model predicts IRT difficulty and CEFR alignment before live testing.',
      queueCount: predictionQueueCount,
      queueLabel: 'Screening approved items waiting for estimation',
      to: '/workflows/pre-testing-pipeline/difficulty-prediction',
    },
    {
      step: 'Step 3',
      status: '• Idle',
      title: 'Seeding',
      description: 'Prioritise items for live test exposure based on bank gaps and confidence.',
      queueCount: seedingQueueCount,
      queueLabel: 'Calibrated items ready for seeding',
      to: '/workflows/pre-testing-pipeline/seeding',
    },
  ];

  const recentRuns = [
    { id: 'RUN-0051', stage: 'Screening', items: 21, flagged: 5, status: 'Success', date: '11 Mar 2025' },
    { id: 'RUN-0050', stage: 'Difficulty Estimation', items: 16, flagged: 0, status: 'Success', date: '10 Mar 2025' },
    { id: 'RUN-0049', stage: 'Seeding', items: 5, flagged: 0, status: 'Success', date: '9 Mar 2025' },
    { id: 'RUN-0048', stage: 'Screening', items: 14, flagged: 2, status: 'Success', date: '7 Mar 2025' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows" className="hover:underline">Workflows</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pre-Testing Pipeline</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Pipeline Stages</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Testing Pipeline</h1>
          <p className="text-gray-600">
            Items flow through three stages before entering the live item bank.
          </p>
        </div>

        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stageCards.map((stage) => (
            <Link key={stage.step} to={stage.to} className="group block h-full">
              <Card className="h-full transition-all hover:shadow-md hover:border-blue-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      {stage.step}
                    </CardTitle>
                    <Badge variant="outline">{stage.status}</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{stage.title}</h3>
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

                  <div className="flex items-center justify-end text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Open stage
                    <ArrowRight className="w-4 h-4 ml-2" />
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flagged</th>
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
                      <td className="px-4 py-3 text-sm text-gray-700">{run.flagged}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default" className="bg-green-600">• {run.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{run.date}</td>
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

