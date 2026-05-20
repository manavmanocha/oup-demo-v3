import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getItemsForReview } from '../data/mockData';

export function ReviewQueue() {
  const items = getItemsForReview();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Review Queue</h1>
          <p className="text-gray-600">
            Items that have been flagged for review or need your attention
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items Requiring Review ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
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
                  </div>

                  <div className="text-sm text-gray-900 mb-4">{item.content}</div>

                  {item.flagReason && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-gray-700 mb-4">
                      <strong>Flagged:</strong> {item.flagReason}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Link to={`/item-bank/${item.level}/${item.id}`}>
                      <Button size="sm">Review Item</Button>
                    </Link>
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
