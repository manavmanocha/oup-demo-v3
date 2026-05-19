import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Database, Workflow, TrendingUp, AlertCircle } from 'lucide-react';
import { bankCapacityData, getCompromisedItems, getItemsForReview } from '../data/mockData';

export function Dashboard() {
  const totalActive = bankCapacityData.reduce((sum, level) => sum + level.active, 0);
  const totalTarget = bankCapacityData.reduce((sum, level) => sum + level.target, 0);
  const totalCompromised = getCompromisedItems().length;
  const itemsNeedingReview = getItemsForReview().length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome to the OUP Assessment Builder</p>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Active Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-gray-900">{totalActive}</div>
                <div className="text-sm text-gray-500">of {totalTarget} target</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Overall Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-green-600">71%</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Healthy trajectory
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Compromised Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-red-600">{totalCompromised}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Needs attention
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-blue-600">19</div>
                <div className="text-sm text-gray-500">awaiting review</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Item Bank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Manage and monitor your assessment item inventory across CEFR levels.
              </p>
              <Link to="/item-bank">
                <Button className="w-full">View Item Bank</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5" />
                Pre-Testing Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Review queue health, run screening and difficulty prediction, and seed approved items.
              </p>
              <Link to="/workflows/pre-testing-pipeline">
                <Button className="w-full">Open Pipeline</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Review Queue Alert */}
        {itemsNeedingReview > 0 && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {itemsNeedingReview} items need your review
                    </div>
                    <div className="text-sm text-gray-600">
                      These items have been flagged by AI screening or require manual review
                    </div>
                  </div>
                </div>
                <Link to="/review-queue">
                  <Button variant="outline">View Queue</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
