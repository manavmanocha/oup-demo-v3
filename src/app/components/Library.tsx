import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Card,
  CardContent,
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
  LayoutGrid,
  List,
  X,
  RotateCcw,
} from "lucide-react";
import { getAllItems, getIngestedItems } from "../data/mockData";
import { getTaxonomyById, type TaxonomyNode } from "../data/taxonomy";
import { QuestionCard } from "./QuestionCard";

const ITEMS_PER_PAGE = 50;
const LIBRARY_FILTER_STATE_KEY = "library-filter-state-v1";

const toNormalizedKey = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

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

type LibraryFilterState = {
  searchQuery: string;
  selectedStatuses: string[];
  selectedItemTypes: string[];
  selectedLevels: string[];
  selectedSkills: string[];
  selectedCognitiveLevels: string[];
  selectedContentDomains: string[];
  selectedLanguageVarieties: string[];
  selectedTopics: string[];
  selectedGrammarFocuses: string[];
  currentPage: number;
  viewMode: "cards" | "table";
  expandedSections: string[];
};

const getInitialLibraryState = (): LibraryFilterState => {
  const pickOne = (values: unknown): string[] => {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }

    const first = values[0];
    return typeof first === "string" ? [first] : [];
  };

  const fallback: LibraryFilterState = {
    searchQuery: "",
    selectedStatuses: [],
    selectedItemTypes: [],
    selectedLevels: [],
    selectedSkills: [],
    selectedCognitiveLevels: [],
    selectedContentDomains: [],
    selectedLanguageVarieties: [],
    selectedTopics: [],
    selectedGrammarFocuses: [],
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
      selectedStatuses: pickOne(parsed.selectedStatuses),
      selectedItemTypes: pickOne(parsed.selectedItemTypes),
      selectedLevels: pickOne(parsed.selectedLevels),
      selectedSkills: pickOne(parsed.selectedSkills),
      selectedCognitiveLevels: pickOne(parsed.selectedCognitiveLevels),
      selectedContentDomains: pickOne(parsed.selectedContentDomains),
      selectedLanguageVarieties: pickOne(parsed.selectedLanguageVarieties),
      selectedTopics: pickOne(parsed.selectedTopics),
      selectedGrammarFocuses: pickOne(parsed.selectedGrammarFocuses),
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
  const navigate = useNavigate();
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
  const [selectedCognitiveLevels, setSelectedCognitiveLevels] = useState<
    string[]
  >(initialState.selectedCognitiveLevels);
  const [selectedContentDomains, setSelectedContentDomains] = useState<
    string[]
  >(initialState.selectedContentDomains);
  const [selectedLanguageVarieties, setSelectedLanguageVarieties] = useState<
    string[]
  >(initialState.selectedLanguageVarieties);
  const [selectedTopics, setSelectedTopics] = useState<
    string[]
  >(initialState.selectedTopics);
  const [selectedGrammarFocuses, setSelectedGrammarFocuses] = useState<
    string[]
  >(initialState.selectedGrammarFocuses);
  const [currentPage, setCurrentPage] = useState(initialState.currentPage);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(initialState.viewMode);

  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState<
    Set<string>
  >(new Set(initialState.expandedSections));

  const allItems = getAllItems();

  const flattenTaxonomyLabels = (nodes: TaxonomyNode[]): string[] => {
    const labels: string[] = [];

    const visit = (currentNodes: TaxonomyNode[]) => {
      currentNodes.forEach((node) => {
        labels.push(node.label);
        if (node.children && node.children.length > 0) {
          visit(node.children);
        }
      });
    };

    visit(nodes);
    return labels;
  };

  const flattenTaxonomyNodes = (nodes: TaxonomyNode[]): TaxonomyNode[] => {
    const flattened: TaxonomyNode[] = [];

    const visit = (currentNodes: TaxonomyNode[]) => {
      currentNodes.forEach((node) => {
        flattened.push(node);
        if (node.children && node.children.length > 0) {
          visit(node.children);
        }
      });
    };

    visit(nodes);
    return flattened;
  };

  const createTaxonomyAliasMap = (taxonomyId: string): Map<string, string> => {
    const taxonomy = getTaxonomyById(taxonomyId);
    const nodes = taxonomy ? flattenTaxonomyNodes(taxonomy.tree) : [];
    const aliasMap = new Map<string, string>();

    nodes.forEach((node, index) => {
      const label = node.label;

      aliasMap.set(toNormalizedKey(label), label);
      aliasMap.set(toNormalizedKey(node.id), label);

      if (taxonomyId === "cognitiveLevels") {
        aliasMap.set(toNormalizedKey(`L${index + 1} ${label}`), label);
      }

      if (taxonomyId === "languageVarieties" && label.endsWith(" English")) {
        aliasMap.set(toNormalizedKey(label.replace(/\s+english$/i, "")), label);
      }

      if (taxonomyId === "languageVarieties" && !label.endsWith(" English")) {
        aliasMap.set(toNormalizedKey(`${label} English`), label);
      }

      if (taxonomyId === "grammar") {
        const withoutTense = label.replace(/\s+tense$/i, "");
        aliasMap.set(toNormalizedKey(withoutTense), label);
        aliasMap.set(toNormalizedKey(`${withoutTense} tense`), label);
        aliasMap.set(toNormalizedKey(`${withoutTense} grammar`), label);
      }
    });

    return aliasMap;
  };

  const toCanonicalTaxonomyLabel = (
    taxonomyId: string,
    value: string | undefined,
  ): string | undefined => {
    if (!value) {
      return undefined;
    }

    const aliasMap = createTaxonomyAliasMap(taxonomyId);
    return aliasMap.get(toNormalizedKey(value)) ?? value;
  };

  const matchesTaxonomyFilter = (
    selectedValues: string[],
    taxonomyId: string,
    rawValue: string | undefined,
  ): boolean => {
    if (selectedValues.length === 0) {
      return true;
    }

    const canonicalItemValue = toCanonicalTaxonomyLabel(taxonomyId, rawValue);

    if (!canonicalItemValue) {
      return false;
    }

    return selectedValues.some((selectedValue) => {
      const canonicalSelectedValue = toCanonicalTaxonomyLabel(taxonomyId, selectedValue);
      return canonicalSelectedValue === canonicalItemValue;
    });
  };

  const filteredItems = useMemo(() => {
    const ingestedIdSet = new Set(getIngestedItems().map((item) => item.id));

    const matchedItems = allItems.filter((item) => {
      const matchesSearch =
        item.id
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
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
      const cognitiveLevel = item.cognitiveLevel ?? "";
      const contentDomain = item.contentDomain ?? "";
      const languageVariety = item.languageVariety ?? "";
      const topic = item.topic ?? "";
      const grammarFocus = item.grammarFocus ?? "";
      const matchesCognitiveLevel = matchesTaxonomyFilter(
        selectedCognitiveLevels,
        "cognitiveLevels",
        cognitiveLevel,
      );
      const matchesContentDomain =
        selectedContentDomains.length === 0
          ? true
          : selectedContentDomains.includes(contentDomain);
      const matchesLanguageVariety = matchesTaxonomyFilter(
        selectedLanguageVarieties,
        "languageVarieties",
        languageVariety,
      );
      const matchesTopic =
        selectedTopics.length === 0
          ? true
          : selectedTopics.includes(topic);
      const matchesGrammarFocus = matchesTaxonomyFilter(
        selectedGrammarFocuses,
        "grammar",
        grammarFocus,
      );

      return (
        matchesSearch &&
        matchesLevel &&
        matchesSkill &&
        matchesItemType &&
        matchesStatus &&
        matchesCognitiveLevel &&
        matchesContentDomain &&
        matchesLanguageVariety &&
        matchesTopic &&
        matchesGrammarFocus
      );
    });

    return prioritizeIngestedFirst(matchedItems, ingestedIdSet);
  }, [
    allItems,
    searchQuery,
    selectedLevels,
    selectedSkills,
    selectedItemTypes,
    selectedStatuses,
    selectedCognitiveLevels,
    selectedContentDomains,
    selectedLanguageVarieties,
    selectedTopics,
    selectedGrammarFocuses,
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
    Published: allItems.filter((item) => item.status === "Published").length,
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

  const createOptionalFieldCounts = (values: Array<string | undefined>): Record<string, number> => {
    const counts: Record<string, number> = {};

    values.forEach((value) => {
      if (!value) {
        return;
      }

      counts[value] = (counts[value] ?? 0) + 1;
    });

    return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  };

  const createTaxonomyCounts = (
    taxonomyId: string,
    values: Array<string | undefined>,
  ): Record<string, number> => {
    const observedCounts = createOptionalFieldCounts(
      values.map((value) => toCanonicalTaxonomyLabel(taxonomyId, value)),
    );
    const taxonomy = getTaxonomyById(taxonomyId);
    const taxonomyLabels = taxonomy ? flattenTaxonomyLabels(taxonomy.tree) : [];
    const counts: Record<string, number> = {};

    taxonomyLabels.forEach((label) => {
      counts[label] = observedCounts[label] ?? 0;
    });

    Object.entries(observedCounts).forEach(([label, count]) => {
      counts[label] ??= count;
    });

    return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  };

  const cognitiveLevelCounts = createTaxonomyCounts("cognitiveLevels", allItems.map((item) => item.cognitiveLevel));
  const contentDomainCounts = createTaxonomyCounts("contentDomains", allItems.map((item) => item.contentDomain));
  const languageVarietyCounts = createTaxonomyCounts("languageVarieties", allItems.map((item) => item.languageVariety));
  const topicCounts = createTaxonomyCounts("topics", allItems.map((item) => item.topic));
  const grammarFocusCounts = createTaxonomyCounts("grammar", allItems.map((item) => item.grammarFocus));

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
    setSelectedStatuses((prev) => (prev[0] === status ? [] : [status]));
    setCurrentPage(1);
  };

  const toggleItemType = (type: string) => {
    setSelectedItemTypes((prev) => (prev[0] === type ? [] : [type]));
    setCurrentPage(1);
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => (prev[0] === level ? [] : [level]));
    setCurrentPage(1);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => (prev[0] === skill ? [] : [skill]));
    setCurrentPage(1);
  };

  const toggleCognitiveLevel = (cognitiveLevel: string) => {
    setSelectedCognitiveLevels((prev) => (prev[0] === cognitiveLevel ? [] : [cognitiveLevel]));
    setCurrentPage(1);
  };

  const toggleContentDomain = (contentDomain: string) => {
    setSelectedContentDomains((prev) => (prev[0] === contentDomain ? [] : [contentDomain]));
    setCurrentPage(1);
  };

  const toggleLanguageVariety = (languageVariety: string) => {
    setSelectedLanguageVarieties((prev) => (prev[0] === languageVariety ? [] : [languageVariety]));
    setCurrentPage(1);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => (prev[0] === topic ? [] : [topic]));
    setCurrentPage(1);
  };

  const toggleGrammarFocus = (grammarFocus: string) => {
    setSelectedGrammarFocuses((prev) => (prev[0] === grammarFocus ? [] : [grammarFocus]));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedItemTypes([]);
    setSelectedLevels([]);
    setSelectedSkills([]);
    setSelectedCognitiveLevels([]);
    setSelectedContentDomains([]);
    setSelectedLanguageVarieties([]);
    setSelectedTopics([]);
    setSelectedGrammarFocuses([]);
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
      selectedCognitiveLevels,
      selectedContentDomains,
      selectedLanguageVarieties,
      selectedTopics,
      selectedGrammarFocuses,
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
    selectedCognitiveLevels,
    selectedContentDomains,
    selectedLanguageVarieties,
    selectedTopics,
    selectedGrammarFocuses,
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
      <div className="mx-auto">
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
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-full xl:w-56 xl:flex-shrink-0 space-y-6">
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

              {/* Cognitive Level Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("cognitiveLevel")}
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">
                    Cognitive Level
                  </span>
                  {expandedSections.has("cognitiveLevel") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("cognitiveLevel") && (
                  <div className="space-y-1">
                    {Object.entries(cognitiveLevelCounts).map(
                      ([cognitiveLevel, count]) => (
                        <button
                          key={cognitiveLevel}
                          onClick={() => toggleCognitiveLevel(cognitiveLevel)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedCognitiveLevels.includes(cognitiveLevel)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{cognitiveLevel}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Content Domain Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("contentDomain")}
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">
                    Content Domain
                  </span>
                  {expandedSections.has("contentDomain") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("contentDomain") && (
                  <div className="space-y-1">
                    {Object.entries(contentDomainCounts).map(
                      ([contentDomain, count]) => (
                        <button
                          key={contentDomain}
                          onClick={() => toggleContentDomain(contentDomain)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedContentDomains.includes(contentDomain)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{contentDomain}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Language Variety Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("languageVariety")}
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">
                    Language Variety
                  </span>
                  {expandedSections.has("languageVariety") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("languageVariety") && (
                  <div className="space-y-1">
                    {Object.entries(languageVarietyCounts).map(
                      ([languageVariety, count]) => (
                        <button
                          key={languageVariety}
                          onClick={() => toggleLanguageVariety(languageVariety)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedLanguageVarieties.includes(languageVariety)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{languageVariety}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Topic Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("topic")}
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">
                    Topic
                  </span>
                  {expandedSections.has("topic") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("topic") && (
                  <div className="space-y-1">
                    {Object.entries(topicCounts).map(
                      ([topic, count]) => (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedTopics.includes(topic)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{topic}</span>
                          <span className="text-gray-500">
                            {count}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Grammar Focus Filter */}
              <div className="border-b pb-4">
                <button
                  onClick={() => toggleSection("grammarFocus")}
                  className="flex items-center justify-between w-full text-left mb-3 cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">
                    Grammar Focus
                  </span>
                  {expandedSections.has("grammarFocus") ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has("grammarFocus") && (
                  <div className="space-y-1">
                    {Object.entries(grammarFocusCounts).map(
                      ([grammarFocus, count]) => (
                        <button
                          key={grammarFocus}
                          onClick={() => toggleGrammarFocus(grammarFocus)}
                          className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer ${
                            selectedGrammarFocuses.includes(grammarFocus)
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{grammarFocus}</span>
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
          <div className="flex-1 min-w-0">
            {/* Active Filters Bar - Top */}
            {(searchQuery.trim().length > 0 ||
              selectedStatuses.length > 0 ||
              selectedLevels.length > 0 ||
              selectedSkills.length > 0 ||
              selectedItemTypes.length > 0 ||
              selectedCognitiveLevels.length > 0 ||
              selectedContentDomains.length > 0 ||
              selectedLanguageVarieties.length > 0 ||
              selectedTopics.length > 0 ||
              selectedGrammarFocuses.length > 0) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">Filters:</span>
                    {searchQuery.trim().length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        Keyword: {searchQuery}
                        <button
                          onClick={() => handleSearchChange("")}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedStatuses.map(status => (
                      <Badge
                        key={status}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        {status}
                        <button
                          onClick={() => toggleStatus(status)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
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
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
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
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
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
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedCognitiveLevels.map(cognitiveLevel => (
                      <Badge
                        key={cognitiveLevel}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        Cognitive: {cognitiveLevel}
                        <button
                          onClick={() => toggleCognitiveLevel(cognitiveLevel)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedContentDomains.map(contentDomain => (
                      <Badge
                        key={contentDomain}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        Content: {contentDomain}
                        <button
                          onClick={() => toggleContentDomain(contentDomain)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedLanguageVarieties.map(languageVariety => (
                      <Badge
                        key={languageVariety}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        Variety: {languageVariety}
                        <button
                          onClick={() => toggleLanguageVariety(languageVariety)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedTopics.map(topic => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        Topic: {topic}
                        <button
                          onClick={() => toggleTopic(topic)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedGrammarFocuses.map(grammarFocus => (
                      <Badge
                        key={grammarFocus}
                        variant="secondary"
                        className="text-sm pl-3 pr-2 py-1 bg-white border border-gray-300"
                      >
                        Grammar: {grammarFocus}
                        <button
                          onClick={() => toggleGrammarFocus(grammarFocus)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
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
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer border border-blue-600"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {/* Items Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <p className="text-sm text-gray-600">
                  {filteredItems.length > 0 ? (
                    <>
                      Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span>-
                      <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredItems.length)}</span> of {filteredItems.length} items
                    </>
                  ) : (
                    <>
                      Showing <span className="font-semibold text-gray-900">0</span> of 0 items
                    </>
                  )}
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
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="w-[44%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Item ID
                          </th>
                          <th className="w-[18%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Item Type
                          </th>
                          <th className="w-[24%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Title
                          </th>
                          <th className="w-[14%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-3 py-8 text-center text-gray-500"
                            >
                              No items found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedItems.map((item) => {
                            const taxonomyBadges = [
                              item.subSkill ? `Sub-skill: ${item.subSkill}` : null,
                              item.cognitiveLevel ? `Cognitive: ${item.cognitiveLevel}` : null,
                              item.contentDomain ? `Content: ${item.contentDomain}` : null,
                              item.languageVariety ? `Variety: ${item.languageVariety}` : null,
                              item.topic ? `Topic: ${item.topic}` : null,
                              item.grammarFocus ? `Grammar: ${item.grammarFocus}` : null,
                            ].filter((value): value is string => Boolean(value));

                            let statusVariant: "secondary" | "destructive" | "outline" = "outline";
                            if (item.status === "Published") {
                              statusVariant = "secondary";
                            } else if (item.status === "Compromised") {
                              statusVariant = "destructive";
                            }

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-gray-50 cursor-pointer focus-within:bg-gray-50"
                                role="link"
                                tabIndex={0}
                                onClick={() => navigate(`/item-bank/${item.level}/${item.id}`)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    navigate(`/item-bank/${item.level}/${item.id}`);
                                  }
                                }}
                              >
                                <td className="px-3 py-3 align-top">
                                  <div className="text-sm font-medium text-blue-600">
                                    {item.id}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1 pr-2">
                                    <Badge variant="outline" className="text-xs font-medium">
                                      CEFR: {item.level}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs font-medium">
                                      Skill: {item.skill}
                                    </Badge>
                                    {taxonomyBadges.map((badgeText) => (
                                      <Badge key={badgeText} variant="outline" className="text-xs font-medium">
                                        {badgeText}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                  <div className="text-sm text-gray-700 break-words">
                                    {item.itemType}
                                  </div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                  <div className="text-sm text-gray-700 break-words">
                                    {item.title}
                                  </div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                  <Badge variant={statusVariant}>
                                    {item.status}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredItems.length)}{" "}
                  of {filteredItems.length} items
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
