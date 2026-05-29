import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { CheckCircle2, Sparkles, Search, ChevronRight } from 'lucide-react';
import { applyDifficultyPredictions, getAllItems, getMockDifficultyPredictionResult } from '../data/mockData';
import { Difficulty } from '../data/types';
import { isWorkflowState } from '../data/workflowState';

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

export function PredictDifficulty() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');
  const [progress, setProgress] = useState(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictionResults, setPredictionResults] = useState<Record<string, { b: number; confidence: number; difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Easy' | 'Very Hard'; discrimination: string }>>({});

  // Get all items from library - filter to items in Screening Passed state
  const allItems = getAllItems();
  const availableItems = useMemo(
    () => sortNewestFirst(allItems.filter((item) => isWorkflowState(item.workflowState, 'SCREENING_APPROVED'))),
    [allItems],
  );

  const filteredItems = useMemo(() => {
    return availableItems.filter(item =>
      item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableItems, searchQuery]);

  // Keep selected items resolvable after estimation changes state after estimation starts
  const selectedItems = allItems
    .filter(item => selectedItemIds.includes(item.id))
    .map(item => ({
      ...item,
      predictedDifficulty: predictionResults[item.id]?.b ?? 0,
      confidence: predictionResults[item.id]?.confidence ?? 0,
    }));

  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map(item => item.id));
    }
  };

  const handleContinue = () => {
    if (selectedItemIds.length > 0) {
      setStep('confirm');
    }
  };

  const completePredictionRun = (generatedResults: { id: string; b: number; confidence: number; difficulty: Difficulty; discrimination: string }[]) => {
    applyDifficultyPredictions(generatedResults);
    setPredictionResults(
      generatedResults.reduce<Record<string, { b: number; confidence: number; difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Easy' | 'Very Hard'; discrimination: string }>>((acc, result) => {
        acc[result.id] = {
          b: result.b,
          confidence: result.confidence,
          difficulty: result.difficulty,
          discrimination: result.discrimination,
        };
        return acc;
      }, {}),
    );
    setStep('success');
  };

  const handleStartPrediction = () => {
    setStep('processing');
    setProgress(0);

    const generatedResults: { id: string; b: number; confidence: number; difficulty: Difficulty; discrimination: string }[] =
      selectedItemIds.map((id) => getMockDifficultyPredictionResult(id));

    // Simulate estimation processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completePredictionRun(generatedResults);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const handleAddMore = () => {
    // Reset and go back to selection
    setStep('select');
    setSelectedItemIds([]);
    setSearchQuery('');
    setProgress(0);
    setPredictionResults({});
  };

  const handleFinish = () => {
    navigate('/workflows/pre-testing-pipeline/difficulty-prediction');
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
            <Link to="/workflows" className="hover:underline">Workflows</Link>
            <span className="text-gray-400">/</span>
            <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pre-Testing Pipeline</Link>
            <span className="text-gray-400">/</span>
            <Link to="/workflows/pre-testing-pipeline/difficulty-prediction" className="hover:underline">Difficulty Estimation</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">Select Items</span>
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Select Items for Difficulty Estimation
              </h1>
              <p className="text-gray-600">
                Choose items that have passed screening. The model will estimate difficulty and discrimination for each one.
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Link to="/workflows/pre-testing-pipeline/difficulty-prediction">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleContinue}
                disabled={selectedItemIds.length === 0}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Selection Summary */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">
                {selectedItemIds.length === 0
                  ? 'No items selected'
                  : `${selectedItemIds.length} item${selectedItemIds.length === 1 ? '' : 's'} selected`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
              >
                {selectedItemIds.length === filteredItems.length && filteredItems.length > 0
                  ? 'Deselect all'
                  : `Select all (${filteredItems.length})`}
              </Button>
            </div>

            {/* Count indicator */}
            <div className="text-sm text-gray-600">
              Showing {filteredItems.length} of {availableItems.length} screening-passed item{availableItems.length === 1 ? '' : 's'}
              {searchQuery && availableItems.length !== filteredItems.length ? ' (filtered)' : ''}
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <Checkbox
                        checked={
                          filteredItems.length > 0 &&
                          selectedItemIds.length === filteredItems.length
                        }
                        onCheckedChange={toggleAll}
                        aria-label="Select all items"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill / Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No items available for difficulty estimation
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedItemIds.includes(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">{item.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate" title={item.title}>{item.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {item.skill === item.itemType ? item.skill : `${item.skill} · ${item.itemType}`}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{item.level}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Confirm difficulty estimation
              </h1>
              <p className="text-gray-600">
                {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} will be sent to the estimation model — the run typically completes within a minute.
              </p>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill / Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">{item.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.skill === item.itemType ? item.skill : `${item.skill} · ${item.itemType}`}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{item.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button onClick={handleStartPrediction}>
                Run estimation on {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6 py-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Running estimation
              </h1>
              <p className="text-gray-600 mb-6">
                Estimating difficulty for {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}. This typically takes under a minute.
              </p>

              <div className="max-w-md mx-auto">
                <div className="h-3 w-full overflow-hidden rounded-full bg-blue-100 mb-2">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{progress}% complete</p>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (() => {
          const CONFIDENCE_THRESHOLD = 85;
          const readyCount = selectedItems.filter((item) => item.confidence >= CONFIDENCE_THRESHOLD).length;
          const reviewCount = selectedItems.length - readyCount;
          return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-base text-gray-900">
                  Estimation complete for {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}.
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{readyCount}</span> ready to publish ·{' '}
                  <span className="font-semibold text-gray-900">{reviewCount}</span> need{reviewCount === 1 ? 's' : ''} manual review.
                </p>
              </div>
            </div>

            {/* Results Summary */}
            <Card>
              <CardContent className="p-0">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Estimation results · {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Difficulty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Discrimination</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedItems.map((item) => {
                        const needsReview = item.confidence < CONFIDENCE_THRESHOLD;
                        return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-blue-600">{item.id}</div>
                            <div className="text-xs text-gray-600 truncate max-w-md" title={item.title}>{item.title}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{predictionResults[item.id]?.difficulty ?? 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{predictionResults[item.id]?.discrimination ?? 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${needsReview ? 'text-amber-700 font-medium' : 'text-gray-700'}`}>
                                {item.confidence}%
                              </span>
                              {needsReview && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                                  Needs review
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleAddMore}>
                Estimate more items
              </Button>
              <Button onClick={handleFinish}>
                Return to estimation dashboard
              </Button>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}

