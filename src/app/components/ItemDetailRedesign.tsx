import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Headphones,
  Play,
  Pause,
  Volume2,
  CheckCircle2,
  XCircle,
  BookOpen,
  Lightbulb,
  AlertCircle,
  Tag,
  Calendar,
  User,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  FileText,
  Info,
} from 'lucide-react';
import { getItemById, getAllItems } from '../data/mockData';
import { CEFRLevel } from '../data/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function ItemDetailRedesign() {
  const { level, itemId } = useParams<{ level: CEFRLevel; itemId: string }>();
  const item = getItemById(itemId!);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [passageExpanded, setPassageExpanded] = useState(true);

  if (!item) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Item not found</p>
        </div>
      </div>
    );
  }

  const isListening = item.skill === 'Listening';
  const allItems = getAllItems();
  const relatedItems = allItems
    .filter(i =>
      i.id !== item.id &&
      i.skill === item.skill &&
      i.level === item.level
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/library">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Library
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{item.skill}</span>
                <span>•</span>
                <span>{item.level}</span>
                <span>•</span>
                <span className="text-gray-400">{item.id}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                Edit Item
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="space-y-6">
            {/* Audio Player for Listening Items */}
            {isListening && item.audioAsset && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Headphones className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Audio Recording</h3>
                      <p className="text-sm text-gray-600 mb-3">{item.audioAsset}</p>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() => setAudioPlaying(!audioPlaying)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {audioPlaying ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Play Audio
                            </>
                          )}
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Volume2 className="w-4 h-4" />
                          <div className="w-32 h-1 bg-gray-300 rounded-full">
                            <div className="w-3/4 h-full bg-blue-600 rounded-full"></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">0:00 / 2:45</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Passage/Context */}
            {item.passage && (
              <Collapsible open={passageExpanded} onOpenChange={setPassageExpanded}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">
                            {isListening ? 'Transcript' : 'Reading Passage'}
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
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                          {item.passage}
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Main Question */}
            <Card className="border-2 border-blue-200 shadow-md">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      Q
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Question</h2>
                  </div>
                  <p className="text-xl text-gray-900 leading-relaxed">
                    {item.title}
                  </p>
                </div>

                {/* Answer Options */}
                {item.options && item.options.length > 0 && (
                  <div className="space-y-3">
                    {item.options.map((option) => (
                      <div
                        key={option.label}
                        className={`p-5 rounded-xl border-2 transition-all ${
                          showExplanation && option.correct
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : showExplanation
                              ? 'border-gray-200 bg-gray-50 opacity-75'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                            showExplanation && option.correct
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {option.label}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-gray-900">{option.text}</p>
                          </div>
                          {showExplanation && option.correct && (
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                          )}
                          {showExplanation && !option.correct && (
                            <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rubric for Speaking/Writing */}
                {item.rubric && (item.skill === 'Speaking' || item.skill === 'Writing') && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Assessment Criteria</h3>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {item.rubric}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Show Answer Button */}
                {!showExplanation && item.options && item.options.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <Button
                      onClick={() => setShowExplanation(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Show Correct Answer & Explanation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Explanation Section */}
            {showExplanation && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-green-900">
                      Answer Explanation
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Correct Answer</h4>
                    <p className="text-gray-700">
                      {item.options?.find(o => o.correct)?.text || 'Answer explanation not available'}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Why This Answer?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      This is the correct answer because it directly addresses the main question in the {item.skill.toLowerCase()} exercise.
                      {isListening && ' The audio recording provides clear evidence supporting this choice.'}
                    </p>
                  </div>

                  {item.subSkill && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Learning Focus</h4>
                      <p className="text-gray-700">
                        This question tests your ability in <strong>{item.subSkill}</strong> at the {item.level} level.
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowExplanation(false)}
                    className="w-full border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Hide Explanation
                  </Button>
                </CardContent>
              </Card>
            )}

            
            {/* Psychometrics Section */}
            <Card>
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
            <Card>
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

            {/* Workflow & Review History */}
            <Card>
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
                  <div className="space-y-4 mb-6">
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

            {/* Similar Questions - At the bottom */}
            {relatedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Similar Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedItems.map((relatedItem) => (
                      <Link
                        key={relatedItem.id}
                        to={`/item-bank/${relatedItem.level}/${relatedItem.id}`}
                        className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {relatedItem.skill === 'Listening' ? (
                              <Headphones className="w-5 h-5 text-gray-600" />
                            ) : (
                              <FileText className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                              {relatedItem.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Badge variant="outline" className="text-xs">
                                {relatedItem.level}
                              </Badge>
                              <span>{relatedItem.itemType}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
