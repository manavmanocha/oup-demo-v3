import { Link } from 'react-router';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Headphones, BookOpen, Play, Mic2, PenTool } from 'lucide-react';
import { AssessmentItem } from '../data/types';

interface QuestionCardProps {
  item: AssessmentItem;
}

export function QuestionCard({ item }: QuestionCardProps) {
  const isListening = item.skill === 'Listening';

  return (
    <Link to={`/item-bank/${item.level}/${item.id}`} className="block h-full">
      <Card className="hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer h-full min-h-[300px] sm:min-h-[350px] lg:min-h-[350px] flex flex-col group overflow-hidden relative">
        {/* Top Accent Bar */}
        <div className={`h-1.5 transition-all duration-300 ${
          isListening ? 'bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:h-2' :
          item.skill === 'Reading' ? 'bg-gradient-to-r from-green-500 to-emerald-500 group-hover:h-2' :
          item.skill === 'Writing' ? 'bg-gradient-to-r from-purple-500 to-pink-500 group-hover:h-2' :
          'bg-gradient-to-r from-orange-500 to-red-500 group-hover:h-2'
        }`} />

        <CardContent className="p-4 sm:p-5 lg:p-6 pt-0 sm:pt-0 lg:pt-0 flex-1 flex flex-col">
          {/* Item ID - Highlighted Section */}
          <div className="mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-md shadow-sm group-hover:shadow-md transition-shadow">
                  <div className="text-[8px] sm:text-xs font-bold text-white tracking-wide">
                    {item.id}
                  </div>
                </div>
              </div>
              <Badge
                variant={item.status === 'Compromised' ? 'destructive' : 'outline'}
                className="text-[8px] sm:text-xs font-medium flex-shrink-0"
              >
                {item.status || 'Draft'}
              </Badge>
            </div>
          </div>

          {/* Skill Badge & Type with Icon */}
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
              isListening ? 'bg-gradient-to-br from-blue-100 to-blue-50' :
              item.skill === 'Reading' ? 'bg-gradient-to-br from-green-100 to-green-50' :
              item.skill === 'Writing' ? 'bg-gradient-to-br from-purple-100 to-purple-50' :
              'bg-gradient-to-br from-orange-100 to-orange-50'
            }`}>
              {isListening ? (
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              ) : item.skill === 'Reading' ? (
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              ) : item.skill === 'Writing' ? (
                <PenTool className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              ) : (
                <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 mb-0.5 truncate">
                {item.skill}
              </div>
              <div className="text-xs text-gray-600 line-clamp-1">{item.itemType}</div>
              {isListening && item.audioAsset && (
                <div className="flex items-center gap-1 mt-1">
                  <Play className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Audio</span>
                </div>
              )}
            </div>
            <Badge variant="outline" className="text-[11px] sm:text-xs font-semibold">
              {item.level}
            </Badge>
          </div>

          {/* Question Title - More Prominent */}
          <h5 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 min-h-[2.5rem] sm:min-h-[3rem] group-hover:text-blue-700 transition-colors leading-snug break-words">
            {item.title.substring(0, 50)}...
          </h5>

          {/* Context/Passage Preview */}
          {item.passage && (
            <div className="mb-3">
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <p className="text-[10px] text-gray-600 italic leading-snug break-words">
                  "{item.passage.substring(0, 100)}..."
                </p>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {item.imageAsset && (
            <div className="mb-3">
              <div className="bg-gray-50 rounded-lg p-0 border border-gray-200 h-[96px] sm:h-[100px] flex items-center justify-center overflow-hidden">
                  <img
                      src={item.imageAsset}
                      alt={item.imageAltText || item.title || 'Reference image for this item'}
                      className="block w-full h-full object-contain mx-auto"
                    />
              </div>
            </div>
          )}

          {/* Bottom Metadata Section */}
          <div className="mt-auto pt-3 border-t border-gray-100 space-y-2.5">
            {/* Primary Metadata */}
            <div className="flex flex-wrap gap-1">
              {item.cognitiveLevel && (
                <Badge variant="outline" className="text-[9px] sm:text-xxs px-2 py-0.5 font-normal bg-white max-w-full inline-flex items-center gap-1 overflow-hidden">
                  <span className="font-medium shrink-0">Cognitive Level:</span>
                  <span className="truncate max-w-[8rem] sm:max-w-[9.5rem]">{item.cognitiveLevel}</span>
                </Badge>
              )}
              {item.contentDomain && (
                <Badge variant="outline" className="text-[9px] sm:text-xxs px-2 py-0.5 font-normal bg-white max-w-full inline-flex items-center gap-1 overflow-hidden">
                  <span className="font-medium shrink-0">Content Domain:</span>
                  <span className="truncate max-w-[8rem] sm:max-w-[9.5rem]">{item.contentDomain}</span>
                </Badge>
              )}
            
              {item.languageVariety && (
                <Badge variant="outline" className="text-[9px] sm:text-xxs px-2 py-0.5 font-normal bg-white max-w-full inline-flex items-center gap-1 overflow-hidden">
                  <span className="font-medium shrink-0">Language Variety:</span>
                  <span className="truncate max-w-[8rem] sm:max-w-[9.5rem]">{item.languageVariety}</span>
                </Badge>
              )}
              {item.topic && (
                <Badge variant="outline" className="text-[9px] sm:text-xxs px-2 py-0.5 font-normal bg-white max-w-full inline-flex items-center gap-1 overflow-hidden">
                  <span className="font-medium shrink-0">Topic:</span>
                  <span className="truncate max-w-[8rem] sm:max-w-[9.5rem]">{item.topic}</span>
                </Badge>
              )}
            </div>

            {/* Difficulty & View Link */}
            <div className="flex items-center justify-between pt-1.5 sm:pt-2 gap-2">
              {item.difficulty && (
                <Badge
                  variant="outline"
                  className={`text-[11px] sm:text-xs font-medium ${
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
              <div className="flex-1" />
              <div className="hidden sm:block text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 whitespace-nowrap">
                View details →
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
