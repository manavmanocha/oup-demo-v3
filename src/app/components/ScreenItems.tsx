import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import {
  CheckCircle2,
  Search,
  ChevronRight,
} from "lucide-react";
import { getAllItems, queueItemsForScreening } from "../data/mockData";

export function ScreenItems() {
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "select" | "confirm" | "success"
  >("select");
  const [selectedItemIds, setSelectedItemIds] = useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [queuedCount, setQueuedCount] = useState(0);

  // Get all items from library - filter to draft or screening-review items
  const allItems = getAllItems();
  const availableItems = allItems.filter(
    (item) => item.workflowState === 'Draft',
  );

  const filteredItems = useMemo(() => {
    return availableItems.filter(
      (item) =>
        item.id
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.content
          .toLowerCase()
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
    queueItemsForScreening(selectedItemIds);
    setStep("success");
  };

  const handleAddMore = () => {
    // Reset and go back to selection
    setStep("select");
    setSelectedItemIds([]);
    setSearchQuery("");
  };

  const handleFinish = () => {
    navigate("/workflows/pre-testing-pipeline/screening");
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
          <Link to="/workflows/pre-testing-pipeline/screening" className="hover:underline">Screening</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Screen Items</span>
        </div>

        {step === "select" && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Select Items for Screening
              </h1>
              <p className="text-gray-600">
                Choose items from the library to add to the
                screening queue. Only items in Draft or In
                Screening Review state are available.
              </p>
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
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">
                {selectedItemIds.length} item(s) selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
              >
                {selectedItemIds.length === filteredItems.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
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
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                              {item.title}
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link to="/workflows/pre-testing-pipeline/screening">
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
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Items Selected for Screening Queue
              </h1>
              <p className="text-gray-600">
                {selectedItems.length} items are selected.
                Please review before continuing.
              </p>
            </div>

            {/* Items Table */}
            <Card>
              <CardContent className="p-0">
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
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            {item.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.itemType}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">
                              {item.level}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.skill}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="pt-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Would you like to add these items to the
                screening queue?
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
              >
                Back
              </Button>
              <div className="flex gap-3">
                <Link to="/workflows/pre-testing-pipeline/screening">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button onClick={handleStartScreening}>
                  Add to Queue
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-6 text-center py-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Items Added to Screening Queue
              </h1>
              <p className="text-gray-600">
                {queuedCount} items have been added
                successfully.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-700 mb-4">
                Would you like to add more items to the
                screening queue?
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleFinish}>
                No
              </Button>
              <Button onClick={handleAddMore}>
                Add More Items
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}