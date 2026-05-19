import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { allMockItems } from '../data/mockData';

export function Screening() {
  const flaggedItems = allMockItems.filter(item => 
    item.screening?.similarity === 'Review' ||
    item.screening?.cefrFit === 'Review' ||
    item.screening?.distractorStrength === 'Review' ||
    item.screening?.fairness === 'Review' ||
    item.screening?.clarity === 'Review'
  ).slice(0, 6);

  const awaitingScreening = 43;
  const flaggedCount = 14;
  const passedCount = 284;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows" className="hover:underline">Workflows</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pre-Testing Pipeline</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Screening</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase mb-1">Step 1</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Screening</h1>
            <p className="text-gray-600">
              AI checks each item across 5 dimensions: CEFR fit, distractor strength, clarity, fairness, and similarity.
            </p>
          </div>
          <Link to="/workflows/pre-testing-pipeline/screening/start">
            <Button>+ Start Screening</Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Awaiting Screening</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{awaitingScreening}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{flaggedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Passed (All Clear)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{passedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Flagged Items · {flaggedItems.length} items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              These items have potential issues identified by the AI. Please review and decide whether to approve, reject.
            </p>

            <div className="space-y-6">
              {flaggedItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/item-bank/${item.cefrLevel}/${item.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {item.id}
                      </Link>
                      <Badge variant="outline">{item.cefrLevel}</Badge>
                      <Badge variant="outline">{item.skill}</Badge>
                      <Badge variant="outline">{item.itemType}</Badge>
                    </div>
                  </div>

                  <div className="text-sm text-gray-900 mb-4">{item.content}</div>

                  {/* Screening Issues */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.screening?.cefrFit === 'Review' && (
                      <Badge variant="secondary">CEFR Fit: Review</Badge>
                    )}
                    {item.screening?.distractorStrength === 'Review' && (
                      <Badge variant="secondary">Distractor: Review</Badge>
                    )}
                    {item.screening?.fairness === 'Review' && (
                      <Badge variant="secondary">Fairness: Review</Badge>
                    )}
                    {item.screening?.fairness === 'Fail' && (
                      <Badge variant="destructive">Fairness: Fail</Badge>
                    )}
                    {item.screening?.clarity === 'Review' && (
                      <Badge variant="secondary">Clarity: Review</Badge>
                    )}
                    {item.screening?.similarity === 'Review' && (
                      <Badge variant="secondary">Similarity: Review</Badge>
                    )}
                  </div>

                  {/* AI Feedback */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-gray-700">
                    {index === 0 && "The grammar in the stem 'If Mary are not free' is incorrect and should be 'If Mary is not free'."}
                    {index === 1 && "The correct answer is not explicitly stated but requires some inference, and the distractors could be more plausible."}
                    {index === 2 && "The phrase 'housewife' may be considered culturally insensitive or outdated. Consider using gender-neutral language like 'homemaker'."}
                    {index === 3 && "This item is very similar to ITM-SPEAK-0002 already in the bank - consider revising the prompt."}
                    {index === 4 && "This item is too difficult for C1 level based on vocabulary complexity and semantic requirements."}
                    {index === 5 && "The grammar and punctuation in the answer options need correction for clarity."}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="outline">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
