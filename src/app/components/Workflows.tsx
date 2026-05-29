import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Workflow } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Workflows() {
  const navigate = useNavigate();

  const workflows = [
    {
      id: 'pre-testing-pipeline',
      title: 'Pre-Testing Pipeline',
      description: 'Review queue health, run screening and difficulty estimation, and seed approved items into the item bank.',
    },
    {
      id: 'pdf-to-text',
      title: 'PDF to Text',
      description: 'Convert uploaded PDF content into structured text with extraction quality checks and metadata mapping.',
    },
    {
      id: 'pdf-to-image',
      title: 'PDF to Image',
      description: 'Convert PDF documents into images for asset pipelines and downstream publishing workflows.',
    },
    {
      id: 'pdf-to-epub',
      title: 'PDF to Accessible ePub',
      description: 'Transform PDF source files into WCAG-friendly ePub outputs with semantic tagging and navigation.',
    },
    {
      id: 'pdf-to-reflowable-html',
      title: 'PDF to Reflowable HTML',
      description: 'Transform book PDFs into reflowable HTML content for responsive and accessible reader experiences.',
    },
    {
      id: 'toc-extraction-and-structuring',
      title: 'TOC extraction and Structuring',
      description: 'Automatically extract and organize table of contents entries from book PDFs for structured navigation.',
    },
    {
      id: 'alt-text-generation',
      title: 'Alt Text Generation',
      description: 'Generate descriptive alternative text for images to support accessibility and compliance standards.',
    },
    {
      id: 'hotlinking',
      title: 'Hotlinking',
      description: 'Insert contextual internal and external hyperlinks across book content for better navigation.',
    },
    {
      id: 'standard-tagging',
      title: 'Standard Tagging',
      description: 'Apply curriculum frameworks or standards tags systematically across content.',
    },
    {
      id: 'glossary-term-linking',
      title: 'Glossary Term Linking',
      description: 'Identify glossary terms and create contextual links across book pages to support comprehension.',
    },
    {
      id: 'video-captioning',
      title: 'Video Captioning and Transcription',
      description: 'Generate timed captions and transcripts for video assets with QA checks before publishing.',
    },
  ];

  const handleCardClick = (workflowId: string) => {
    if (workflowId === 'pre-testing-pipeline') {
      navigate('/workflows/pre-testing-pipeline');
    }
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, workflowId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(workflowId);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflows</h1>
          <p className="text-gray-600">
            Automated pipelines that process, validate, and publish content across the comproDLS platform.
          </p>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="cursor-pointer select-none hover:shadow-md active:scale-[0.99] transition duration-150"
              onClick={() => handleCardClick(workflow.id)}
              onKeyDown={(event) => handleCardKeyDown(event, workflow.id)}
              role="button"
              tabIndex={0}
              aria-label={`${workflow.title} workflow card`}
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Workflow className="w-5 h-5 text-gray-600" />
                  <CardTitle className="text-sm font-medium text-gray-500 uppercase">
                    Workflow
                  </CardTitle>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{workflow.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{workflow.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

