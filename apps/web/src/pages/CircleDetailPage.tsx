import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCircle } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyInviteButton } from '@/components/copy-invite-button';

export function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Awaited<ReturnType<typeof getCircle>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCircle(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (!data) return <p className="text-muted">Circle not found</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/home" className="text-sm text-muted hover:text-foreground">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{data.name}</h1>
        {data.description && <p className="text-muted">{data.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{data.memberCount} members</span>
          <CopyInviteButton code={data.inviteCode} />
        </div>
      </div>

      <div className="flex gap-2">
        <Link to={`/circles/${id}/bets/new`} className="flex-1">
          <Button className="w-full" size="lg">
            Create bet
          </Button>
        </Link>
        <Link to={`/circles/${id}/members`}>
          <Button variant="secondary" size="lg">
            Members
          </Button>
        </Link>
        <Link to={`/circles/${id}/leaderboard`}>
          <Button variant="secondary" size="lg">
            Board
          </Button>
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Active bets</h2>
        {data.bets.length === 0 ? (
          <p className="text-sm text-muted">No active bets. Be the first to create one!</p>
        ) : (
          <div className="space-y-3">
            {data.bets.map((bet) => (
              <Link key={bet.id} to={`/bets/${bet.id}`}>
                <Card className="transition-colors hover:bg-surface-hover">
                  <p className="font-semibold">{bet.title}</p>
                  <p className="text-sm text-muted">
                    {bet.bet_type.replace('_', ' ')} · {bet.status} ·{' '}
                    {new Date(bet.end_date).toLocaleString()}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {((bet.options as { name: string }[]) ?? []).map((opt) => (
                      <span
                        key={opt.name}
                        className="rounded-lg bg-surface-hover px-2 py-1 text-xs text-muted"
                      >
                        {opt.name}
                      </span>
                    ))}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
