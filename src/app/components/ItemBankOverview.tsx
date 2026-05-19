import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { bankCapacityData, getCompromisedItems } from '../data/mockData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function ItemBankOverview() {
  const totalActive = bankCapacityData.reduce((sum, level) => sum + level.active, 0);
  const totalTarget = bankCapacityData.reduce((sum, level) => sum + level.target, 0);
  const totalGap = bankCapacityData.reduce((sum, level) => sum + level.gapToTarget, 0);
  const overallHealth = Math.round((totalActive / totalTarget) * 100);
  const compromisedItems = getCompromisedItems();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Item Bank</h1>
            <p className="text-gray-600">
              Manage and monitor your assessment item inventory across CEFR levels.
            </p>
          </div>
          <Button>
            <Link to="/workflows/pre-testing-pipeline">Review pipeline</Link>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalActive}</div>
              <div className="text-sm text-gray-500 mt-1">of {totalTarget} target</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Overall Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{overallHealth}%</div>
              <div className="text-sm text-gray-500 mt-1">Healthy trajectory</div>
              <Progress value={overallHealth} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Gap to Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalGap}</div>
              <div className="text-sm text-gray-500 mt-1">Items still needed</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">In Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">19</div>
              <div className="text-sm text-gray-500 mt-1">awaiting review</div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Capacity by CEFR Level */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Bank Capacity by CEFR Level</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      <strong>CEFR</strong> (Common European Framework of Reference for Languages) 
                      defines six proficiency levels from A1 (beginner) to C2 (proficient).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4 mb-6">
              {bankCapacityData.map((level) => (
                <Link
                  key={level.level}
                  to={`/item-bank/${level.level}`}
                  className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="text-center mb-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">{level.percentage}%</div>
                    <div
                      className="bg-gray-400 rounded-t mx-auto relative"
                      style={{ 
                        width: '100%',
                        height: `${Math.max(level.percentage * 1.5, 20)}px`,
                      }}
                    >
                      {level.compromised > 0 && (
                        <div
                          className="bg-red-400 absolute bottom-0 left-0 right-0 rounded-t"
                          style={{ height: `${(level.compromised / (level.active + level.compromised)) * 100}%` }}
                        />
                      )}
                      {level.percentage < 100 && (
                        <div
                          className="bg-gray-200 absolute top-0 left-0 right-0"
                          style={{ height: `${100 - level.percentage}%` }}
                        />
                      )}
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-2">{level.level}</div>
                    <div className="text-xs text-gray-500">{level.active} / {level.target}</div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded" />
                <span className="text-gray-600">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span className="text-gray-600">Compromised</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded" />
                <span className="text-gray-600">Gap to target</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 text-center">
              C1 needs 36 more items to reach target · 1 compromised · 19 pending
            </div>
          </CardContent>
        </Card>

        {/* Attention Required */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Attention Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{compromisedItems.length}</div>
                  <div className="text-sm text-gray-600">Compromised items</div>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-sm text-gray-600 cursor-help">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span>What does "compromised" mean?</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      <strong>Compromised items</strong> have been exposed too many times in live testing, 
                      which may affect their security and validity. High exposure allows test-takers 
                      to share answers, reducing the item's effectiveness.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
