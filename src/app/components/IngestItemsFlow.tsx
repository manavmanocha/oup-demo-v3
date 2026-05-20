import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle2, Upload, FileText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';

interface IngestItemsFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IngestItemsFlow({ isOpen, onClose }: IngestItemsFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'configure' | 'validate' | 'success'>('upload');
  const [fileName, setFileName] = useState('');
  const [itemCount, setItemCount] = useState(0);

  // Configuration state
  const [level, setCefrLevel] = useState('');
  const [skill, setSkill] = useState('');
  const [itemType, setItemType] = useState('');
  const [source, setSource] = useState('');

  // Mock uploaded items for validation preview
  const mockItems = [
    { id: 'ITM-NEW-001', content: 'What is the main idea of the passage?', type: 'Multiple Choice', issues: [] },
    { id: 'ITM-NEW-002', content: 'Complete the sentence: The weather today is ___', type: 'Fill in the Blanks', issues: [] },
    { id: 'ITM-NEW-003', content: 'Listen to the audio and answer the question.', type: 'Listening Comprehension', issues: ['Missing audio file reference'] },
    { id: 'ITM-NEW-004', content: 'Match the words with their definitions.', type: 'Match the Following', issues: [] },
    { id: 'ITM-NEW-005', content: 'Write a short essay about your favorite book.', type: 'Composition', issues: [] },
  ];

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setItemCount(mockItems.length);
    setStep('configure');
  };

  const handleConfigure = () => {
    if (level && skill && itemType && source) {
      setStep('validate');
    }
  };

  const handleValidate = () => {
    setStep('success');
  };

  const handleFinish = () => {
    onClose();
    navigate('/library');
    // Reset state
    setStep('upload');
    setFileName('');
    setItemCount(0);
    setCefrLevel('');
    setSkill('');
    setItemType('');
    setSource('');
  };

  const handleCancel = () => {
    onClose();
    // Reset state
    setStep('upload');
    setFileName('');
    setItemCount(0);
    setCefrLevel('');
    setSkill('');
    setItemType('');
    setSource('');
  };

  const handleBack = () => {
    if (step === 'configure') setStep('upload');
    else if (step === 'validate') setStep('configure');
  };

  const validItemsCount = mockItems.filter(item => item.issues.length === 0).length;
  const invalidItemsCount = mockItems.filter(item => item.issues.length > 0).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && step !== 'success') handleCancel();
    }}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        {step === 'upload' && (
          <div className="space-y-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Upload Items File
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Select a CSV or Excel file containing your assessment items.
            </DialogDescription>

            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-700 mb-4">
                    <span className="font-medium">Drag and drop your file here</span>, or{' '}
                    <label className="text-blue-600 cursor-pointer hover:underline">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </p>
                  <p className="text-sm text-gray-500">Supported formats: CSV, XLSX, XLS</p>
                </div>
              </CardContent>
            </Card>

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

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'configure' && (
          <div className="space-y-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Configure Metadata
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Set default metadata for {itemCount} items from <span className="font-medium">{fileName}</span>
            </DialogDescription>

            <Card>
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

            <Card>
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
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
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
                      <SelectItem value="Reading">Reading</SelectItem>
                      <SelectItem value="Writing">Writing</SelectItem>
                      <SelectItem value="Listening">Listening</SelectItem>
                      <SelectItem value="Speaking">Speaking</SelectItem>
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
                      <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                      <SelectItem value="Fill in the Blanks">Fill in the Blanks</SelectItem>
                      <SelectItem value="Composition">Composition</SelectItem>
                      <SelectItem value="Listening Comprehension">Listening Comprehension</SelectItem>
                      <SelectItem value="Match the Following">Match the Following</SelectItem>
                      <SelectItem value="Reading Comprehension">Reading Comprehension</SelectItem>
                      <SelectItem value="Short Answer">Short Answer</SelectItem>
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

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfigure}
                  disabled={!level || !skill || !itemType || !source}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'validate' && (
          <div className="space-y-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Validation & Preview
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Review the items before adding them to the item bank.
            </DialogDescription>

            {/* Validation Summary */}
            <div className="grid grid-cols-3 gap-4">
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                  Applied Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">CEFR: {level}</Badge>
                  <Badge variant="outline">Skill: {skill}</Badge>
                  <Badge variant="outline">Type: {itemType}</Badge>
                  <Badge variant="outline">Source: {source}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Items Preview */}
            <Card>
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
              <Card className="bg-orange-50 border-orange-200">
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

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleValidate}>
                  Ingest {validItemsCount} Item(s)
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 py-8">
            <DialogTitle className="sr-only">Items Ingested Successfully</DialogTitle>
            <DialogDescription className="sr-only">
              {validItemsCount} items have been added to the item bank.
            </DialogDescription>

            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Items Ingested Successfully
              </h2>
              <p className="text-gray-600 mb-6">
                {validItemsCount} items have been added to the item bank.
              </p>
            </div>

            <Card>
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
                    <span className="font-semibold text-gray-900">{level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skill:</span>
                    <span className="font-semibold text-gray-900">{skill}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="font-semibold text-gray-900">{source}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Next Steps</p>
                    <p className="text-blue-700">
                      Your items are now in the item bank with "Draft" status. You can review them in the Library and add them to the Pre-Testing Pipeline for screening and difficulty prediction.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-3 pt-4">
              <Button onClick={handleFinish}>
                Go to Library
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
