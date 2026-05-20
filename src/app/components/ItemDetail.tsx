import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  AlertTriangle, 
  Check, 
  AlertCircle, 
  Flag, 
  Archive,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { getItemById } from '../data/mockData';
import { CEFRLevel } from '../data/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

export function ItemDetail() {
  const { level, itemId } = useParams<{ level: CEFRLevel; itemId: string }>();
  const item = getItemById(itemId!);
  const [passageExpanded, setPassageExpanded] = useState(false);

  if (!item) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-gray-600">Item not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/library" className="hover:underline">Library</Link>
          <span className="text-gray-400">/</span>
          <Link to={`/item-bank/${level}`} className="hover:underline">{level}</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{item.id}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {item.status === 'Compromised' && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  • Compromised
                </Badge>
              )}
              <Badge variant="outline">{item.level}</Badge>
              <Badge variant="outline">{item.skill}</Badge>
              <Badge variant="outline">{item.itemType}</Badge>
            </div>
          </div>
          <Button variant="outline">Restore to Active</Button>
        </div>

        {/* Compromised Warning */}
        {item.status === 'Compromised' && (
          <Card className="mb-6 border-orange-300 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">
                    Compromised — High exposure
                  </div>
                  <div className="text-sm text-gray-700">
                    High exposure count ({item.exposureCount}) may compromise item security. Consider retiring this item.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Passage (if applicable) */}
        {item.passageId && (
          <Collapsible open={passageExpanded} onOpenChange={setPassageExpanded}>
            <Card className="mb-6">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        PASSAGE {item.passageId}
                      </CardTitle>
                    </div>
                    {passageExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {item.passage || 'Passage content would be displayed here...'}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Item Content */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {item.title}
            </h2>

            {/* MCQ Options */}
            {item.itemType === 'Multiple Choice' && item.options && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-500 uppercase mb-3">Options</div>
                {item.options.map((option) => (
                  <div
                    key={option.label}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      option.correct
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="font-semibold text-gray-700 min-w-[2rem]">
                        {option.label}
                      </div>
                      <div className="flex-1 text-gray-900">{option.text}</div>
                      {option.correct && (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Essay Rubric */}
            {item.itemType === 'Essay' && item.rubric && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-500 uppercase mb-3">Rubric</div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {item.rubric}
                  </pre>
                </div>
              </div>
            )}

            {/* Speaking Prompt */}
            {item.itemType === 'Speaking' && (
              <div className="space-y-3">
                {item.rubric && (
                  <>
                    <div className="text-sm font-medium text-gray-500 uppercase mb-3">Rubric</div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {item.rubric}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Listening Audio */}
            {item.skill === 'Listening' && item.audioAsset && (
              <div className="space-y-3 mt-6">
                <div className="text-sm font-medium text-gray-500 uppercase mb-3">Audio Asset</div>
                <div className="p-4 bg-gray-50 rounded-lg border flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                    🎵
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.audioAsset}</div>
                    <div className="text-xs text-gray-500">Audio file for listening comprehension</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Psychometrics Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Psychometrics</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">
                      <strong>IRT (Item Response Theory)</strong> parameters describe item characteristics:
                      <br />• <strong>b</strong> (difficulty): Higher values = harder items
                      <br />• <strong>a</strong> (discrimination): How well item separates ability levels
                      <br />• <strong>c</strong> (guessing): Probability of correct guess
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {item.irtParameters ? (
              <div className="space-y-4">
                {/* IRT Source */}
                <div className="flex items-center gap-2 mb-4">
                  {item.irtParameters.calibratedFromFieldTest ? (
                    <Badge variant="default" className="bg-green-600">Calibrated from Field Test</Badge>
                  ) : item.irtParameters.predictedByAI ? (
                    <Badge variant="secondary">Predicted by AI</Badge>
                  ) : (
                    <Badge variant="outline">Unknown Source</Badge>
                  )}
                  {item.irtParameters.predictedByAI && item.aiModelVersion && (
                    <span className="text-xs text-gray-500">
                      Model: {item.aiModelVersion}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Difficulty (b-parameter)</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {item.irtParameters.b.toFixed(2)}
                    </div>
                    {item.difficulty && (
                      <div className="text-xs text-gray-500 mt-1">
                        Qualitative: {item.difficulty}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Discrimination (a-parameter)</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {item.irtParameters.a.toFixed(2)}
                    </div>
                    {item.discrimination && (
                      <div className="text-xs text-gray-500 mt-1">{item.discrimination}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Guessing (c-parameter)</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {item.irtParameters.c.toFixed(2)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-6">
                  {item.irtParameters.sampleSize && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Sample Size</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {item.irtParameters.sampleSize.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {item.irtParameters.modelVersion && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Model Version</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {item.irtParameters.modelVersion}
                      </div>
                    </div>
                  )}

                  {item.irtParameters.predictionDate && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {item.irtParameters.calibratedFromFieldTest ? 'Calibration Date' : 'Prediction Date'}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {new Date(item.irtParameters.predictionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  )}

                  {item.confidence !== undefined && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Confidence</div>
                      <div className="text-lg font-semibold text-gray-900">{item.confidence}%</div>
                    </div>
                  )}
                </div>

                {/* Manual Override */}
                {item.manualOverride && item.manualOverrideReason && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-blue-900">Manual Override Applied</div>
                        <div className="text-sm text-blue-700 mt-1">{item.manualOverrideReason}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No psychometric parameters available for this item.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Properties */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Item Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Sub-Skill</div>
                <div className="font-medium text-gray-900">{item.subSkill || 'N/A'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Cognitive Level</div>
                <div className="font-medium text-gray-900">{item.cognitiveLevel || 'N/A'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Content Domain</div>
                <div className="font-medium text-gray-900">{item.contentDomain || 'N/A'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Language Variety</div>
                <div className="font-medium text-gray-900">{item.languageVariety || 'N/A'}</div>
              </div>

              {item.exposureCount !== undefined && (
                <div>
                  <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    Exposure Count
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Number of times this item has been administered</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className={`font-bold ${item.exposureCount > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.exposureCount}
                  </div>
                  {item.lastEditedDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Last: {new Date(item.lastEditedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              )}

              {item.enemyItems && item.enemyItems.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    Enemy Items
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            <strong>Enemy items</strong> should not appear together in the same test form,
                            typically due to content overlap or shared context.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-1">
                    {item.enemyItems.map((enemyId) => (
                      <Badge key={enemyId} variant="outline" className="text-xs">
                        {enemyId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Screening Results */}
        {item.screening && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Screening</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(item.screening).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <Badge
                      variant={
                        value === 'Pass' ? 'default' :
                        value === 'Review' ? 'secondary' :
                        'destructive'
                      }
                      className={
                        value === 'Pass' ? 'bg-green-600' :
                        value === 'Review' ? 'bg-yellow-600' :
                        ''
                      }
                    >
                      {value}
                    </Badge>
                  </div>
                ))}
              </div>

              {item.screening.similarity === 'Review' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    High exposure count ({item.exposureCount}) may compromise item security. Consider retiring this item.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Workflow & Review History */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Review History & Workflow State</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Current State */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Current State</div>
              <Badge className="text-base px-3 py-1">
                {item.workflowState || 'Unknown'}
              </Badge>
            </div>

            {/* Timeline */}
            {item.reviewHistory && item.reviewHistory.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700">Timeline</div>
                {item.reviewHistory.map((entry, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      {index < item.reviewHistory!.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-300 my-1" style={{ minHeight: '2rem' }} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{entry.action}</span>
                        <Badge variant="outline" className="text-xs">{entry.state}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {entry.reviewer} · {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      {entry.notes && (
                        <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Authorship */}
            <Separator className="my-6" />
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Author</div>
                <div className="font-medium text-gray-900">{item.author || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Last Edited</div>
                <div className="font-medium text-gray-900">
                  {item.lastEditedDate
                    ? new Date(item.lastEditedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </div>
                {item.lastEditedBy && (
                  <div className="text-xs text-gray-500 mt-1">by {item.lastEditedBy}</div>
                )}
              </div>
              <div>
                <div className="text-gray-600 mb-1">Reviewers</div>
                {item.reviewers && item.reviewers.length > 0 ? (
                  <div className="space-y-1">
                    {item.reviewers.map((reviewer, index) => (
                      <div key={index} className="text-sm font-medium text-gray-900">
                        {reviewer}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">None</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Flag for Review
              </Button>
              <Button variant="outline" className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50">
                <Archive className="w-4 h-4" />
                Retire Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-sm text-gray-500 flex items-center justify-between">
          <div>
            Created {item.createdDate
              ? new Date(item.createdDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A'}
          </div>
          <div>
            Last updated {item.lastEditedDate
              ? new Date(item.lastEditedDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
