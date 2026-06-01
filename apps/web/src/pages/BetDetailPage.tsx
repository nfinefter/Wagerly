import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBet, getMyPlacements } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { BetActions } from '@/components/bet-actions';
import { PlaceBetForm } from '@/components/place-bet-form';
import { WalletBadge } from '@/components/wallet-badge';

export function BetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { refreshBalance } = useWallet();
  const [bet, setBet] = useState<Awaited<ReturnType<typeof getBet>> | null>(null);
  const [placements, setPlacements] = useState<Awaited<ReturnType<typeof getMyPlacements>>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getBet(id), getMyPlacements(id)])
      .then(([b, p]) => {
        setBet(b);
        setPlacements(p);
        refreshBalance();
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, refreshBalance]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-muted">Loading…</p>;
  if (!bet) return <p className="text-muted">Bet not found</p>;

  const isCreator = user?.id === bet.creatorId;
  const canBet = bet.status === 'OPEN';
  const isSettled = bet.status === 'SETTLED';

  function stakeForOption(optionId: string) {
    return placements
      .filter((p) => p.betOptionId === optionId)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to={`/circles/${bet.circle?.id}`}
            className="text-sm text-muted hover:text-foreground"
          >
            ← {bet.circle?.name}
          </Link>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-brand">
            {bet.status} · {bet.betType.replace('_', ' ')}
          </p>
          <h1 className="text-2xl font-bold">{bet.title}</h1>
          {bet.description && <p className="mt-2 text-muted">{bet.description}</p>}
          <p className="mt-2 text-sm text-muted">
            Ends {new Date(bet.endDate).toLocaleString()} · Play money
          </p>
        </div>
        <WalletBadge />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Outcomes</h2>
        {bet.options.map((opt) => {
          const odds = opt.odds != null ? opt.odds.toFixed(2) : '—';
          const impliedProb = opt.impliedProb != null ? `${opt.impliedProb.toFixed(1)}%` : '—';
          const isWinner = isSettled && bet.winningOptionId === opt.id;
          const myStake = stakeForOption(opt.id);

          return (
            <Card
              key={opt.id}
              className={isWinner ? 'border-brand ring-1 ring-brand/40' : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {opt.name}
                  {isWinner && (
                    <span className="ml-2 text-xs font-medium text-brand">Winner</span>
                  )}
                </span>
                <span className="text-sm text-muted">{impliedProb} implied</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{
                    width:
                      bet.totalPool > 0
                        ? `${(opt.totalAmount / bet.totalPool) * 100}%`
                        : '0%',
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted">Pool: ${opt.totalAmount.toFixed(0)}</span>
                <span className="font-medium text-brand-hover">Odds: {odds}x</span>
              </div>
              {canBet && (
                <PlaceBetForm
                  betOptionId={opt.id}
                  optionName={opt.name}
                  existingStake={myStake}
                  onPlaced={load}
                />
              )}
              {!canBet && myStake > 0 && (
                <p className="mt-2 text-xs text-muted">Your stake: ${myStake.toFixed(0)}</p>
              )}
            </Card>
          );
        })}
      </section>

      {bet.status === 'LOCKED' && (
        <Card className="border-dashed">
          <p className="text-center text-sm text-muted">Betting is locked. Waiting for settlement.</p>
        </Card>
      )}

      {isCreator && (
        <BetActions
          betId={bet.id}
          status={bet.status}
          options={bet.options.map((o) => ({ id: o.id, name: o.name }))}
          onUpdated={load}
        />
      )}
    </div>
  );
}
