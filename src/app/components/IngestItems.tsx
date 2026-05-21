import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Download, FileText, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { taxonomies } from '../data/taxonomy';

export function IngestItems() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'metadata' | 'validate' | 'success'>('upload');
  const [fileName, setFileName] = useState('');
  const [itemCount, setItemCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata configuration state
  const [level, setCefrLevel] = useState('');
  const [skill, setSkill] = useState('');
  const [itemType, setItemType] = useState('');
  const [source, setSource] = useState('');

  // Get taxonomy options
  const cefrLevelsTaxonomy = taxonomies.find(t => t.id === 'cefrLevels');
  const skillsTaxonomy = taxonomies.find(t => t.id === 'skills');
  const itemTypesTaxonomy = taxonomies.find(t => t.id === 'itemTypes');

  // Mock uploaded items for validation preview
  const mockItems = [
    { id: 'ITM-NEW-001', content: 'What is the main idea of the passage?', type: 'Multiple Choice', issues: [] },
    { id: 'ITM-NEW-002', content: 'Complete the sentence: The weather today is ___', type: 'Fill in the Blanks', issues: [] },
    { id: 'ITM-NEW-003', content: 'Listen to the audio and answer the question.', type: 'Listening Comprehension', issues: ['Missing audio file reference'] },
    { id: 'ITM-NEW-004', content: 'Match the words with their definitions.', type: 'Match the Following', issues: [] },
    { id: 'ITM-NEW-005', content: 'Write a short essay about your favorite book.', type: 'Composition', issues: [] },
  ];

  const validItemsCount = mockItems.filter(item => item.issues.length === 0).length;
  const invalidItemsCount = mockItems.filter(item => item.issues.length > 0).length;

  const supportedItemTypes = [
    {
      name: 'MCQ',
      description: 'Multiple choice question activity with selectable answer options.',
    },
    {
      name: 'Composition',
      description: 'Writing-based activity for evaluating composition and language skills.',
    },
    {
      name: 'Fill in the Blanks',
      description: 'Interactive activity where learners complete missing words or phrases.',
    },
    {
      name: 'Match the Following',
      description: 'Matching activity that connects related items, terms, or concepts.',
    },
    {
      name: 'Reading Comprehension',
      description: 'Passage-based activity designed to assess reading and understanding skills.',
    },
    {
      name: 'Drag and Drop',
      description: 'Interactive activity where users drag items into the correct positions.',
    },
    {
      name: 'Vocabulary',
      description: 'Word and meaning based activity focused on vocabulary building.',
    },
    {
      name: 'Listening Comprehension',
      description: 'Audio-based activity to evaluate listening and comprehension abilities.',
    },
    {
      name: 'Short Answer',
      description: 'Open-ended activity requiring brief written responses from learners.',
    },
  ];

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setItemCount(mockItems.length);
    setStep('metadata');
  };

  const handleMetadataSubmit = () => {
    if (level && skill && itemType && source) {
      setStep('validate');
    }
  };

  const handleValidationSubmit = () => {
    setStep('success');
  };

  const handleFinish = () => {
    navigate('/library');
  };

  const handleBack = () => {
    if (step === 'metadata') setStep('upload');
    else if (step === 'validate') setStep('metadata');
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/library" className="hover:underline">Library</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Ingest Items</span>
        </div>

        {step === 'upload' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ingest New Items</h1>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Upload Items File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Upload your assessment items via CSV or Excel file. You will be able to configure metadata, preview, and validate your items before adding them to the global library.
                  </p>

                  <button className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Download className="w-4 h-4" />
                    Download Sample CSV Template
                  </button>

                  <div
                    className={`border-2 border-dashed rounded-lg mt-4 cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  >
                    <div className="pt-12 pb-12 px-6">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className={`w-16 h-16 mb-4 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                        <p className="text-gray-700 mb-4">
                          <span className="font-medium">Drag and drop your file here</span>, or{' '}
                          <span className="text-blue-600 hover:underline">browse</span>
                        </p>
                        <p className="text-sm text-gray-500">Supported formats: CSV, XLSX, XLS</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-1">File Requirements</p>
                          <ul className="text-blue-700 space-y-1 list-disc list-inside">
                            <li>Required columns: Item ID, Content, Type, Answer Key</li>
                            <li>Optional columns: Distractors, Metadata, Tags</li>
                            <li>Maximum 500 items per upload</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Right Column - Supported Item Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Supported Item Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-6">
                    Following item types are supported for ingestion.
                  </p>

                  <div className="space-y-4">
                    {supportedItemTypes.map((itemType, index) => (
                      <div key={index} className="flex gap-3">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            {itemType.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {itemType.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/library')}
              >
                Back to Library
              </Button>
            </div>
          </>
        )}

        {step === 'metadata' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure Metadata</h1>
              <p className="text-gray-600">
                Set default metadata for {itemCount} items from <span className="font-medium">{fileName}</span>
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  File Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">File Name</div>
                    <div className="text-sm font-medium text-gray-900">{fileName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Items Detected</div>
                    <div className="text-sm font-medium text-gray-900">{itemCount} items</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  Default Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    CEFR Level <span className="text-red-500">*</span>
                  </label>
                  <Select value={level} onValueChange={setCefrLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CEFR level" />
                    </SelectTrigger>
                    <SelectContent>
                      {cefrLevelsTaxonomy?.tree.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Skill <span className="text-red-500">*</span>
                  </label>
                  <Select value={skill} onValueChange={setSkill}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillsTaxonomy?.tree.map(skill => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Item Type <span className="text-red-500">*</span>
                  </label>
                  <Select value={itemType} onValueChange={setItemType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemTypesTaxonomy?.tree.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Cambridge Assessment, Internal Development"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/library')}>
                  Cancel
                </Button>
                <Button
                  onClick={handleMetadataSubmit}
                  disabled={!level || !skill || !itemType || !source}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'validate' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation & Preview</h1>
              <p className="text-gray-600">
                Review the items before adding them to the global library.
              </p>
            </div>

            {/* Validation Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{itemCount}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{validItemsCount}</div>
                    <div className="text-sm text-gray-600">Valid</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">{invalidItemsCount}</div>
                    <div className="text-sm text-gray-600">Issues Found</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metadata Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  Applied Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">CEFR: {cefrLevelsTaxonomy?.tree.find(l => l.id === level)?.label}</Badge>
                  <Badge variant="outline">Skill: {skillsTaxonomy?.tree.find(s => s.id === skill)?.label}</Badge>
                  <Badge variant="outline">Type: {itemTypesTaxonomy?.tree.find(t => t.id === itemType)?.label}</Badge>
                  <Badge variant="outline">Source: {source}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Items Preview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  Items Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg ${
                        item.issues.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{item.id}</span>
                          <Badge variant="outline" className="text-xs">{item.type}</Badge>
                          {item.issues.length === 0 && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                      {item.issues.length > 0 && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-white border border-orange-200 rounded">
                          <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-orange-800">
                            {item.issues.map((issue, idx) => (
                              <div key={idx}>{issue}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {invalidItemsCount > 0 && (
              <Card className="bg-orange-50 border-orange-200 mb-8">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-900">
                      <p className="font-medium mb-1">Issues Detected</p>
                      <p className="text-orange-700">
                        {invalidItemsCount} item(s) have validation issues. You can proceed to ingest valid items only, or cancel and fix the issues.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/library')}>
                  Cancel
                </Button>
                <Button onClick={handleValidationSubmit}>
                  Ingest {validItemsCount} Item(s)
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Items Ingested Successfully
              </h1>
              <p className="text-gray-600">
                {validItemsCount} items have been added to the global library.
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Ingestion Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Added:</span>
                    <span className="font-semibold text-gray-900">{validItemsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Skipped:</span>
                    <span className="font-semibold text-gray-900">{invalidItemsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CEFR Level:</span>
                    <span className="font-semibold text-gray-900">{cefrLevelsTaxonomy?.tree.find(l => l.id === level)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skill:</span>
                    <span className="font-semibold text-gray-900">{skillsTaxonomy?.tree.find(s => s.id === skill)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="font-semibold text-gray-900">{source}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200 mb-8">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Next Steps</p>
                    <p className="text-blue-700">
                      Your items are now in the global library with "Draft" status. You can review them in the Library and add them to the Pre-Testing Pipeline for screening and difficulty prediction.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => {
                setStep('upload');
                setFileName('');
                setItemCount(0);
                setCefrLevel('');
                setSkill('');
                setItemType('');
                setSource('');
              }}>
                Ingest More Items
              </Button>
              <Button onClick={handleFinish}>
                Go to Library
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
