import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Sparkles,
  ScanSearch,
  Gauge,
  Target,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { getItemsForReview } from "../data/mockData";
import { isWorkflowState } from '../data/workflowState';

export function Dashboard() {
  const itemsNeedingReview = getItemsForReview();

  const recentReviews = itemsNeedingReview
    .filter(
      (item) =>
        isWorkflowState(item.workflowState, 'PENDING_SCREENING_REVIEW') ||
        isWorkflowState(item.workflowState, 'PENDING_DP_REVIEW'),
    )
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      status: isWorkflowState(item.workflowState, 'PENDING_DP_REVIEW') ? 'DP Review' : 'Screening Review',
      type: item.itemType,
      level: item.level,
      flaggedFor:
        item.screening?.similarity === 'Fail' ? 'Similarity' :
        item.screening?.cefrFit === 'Fail' ? 'CEFR Fit' :
        item.screening?.distractorStrength === 'Fail' ? 'Distractor Strength' :
        item.screening?.clarity === 'Fail' ? 'Clarity' :
        item.screening?.fairness === 'Fail' ? 'Fairness' :
        isWorkflowState(item.workflowState, 'PENDING_DP_REVIEW') ? 'Confidence' : 'Screening',
    }));

  const aiInsights = [
    { message: '12 items may be over-difficult for their CEFR level', severity: 'warning' },
    { message: '5 items require metadata review before seeding', severity: 'info' },
    { message: 'Reading set shows high confidence predictions (avg 89%)', severity: 'success' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Workflow Hub
          </h1>
          <p className="text-gray-600">
            Accelerate your assessment preparation with intelligent workflows
          </p>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Items Screened</div>
                <ScanSearch className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">847</div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Predictions Generated</div>
                <Gauge className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">412</div>
              <p className="text-xs text-gray-500 mt-1">82% avg accuracy</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Ready for Seeding</div>
                <Target className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">23</div>
              <p className="text-xs text-gray-500 mt-1">High confidence</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Active Reviews</div>
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{itemsNeedingReview.length}</div>
              <p className="text-xs text-gray-500 mt-1">Pending action</p>
            </CardContent>
          </Card>
        </div>

        {/* Primary Workflow Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Screening */}
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ScanSearch className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Screening</CardTitle>
                  <Badge variant="outline" className="mt-1 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                AI-powered content screening for quality and compliance review across 5 dimensions
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Queue Status</span>
                <span className="font-semibold text-gray-900">6 items waiting</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last Run</span>
                <span className="text-gray-600">21 items · 5 flagged</span>
              </div>
              <Link to="/workflows/pre-testing-pipeline/screening">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Start Screening
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Difficulty Prediction */}
          <Card className="border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Gauge className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Difficulty Prediction</CardTitle>
                  <Badge variant="outline" className="mt-1 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    ML Model
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                AI-predicted CEFR alignment and difficulty with confidence indicators
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Queue Status</span>
                <span className="font-semibold text-gray-900">3 items waiting</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Model Accuracy</span>
                <span className="text-green-600 font-semibold">82%</span>
              </div>
              <Link to="/workflows/pre-testing-pipeline/difficulty-prediction">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Start Prediction
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Seeding */}
          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Seeding</CardTitle>
                  <Badge variant="outline" className="mt-1 text-xs">
                    Adaptive Testing
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Prepare items for adaptive testing with intelligent prioritization
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Queue Status</span>
                <span className="font-semibold text-gray-900">8 items ready</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Next Window</span>
                <span className="text-gray-600">15 Mar 2025</span>
              </div>
              <Link to="/workflows/pre-testing-pipeline/seeding">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Start Seeding
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Review Queue */}
          <Card className="lg:col-span-2 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Review Queue</CardTitle>
              <Link to="/review-queue">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReviews.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div>
                        <Link
                          to={`/item-bank/${item.level}/${item.id}?from=workflow`}
                          state={{ fromWorkflow: true }}
                          className="font-medium text-blue-600 hover:underline text-sm"
                        >
                          {item.id}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{item.type}</Badge>
                          <Badge variant="outline" className="text-xs">{item.level}</Badge>
                          <span className="text-xs text-gray-500">· {item.flaggedFor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'Screening Review' && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Screening Review
                        </Badge>
                      )}
                      {item.status === 'DP Review' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          DP Review
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {recentReviews.length === 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    No Screening Review or DP Review items in queue.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Panel */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      insight.severity === 'warning'
                        ? 'bg-orange-50 border border-orange-200'
                        : insight.severity === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex gap-2">
                      {insight.severity === 'warning' && (
                        <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      )}
                      {insight.severity === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      )}
                      {insight.severity === 'info' && (
                        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <p
                        className={
                          insight.severity === 'warning'
                            ? 'text-orange-800'
                            : insight.severity === 'success'
                            ? 'text-green-800'
                            : 'text-blue-800'
                        }
                      >
                        {insight.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}