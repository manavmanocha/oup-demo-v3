import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check } from 'lucide-react';

export function Seeding() {
  const recommendedItems = [
    { id: 'ITM-RACE-0238', level: 'A2', skill: 'Reading', itemType: 'Multiple Choice', content: 'If Mary are not free in the daytime, she\'d better call...', difficulty: 'Easy', a2Bank: '71%', confidence: '77%', familyRelationship: 'only 6 items at A2', defer: true },
    { id: 'ITM-RACE-0293', level: 'A2', skill: 'Reading', itemType: 'Multiple Choice', content: 'Why did the girl long for the house on the hill?', difficulty: 'Easy', a2Bank: '71%', confidence: '77%', familyRelationship: 'only 6 items at A2' },
    { id: 'ITM-RACE-0244', level: 'A2', skill: 'Reading', itemType: 'Multiple Choice', content: 'The little boy cried because...', difficulty: 'Easy', a2Bank: '71%', confidence: '86%', familyRelationship: 'Passed all screening checks' },
    { id: 'ITM-RACE-0048', level: 'B1', skill: 'Reading', itemType: 'Multiple Choice', content: 'A tale about fairies should be read...', difficulty: 'Medium', b1Bank: '54%', confidence: '87%', familyRelationship: 'Passed all screening checks', defer: true },
    { id: 'ITM-RACE-0053', level: 'A2', skill: 'Reading', itemType: 'Multiple Choice', content: 'The port of London...', difficulty: 'Easy', a2Bank: '71%', confidence: '91%', familyRelationship: 'Passed all screening checks' },
    { id: 'ITM-RACE-0061', level: 'A2', skill: 'Reading', itemType: 'Multiple Choice', content: 'If Mary are not free in the daytime, she\'d better call...', difficulty: 'Easy', a2Bank: '71%', confidence: '87%', familyRelationship: 'only 6 items at A2' },
  ];

  const currentlySeeded = [
    { id: 'ITM-RACE-0080', item: 'It seems that the argument went like clouds of MBAs...', level: 'B2', difficulty: 'Hard', responses: '0 / 200', seeded: '1 Mar 2025' },
    { id: 'ITM-RACE-0081', item: 'Which of the places mentioned is most likely...', level: 'A2', difficulty: 'Medium', responses: '0 / 200', seeded: '1 Mar 2025' },
    { id: 'ITM-RACE-0160', item: 'The Nazis inflected people who is...', level: 'B1', difficulty: 'Medium', responses: '0 / 200', seeded: '1 Mar 2025' },
    { id: 'ITM-RACE-0161', item: 'We know from the text that the customers at "Sam\'s L...', level: 'B1', difficulty: 'Easy', responses: '0 / 200', seeded: '1 Mar 2025' },
    { id: 'ITM-RACE-0182', item: 'When the father felt his baby, he was worried...', level: 'B1', difficulty: 'Medium', responses: '0 / 200', seeded: '1 Mar 2025' },
    { id: 'ITM-RACE-0193', item: 'Why does the author congratulate the male readers...', level: 'B1', difficulty: 'Medium', responses: '0 / 200', seeded: '1 Mar 2025' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows" className="hover:underline">Workflows</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pre-Testing Pipeline</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Seeding</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase mb-1">Step 3</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seeding</h1>
            <p className="text-gray-600">
              Choose which items to include in live tests next – prioritised by where the bank needs items most.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Ready to Seed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">62</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase">Currently Seeded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">32</div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Gaps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Bank Gaps by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4 mb-6">
              {[
                { level: 'C1', gap: 36, needed: 'critical' },
                { level: 'B1', gap: 28, needed: 'high' },
                { level: 'A2', gap: 23, needed: 'medium' },
                { level: 'B2', gap: 23, needed: 'medium' },
                { level: 'C2', gap: 4, needed: 'low' },
                { level: 'A1', gap: 3, needed: 'low' },
              ].map((item) => (
                <div key={item.level} className="flex-1 text-center">
                  <div
                    className={`rounded-t mx-auto ${
                      item.needed === 'critical' ? 'bg-red-400' :
                      item.needed === 'high' ? 'bg-orange-400' :
                      item.needed === 'medium' ? 'bg-yellow-400' :
                      'bg-gray-300'
                    }`}
                    style={{ 
                      width: '100%',
                      height: `${Math.max(item.gap * 2, 20)}px`,
                    }}
                  />
                  <div className="text-sm font-bold text-gray-900 mt-2">{item.level}</div>
                  <div className="text-xs text-gray-500">{item.gap} needed</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended for Seeding */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Recommended for Seeding · 6 items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              Select items to include in the next live test batch.
            </p>

            <div className="space-y-4">
              {recommendedItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <input type="checkbox" className="mt-1" defaultChecked={!item.defer} />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Link
                          to={`/item-bank/${item.level}/${item.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {item.id}
                        </Link>
                        <Badge variant="outline">{item.level}</Badge>
                        <Badge variant="outline">{item.skill}</Badge>
                        <Badge variant="outline">{item.itemType}</Badge>
                      </div>

                      <div className="text-sm text-gray-900 mb-3">{item.content}</div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Difficulty: {item.difficulty}
                        </Badge>
                        {item.defer && (
                          <Badge variant="secondary">Defer</Badge>
                        )}
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-gray-600">
                        <div>
                          <span className="font-medium text-orange-600">{item.level} bank at {item.a2Bank || item.b1Bank}</span> · 
                          Model confidence {item.confidence} · {item.familyRelationship}
                        </div>
                        <div className="text-green-600">Passed all screening checks</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-gray-50 border rounded text-sm text-gray-600">
              0 items selected for seeding
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button>Confirm Batch</Button>
            </div>
          </CardContent>
        </Card>

        {/* Currently Seeded */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 uppercase">
              Currently Seeded · 6 items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              These items are already in live testing.
            </p>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seeded</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentlySeeded.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/item-bank/${item.level}/${item.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {item.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">{item.item}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.difficulty}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.responses}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.seeded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
