import { useState } from 'react';
import { placeBet } from '@/lib/data';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PlaceBetForm({
  betOptionId,
  optionName,
  existingStake,
  onPlaced,
}: {
  betOptionId: string;
  optionName: string;
  existingStake: number;
  onPlaced: () => void;
}) {
  const { balance, refreshBalance } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (balance != null && parsed > balance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await placeBet(betOptionId, parsed);
      setAmount('');
      await refreshBalance();
      onPlaced();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-border pt-3">
      {existingStake > 0 && (
        <p className="text-xs text-muted">Your stake: ${existingStake.toFixed(0)}</p>
      )}
      <div className="flex gap-2">
        <Input
          type="number"
          min={1}
          step={1}
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading}>
          Bet on {optionName}
        </Button>
      </div>
      {error && <p className="text-xs text-loss">{error}</p>}
    </form>
  );
}
