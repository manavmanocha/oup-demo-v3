import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  Card,
  CardContent,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import {
  CheckCircle2,
  Sparkles,
  Search,
  ChevronRight,
} from "lucide-react";
import { getAllItems, getIngestedItems, queueItemsForScreening } from "../data/mockData";
import { isWorkflowState } from '../data/workflowState';

const prioritizeIngestedFirst = <T extends { id: string }>(items: T[], ingestedIds: Set<string>): T[] => {
  const ingested: T[] = [];
  const nonIngested: T[] = [];

  items.forEach((item) => {
    if (ingestedIds.has(item.id)) {
      ingested.push(item);
      return;
    }

    nonIngested.push(item);
  });

  return [...ingested, ...nonIngested];
};

export function ScreenItems() {
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "select" | "confirm" | "processing" | "success"
  >("select");
  const [selectedItemIds, setSelectedItemIds] = useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [queuedCount, setQueuedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const stepLabel: Record<typeof step, string> = {
    select: 'Select Items',
    confirm: 'Confirm Queue',
    processing: 'Running',
    success: 'Queue confirmed',
  };

  // Get all items from library - filter to draft or screening-review items
  const allItems = getAllItems();
  const ingestedIdSet = useMemo(
    () => new Set(getIngestedItems().map((item) => item.id)),
    [allItems],
  );
  const availableItems = useMemo(
    () => prioritizeIngestedFirst(
      allItems.filter((item) => isWorkflowState(item.workflowState, 'NOT_STARTED')),
      ingestedIdSet,
    ),
    [allItems, ingestedIdSet],
  );

  const filteredItems = useMemo(() => {
    return availableItems.filter(
      (item) =>
        item.id
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.title ?? item.content ?? '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.topic
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item?.content
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }, [availableItems, searchQuery]);

  const selectedItems = availableItems.filter((item) =>
    selectedItemIds.includes(item.id),
  );

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((item) => item.id));
    }
  };

  const handleContinue = () => {
    if (selectedItemIds.length > 0) {
      setStep("confirm");
    }
  };

  const handleStartScreening = () => {
    setQueuedCount(selectedItemIds.length);
    setStep("processing");
    setProgress(0);
    const itemIds = [...selectedItemIds];

    // Simulate screening batch processing before confirmation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          queueItemsForScreening(itemIds);
          setCompletedAt(new Date());
          setStep("success");
          return 100;
        }

        return prev + 20;
      });
    }, 350);
  };

  const handleAddMore = () => {
    // Reset and go back to selection
    setStep("select");
    setSelectedItemIds([]);
    setSearchQuery("");
    setProgress(0);
    setCompletedAt(null);
  };

  const handleFinish = () => {
    navigate("/workflows/pre-testing-pipeline/screening", {
      state: { justProcessedIds: selectedItemIds },
    });
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
          <Link to="/workflows/pre-testing-pipeline/screening" className="hover:underline">Screening</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{stepLabel[step]}</span>
        </div>

        {step === "select" && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Select Items for Screening
              </h1>
              <p className="text-gray-600">
                Select draft items from the library to queue for AI screening. This list includes only draft items that have not entered the pipeline; items already in screening are tracked on the screening dashboard.
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, title, or topic"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Link to="/workflows/pre-testing-pipeline/screening">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleContinue}
                disabled={selectedItemIds.length === 0}
                title={selectedItemIds.length === 0 ? 'Select at least one item to continue' : 'Continue to confirmation'}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Selection Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 rounded-lg">
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
              Showing {filteredItems.length} of {availableItems.length} draft item{availableItems.length === 1 ? '' : 's'}
              {searchQuery && availableItems.length !== filteredItems.length ? ' (filtered)' : ''}
            </div>

            {/* Items Table */}
            <Card>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[480px]">
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Item ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          CEFR
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                          Skill
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No items available for screening
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedItemIds.includes(
                                  item.id,
                                )}
                                onCheckedChange={() =>
                                  toggleItem(item.id)
                                }
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-blue-600">
                              {item.id}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate" title={item.title ?? item.content ?? 'Untitled item'}>
                              {item.title ?? item.content ?? 'Untitled item'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">
                              {item.itemType}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">
                                {item.level}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">
                              {item.skill}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>


          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Confirm screening queue
              </h1>
              <p className="text-gray-600">
                {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} will be picked up by the next screening run, typically within a few minutes.
              </p>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CEFR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Skill
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.title ?? item.content ?? 'Untitled item'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.itemType}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {item.level}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.skill}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
              >
                Back
              </Button>
              <Button onClick={handleStartScreening}>
                Send {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} to screening
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-6 py-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {progress >= 100 ? 'Finalising screening run' : 'Running screening checks'}
              </h1>
              <p className="text-gray-600 mb-6">
                Screening {queuedCount} item{queuedCount === 1 ? '' : 's'} across CEFR fit, distractor strength, clarity, fairness, and similarity.
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

        {step === "success" && (
          <div className="space-y-6 py-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Items queued</h1>
              <p className="text-gray-600">Your selected items are now in the screening queue.</p>
            </div>

            <div className="flex justify-center py-4">
              <Card className="w-full max-w-md">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                  </div>

                  <p className="text-base text-gray-900">
                    {queuedCount} item{queuedCount === 1 ? '' : 's'} added to the screening queue. The next run typically completes within a few minutes. Results will appear in the screening dashboard.
                  </p>

                  {completedAt && (
                    <p className="text-xs text-gray-500">
                      Completed at {completedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button variant="outline" onClick={handleAddMore}>
                      Queue more items
                    </Button>
                    <Button onClick={handleFinish}>
                      Return to screening dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}