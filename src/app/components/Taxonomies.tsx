import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Search,
  FolderTree,
  Plus,
  List,
  Network,
  ChevronRight,
  Tag,
  Layers,
  BookOpen,
} from 'lucide-react';
import { taxonomies } from '../data/taxonomy';

export function Taxonomies() {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTaxonomies = taxonomies.filter(tax =>
    tax.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tax.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tax.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCategories = taxonomies.reduce((sum, tax) => sum + tax.tree.length, 0);
  const totalItems = taxonomies.reduce((sum, tax) => sum + tax.itemCount, 0);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Taxonomies</h1>
            <p className="text-gray-600">
              Manage classification systems and hierarchies for organizing assessment content.
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Taxonomy
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <FolderTree className="w-4 h-4" />
                Total Taxonomies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{taxonomies.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Total Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
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
                <Layers className="w-4 h-4" />
                Max Depth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">2</div>
            </CardContent>
          </Card>
        </div>

        {/* Taxonomies List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                All Taxonomies
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'tree' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                >
                  <Network className="w-4 h-4 mr-2" />
                  Tree
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search taxonomies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {viewMode === 'list' ? (
              /* List View */
              <div className="space-y-4">
                {filteredTaxonomies.map((taxonomy) => (
                  <Link
                    key={taxonomy.id}
                    to={`/taxonomies/${taxonomy.id}`}
                    className="block"
                  >
                    <div className="border rounded-lg p-6 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FolderTree className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {taxonomy.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {taxonomy.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{taxonomy.type}</Badge>
                        </div>
                        <div className="text-gray-600">
                          <span className="font-semibold text-gray-900">{taxonomy.tree.length}</span> categories
                        </div>
                        <div className="text-gray-600">
                          <span className="font-semibold text-gray-900">{taxonomy.itemCount}</span> items
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Tree View */
              <div className="border rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-6">
                  Hierarchical view of all taxonomies and their relationships.
                </p>
                <div className="space-y-4">
                  {filteredTaxonomies.map((taxonomy) => (
                    <div key={taxonomy.id} className="border-l-2 border-gray-300 pl-4">
                      <Link
                        to={`/taxonomies/${taxonomy.id}`}
                        className="block mb-2 hover:text-blue-600"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <FolderTree className="w-4 h-4" />
                          <span className="font-semibold text-gray-900">{taxonomy.name}</span>
                          <Badge variant="outline" className="text-xs">{taxonomy.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">{taxonomy.description}</p>
                      </Link>
                      <div className="ml-6 mt-2 space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span>{taxonomy.tree.length} categories</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span>{taxonomy.itemCount} tagged items</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
