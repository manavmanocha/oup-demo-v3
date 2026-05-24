import { Link, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertCircle } from 'lucide-react';
import { getItemsByLevel, bankCapacityData } from '../data/mockData';
import { CEFRLevel } from '../data/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function ItemBankCEFRLevel() {
  const { level } = useParams<{ level: CEFRLevel }>();

  const items = getItemsByLevel(level as CEFRLevel);
  const levelData = bankCapacityData.find(l => l.level === level);
  const levelTotal = Math.max(items.length, 1);
  const pipelineStates = ['Draft', 'In Screening', 'Screening Review', 'Screening Passed', 'In Difficulty Prediction', 'Difficulty Prediction Review'];
  const pendingCount = items.filter(item => pipelineStates.includes(item.workflowState || '')).length;

  const skillDistribution = [
    { skill: 'Reading', count: items.filter(i => i.skill === 'Reading').length },
    { skill: 'Writing', count: items.filter(i => i.skill === 'Writing').length },
    { skill: 'Listening', count: items.filter(i => i.skill === 'Listening').length },
    { skill: 'Speaking', count: items.filter(i => i.skill === 'Speaking').length },
  ].map((row) => ({
    ...row,
    percentage: Math.round((row.count / levelTotal) * 100),
  }));

  if (!level || !levelData) {
    return <div className="p-4 sm:p-6 md:p-8">Level not found</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/library" className="hover:underline">Library</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{level}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{level}</h1>
            <p className="text-gray-600">
              {levelData.active + levelData.compromised} of {levelData.target} items active · {levelData.gapToTarget} needed to reach target
            </p>
          </div>
          <Button>+ Ingest Items</Button>
        </div>

        {/* Capacity Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-gray-900">{levelData.percentage}%</div>
            </div>
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-gray-400 transition-all"
                style={{ width: `${(levelData.active / levelData.target) * 100}%` }}
              />
              {levelData.compromised > 0 && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-400 transition-all"
                  style={{ width: `${(levelData.compromised / levelData.target) * 100}%` }}
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  <span className="font-semibold">{levelData.active}</span> active
                </span>
                {levelData.compromised > 0 && (
                  <span className="text-red-600">
                    <span className="font-semibold">{levelData.compromised}</span> compromised
                  </span>
                )}
                <span className="text-gray-500">
                  <span className="font-semibold">{pendingCount}</span> pending in pipeline
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Skill Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {skillDistribution.map((skill) => (
              <div key={skill.skill} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-700">{skill.skill}</div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-600 flex items-center justify-end px-2"
                      style={{ width: `${Math.min(skill.percentage, 100)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{skill.percentage}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-semibold text-gray-900">{skill.count}</div>
              </div>
            ))}
          </CardContent>
        </Card>


        {/* Compromised Items */}
        {items.filter(item => item.status === 'Compromised').length > 0 && (
          <Card className="mb-8 border-red-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-600 uppercase">Compromised Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content Preview</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exposure Count</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.filter(item => item.status === 'Compromised').map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/item-bank/${level}/${item.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {item.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{item.skill}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700 max-w-md truncate">
                            {item.content}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-red-600 font-semibold">
                            {item.exposureCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/item-bank/${level}/${item.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* In Pipeline Section */}
        {items.filter(item => pipelineStates.includes(item.workflowState || '')).length > 0 && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-600 uppercase">In Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content Preview</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow State</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.filter(item => pipelineStates.includes(item.workflowState || '')).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/item-bank/${level}/${item.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {item.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{item.skill}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700 max-w-md truncate">
                            {item.content}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {item.workflowState}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/item-bank/${level}/${item.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

