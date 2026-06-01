import { useWallet } from '@/contexts/WalletContext';

function formatBalance(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function WalletBadge() {
  const { balance, loading } = useWallet();

  if (loading) {
    return (
      <span className="rounded-lg bg-surface px-3 py-1.5 text-sm text-muted">—</span>
    );
  }

  return (
    <span className="rounded-lg bg-brand/20 px-3 py-1.5 text-sm font-semibold text-brand-hover">
      {balance != null ? formatBalance(balance) : '—'}
    </span>
  );
}
