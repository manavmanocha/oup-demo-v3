import { Link } from 'react-router';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Headphones, FileText, BookOpen, Play, Mic2, PenTool } from 'lucide-react';
import { AssessmentItem } from '../data/types';

interface QuestionCardProps {
  item: AssessmentItem;
}

export function QuestionCard({ item }: QuestionCardProps) {
  const isListening = item.skill === 'Listening';

  return (
    <Link to={`/item-bank/${item.level}/${item.id}`}>
      <Card className="hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col group overflow-hidden">
        {/* Top Accent Bar */}
        <div className={`h-1 ${
          isListening ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
          item.skill === 'Reading' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
          item.skill === 'Writing' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
          'bg-gradient-to-r from-orange-500 to-red-500'
        }`} />

        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Skill Badge & Audio Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isListening ? 'bg-blue-100' :
                item.skill === 'Reading' ? 'bg-green-100' :
                item.skill === 'Writing' ? 'bg-purple-100' :
                'bg-orange-100'
              }`}>
                {isListening ? (
                  <Headphones className="w-5 h-5 text-blue-600" />
                ) : item.skill === 'Reading' ? (
                  <BookOpen className="w-5 h-5 text-green-600" />
                ) : item.skill === 'Writing' ? (
                  <PenTool className="w-5 h-5 text-purple-600" />
                ) : (
                  <Mic2 className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">
                  {item.skill}
                </div>
                <div className="text-xs text-gray-500">{item.itemType}</div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              {item.level}
            </Badge>
          </div>

          {/* Audio Indicator */}
          {isListening && item.audioAsset && (
            <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Audio Recording</span>
            </div>
          )}

          {/* Question Title - Most Prominent */}
          <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-3 min-h-[4.5rem] group-hover:text-blue-700 transition-colors">
            {item.title}
          </h3>

          {/* Context/Passage Preview */}
          <div className="flex-1 mb-4">
            {item.passage && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-600 line-clamp-2 italic">
                  "{item.passage.substring(0, 120)}..."
                </p>
              </div>
            )}

            {/* Options Count for MCQ */}
            {item.options && item.options.length > 0 && !item.passage && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{item.options.length}</span> answer choices
              </div>
            )}
          </div>

          {/* Bottom Metadata - Minimal & Clean */}
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
            {item.subSkill && (
              <div className="text-xs text-gray-600 line-clamp-1">
                <span className="font-medium">Focus:</span> {item.subSkill}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.difficulty && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      item.difficulty === 'Easy'
                        ? 'border-green-300 text-green-700 bg-green-50'
                        : item.difficulty === 'Medium'
                          ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                          : 'border-red-300 text-red-700 bg-red-50'
                    }`}
                  >
                    {item.difficulty}
                  </Badge>
                )}
                <span className="text-xs text-gray-400">{item.id}</span>
              </div>
              <div className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View →
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
