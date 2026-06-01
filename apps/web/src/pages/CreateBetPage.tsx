import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createBet } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const BET_TYPES = [
  { value: 'YES_NO' as const, label: 'Yes / No' },
  { value: 'OVER_UNDER' as const, label: 'Over / Under' },
  { value: 'MULTIPLE_CHOICE' as const, label: 'Multiple choice' },
];

export function CreateBetPage() {
  const { id: circleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [betType, setBetType] = useState<(typeof BET_TYPES)[number]['value']>('YES_NO');
  const [endDate, setEndDate] = useState('');
  const [optionsText, setOptionsText] = useState('Option A\nOption B\nOption C');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!circleId) return;
    setLoading(true);
    setError(null);
    try {
      const options =
        betType === 'MULTIPLE_CHOICE'
          ? optionsText
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      const bet = await createBet(circleId, {
        title,
        description: description || undefined,
        category: category || undefined,
        betType,
        endDate: new Date(endDate),
        options,
      });
      navigate(`/bets/${bet.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/circles/${circleId}`} className="text-sm text-muted hover:text-foreground">
          ← Back to circle
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Create bet</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="What's the bet?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted">Bet type</p>
            <div className="flex flex-wrap gap-2">
              {BET_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setBetType(t.value)}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    betType === t.value
                      ? 'border-brand bg-brand/20 text-brand-hover'
                      : 'border-border text-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {betType === 'MULTIPLE_CHOICE' && (
            <textarea
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted focus:border-brand focus:outline-none"
              rows={4}
              placeholder="One option per line"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
            />
          )}

          <div>
            <label className="text-sm text-muted">End date & time</label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            Create bet
          </Button>
        </form>
      </Card>

      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  );
}
