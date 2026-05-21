import { useEffect, useMemo, useState } from "react";
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
  LayoutGrid,
  List,
  X,
  RotateCcw,
} from "lucide-react";
import { getAllItems } from "../data/mockData";
import { QuestionCard } from "./QuestionCard";

const ITEMS_PER_PAGE = 50;
const LIBRARY_FILTER_STATE_KEY = "library-filter-state-v1";

type LibraryFilterState = {
  searchQuery: string;
  selectedStatuses: string[];
  selectedItemTypes: string[];
  selectedLevels: string[];
  selectedSkills: string[];
  currentPage: number;
  viewMode: "cards" | "table";
  expandedSections: string[];
};

const getInitialLibraryState = (): LibraryFilterState => {
  const fallback: LibraryFilterState = {
    searchQuery: "",
    selectedStatuses: [],
    selectedItemTypes: [],
    selectedLevels: [],
    selectedSkills: [],
    currentPage: 1,
    viewMode: "table",
    expandedSections: ["status"],
  };

  try {
    const raw = localStorage.getItem(LIBRARY_FILTER_STATE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<LibraryFilterState>;
    return {
      ...fallback,
      ...parsed,
      expandedSections:
        Array.isArray(parsed.expandedSections) && parsed.expandedSections.length > 0
          ? parsed.expandedSections
          : fallback.expandedSections,
      viewMode: parsed.viewMode === "cards" ? "cards" : "table",
      currentPage:
        typeof parsed.currentPage === "number" && parsed.currentPage > 0
          ? parsed.currentPage
          : 1,
    };
  } catch {
    return fallback;
  }
};

export function Library() {
  const initialState = getInitialLibraryState();

  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);
  const [selectedStatuses, setSelectedStatuses] = useState<
    string[]
  >(initialState.selectedStatuses);
  const [selectedItemTypes, setSelectedItemTypes] = useState<
    string[]
  >(initialState.selectedItemTypes);
  const [selectedLevels, setSelectedLevels] = useState<
    string[]
  >(initialState.selectedLevels);
  const [selectedSkills, setSelectedSkills] = useState<
    string[]
  >(initialState.selectedSkills);
  const [currentPage, setCurrentPage] = useState(initialState.currentPage);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(initialState.viewMode);

  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState<
    Set<string>
  >(new Set(initialState.expandedSections));

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
          .includes(searchQuery.toLowerCase()) ||
        (item.subSkill?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.contentDomain?.toLowerCase().includes(searchQuery.toLowerCase()));
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
      const matchesStatus =
        selectedStatuses.length === 0
          ? true
          : selectedStatuses.includes(item.status);

      return (
        matchesSearch &&
        matchesLevel &&
        matchesSkill &&
        matchesItemType &&
        matchesStatus
      );
    });
  }, [
    allItems,
    searchQuery,
    selectedLevels,
    selectedSkills,
    selectedItemTypes,
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
    Draft: allItems.filter((item) => item.status === "Draft").length,
    Published: allItems.filter((item) => item.status === "Active").length,
    Retired: allItems.filter((item) => item.status === "Retired").length,
    Compromised: allItems.filter((item) => item.status === "Compromised").length,
  };

  const allItemTypes = Array.from(new Set(allItems.map(item => item.itemType)));
  const itemTypeCounts: Record<string, number> = {};
  allItemTypes.forEach(type => {
    itemTypeCounts[type] = allItems.filter(item => item.itemType === type).length;
  });

  const levelCounts = {
    A1: allItems.filter((item) => item.level === "A1").length,
    A2: allItems.filter((item) => item.level === "A2").length,
    B1: allItems.filter((item) => item.level === "B1").length,
    B2: allItems.filter((item) => item.level === "B2").length,
    C1: allItems.filter((item) => item.level === "C1").length,
    C2: allItems.filter((item) => item.level === "C2").length,
  };

  const skillCounts = {
    Reading: allItems.filter((item) => item.skill === "Reading").length,
    Writing: allItems.filter((item) => item.skill === "Writing").length,
    Listening: allItems.filter((item) => item.skill === "Listening").length,
    Speaking: allItems.filter((item) => item.skill === "Speaking").length,
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
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
    setCurrentPage(1);
  };

  const toggleItemType = (type: string) => {
    setSelectedItemTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type],
    );
    setCurrentPage(1);
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level],
    );
    setCurrentPage(1);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill],
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedItemTypes([]);
    setSelectedLevels([]);
    setSelectedSkills([]);
    setSearchQuery('');
    setCurrentPage(1);
  };

  useEffect(() => {
    const stateToPersist: LibraryFilterState = {
      searchQuery,
      selectedStatuses,
      selectedItemTypes,
      selectedLevels,
      selectedSkills,
      currentPage,
      viewMode,
      expandedSections: Array.from(expandedSections),
    };

    localStorage.setItem(
      LIBRARY_FILTER_STATE_KEY,
      JSON.stringify(stateToPersist),
    );
  }, [
    searchQuery,
    selectedStatuses,
    selectedItemTypes,
    selectedLevels,
    selectedSkills,
    currentPage,
    viewMode,
    expandedSections,
  ]);

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
                  Ingest New Items
                </h2>
                <p className="text-sm text-gray-600">
                  Select this option to ingest new items into the global library. Once ingested these items
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
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Total Count */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Total ({filteredItems.length})
              </h3>
              <p className="text-sm text-gray-600">
                Selecting an existing item. Use the filters below to narrow down items in the list.
              </p>
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
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
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
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
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
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
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
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
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
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
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
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
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
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
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
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
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
            </div>
          </div>

          {/* Right Content - Items */}
          <div className="flex-1">
            {/* Active Filters Bar - Top */}
            {(selectedStatuses.length > 0 ||
              selectedLevels.length > 0 ||
              selectedSkills.length > 0 ||
              selectedItemTypes.length > 0) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">Filters:</span>
                    {selectedStatuses.map(status => (
                      <Badge
                        key={status}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        {status}
                        <button
                          onClick={() => toggleStatus(status)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedLevels.map(level => (
                      <Badge
                        key={level}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        CEFR level &gt; {level}
                        <button
                          onClick={() => toggleLevel(level)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedSkills.map(skill => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        {skill}
                        <button
                          onClick={() => toggleSkill(skill)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedItemTypes.map(type => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        {type}
                        <button
                          onClick={() => toggleItemType(type)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {/* Items Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredItems.length}</span> of {allItems.length} questions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={viewMode === 'cards' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Cards
                </Button>
              </div>
            </div>

            {/* Items Display */}
            {viewMode === 'cards' ? (
              /* Card View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                {paginatedItems.length === 0 ? (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="pt-12 pb-12">
                        <div className="text-center text-gray-500">
                          No items found matching your filters.
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  paginatedItems.map((item) => (
                    <div key={item.id} className="min-h-[320px]">
                      <QuestionCard item={item} />
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Table View */
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
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              No items found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedItems.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <Link
                                  to={`/item-bank/${item.level}/${item.id}`}
                                  className="text-sm font-medium text-blue-600 hover:underline"
                                >
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
                                <div className="text-sm text-gray-700 max-w-md truncate">
                                  {item.title}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={
                                    item.status === "Active"
                                      ? "secondary"
                                      : item.status === "Compromised"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Link
                                  to={`/item-bank/${item.level}/${item.id}`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                  >
                                    View
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
}