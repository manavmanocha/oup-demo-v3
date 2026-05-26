import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Workflow } from 'lucide-react';

export function Workflows() {
  const workflows = [
    {
      id: 'pre-testing-pipeline',
      title: 'Pre-Testing Pipeline',
      description: 'Review queue health, run screening and difficulty prediction, and seed approved items into the item bank.',
      status: 'Available',
      path: '/workflows/pre-testing-pipeline',
    },
    {
      id: 'pdf-to-text',
      title: 'PDF to Text',
      description: 'Convert uploaded PDF content into structured text with extraction quality checks and metadata mapping.',
      status: 'Coming Soon',
    },
    {
      id: 'pdf-to-epub',
      title: 'PDF to Accessible ePub',
      description: 'Transform PDF source files into WCAG-friendly ePub outputs with semantic tagging and navigation.',
      status: 'Coming Soon',
    },
    {
      id: 'video-captioning',
      title: 'Video Captioning and Transcription',
      description: 'Generate timed captions and transcripts for video assets with QA checks before publishing.',
      status: 'Coming Soon',
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflows</h1>
          <p className="text-gray-600">
            Choose a workflow to start processing. Additional workflows are listed below and will be enabled over time.
          </p>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-gray-600" />
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                      Workflow
                    </CardTitle>
                  </div>
                  <Badge
                    variant={workflow.status === 'Available' ? 'default' : 'secondary'}
                    className={workflow.status === 'Available' ? 'bg-green-600' : ''}
                  >
                    {workflow.status}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{workflow.title}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{workflow.description}</p>
                {workflow.path ? (
                  <Link to={workflow.path}>
                    <Button className="w-full">Open Workflow</Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled>
                    Unavailable
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

