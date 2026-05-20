import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Search,
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Tag,
  FileText,
  Calendar,
} from 'lucide-react';
import { getTaxonomyById, TaxonomyNode } from '../data/taxonomy';

export function TaxonomyDetail() {
  const { taxonomyId } = useParams<{ taxonomyId: string }>();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const taxonomy = getTaxonomyById(taxonomyId || '');

  if (!taxonomy) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Taxonomy Not Found</h1>
            <p className="text-gray-600 mb-4">The requested taxonomy does not exist.</p>
            <Link to="/taxonomies">
              <Button>Back to Taxonomies</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: TaxonomyNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    // Calculate item count for this node and its children
    const getNodeItemCount = (n: TaxonomyNode): number => {
      const childCount = n.children?.reduce((sum, child) => sum + getNodeItemCount(child), 0) || 0;
      return childCount > 0 ? childCount : Math.floor(Math.random() * 150) + 50; // Mock count
    };

    const itemCount = getNodeItemCount(node);

    return (
      <div key={node.id} style={{ marginLeft: `${level * 24}px` }}>
        <div className="flex items-center gap-2 py-3 px-4 hover:bg-gray-50 rounded-lg group">
          {hasChildren ? (
            <button onClick={() => toggleNode(node.id)} className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4"></div>
          )}
          <FolderTree className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{node.label}</span>
              <Badge variant="secondary" className="text-xs">{itemCount}</Badge>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children?.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalItems = taxonomy.itemCount;
  const totalCategories = taxonomy.tree.length;
  const hasSubcategories = taxonomy.tree.some(node => node.children && node.children.length > 0);
  const totalSubcategories = taxonomy.tree.reduce((sum, node) => sum + (node.children?.length || 0), 0);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/taxonomies" className="hover:underline">Taxonomies</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{taxonomy.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{taxonomy.name}</h1>
              <Badge variant="outline">{taxonomy.type}</Badge>
            </div>
            <p className="text-gray-600">{taxonomy.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Taxonomy
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalCategories}</div>
              {hasSubcategories && (
                <div className="text-sm text-gray-600 mt-1">{totalSubcategories} subcategories</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tagged Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-gray-900">{hasSubcategories ? '2-Level' : 'Flat'} Hierarchy</div>
            </CardContent>
          </Card>
        </div>

        {/* Hierarchy Tree */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Hierarchy Structure
              </CardTitle>
              <Button variant="outline" size="sm">
                Expand All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tree */}
            <div className="border rounded-lg p-4">
              {taxonomy.tree.length > 0 ? (
                <div>
                  {taxonomy.tree.map(node => renderNode(node, 0))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No categories defined yet.</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Category
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Usage Across Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Distribution of items tagged with categories from this taxonomy.
            </p>
            <div className="space-y-3">
              {taxonomy.tree.map((node: TaxonomyNode) => {
                const percentage = totalItems > 0 ? (node.itemCount / totalItems) * 100 : 0;
                return (
                  <div key={node.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{node.name}</span>
                      <span className="text-sm text-gray-600">{node.itemCount} items ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
