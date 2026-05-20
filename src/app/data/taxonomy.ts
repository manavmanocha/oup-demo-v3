import taxonomyData from '../../imports/pasted_text/taxonomy-skills.json';

export interface TaxonomyNode {
  id: string;
  label: string;
  children?: TaxonomyNode[];
}

export interface Taxonomy {
  id: string;
  name: string;
  description: string;
  type: string;
  tree: TaxonomyNode[];
  itemCount: number;
}

// Transform the JSON data into our taxonomy structure
export const taxonomies: Taxonomy[] = [
  {
    id: 'skills',
    name: 'Skills & Competencies',
    description: 'Language skills classification (Reading, Writing, Listening, Speaking)',
    type: 'Skills',
    tree: taxonomyData.taxonomy.skills,
    itemCount: 847,
  },
  {
    id: 'contentDomains',
    name: 'Content Domains',
    description: 'Subject matter and topic classification for assessment content',
    type: 'Content',
    tree: taxonomyData.taxonomy.contentDomains.map(item => ({ ...item, children: [] })),
    itemCount: 623,
  },
  {
    id: 'languageVarieties',
    name: 'Language Varieties',
    description: 'English language varieties and formality levels',
    type: 'Language',
    tree: taxonomyData.taxonomy.languageVarieties.map(item => ({ ...item, children: [] })),
    itemCount: 412,
  },
  {
    id: 'cefrLevels',
    name: 'CEFR Levels',
    description: 'Common European Framework of Reference for Languages proficiency levels',
    type: 'Proficiency',
    tree: taxonomyData.taxonomy.cefrLevels.map(item => ({ ...item, children: [] })),
    itemCount: 847,
  },
  {
    id: 'topics',
    name: 'Topics',
    description: 'Common topics covered in assessment items',
    type: 'Topics',
    tree: taxonomyData.taxonomy.topics.map(item => ({ ...item, children: [] })),
    itemCount: 534,
  },
  {
    id: 'grammar',
    name: 'Grammar Focus',
    description: 'Specific grammar structures targeted in assessment items',
    type: 'Grammar',
    tree: taxonomyData.taxonomy.grammar.map(item => ({ ...item, children: [] })),
    itemCount: 345,
  },
  {
    id: 'cognitiveLevels',
    name: 'Cognitive Levels',
    description: "Bloom's Taxonomy levels for cognitive difficulty",
    type: 'Complexity',
    tree: taxonomyData.taxonomy.cognitiveLevels.map(item => ({ ...item, children: [] })),
    itemCount: 847,
  },
  {
    id: 'itemTypes',
    name: 'Item Types',
    description: 'Assessment item format taxonomy',
    type: 'Format',
    tree: taxonomyData.taxonomy.itemTypes.map(item => ({ ...item, children: [] })),
    itemCount: 847,
  },
];

export function getTaxonomyById(id: string): Taxonomy | undefined {
  return taxonomies.find(t => t.id === id);
}
