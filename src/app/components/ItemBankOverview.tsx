import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowRight, Info } from 'lucide-react';
import { getAllItems, getBankCapacity, getCompromisedItems } from '../data/mockData';
import { isWorkflowState, getWorkflowStateLabel } from '../data/workflowState';
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
  const bankCapacityData = getBankCapacity();
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
        isWorkflowState(item.workflowState, 'PENDING_SCREENING_REVIEW') ||
        isWorkflowState(item.workflowState, 'PENDING_DP_REVIEW'),
    )
    .map((item) => ({
      id: item.id,
      name: item.title || item.content,
      type: item.itemType,
      submittedBy: item.author || 'System',
      status: getWorkflowStateLabel(item.workflowState),
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
      case 'Screening Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Difficulty Estimation Review': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <Link to="/workflows" className="hover:text-gray-700">Workflows</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700">Pre-Testing Pipeline</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Testing Pipeline Overview</h1>
            <p className="text-gray-600">
              Monitor item-bank coverage and manage the pre-testing review queue across CEFR levels.
            </p>
          </div>
          <Link to="/workflows/pre-testing-pipeline/stages">
            <Button>
              View pipeline stages
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
              <div className="text-sm text-gray-500 mt-1">of {totalTarget} items targeted</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Bank Fill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{overallHealth}%</div>
              <div className="text-sm text-gray-500 mt-1">vs target capacity</div>
              <Progress value={overallHealth} className="mt-3 h-1.5" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Gap to Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalGap}</div>
              <div className="text-sm text-gray-500 mt-1">items still needed</div>
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

        {/* Bank Fill by CEFR Level */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Bank Fill by CEFR Level</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Active items as a percentage of target capacity, per CEFR level. Click a bar to drill into items at that level.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mx-auto flex max-w-4xl items-end justify-center gap-2 sm:gap-6 mb-6">
              {bankCapacityData.map((level) => (
                <Link
                  key={level.level}
                  to={`/item-bank/${level.level}`}
                  className="w-20 sm:w-24 min-w-0 group"
                >
                  <div className="mx-auto text-center max-w-[5.5rem]">
                    <div className="text-xs font-medium text-gray-500 mb-1">{level.percentage}%</div>
                    {/* Uniform-height container with bottom-up fill */}
                    <div className="relative mx-auto w-10 h-40 overflow-hidden rounded-md bg-gray-100 border border-gray-200 group-hover:border-gray-300 transition-colors">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-slate-600 group-hover:bg-slate-700 transition-colors"
                        style={{ height: `${level.percentage}%` }}
                      >
                        {level.compromised > 0 && (level.active + level.compromised) > 0 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-red-300/70"
                            style={{ height: `${(level.compromised / (level.active + level.compromised)) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mt-2">{level.level}</div>
                    <div className="text-xs text-gray-500">{level.active} / {level.target}</div>
                    {level.compromised > 0 && (
                      <div className="mt-1 text-[11px] text-red-500">
                        {level.compromised} compromised
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-600" />
                <span className="text-gray-600">Active items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
                <span className="text-gray-600">Gap to target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <span className="text-gray-600">Compromised</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 text-center">
              {highestGapLevel && highestGapLevel.gapToTarget > 0
                ? `${highestGapLevel.level} needs ${highestGapLevel.gapToTarget} more items to reach target · ${compromisedItems.length} compromised · ${reviewQueueItems.length} pending`
                : `${compromisedItems.length} compromised · ${reviewQueueItems.length} pending`}
            </div>
          </CardContent>
        </Card>

        {/* Review Queue */}
        <Card>
          <CardHeader className="sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Review Queue</CardTitle>
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
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Screening Review">Screening Review</SelectItem>
                  <SelectItem value="Difficulty Estimation Review">Difficulty Estimation Review</SelectItem>
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
                {/* Bulk Actions */}
                {selectedItems.size > 0 && (
                  <div className="mb-3 p-2.5 pl-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">{selectedItems.size}</span> item{selectedItems.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Approve selected</Button>
                      <Button variant="outline" size="sm">Reject selected</Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

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
                                className="text-sm text-gray-900 hover:text-blue-700"
                              >
                                {item.name}
                              </Link>
                              <span className="text-xs font-mono text-gray-500 mt-0.5">{item.id}</span>
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
                            <Badge variant="outline" className={getStatusColor(item.status)}>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

