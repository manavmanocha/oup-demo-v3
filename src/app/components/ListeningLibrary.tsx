import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Search,
  Headphones,
  PlayCircle,
  FileAudio,
  ChevronDown,
  ChevronUp,
  Filter,
  Clock,
  Target,
  BookOpen,
} from 'lucide-react';
import { listeningTests, listeningQuestions, ListeningQuestion } from '../data/listeningQuestions';
import { taxonomies } from '../data/taxonomy';

export function ListeningLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['skills', 'tests'])
  );

  // Get listening skills from taxonomy
  const listeningSkillsTaxonomy = taxonomies.find(t => t.id === 'skills');
  const listeningSkills = listeningSkillsTaxonomy?.tree.find(
    node => node.id === 'LISTENING'
  )?.children || [];

  // Get unique values for filters
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const cefrLevels = ['A2', 'B1', 'B2', 'C1', 'C2'];
  const questionTypes = Array.from(
    new Set(listeningQuestions.map(q => q.questionType))
  ).sort();

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return listeningQuestions.filter((question) => {
      const matchesSearch =
        question.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.topic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSkill =
        selectedSkills.length === 0 || selectedSkills.includes(question.skillId);

      const matchesDifficulty =
        selectedDifficulties.length === 0 ||
        selectedDifficulties.includes(question.difficulty);

      const matchesLevel =
        selectedLevels.length === 0 || selectedLevels.includes(question.level);

      const matchesQuestionType =
        selectedQuestionTypes.length === 0 ||
        selectedQuestionTypes.includes(question.questionType);

      return (
        matchesSearch &&
        matchesSkill &&
        matchesDifficulty &&
        matchesLevel &&
        matchesQuestionType
      );
    });
  }, [
    searchQuery,
    selectedSkills,
    selectedDifficulties,
    selectedLevels,
    selectedQuestionTypes,
  ]);

  // Group questions by test
  const questionsByTest = useMemo(() => {
    const grouped: Record<string, ListeningQuestion[]> = {};
    filteredQuestions.forEach(question => {
      if (!grouped[question.testId]) {
        grouped[question.testId] = [];
      }
      grouped[question.testId].push(question);
    });
    return grouped;
  }, [filteredQuestions]);

  // Calculate statistics
  const totalQuestions = listeningQuestions.length;
  const totalTests = listeningTests.length;

  const skillCounts = listeningSkills.reduce((acc, skill) => {
    acc[skill.id] = listeningQuestions.filter(q => q.skillId === skill.id).length;
    return acc;
  }, {} as Record<string, number>);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(s => s !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleDifficulty = (difficulty: string) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleQuestionType = (type: string) => {
    setSelectedQuestionTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedDifficulties([]);
    setSelectedLevels([]);
    setSelectedQuestionTypes([]);
    setSearchQuery('');
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Listening Question Library
          </h1>
          <p className="text-gray-600">
            Comprehensive collection of IELTS listening practice questions organized by
            skill and difficulty
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalQuestions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <FileAudio className="w-4 h-4" />
                Practice Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalTests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <Target className="w-4 h-4" />
                Listening Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {listeningSkills.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Filtered Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {filteredQuestions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Active Filters */}
            {(selectedSkills.length > 0 ||
              selectedDifficulties.length > 0 ||
              selectedLevels.length > 0 ||
              selectedQuestionTypes.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Active Filters
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedSkills.length > 0 && (
                    <Badge variant="secondary">{selectedSkills.length} skills</Badge>
                  )}
                  {selectedDifficulties.length > 0 && (
                    <Badge variant="secondary">
                      {selectedDifficulties.length} difficulties
                    </Badge>
                  )}
                  {selectedLevels.length > 0 && (
                    <Badge variant="secondary">{selectedLevels.length} levels</Badge>
                  )}
                  {selectedQuestionTypes.length > 0 && (
                    <Badge variant="secondary">{selectedQuestionTypes.length} types</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Listening Skills Filter */}
            <div className="border-b pb-4">
              <button
                onClick={() => toggleSection('skills')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <span className="font-semibold text-gray-900">Listening Skills</span>
                {expandedSections.has('skills') ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
              {expandedSections.has('skills') && (
                <div className="space-y-1">
                  {listeningSkills.map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                        selectedSkills.includes(skill.id)
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <span className="text-xs">{skill.label}</span>
                      <span className="text-gray-500 text-xs">
                        {skillCounts[skill.id] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="border-b pb-4">
              <button
                onClick={() => toggleSection('difficulty')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <span className="font-semibold text-gray-900">Difficulty</span>
                {expandedSections.has('difficulty') ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
              {expandedSections.has('difficulty') && (
                <div className="space-y-1">
                  {difficulties.map(difficulty => (
                    <button
                      key={difficulty}
                      onClick={() => toggleDifficulty(difficulty)}
                      className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                        selectedDifficulties.includes(difficulty)
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <span>{difficulty}</span>
                      <span className="text-gray-500">
                        {
                          listeningQuestions.filter(q => q.difficulty === difficulty)
                            .length
                        }
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CEFR Level Filter */}
            <div className="border-b pb-4">
              <button
                onClick={() => toggleSection('level')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <span className="font-semibold text-gray-900">CEFR Level</span>
                {expandedSections.has('level') ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
              {expandedSections.has('level') && (
                <div className="space-y-1">
                  {cefrLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                        selectedLevels.includes(level)
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <span>{level}</span>
                      <span className="text-gray-500">
                        {listeningQuestions.filter(q => q.level === level).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Question Type Filter */}
            <div className="pb-4">
              <button
                onClick={() => toggleSection('questionType')}
                className="flex items-center justify-between w-full text-left mb-3"
              >
                <span className="font-semibold text-gray-900">Question Type</span>
                {expandedSections.has('questionType') ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
              {expandedSections.has('questionType') && (
                <div className="space-y-1">
                  {questionTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleQuestionType(type)}
                      className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-50 ${
                        selectedQuestionTypes.includes(type)
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <span className="text-xs">{type}</span>
                      <span className="text-gray-500 text-xs">
                        {listeningQuestions.filter(q => q.questionType === type).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Questions */}
          <div className="flex-1">
            {/* Tests and Questions */}
            {Object.keys(questionsByTest).length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No questions match your filters</p>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {listeningTests
                  .filter(test => questionsByTest[test.id])
                  .map(test => {
                    const testQuestions = questionsByTest[test.id];
                    const sections = Array.from(
                      new Set(testQuestions.map(q => q.section))
                    ).sort();

                    return (
                      <Card key={test.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                                {test.name}
                              </CardTitle>
                              <p className="text-sm text-gray-600 mb-3">
                                {test.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{test.difficulty}</Badge>
                                <Badge variant="outline">{test.topic}</Badge>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {test.duration} minutes
                                </div>
                                <div className="text-sm text-gray-600">
                                  {testQuestions.length} questions
                                </div>
                              </div>
                            </div>
                            <Button size="sm">
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Start Test
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Questions grouped by section */}
                          {sections.map(section => {
                            const sectionQuestions = testQuestions.filter(
                              q => q.section === section
                            );

                            return (
                              <div key={section} className="mb-6 last:mb-0">
                                <h3 className="font-semibold text-gray-900 mb-3">
                                  Section {section}
                                </h3>
                                <div className="space-y-2">
                                  {sectionQuestions.map(question => (
                                    <div
                                      key={question.id}
                                      className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="text-xs">
                                              Q{question.questionNumber}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                              {question.questionType}
                                            </Badge>
                                            <Badge
                                              variant="outline"
                                              className={`text-xs ${
                                                question.difficulty === 'Easy'
                                                  ? 'border-green-300 text-green-700'
                                                  : question.difficulty === 'Medium'
                                                    ? 'border-yellow-300 text-yellow-700'
                                                    : 'border-red-300 text-red-700'
                                              }`}
                                            >
                                              {question.difficulty}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                              {question.level}
                                            </Badge>
                                          </div>
                                          <p className="text-sm font-medium text-gray-900 mb-1">
                                            {question.question}
                                          </p>
                                          {question.context && (
                                            <p className="text-xs text-gray-600 mb-2">
                                              Context: {question.context}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>Skill: {question.skill}</span>
                                            <span>•</span>
                                            <span>Topic: {question.topic}</span>
                                          </div>
                                          {question.options && (
                                            <div className="mt-3 space-y-1">
                                              {question.options.map((option, idx) => (
                                                <div
                                                  key={idx}
                                                  className="text-xs text-gray-700 pl-4"
                                                >
                                                  {String.fromCharCode(65 + idx)}. {option}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {question.audioFile && (
                                          <FileAudio className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
