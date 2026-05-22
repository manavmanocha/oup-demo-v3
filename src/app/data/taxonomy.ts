import taxonomyData from "./taxonomy.json";

export interface TaxonomyNode {
  id: string;
  label: string;
  children?: TaxonomyNode[];
  itemCount?: number;
}

export interface Taxonomy {
  id: string;
  name: string;
  description: string;
  type: string;
  tree: TaxonomyNode[];
  itemCount: number;
}

// Helper function to add item counts to taxonomy nodes
function addItemCounts(nodes: TaxonomyNode[], totalItems: number): TaxonomyNode[] {
  const nodeCount = nodes.length;
  let remainingItems = totalItems;

  return nodes.map((node, index) => {
    // Distribute items across nodes, with some randomness
    const isLast = index === nodeCount - 1;
    const itemCount = isLast
      ? remainingItems
      : Math.floor(Math.random() * (totalItems / nodeCount) * 1.5);

    remainingItems -= itemCount;

    return {
      ...node,
      itemCount,
      children: node.children ? addItemCounts(node.children, itemCount) : undefined,
    };
  });
}

// Transform the JSON data into our taxonomy structure
export const taxonomies: Taxonomy[] = [
  {
    id: "skills",
    name: "Skills & Competencies",
    description:
      "Language skills classification (Reading, Writing, Listening, Speaking)",
    type: "Skills",
    tree: addItemCounts(taxonomyData.taxonomy.skills, 847),
    itemCount: 847,
  },
  {
    id: "contentDomains",
    name: "Content Domains",
    description:
      "Subject matter and topic classification for assessment content",
    type: "Content",
    tree: addItemCounts(
      taxonomyData.taxonomy.contentDomains.map((item) => ({
        ...item,
        children: [],
      })),
      623
    ),
    itemCount: 623,
  },
  {
    id: "languageVarieties",
    name: "Language Varieties",
    description:
      "English language varieties and formality levels",
    type: "Language",
    tree: addItemCounts(
      taxonomyData.taxonomy.languageVarieties.map(
        (item) => ({ ...item, children: [] }),
      ),
      412
    ),
    itemCount: 412,
  },
  {
    id: "cefrLevels",
    name: "CEFR Levels",
    description:
      "Common European Framework of Reference for Languages proficiency levels",
    type: "Proficiency",
    tree: addItemCounts(
      taxonomyData.taxonomy.cefrLevels.map((item) => ({
        ...item,
        children: [],
      })),
      847
    ),
    itemCount: 847,
  },
  {
    id: "topics",
    name: "Topics",
    description: "Common topics covered in assessment items",
    type: "Topics",
    tree: addItemCounts(
      taxonomyData.taxonomy.topics.map((item) => ({
        ...item,
        children: [],
      })),
      534
    ),
    itemCount: 534,
  },
  {
    id: "grammar",
    name: "Grammar Focus",
    description:
      "Specific grammar structures targeted in assessment items",
    type: "Grammar",
    tree: addItemCounts(
      taxonomyData.taxonomy.grammar.map((item) => ({
        ...item,
        children: [],
      })),
      345
    ),
    itemCount: 345,
  },
  {
    id: "cognitiveLevels",
    name: "Cognitive Levels",
    description:
      "Bloom's Taxonomy levels for cognitive difficulty",
    type: "Complexity",
    tree: addItemCounts(
      taxonomyData.taxonomy.cognitiveLevels.map((item) => ({
        ...item,
        children: [],
      })),
      847
    ),
    itemCount: 847,
  },
  {
    id: "itemTypes",
    name: "Item Types",
    description: "Assessment item format taxonomy",
    type: "Format",
    tree: addItemCounts(
      taxonomyData.taxonomy.itemTypes.map((item) => ({
        ...item,
        children: [],
      })),
      847
    ),
    itemCount: 847,
  },
];

export function getTaxonomyById(
  id: string,
): Taxonomy | undefined {
  return taxonomies.find((t) => t.id === id);
}