import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { getAllItems } from "../data/mockData";

interface StartScreeningFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StartScreeningFlow({
  isOpen,
  onClose,
}: StartScreeningFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "select" | "confirm" | "success"
  >("select");
  const [selectedItemIds, setSelectedItemIds] = useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Get all items from library - filter to only Draft/In Review items
  const allItems = getAllItems();
  const availableItems = allItems;
  // const availableItems = allItems.filter(item =>
  //   item.workflowState === 'Draft' || item.workflowState === 'In Review'
  // );

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
    setStep("success");
  };

  const handleAddMore = () => {
    onClose();
    navigate("/workflows/pre-testing-pipeline/screening/start");
  };

  const handleFinish = () => {
    onClose();
    navigate("/workflows/pre-testing-pipeline/screening");
    // Reset for next time
    setStep("select");
    setSelectedItemIds([]);
    setSearchQuery("");
  };

  const handleCancel = () => {
    onClose();
    // Reset for next time
    setStep("select");
    setSelectedItemIds([]);
    setSearchQuery("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <DialogContent className="max-w-8xl max-h-[80vh]">
        {step === "select" && (
          <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Select Items for Screening
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Choose items from the library to add to the
              screening queue. Only items in Draft or In Review
              state are available.
            </DialogDescription>

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
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
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
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left w-12"></th>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
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
          <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Items Selected for Screening Queue
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedItems.length} items are selected. Please
              review before continuing.
            </DialogDescription>

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
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button onClick={handleStartScreening}>
                  Add to Queue
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-6 text-center py-8">
            <DialogTitle className="sr-only">
              Items Added to Screening Queue
            </DialogTitle>
            <DialogDescription className="sr-only">
              {selectedItems.length} items have been added
              successfully.
            </DialogDescription>

            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Items Added to Screening Queue
              </h2>
              <p className="text-gray-600">
                {selectedItems.length} items have been added
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
      </DialogContent>
    </Dialog>
  );
}