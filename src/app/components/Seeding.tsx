import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { SEEDED_RESPONSE_TARGET, bankCapacityTargets, getAllItems, getBankCapacity, getSeededResponsesAccrued, moveItemsToSeeded } from '../data/mockData';
import { AssessmentItem, CEFRLevel, Skill } from '../data/types';
import { isWorkflowState } from '../data/workflowState';

const DEFAULT_VISIBLE_RECOMMENDED_ITEMS = 4;
const DEFAULT_VISIBLE_SEEDED_ITEMS = 5;

const LOW_CONFIDENCE_THRESHOLD = 75;
const SKILLS_PER_LEVEL = 4; // Reading, Listening, Writing, Speaking
const SUBSKILL_MIN_TARGET = 4; // minimum items per (level, skill, subSkill) for healthy coverage
const TOP_GAP_BUCKETS = 5;

const SKILL_KEY = (level: CEFRLevel, skill: Skill) => `${level}|${skill}`;
const SUBSKILL_KEY = (level: CEFRLevel, skill: Skill, subSkill: string) => `${level}|${skill}|${subSkill}`;

const formatSeededDate = (iso?: string): string => {
  if (!iso) return 'N/A';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatItemIdForDisplay = (id: string): string => {
  return id.startsWith('ITMBK-') ? id.slice('ITMBK-'.length) : id;
};

type BankSignals = {
  gapByLevel: Record<string, number>;
  gapBySkill: Record<string, number>; // level|skill -> gap
  gapBySubSkill: Record<string, number>; // level|skill|subSkill -> gap
};

// Bank-aware priority score for ordering seeding candidates.
// Higher score = higher priority. Weighted so that bank gaps drive ordering
// (level gap >> skill gap >> sub-skill gap) and low confidence breaks ties.
const getSeedingPriorityScore = (
  item: Pick<AssessmentItem, 'level' | 'skill' | 'subSkill' | 'confidence'>,
  signals: BankSignals,
): number => {
  const levelGap = signals.gapByLevel[item.level] ?? 0;
  const skillGap = signals.gapBySkill[SKILL_KEY(item.level, item.skill)] ?? 0;
  const subSkillGap = item.subSkill
    ? signals.gapBySubSkill[SUBSKILL_KEY(item.level, item.skill, item.subSkill)] ?? 0
    : 0;
  const confidence = item.confidence ?? 100;
  const confidenceBoost = Math.max(0, LOW_CONFIDENCE_THRESHOLD - confidence);
  return levelGap * 3 + skillGap * 5 + subSkillGap * 4 + confidenceBoost;
};

// Items qualify for seeding if the bank still needs them (level / skill /
// sub-skill gap) OR if the IRT prediction lacks confidence and needs live
// response evidence. High-confidence items in already-saturated buckets are
// filtered out so the queue surfaces actual bank intelligence.
const qualifiesForSeeding = (
  item: Pick<AssessmentItem, 'level' | 'skill' | 'subSkill' | 'confidence'>,
  signals: BankSignals,
): boolean => {
  const levelGap = signals.gapByLevel[item.level] ?? 0;
  const skillGap = signals.gapBySkill[SKILL_KEY(item.level, item.skill)] ?? 0;
  const subSkillGap = item.subSkill
    ? signals.gapBySubSkill[SUBSKILL_KEY(item.level, item.skill, item.subSkill)] ?? 0
    : 0;
  const confidence = item.confidence ?? 100;
  return (
    levelGap > 0
    || skillGap > 0
    || subSkillGap > 0
    || (confidence > 0 && confidence < LOW_CONFIDENCE_THRESHOLD)
  );
};

const buildSeedingRationale = (
  item: Pick<AssessmentItem, 'id' | 'level' | 'skill' | 'subSkill' | 'confidence'>,
  signals: BankSignals,
): string => {
  const confidence = item.confidence ?? 0;
  const levelGap = signals.gapByLevel[item.level] ?? 0;
  const skillGap = signals.gapBySkill[SKILL_KEY(item.level, item.skill)] ?? 0;
  const subSkillGap = item.subSkill
    ? signals.gapBySubSkill[SUBSKILL_KEY(item.level, item.skill, item.subSkill)] ?? 0
    : 0;

  if (skillGap > 0) {
    const suffix = subSkillGap > 0 && item.subSkill
      ? `; sub-skill "${item.subSkill}" short by ${subSkillGap}`
      : '';
    return `Bank gap: ${item.level} ${item.skill} short by ${skillGap}${suffix}`;
  }

  if (subSkillGap > 0 && item.subSkill) {
    return `Sub-skill gap: ${item.level} ${item.skill} \u2022 ${item.subSkill} short by ${subSkillGap}`;
  }

  if (levelGap > 0) {
    return `Bank gap at ${item.level} \u2014 ${levelGap} item${levelGap === 1 ? '' : 's'} below target`;
  }

  if (confidence > 0 && confidence < LOW_CONFIDENCE_THRESHOLD) {
    return `Low model confidence (${confidence}%) \u2014 field evidence required before bank entry`;
  }

  return `${item.level} ${item.skill} coverage on target \u2014 refresh exposure pool`;
};

const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortNewestFirst = <T extends { id: string; createdDate?: string; lastEditedDate?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const aTime = Math.max(toTimestamp(a.lastEditedDate), toTimestamp(a.createdDate));
    const bTime = Math.max(toTimestamp(b.lastEditedDate), toTimestamp(b.createdDate));

    if (bTime !== aTime) {
      return bTime - aTime;
    }

    return b.id.localeCompare(a.id);
  });
};

