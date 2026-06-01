import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMyCircles, listActiveBetsForUser } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { SignOutButton } from '@/components/sign-out-button';
import { WalletBadge } from '@/components/wallet-badge';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Awaited<ReturnType<typeof listMyCircles>>>([]);
  const [bets, setBets] = useState<Awaited<ReturnType<typeof listActiveBetsForUser>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([listMyCircles(), listActiveBetsForUser()])
      .then(([c, b]) => {
        if (!mounted) return;
        if (c.length === 0) {
          navigate('/onboarding', { replace: true });
          return;
        }
        setCircles(c);
        setBets(b);
      })
      .catch((err) => {
        if (!mounted) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load your circles';
        setError(message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const timeout = window.setTimeout(() => {
      if (mounted) {
        setError('Request timed out. Check your Supabase connection and that migrations are applied.');
        setLoading(false);
      }
    }, 15000);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  if (loading) {
    return <p className="text-muted">Loading…</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">MarketLeague</h1>
        <Card>
          <p className="text-sm text-loss">{error}</p>
          <p className="mt-2 text-sm text-muted">
            Make sure both SQL migrations are run in Supabase (init + play_betting).
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
        <Link to="/onboarding" className="text-sm text-brand hover:text-brand-hover">
          Go to onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MarketLeague</h1>
          <p className="text-sm text-muted">Your circles & active bets</p>
        </div>
        <div className="flex items-center gap-2">
          <WalletBadge />
          <SignOutButton />
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Circles</h2>
          <Link to="/onboarding" className="text-sm text-brand hover:text-brand-hover">
            + New
          </Link>
        </div>
        <div className="space-y-3">
          {circles.map((circle) => (
            <Link key={circle.id} to={`/circles/${circle.id}`}>
              <Card className="transition-colors hover:bg-surface-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{circle.name}</p>
                    <p className="text-sm text-muted">
                      {circle.memberCount} members · {circle.betCount} bets
                    </p>
                  </div>
                  <span className="rounded-lg bg-brand/20 px-2 py-1 text-xs font-medium text-brand-hover">
                    {circle.inviteCode}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Active Bets</h2>
        {bets.length === 0 ? (
          <p className="text-sm text-muted">No active bets yet. Create one in a circle!</p>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => (
              <Link key={bet.id} to={`/bets/${bet.id}`}>
                <Card className="transition-colors hover:bg-surface-hover">
                  <p className="text-xs text-brand">{bet.circle.name}</p>
                  <p className="font-semibold">{bet.title}</p>
                  <p className="text-sm text-muted">
                    {bet.status} · ends {new Date(bet.endDate).toLocaleDateString()}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}