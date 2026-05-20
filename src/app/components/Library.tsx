import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { getAllItems } from "../data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const ITEMS_PER_PAGE = 50;

export function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<
    string[]
  >([]);
  const [selectedItemTypes, setSelectedItemTypes] = useState<
    string[]
  >([]);
  const [selectedLevels, setSelectedLevels] = useState<
    string[]
  >([]);
  const [selectedSkills, setSelectedSkills] = useState<
    string[]
  >([]);
  const [selectedWorkflowStates, setSelectedWorkflowStates] =
    useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState<
    Set<string>
  >(new Set(["status"]));

  const allItems = getAllItems();

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch =
        item.id
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.content
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesLevel =
        selectedLevels.length === 0
          ? true
          : selectedLevels.includes(item.level);
      const matchesSkill =
        selectedSkills.length === 0
          ? true
          : selectedSkills.includes(item.skill);
      const matchesItemType =
        selectedItemTypes.length === 0
          ? true
          : selectedItemTypes.includes(item.itemType);
      const matchesWorkflowState =
        selectedWorkflowStates.length === 0
          ? true
          : item.workflowState &&
            selectedWorkflowStates.includes(item.workflowState);
      const matchesStatus =
        selectedStatuses.length === 0
          ? true
          : selectedStatuses.includes(item.status);

      return (
        matchesSearch &&
        matchesLevel &&
        matchesSkill &&
        matchesItemType &&
        matchesWorkflowState &&
        matchesStatus
      );
    });
  }, [
    allItems,
    searchQuery,
    selectedLevels,
    selectedSkills,
    selectedItemTypes,
    selectedWorkflowStates,
    selectedStatuses,
  ]);

  const totalPages = Math.ceil(
    filteredItems.length / ITEMS_PER_PAGE,
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(
    startIndex,
    endIndex,
  );

  // Calculate counts for filters
  const statusCounts = {
    Active: allItems.filter((item) => item.status === "Active")
      .length,
    Retired: allItems.filter(
      (item) => item.status === "Retired",
    ).length,
    Compromised: allItems.filter(
      (item) => item.status === "Compromised",
    ).length,
  };

  const itemTypeCounts = {
    "Multiple Choice": allItems.filter(
      (item) => item.itemType === "Multiple Choice",
    ).length,
    Essay: allItems.filter((item) => item.itemType === "Essay")
      .length,
    Speaking: allItems.filter(
      (item) => item.itemType === "Speaking",
    ).length,
    "Fill in the Blanks": allItems.filter(
      (item) => item.itemType === "Fill in the Blanks",
    ).length,
    "Match the Following": allItems.filter(
      (item) => item.itemType === "Match the Following",
    ).length,
  };

  const levelCounts = {
    A1: allItems.filter((item) => item.level === "A1").length,
    A2: allItems.filter((item) => item.level === "A2").length,
    B1: allItems.filter((item) => item.level === "B1").length,
    B2: allItems.filter((item) => item.level === "B2").length,
    C1: allItems.filter((item) => item.level === "C1").length,
    C2: allItems.filter((item) => item.level === "C2").length,
  };

  const skillCounts = {
    Reading: allItems.filter((item) => item.skill === "Reading")
      .length,
    Writing: allItems.filter((item) => item.skill === "Writing")
      .length,
    Listening: allItems.filter(
      (item) => item.skill === "Listening",
    ).length,
    Speaking: allItems.filter(
      (item) => item.skill === "Speaking",
    ).length,
  };

  const workflowStateCounts = {
    Draft: allItems.filter(
      (item) => item.workflowState === "Draft",
    ).length,
    "In Review": allItems.filter(
      (item) => item.workflowState === "In Review",
    ).length,
    Approved: allItems.filter(
      (item) => item.workflowState === "Approved",
    ).length,
    Published: allItems.filter(
      (item) => item.workflowState === "Live",
    ).length,
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? [] : [status],
    );
    setCurrentPage(1);
  };

  const toggleItemType = (type: string) => {
    setSelectedItemTypes((prev) =>
      prev.includes(type) ? [] : [type],
    );
    setCurrentPage(1);
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? [] : [level],
    );
    setCurrentPage(1);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? [] : [skill],
    );
    setCurrentPage(1);
  };

  const toggleWorkflowState = (state: string) => {
    setSelectedWorkflowStates((prev) =>
      prev.includes(state) ? [] : [state],
    );
    setCurrentPage(1);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Library
          </h1>
          <p className="text-gray-600">
            Centralized inventory for all assessment items
            across CEFR levels and skills.
          </p>
        </div>

        {/* Ingest New Assets Card */}
        <Card className="mb-8 bg-blue-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Ingest New Assets
                </h2>
                <p className="text-sm text-gray-600">
                  Select this option to ingest new assets into
                  the global library. Once ingested these assets
                  will be available for linking across all the
                  products.
                </p>
              </div>
              <Link to="/library/ingest">
                <Button className="w-full md:w-auto md:ml-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Click here to ingest
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Main Layout: Sidebar + Content */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
          {/* Left Sidebar - Filters */}
          <div className="w-full space-y-6 xl:w-64 xl:flex-shrink-0">
            {/* Total Count */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Total ({allItems.length})
              </h3>
              <p className="text-sm text-gray-600">
                Selecting an existing asset. Use the filters
                below to narrow down items in the list.
              </p>
            </div>

            {/* Time Filter */}
            <div>
              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Time: All</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Keyword..."
                value={searchQuery}
                onChange={(e) =>
                  handleSearchChange(e.target.value)
                }
                className="pl-9"
              />
            </div>

            {/* Collapsible Filters */}
            <div className="space-y-4">
              {/* Status Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("status")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <span className="font-semibold text-gray-900">
                    Status
                  </span>
                  {expandedSections.has("status") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("status") && (
                  <div className="space-y-1">
                    {Object.entries(statusCounts).map(
                      ([status, count]) => (
                        <button
                          key={status}
                          onClick={() => toggleStatus(status)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                            selectedStatuses.includes(status)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{status}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Type Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("type")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <span className="font-semibold text-gray-900">
                    Type
                  </span>
                  {expandedSections.has("type") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("type") && (
                  <div className="space-y-1">
                    {Object.entries(itemTypeCounts).map(
                      ([type, count]) => (
                        <button
                          key={type}
                          onClick={() => toggleItemType(type)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                            selectedItemTypes.includes(type)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{type}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* CEFR Level Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("level")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <span className="font-semibold text-gray-900">
                    CEFR Level
                  </span>
                  {expandedSections.has("level") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("level") && (
                  <div className="space-y-1">
                    {Object.entries(levelCounts).map(
                      ([level, count]) => (
                        <button
                          key={level}
                          onClick={() => toggleLevel(level)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                            selectedLevels.includes(level)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{level}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Skill Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("skill")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <span className="font-semibold text-gray-900">
                    Skill
                  </span>
                  {expandedSections.has("skill") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("skill") && (
                  <div className="space-y-1">
                    {Object.entries(skillCounts).map(
                      ([skill, count]) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                            selectedSkills.includes(skill)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{skill}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Workflow State Filter */}
              <div className="pb-4">
                <button
                  onClick={() => toggleSection("workflow")}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <span className="font-semibold text-gray-900">
                    Workflow State
                  </span>
                  {expandedSections.has("workflow") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("workflow") && (
                  <div className="space-y-1">
                    {Object.entries(workflowStateCounts).map(
                      ([state, count]) => (
                        <button
                          key={state}
                          onClick={() =>
                            toggleWorkflowState(state)
                          }
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                            selectedWorkflowStates.includes(
                              state,
                            )
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{state}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Items */}
          <div className="min-w-0">
            {/* Items Table */}
            <Card>
              <CardContent className="p-0">
                {/* Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap w-40">
                          Item ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Level
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Skill
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Workflow State
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No items found matching your
                            filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 whitespace-nowrap w-40">
                              <Link
                                to={`/item-bank/${item.level}/${item.id}`}
                                className="text-sm font-medium text-blue-600 hover:underline">
                                {item.id}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className="font-medium"
                              >
                                {item.level}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">
                                {item.skill}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-700 w-60 truncate">
                                {item.title}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  item.status === "Active"
                                    ? "secondary"
                                    : item.status ===
                                        "Compromised"
                                      ? "destructive"
                                      : "outline"
                                }
                              >
                                {item.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {item.workflowState && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {item.workflowState}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, filteredItems.length)}{" "}
                      of {filteredItems.length} items
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.max(1, p - 1),
                          )
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (
                              currentPage >=
                              totalPages - 2
                            ) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  setCurrentPage(pageNum)
                                }
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            );
                          },
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(totalPages, p + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {totalPages <= 1 && (
                  <div className="mt-4 text-sm text-gray-600 text-center">
                    Showing {filteredItems.length} of{" "}
                    {allItems.length} items
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}