import { describe, expect, it, vi } from 'vitest';

import { getTaxonomyById, taxonomies } from '../../src/app/data/taxonomy';
import type { TaxonomyNode } from '../../src/app/data/taxonomy';

const sumNodeCounts = (nodes: TaxonomyNode[]): number => {
  return nodes.reduce((total, node) => {
    const own = node.itemCount ?? 0;
    const children = node.children ? sumNodeCounts(node.children) : 0;
    return total + own + children;
  }, 0);
};

describe('taxonomy data', () => {
  it('returns known taxonomies and undefined for unknown id', () => {
    expect(getTaxonomyById('skills')?.id).toBe('skills');
    expect(getTaxonomyById('does-not-exist')).toBeUndefined();
  });

  it('assigns itemCount on each root node and conserves totals at root level', () => {
    taxonomies.forEach((taxonomy) => {
      const rootTotal = taxonomy.tree.reduce((sum, node) => sum + (node.itemCount ?? 0), 0);
      expect(rootTotal).toBe(taxonomy.itemCount);
      taxonomy.tree.forEach((node) => {
        expect(node.itemCount).toBeTypeOf('number');
        expect((node.itemCount ?? -1) >= 0).toBe(true);
      });
    });
  });

  it('keeps parent and child item count totals aligned for nested nodes', () => {
    const nestedTaxonomy = getTaxonomyById('skills');
    expect(nestedTaxonomy).toBeDefined();
    if (!nestedTaxonomy) {
      throw new Error('Expected skills taxonomy to exist');
    }

    nestedTaxonomy.tree.forEach((rootNode) => {
      if (!rootNode.children || rootNode.children.length === 0) {
        return;
      }

      const childrenTotal = rootNode.children.reduce((sum, child) => sum + (child.itemCount ?? 0), 0);
      expect(childrenTotal).toBe(rootNode.itemCount ?? 0);
    });
  });

  it('is deterministic when Math.random is mocked before module evaluation', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    vi.resetModules();
    const reloaded = await import('../../src/app/data/taxonomy');
    const skills = reloaded.getTaxonomyById('skills');

    expect(skills).toBeDefined();
    if (!skills) {
      throw new Error('Expected skills taxonomy to exist after reload');
    }

    const rootTotal = skills.tree.reduce((sum, node) => sum + (node.itemCount ?? 0), 0);
    expect(rootTotal).toBe(skills.itemCount);
    expect(sumNodeCounts(skills.tree)).toBeGreaterThanOrEqual(skills.itemCount);

    randomSpy.mockRestore();
  });
});
