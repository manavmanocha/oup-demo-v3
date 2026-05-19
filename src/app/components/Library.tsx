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
  const [filter, setFilter] = useState<"all" | "active">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] =
    useState<string>("all");
  const [selectedSkill, setSelectedSkill] =
    useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const allItems = getAllItems();

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesFilter =
        filter === "all" ? true : item.status === "Active";
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
        selectedLevel === "all"
          ? true
          : item.level === selectedLevel;
      const matchesSkill =
        selectedSkill === "all"
          ? true
          : item.skill === selectedSkill;

      return (
        matchesFilter &&
        matchesSearch &&
        matchesLevel &&
        matchesSkill
      );
    });
  }, [
    allItems,
    filter,
    searchQuery,
    selectedLevel,
    selectedSkill,
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

  const activeItemsCount = allItems.filter(
    (item) => item.status === "Active",
  ).length;

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter: "all" | "active") => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    setCurrentPage(1);
  };

  const handleSkillChange = (value: string) => {
    setSelectedSkill(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-8">
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
            <div className="flex items-center justify-between">
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
                <Button className="ml-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Click here to ingest
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Item Inventory
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={
                    filter === "active" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleFilterChange("active")}
                >
                  Active Items
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-white text-gray-900"
                  >
                    {activeItemsCount}
                  </Badge>
                </Button>
                <Button
                  variant={
                    filter === "all" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleFilterChange("all")}
                >
                  All Items
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-white text-gray-900"
                  >
                    {allItems.length}
                  </Badge>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, title, or content..."
                  value={searchQuery}
                  onChange={(e) =>
                    handleSearchChange(e.target.value)
                  }
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedLevel}
                onValueChange={handleLevelChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="CEFR Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Levels
                  </SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A2">A2</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedSkill}
                onValueChange={handleSkillChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Skills
                  </SelectItem>
                  <SelectItem value="Reading">
                    Reading
                  </SelectItem>
                  <SelectItem value="Writing">
                    Writing
                  </SelectItem>
                  <SelectItem value="Listening">
                    Listening
                  </SelectItem>
                  <SelectItem value="Speaking">
                    Speaking
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Workflow State
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
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
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/item-bank/${item.level}/${item.id}`}
                          >
                            <Button variant="ghost" size="sm">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredItems.length)} of{" "}
                  {filteredItems.length} items
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
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
  );
}