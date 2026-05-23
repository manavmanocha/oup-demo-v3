import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { AlertCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { bankCapacityData, getAllItems, getCompromisedItems } from '../data/mockData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function ItemBankOverview() {
  const totalActive = bankCapacityData.reduce((sum, level) => sum + level.active, 0);
  const totalTarget = bankCapacityData.reduce((sum, level) => sum + level.target, 0);
  const totalGap = bankCapacityData.reduce((sum, level) => sum + level.gapToTarget, 0);
  const overallHealth = totalTarget > 0 ? Math.round((totalActive / totalTarget) * 100) : 0;
  const compromisedItems = getCompromisedItems();

  // Review Queue State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const reviewQueueItems = getAllItems()
    .filter(
      (item) =>
        item.workflowState === 'Screening Review' ||
        item.workflowState === 'Difficulty Prediction Review',
    )
    .map((item) => ({
      id: item.id,
      name: item.title || item.content,
      type: item.itemType,
      submittedBy: item.author || 'System',
      status: item.workflowState === 'Difficulty Prediction Review' ? 'DP Review' : 'Screening Review',
      level: item.level,
    }));
  const highestGapLevel = [...bankCapacityData].sort((a, b) => b.gapToTarget - a.gapToTarget)[0];

  const filteredReviewItems = reviewQueueItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReviewItems.length / itemsPerPage);
  const paginatedItems = filteredReviewItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(paginatedItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Screening Review': return 'bg-orange-100 text-orange-800';
      case 'DP Review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows" className="hover:underline">Workflows</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Pre-Testing Pipeline</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Testing Pipeline Overview</h1>
            <p className="text-gray-600">
              Monitor item health and manage the pre-testing pipeline across CEFR levels.
            </p>
          </div>
          <Link to="/workflows/pre-testing-pipeline/stages">
            <Button>Review pipeline</Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalActive}</div>
              <div className="text-sm text-gray-500 mt-1">of {totalTarget} target</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Overall Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{overallHealth}%</div>
              <div className="text-sm text-gray-500 mt-1">Healthy trajectory</div>
              <Progress value={overallHealth} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Gap to Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalGap}</div>
              <div className="text-sm text-gray-500 mt-1">Items still needed</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">In Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{reviewQueueItems.length}</div>
              <div className="text-sm text-gray-500 mt-1">awaiting review</div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Capacity by CEFR Level */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Bank Capacity by CEFR Level</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      <strong>CEFR</strong> (Common European Framework of Reference for Languages) 
                      defines six proficiency levels from A1 (beginner) to C2 (proficient).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4 mb-6">
              {bankCapacityData.map((level) => (
                <Link
                  key={level.level}
                  to={`/item-bank/${level.level}`}
                  className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="text-center mb-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">{level.percentage}%</div>
                    <div
                      className="bg-gray-400 rounded-t mx-auto relative"
                      style={{ 
                        width: '100%',
                        height: `${Math.max(level.percentage * 1.5, 20)}px`,
                      }}
                    >
                      {level.compromised > 0 && (
                        <div
                          className="bg-red-400 absolute bottom-0 left-0 right-0 rounded-t"
                          style={{ height: `${(level.compromised / (level.active + level.compromised)) * 100}%` }}
                        />
                      )}
                      {level.percentage < 100 && (
                        <div
                          className="bg-gray-200 absolute top-0 left-0 right-0"
                          style={{ height: `${100 - level.percentage}%` }}
                        />
                      )}
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-2">{level.level}</div>
                    <div className="text-xs text-gray-500">{level.active} / {level.target}</div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded" />
                <span className="text-gray-600">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span className="text-gray-600">Compromised</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded" />
                <span className="text-gray-600">Gap to target</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 text-center">
              {highestGapLevel
                ? `${highestGapLevel.level} needs ${highestGapLevel.gapToTarget} more items to reach target · ${compromisedItems.length} compromised · ${reviewQueueItems.length} pending`
                : `${compromisedItems.length} compromised · ${reviewQueueItems.length} pending`}
            </div>
          </CardContent>
        </Card>

        {/* Review Queue */}
        <Card className="border-blue-200">
          <CardHeader className="sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-600 uppercase">Review Queue</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{filteredReviewItems.length} items</span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by item name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Screening Review">Screening Review</SelectItem>
                  <SelectItem value="DP Review">DP Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReviewItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No items in review queue</h3>
                <p className="text-sm text-gray-500">There are currently no items matching your filters.</p>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <Checkbox
                            checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <Link
                                to={`/item-bank/${item.level}/${item.id}?from=workflow`}
                                state={{ fromWorkflow: true }}
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                {item.id}
                              </Link>
                              <span className="text-xs text-gray-500 mt-0.5">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{item.type}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{item.level}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.submittedBy}</td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredReviewItems.length)} of {filteredReviewItems.length} items
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                {selectedItems.size > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Approve Selected</Button>
                      <Button variant="outline" size="sm">Reject Selected</Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

