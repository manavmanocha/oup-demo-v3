import taxonomyData from "./taxonomy.json";
import questionsData from "./questions.json";

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

type Question = {
  skill?: string;
  level?: string;
  topic?: string;
  skillTag?: string;
  cognitiveLevel?: string;
  contentDomain?: string;
  languageVariety?: string;
  questionType?: string;
};

const questions: Question[] = (questionsData as { questions: Question[] }).questions;

const norm = (s: string | undefined | null): string =>
  (s ?? "").toString().trim().toLowerCase();

function countWhere(predicate: (q: Question) => boolean): number {
  let n = 0;
  for (const q of questions) if (predicate(q)) n++;
  return n;
}

type Matcher = (node: TaxonomyNode, ancestors: TaxonomyNode[]) => (q: Question) => boolean;

// Build a tree where each leaf's itemCount comes from the matcher and each
// parent's itemCount aggregates its descendants.
function buildTree(
  nodes: TaxonomyNode[],
  matcher: Matcher,
  ancestors: TaxonomyNode[] = [],
): TaxonomyNode[] {
  return nodes.map((node) => {
    const children = node.children && node.children.length > 0
      ? buildTree(node.children, matcher, [...ancestors, node])
      : undefined;

    const itemCount = children && children.length > 0
      ? children.reduce((sum, c) => sum + (c.itemCount ?? 0), 0)
      : countWhere(matcher(node, ancestors));

    return { ...node, itemCount, children };
  });
}

const totalOf = (tree: TaxonomyNode[]): number =>
  tree.reduce((sum, n) => sum + (n.itemCount ?? 0), 0);

// --- Matchers per taxonomy ---------------------------------------------------

// Skills: leaf subskills must match BOTH the parent skill (Reading/Listening/...)
// and the question's skillTag. This prevents shared subskill labels (e.g.
// "Inference from context") from being double-counted across skills.
const TOP_LEVEL_SKILLS = new Set(["reading", "listening", "writing", "speaking"]);
const skillsMatcher: Matcher = (node, ancestors) => {
  const label = norm(node.label);
  if (TOP_LEVEL_SKILLS.has(label)) {
    return (q) => norm(q.skill) === label;
  }
  const parentSkill = ancestors.find((a) => TOP_LEVEL_SKILLS.has(norm(a.label)));
  const parentLabel = parentSkill ? norm(parentSkill.label) : null;
  return (q) => {
    if (parentLabel && norm(q.skill) !== parentLabel) return false;
    return norm(q.skillTag) === label;
  };
};

// CEFR labels look like "A1 (Beginner)" — the CEFR code is the first token.
const cefrMatcher: Matcher = (node) => {
  const code = norm(node.label.split(/\s+/)[0]);
  return (q) => norm(q.level) === code;
};

// Bloom's cognitive levels: question values are like "L4 Analyze"; node labels
// are "Analyze". Substring match on the label is sufficient.
const cognitiveMatcher: Matcher = (node) => {
  const label = norm(node.label);
  return (q) => norm(q.cognitiveLevel).includes(label);
};

// Content domains are nested (CEFR Companion 2020 spheres). Leaves match by
// exact contentDomain; roots aggregate their leaves automatically.
const contentDomainMatcher: Matcher = (node) => {
  const label = norm(node.label);
  return (q) => norm(q.contentDomain) === label;
};

// Topics: leaf labels mirror published item-bank topic strings. Use exact match
// to keep counts faithful to the bank.
const topicMatcher: Matcher = (node) => {
  const label = norm(node.label);
  return (q) => norm(q.topic) === label;
};

// Item types: bank uses canonical labels (Multiple Choice, Matching, ...).
const itemTypeMatcher: Matcher = (node) => {
  const label = norm(node.label);
  return (q) => norm(q.questionType) === label;
};

// Language varieties: bank only uses the short name ("International"). Strip
// "English" / "register" suffixes from labels before comparing.
const stripVarietySuffix = (s: string): string =>
  s.replace(/\s+english$/i, "").replace(/\s+register$/i, "").trim();
