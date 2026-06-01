import { useState } from 'react';
import { updateBetStatus } from '@/lib/data';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function BetActions({
  betId,
  status,
  options,
  onUpdated,
}: {
  betId: string;
  status: string;
  options: { id: string; name: string }[];
  onUpdated: () => void;
}) {
  const [winningOptionId, setWinningOptionId] = useState(options[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshBalance } = useWallet();

  async function update(status: 'LOCKED' | 'SETTLED' | 'CANCELLED') {
    if (status === 'SETTLED' && !window.confirm('Settle this bet and distribute payouts?')) {
      return;
    }
    if (status === 'CANCELLED' && !window.confirm('Cancel this bet and refund all stakes?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateBetStatus(
        betId,
        status,
        status === 'SETTLED' ? winningOptionId : undefined,
      );
      if (status === 'SETTLED' || status === 'CANCELLED') {
        await refreshBalance();
      }
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'SETTLED' || status === 'CANCELLED') {
    return (
      <Card>
        <p className="text-sm text-muted">This bet is {status.toLowerCase()}.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <p className="text-sm font-medium">Creator actions</p>
      {status === 'OPEN' && (
        <Button
          variant="secondary"
          className="w-full"
          disabled={loading}
          onClick={() => update('LOCKED')}
        >
          Lock betting
        </Button>
      )}
      {(status === 'OPEN' || status === 'LOCKED') && (
        <>
          <select
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-foreground"
            value={winningOptionId}
            onChange={(e) => setWinningOptionId(e.target.value)}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                Winner: {o.name}
              </option>
            ))}
          </select>
          <Button className="w-full" disabled={loading} onClick={() => update('SETTLED')}>
            Settle bet
          </Button>
        </>
      )}
      <Button variant="danger" className="w-full" disabled={loading} onClick={() => update('CANCELLED')}>
        Cancel bet
      </Button>
      {error && <p className="text-sm text-loss">{error}</p>}
    </Card>
  );
}
