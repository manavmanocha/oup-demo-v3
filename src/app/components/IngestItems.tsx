import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, Download, FileText } from 'lucide-react';

export function IngestItems() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Handle file drop logic here
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Handle file selection logic here
  };

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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ingest New Items</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Drop File to Ingest */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Drop File to Ingest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Drop your assessment items or click to browse/select files. You will be able to preview and review your items later before adding them to the global item bank.
              </p>

              <button className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Download className="w-4 h-4" />
                Download Sample CSV
              </button>

              {/* Drag and Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-12 transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-700 mb-2">
                    <span className="font-medium">Drag and drop files</span> here, or{' '}
                    <label className="text-blue-600 cursor-pointer hover:underline">
                      click
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".csv,.xlsx,.xls"
                        onChange={handleChange}
                      />
                    </label>{' '}
                    to select from your computer
                  </p>
                </div>
              </div>
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
            Cancel
          </Button>
          <Button>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
