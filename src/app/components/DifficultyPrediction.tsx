import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Info } from 'lucide-react';
import { acceptPredictedItems, getAllItems } from '../data/mockData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function DifficultyPrediction() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const allItems = useMemo(() => getAllItems(), [refreshVersion]);
  const waitingForPrediction = allItems.filter((item) => item.workflowState === 'Screening Passed');

  const calibratedItems = allItems
    .filter((item) => item.workflowState === 'Difficulty Prediction Review')
    .map((item) => ({
      id: item.id,
      item: item.title,
      level: item.level,
      skill: item.skill,
      itemType: item.itemType,
      content: item.content,
      confidence: item.confidence ?? 0,
      difficulty: item.difficulty ?? 'Medium',
      discrimination: item.discrimination ?? 'Moderate',
    }));

  const needsReview = calibratedItems.filter((item) => item.confidence < 85);
  const readyToAccept = calibratedItems.filter((item) => item.confidence >= 85);

  const handleAcceptItem = (itemId: string) => {
    acceptPredictedItems([itemId]);
    setRefreshVersion((prev) => prev + 1);
  };

  const handleAcceptAll = () => {
    const itemIds = readyToAccept.map((item) => item.id);
    if (!itemIds.length) {
      return;
    }

    acceptPredictedItems(itemIds);
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
          <span className="text-gray-900">Difficulty Prediction</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase mb-1">Step 2</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Difficulty Prediction</h1>
            <p className="text-gray-600">
              Our model estimates how hard each question is, and how well it separates stronger from weaker students.
            </p>
          </div>
          <Link to="/workflows/pre-testing-pipeline/difficulty-prediction/start">
            <Button>+ Start Prediction</Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Need Your Review</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{needsReview.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Ready to Accept</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{readyToAccept.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Waiting for Prediction</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-900">{waitingForPrediction.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Model Accuracy */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-green-700">94%</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  of predictions match the actual difficulty measured in live testing
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        How sure the model is about its prediction (higher is better)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                How sure the model is about its prediction (higher is better)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Difficulty</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        How hard the question is for students at the target level
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                How hard the question is for students at the target level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Discrimination</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        How well the question separates stronger from weaker students (better discrimination = better)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                How well the question separates stronger from weaker students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Needs Your Review */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Needs Your Review · {needsReview.length} items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              The model isn't sure about these — please check the predictions before accepting.
            </p>

            <div className="space-y-4">
              {needsReview.map((item) => (
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

                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Confidence</div>
                      <div className="font-semibold text-gray-900">{item.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Difficulty</div>
                      <div className="font-semibold text-gray-900">{item.difficulty}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Discrimination</div>
                      <div className="font-semibold text-gray-900">{item.discrimination}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleAcceptItem(item.id)}>Accept</Button>
                    <Button size="sm" variant="outline">Reject</Button>
                    <Button size="sm" variant="outline">Override</Button>
                  </div>
                </div>
              ))}

              {needsReview.length === 0 && (
                <div className="text-sm text-gray-600 border rounded-lg p-6 bg-gray-50">
                  No low-confidence predictions are pending manual review.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ready to Accept */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Ready to Accept · {readyToAccept.length} items
            </CardTitle>
            <Button size="sm" onClick={handleAcceptAll} disabled={readyToAccept.length === 0}>Accept All</Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              The model is highly confident about these predictions. You can accept them all at once.
            </p>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discrimination</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {readyToAccept.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/item-bank/${item.level}/${item.id}`}
                          state={{ fromWorkflow: true }}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {item.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">{item.item}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.confidence}%</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.difficulty}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.discrimination}</td>
                    </tr>
                  ))}
                  {readyToAccept.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No high-confidence predictions available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