const languageVarietyMatcher: Matcher = (node) => {
  const label = norm(stripVarietySuffix(node.label));
  return (q) => {
    const v = norm(q.languageVariety);
    if (!v) return false;
    return v === label;
  };
};

// Grammar Focus: the demo question bank does not tag grammar structures, so
// counts remain 0. The structure follows the English Grammar Profile so it can
// be wired up to a future grammar-tagged item bank without re-shaping.
const grammarMatcher: Matcher = () => () => false;

// --- Build the taxonomies ----------------------------------------------------

const tax = taxonomyData.taxonomy as Record<string, TaxonomyNode[]>;

const skillsTree = buildTree(tax.skills, skillsMatcher);
const contentDomainsTree = buildTree(tax.contentDomains, contentDomainMatcher);
const languageVarietiesTree = buildTree(tax.languageVarieties, languageVarietyMatcher);
const cefrLevelsTree = buildTree(tax.cefrLevels, cefrMatcher);
const topicsTree = buildTree(tax.topics, topicMatcher);
const grammarTree = buildTree(tax.grammar, grammarMatcher);
const cognitiveLevelsTree = buildTree(tax.cognitiveLevels, cognitiveMatcher);
const itemTypesTree = buildTree(tax.itemTypes, itemTypeMatcher);

export const taxonomies: Taxonomy[] = [
  {
    id: "skills",
    name: "Skills & Competencies",
    description:
      "Macro skills with Cambridge-style analytic subskills (Reading, Listening, Writing, Speaking).",
    type: "Skills",
    tree: skillsTree,
    itemCount: totalOf(skillsTree),
  },
  {
    id: "contentDomains",
    name: "Content Domains",
    description:
      "CEFR Companion (2020) domains: Personal, Public, Educational and Occupational spheres of use.",
    type: "Content",
    tree: contentDomainsTree,
    itemCount: totalOf(contentDomainsTree),
  },
  {
    id: "languageVarieties",
    name: "Language Varieties",
    description:
      "Native varieties, World Englishes and register tags used to balance regional and stylistic exposure.",
    type: "Language",
    tree: languageVarietiesTree,
    itemCount: totalOf(languageVarietiesTree),
  },
  {
    id: "cefrLevels",
    name: "CEFR Levels",
    description:
      "Common European Framework of Reference proficiency levels from Pre-A1 (Foundation) through C2 (Proficient).",
    type: "Proficiency",
    tree: cefrLevelsTree,
    itemCount: totalOf(cefrLevelsTree),
  },
  {
    id: "topics",
    name: "Topics",
    description:
      "Cambridge English Topic List groupings used across PET, FCE, CAE and equivalent OUP exam syllabi.",
    type: "Topics",
    tree: topicsTree,
    itemCount: totalOf(topicsTree),
  },
  {
    id: "grammar",
    name: "Grammar Focus",
    description:
      "Structures grouped by the English Grammar Profile (Cambridge) — verb forms, modality, sentence structure, noun phrase and lexico-grammar.",
    type: "Grammar",
    tree: grammarTree,
    itemCount: totalOf(grammarTree),
  },
  {
    id: "cognitiveLevels",
    name: "Cognitive Levels",
    description: "Bloom's Revised Taxonomy levels applied to item cognitive demand.",
    type: "Complexity",
    tree: cognitiveLevelsTree,
    itemCount: totalOf(cognitiveLevelsTree),
  },
  {
    id: "itemTypes",
    name: "Item Types",
    description:
      "Cambridge / IELTS / OUP item formats grouped as Objective, Completion and Productive tasks.",
    type: "Format",
    tree: itemTypesTree,
    itemCount: totalOf(itemTypesTree),
  },
];

export function getTaxonomyById(id: string): Taxonomy | undefined {
  return taxonomies.find((t) => t.id === id);
}
