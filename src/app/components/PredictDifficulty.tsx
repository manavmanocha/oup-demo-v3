import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { CheckCircle2, Sparkles, Search, ChevronRight } from 'lucide-react';
import { Progress } from './ui/progress';
import { getAllItems } from '../data/mockData';

export function PredictDifficulty() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');
  const [progress, setProgress] = useState(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Get all items from library - filter to items that passed screening
  const allItems = getAllItems();
  const availableItems = allItems.filter(item =>
    item.screening?.cefrFit === 'Pass' ||
    item.screening?.similarity === 'Pass' ||
    item.workflowState === 'Approved'
  );

  const filteredItems = useMemo(() => {
    return availableItems.filter(item =>
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableItems, searchQuery]);

  // Generate mock prediction data for selected items
  const selectedItems = availableItems
    .filter(item => selectedItemIds.includes(item.id))
    .map(item => ({
      ...item,
      predictedDifficulty: Math.random() * 2,
      confidence: Math.floor(Math.random() * 30) + 70,
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

  const handleStartPrediction = () => {
    setStep('processing');
    setProgress(0);

    // Simulate prediction processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('success'), 500);
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
  };

  const handleFinish = () => {
    navigate('/workflows/pre-testing-pipeline/difficulty-prediction');
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pipeline</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline/difficulty-prediction" className="hover:underline">Difficulty Prediction</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Predict Difficulty</span>
        </div>

        {step === 'select' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Select Items for Difficulty Prediction
                </h1>
                <p className="text-gray-600">
                  Choose items that have passed screening to run ML-based difficulty prediction.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selection Summary */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">
                {selectedItemIds.length} item(s) selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
              >
                {selectedItemIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Items Table */}
            <Card>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No items available for difficulty prediction
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
                            <td className="px-4 py-3 text-sm font-medium text-blue-600">{item.id}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">{item.title}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{item.itemType}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{item.level}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{item.skill}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link to="/workflows/pre-testing-pipeline/difficulty-prediction">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleContinue}
                disabled={selectedItemIds.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Run Difficulty Prediction
                </h1>
                <p className="text-gray-600">
                  {selectedItems.length} items selected for ML-based difficulty prediction.
                </p>
              </div>
            </div>

            {/* Items Table */}
            <Card>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">{item.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.itemType}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{item.level}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-900">
                    <p className="font-medium mb-1">AI Model: IRT-LSTM-3.1</p>
                    <p className="text-purple-700">
                      This model predicts IRT difficulty parameters and CEFR alignment with an average accuracy of 82%.
                      Prediction typically takes 10-15 seconds per item.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Would you like to run difficulty prediction on these items?
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <div className="flex gap-3">
                <Link to="/workflows/pre-testing-pipeline/difficulty-prediction">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button onClick={handleStartPrediction} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Prediction
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6 py-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Running Predictions...
              </h1>
              <p className="text-gray-600 mb-6">
                AI is analyzing {selectedItems.length} items. This may take a moment.
              </p>

              <div className="max-w-md mx-auto">
                <Progress value={progress} className="h-3 mb-2" />
                <p className="text-sm text-gray-600">{progress}% complete</p>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 py-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Predictions Complete
              </h1>
              <p className="text-gray-600 mb-6">
                {selectedItems.length} items have been analyzed successfully.
              </p>
            </div>

            {/* Results Summary */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Prediction Results</h3>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.id}</p>
                        <p className="text-xs text-gray-600">{item.title}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Difficulty (b)</p>
                          <p className="text-sm font-semibold text-gray-900">{item.predictedDifficulty.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Confidence</p>
                          <p className="text-sm font-semibold text-purple-600">{item.confidence}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-gray-700 mb-4">
                Would you like to predict more items?
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleFinish}>
                No, Finish
              </Button>
              <Button onClick={handleAddMore} className="bg-purple-600 hover:bg-purple-700">
                Predict More Items
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