export function Seeding() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [showAllSeeded, setShowAllSeeded] = useState(false);

  const allItems = useMemo(() => getAllItems(), [refreshVersion]);

  // Bank intelligence signals: gaps by level, by (level, skill), and by
  // (level, skill, sub-skill). Targets are derived from bankCapacityTargets
  // split evenly across the four skills, with a soft minimum per sub-skill.
  const bankSignals = useMemo<BankSignals>(() => {
    const gapByLevel: Record<string, number> = {};
    const activeByLevel: Record<string, number> = {};
    const activeBySkill: Record<string, number> = {};
    const activeBySubSkill: Record<string, number> = {};
    const subSkillsByLevelSkill: Record<string, Set<string>> = {};

    getBankCapacity().forEach((row) => {
      gapByLevel[row.level] = row.gapToTarget;
      activeByLevel[row.level] = row.active;
    });

    allItems.forEach((item) => {
      if (item.status !== 'Published') return;
      const skillKey = SKILL_KEY(item.level, item.skill);
      activeBySkill[skillKey] = (activeBySkill[skillKey] ?? 0) + 1;
      if (item.subSkill) {
        const subKey = SUBSKILL_KEY(item.level, item.skill, item.subSkill);
        activeBySubSkill[subKey] = (activeBySubSkill[subKey] ?? 0) + 1;
        if (!subSkillsByLevelSkill[skillKey]) subSkillsByLevelSkill[skillKey] = new Set();
        subSkillsByLevelSkill[skillKey].add(item.subSkill);
      }
    });

    const gapBySkill: Record<string, number> = {};
    (Object.keys(bankCapacityTargets) as CEFRLevel[]).forEach((level) => {
      const target = Math.ceil(bankCapacityTargets[level] / SKILLS_PER_LEVEL);
      (['Reading', 'Listening', 'Writing', 'Speaking'] as Skill[]).forEach((skill) => {
        const key = SKILL_KEY(level, skill);
        gapBySkill[key] = Math.max(0, target - (activeBySkill[key] ?? 0));
      });
    });

    const gapBySubSkill: Record<string, number> = {};
    Object.entries(activeBySubSkill).forEach(([key, count]) => {
      gapBySubSkill[key] = Math.max(0, SUBSKILL_MIN_TARGET - count);
    });

    return { gapByLevel, gapBySkill, gapBySubSkill };
  }, [allItems]);

  const topBankGaps = useMemo(() => {
    return Object.entries(bankSignals.gapBySkill)
      .filter(([, gap]) => gap > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_GAP_BUCKETS)
      .map(([key, gap]) => {
        const [level, skill] = key.split('|');
        return { level, skill, gap };
      });
  }, [bankSignals]);

  const recommendedItems = useMemo(
    () => {
      const candidates = allItems.filter((item) =>
        isWorkflowState(item.workflowState, 'RECOMMENDED_FOR_SEEDING')
        && qualifiesForSeeding(item, bankSignals),
      );

      return [...candidates].sort((a, b) => {
        const scoreDiff = getSeedingPriorityScore(b, bankSignals) - getSeedingPriorityScore(a, bankSignals);
        if (scoreDiff !== 0) return scoreDiff;

        const aTime = Math.max(toTimestamp(a.lastEditedDate), toTimestamp(a.createdDate));
        const bTime = Math.max(toTimestamp(b.lastEditedDate), toTimestamp(b.createdDate));
        if (bTime !== aTime) return bTime - aTime;
        return b.id.localeCompare(a.id);
      });
    },
    [allItems, bankSignals],
  );

  const currentlySeeded = useMemo(
    () => sortNewestFirst(allItems.filter((item) => isWorkflowState(item.workflowState, 'SEEDED'))),
    [allItems],
  );
  const visibleRecommendedItems = showAllRecommended
    ? recommendedItems
    : recommendedItems.slice(0, DEFAULT_VISIBLE_RECOMMENDED_ITEMS);
  const visibleSeededItems = showAllSeeded ? currentlySeeded : currentlySeeded.slice(0, DEFAULT_VISIBLE_SEEDED_ITEMS);
  const hiddenRecommendedCount = Math.max(recommendedItems.length - DEFAULT_VISIBLE_RECOMMENDED_ITEMS, 0);
  const hiddenSeededCount = Math.max(currentlySeeded.length - DEFAULT_VISIBLE_SEEDED_ITEMS, 0);

  const toggleSelected = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const EXPORT_TARGETS = [
    {
      id: 'test-delivery',
      label: 'External Test Delivery System',
      description: 'Push as a seeding batch into the live delivery platform via API.',
    },
    {
      id: 'item-bank-api',
      label: 'External Item Bank API',
      description: 'Sync items, metadata, and predicted parameters to the central item bank.',
    },
    {
      id: 'csv-export',
      label: 'Download CSV manifest',
      description: 'Export a batch manifest (item IDs, level, skill, target slots) for offline ingestion.',
    },
  ] as const;
  type ExportTargetId = typeof EXPORT_TARGETS[number]['id'];

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportTargetId>('test-delivery');
  const [isExporting, setIsExporting] = useState(false);

  const handleConfirmBatch = () => {
    if (selectedItemIds.length === 0) {
      return;
    }
    setIsExportDialogOpen(true);
  };

  const handleConfirmExport = () => {
    if (selectedItemIds.length === 0) return;
    const target = EXPORT_TARGETS.find((option) => option.id === exportTarget);
    const batchId = `SEED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const itemCount = selectedItemIds.length;

    setIsExporting(true);
    // Simulate an API/handoff call so the action feels like a real integration.
    window.setTimeout(() => {
      moveItemsToSeeded(selectedItemIds);
      setSelectedItemIds([]);
      setRefreshVersion((prev) => prev + 1);
      setIsExporting(false);
      setIsExportDialogOpen(false);

      toast.success(`Batch ${batchId} exported`, {
        description: `${itemCount} item${itemCount === 1 ? '' : 's'} handed off to ${target?.label ?? 'external system'}.`,
      });
    }, 700);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows" className="hover:underline">Workflows</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pre-Testing Pipeline</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline/stages" className="hover:underline">Pipeline Stages</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline/seeding" className="hover:underline">Seeding</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Recommended Items</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Stage 3 · Seeding</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recommended Items</h1>
            <p className="text-gray-600 max-w-xl">
              Items ranked by bank gap and model confidence. Select and confirm to allocate to the next live test batch.
            </p>
          </div>
        </div>

        {/* Bank intelligence summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Bank Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Seeding priority is driven by where the bank is thinnest by CEFR level and skill, and where IRT confidence is low. High-confidence items in already-saturated buckets are deprioritised.
            </p>
            {topBankGaps.length === 0 ? (
              <div className="text-sm text-gray-600">All level × skill buckets are at or above target.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs uppercase tracking-wide text-gray-500 mr-1 self-center">Top gaps</span>
                {topBankGaps.map((row) => (
                  <Badge key={`${row.level}-${row.skill}`} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                    {row.level} {row.skill} short by {row.gap}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended for Seeding */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Recommended for Seeding · {recommendedItems.length} items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              Ranked by bank gap (level → skill → sub-skill) and model confidence. High-confidence items in saturated buckets are filtered out.
            </p>

            {recommendedItems.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                No items are currently queued for seeding. Run a difficulty estimation to generate candidates.
              </div>
            ) : (
              <div className="space-y-4">
                {visibleRecommendedItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Link
                            to={`/item-bank/${item.level}/${item.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {formatItemIdForDisplay(item.id)}
                          </Link>
                          <Badge variant="outline">{item.level}</Badge>
                          <Badge variant="outline">{item.skill}</Badge>
                          <Badge variant="outline">{item.itemType}</Badge>
                        </div>

                        <div className="text-sm text-gray-900 mb-3">{item.title}</div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {item.difficulty && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {item.difficulty}
                            </Badge>
                          )}
                          {item.confidence !== undefined && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              Confidence: {item.confidence}%
                            </Badge>
                          )}
                          <Badge variant="secondary" className="bg-amber-50 text-amber-800 border border-amber-200">
                            {buildSeedingRationale(item, bankSignals)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {!showAllRecommended && hiddenRecommendedCount > 0 && (
                  <Button variant="outline" onClick={() => setShowAllRecommended(true)}>
                    Show {hiddenRecommendedCount} more item{hiddenRecommendedCount === 1 ? '' : 's'}
                  </Button>
                )}
              </div>
            )}

            <div className="mt-6 p-3 bg-gray-50 border rounded text-sm text-gray-600">
              {selectedItemIds.length} item{selectedItemIds.length === 1 ? '' : 's'} selected
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={handleConfirmBatch} disabled={selectedItemIds.length === 0}>
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Export Seeding Batch
              </Button>
              {selectedItemIds.length > 0 && (
                <span className="text-xs text-gray-500">
                  Hands off to the chosen external system, then marks items as Seeded here.
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Currently Seeded */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Currently Seeded · {currentlySeeded.length} items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              These items are embedded in live test forms and accruing response data.
            </p>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seeded</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleSeededItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/item-bank/${item.level}/${item.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {formatItemIdForDisplay(item.id)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.difficulty || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getSeededResponsesAccrued(item)} / {SEEDED_RESPONSE_TARGET}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatSeededDate(item.lastEditedDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!showAllSeeded && hiddenSeededCount > 0 && (
              <div className="mt-4">
                <Button variant="outline" onClick={() => setShowAllSeeded(true)}>
                  Show {hiddenSeededCount} more item{hiddenSeededCount === 1 ? '' : 's'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isExportDialogOpen} onOpenChange={(open) => { if (!isExporting) setIsExportDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              Export Seeding Batch
            </DialogTitle>
            <DialogDescription>
              {selectedItemIds.length} item{selectedItemIds.length === 1 ? '' : 's'} will be handed off to the chosen external system. Items will then be marked as Seeded and the export logged in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Destination</div>
            <RadioGroup
              value={exportTarget}
              onValueChange={(value) => setExportTarget(value as ExportTargetId)}
              className="space-y-2"
            >
              {EXPORT_TARGETS.map((option) => (
                <Label
                  key={option.id}
                  htmlFor={`export-target-${option.id}`}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    exportTarget === option.id ? 'border-blue-300 bg-blue-50/40' : 'hover:bg-gray-50'
                  }`}
                >
                  <RadioGroupItem id={`export-target-${option.id}`} value={option.id} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{option.description}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>

            <div className="rounded-md border bg-gray-50 p-3 text-xs text-gray-600 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>
                On confirm, the batch manifest is posted to the selected external system. This is a demo handoff &mdash; no live integration is called.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmExport} disabled={isExporting}>
              {isExporting ? 'Exporting…' : `Export ${selectedItemIds.length} item${selectedItemIds.length === 1 ? '' : 's'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

