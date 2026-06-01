import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCircle, getCircleLeaderboard } from '@/lib/data';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/ui/card';

function formatProfit(profit: number) {
  const prefix = profit >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(profit).toFixed(0)}`;
}

export function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const [circleName, setCircleName] = useState('');
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof getCircleLeaderboard>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCircle(id), getCircleLeaderboard(id)])
      .then(([c, leaderboard]) => {
        setCircleName(c.name);
        setEntries(leaderboard);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/circles/${id}`} className="text-sm text-muted hover:text-foreground">
          ← {circleName}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted">Play money profit rankings for this circle</p>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <Card key={entry.userId} className="flex items-center gap-3">
            <span className="w-6 text-center font-bold text-muted">{index + 1}</span>
            <Avatar name={entry.displayName ?? entry.email} src={entry.avatarUrl} />
            <div className="flex-1">
              <p className="font-medium">{entry.displayName ?? entry.email}</p>
            </div>
            <span
              className={`font-semibold ${entry.profit >= 0 ? 'text-win' : 'text-loss'}`}
            >
              {formatProfit(entry.profit)}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
