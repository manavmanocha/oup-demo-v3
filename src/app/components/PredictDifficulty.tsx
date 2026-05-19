import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';

export function PredictDifficulty() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const availableItems = [
    { id: 'ITEM_SKL_009', title: 'Complex Technical Text Analysis', type: 'Multiple Choice', cefrLevel: 'C1', skill: 'Reading', screeningStatus: 'APPROVED' },
    { id: 'ITEM_SKL_010', title: 'Formal Email Writing Requirements', type: 'Multiple Choice', cefrLevel: 'B2', skill: 'Writing', screeningStatus: 'APPROVED' },
    { id: 'ITEM_SKL_011', title: 'Abstract Concept Discussion Listening', type: 'Multiple Choice', cefrLevel: 'C1', skill: 'Listening', screeningStatus: 'APPROVED' },
    { id: 'ITEM_SKL_012', title: 'Cultural Context Comprehension Reading', type: 'Multiple Choice', cefrLevel: 'B2', skill: 'Reading', screeningStatus: 'APPROVED' },
    { id: 'ITEM_SKL_013', title: 'Nuanced Opinion Expression Speaking', type: 'Speaking', cefrLevel: 'C1', skill: 'Speaking', screeningStatus: 'APPROVED' },
    { id: 'ITEM_SKL_014', title: 'Professional Presentation Structure Writing', type: 'Essay', cefrLevel: 'B2', skill: 'Writing', screeningStatus: 'APPROVED' },
    { id: 'ITEM_SKL_015', title: 'Rapid Information Processing Listening', type: 'Multiple Choice', cefrLevel: 'B1', skill: 'Listening', screeningStatus: 'APPROVED' },
    { id: 'ITEM_SKL_016', title: 'Inference and Context Clues Reading', type: 'Multiple Choice', cefrLevel: 'B1', skill: 'Reading', screeningStatus: 'APPROVED' },
    { id: 'ITEM_SKL_017', title: 'Academic Discussion Engagement Speaking', type: 'Speaking', cefrLevel: 'B2', skill: 'Speaking', screeningStatus: 'APPROVED' },
  ];

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <Link to="/workflows/pre-testing-pipeline" className="hover:underline">Pipeline</Link>
          <span className="text-gray-400">/</span>
          <Link to="/workflows/pre-testing-pipeline/difficulty-prediction" className="hover:underline">Difficulty Prediction</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Predict Difficulty</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Predict Item Difficulty</h1>
          <p className="text-gray-600">
            Select items approved in screening stage for difficulty prediction
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-900">
            <strong>{availableItems.length}</strong> items ready for difficulty prediction
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 w-12">
                      <Checkbox />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEFR Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screening Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {availableItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-blue-600">{item.id}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.cefrLevel}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.skill}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default" className="bg-green-600">{item.screeningStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Link to="/workflows/pre-testing-pipeline/difficulty-prediction">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button disabled={selectedItems.length === 0}>
                Start Difficulty Prediction ({selectedItems.length} selected)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
