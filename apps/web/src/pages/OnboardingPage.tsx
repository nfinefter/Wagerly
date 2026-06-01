import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCircle, joinCircle } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const circle = await createCircle({ name, description: description || undefined, moneyMode: 'PLAY' });
      navigate(`/circles/${circle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create circle');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const circle = await joinCircle(inviteCode.trim());
      navigate(`/circles/${circle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join circle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Get started</h1>
        <p className="text-muted">Create a circle or join with an invite code</p>
      </div>

      <div className="flex gap-2 rounded-xl bg-surface p-1">
        <button
          type="button"
          onClick={() => setTab('create')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === 'create' ? 'bg-brand text-white' : 'text-muted'
          }`}
        >
          Create Circle
        </button>
        <button
          type="button"
          onClick={() => setTab('join')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === 'join' ? 'bg-brand text-white' : 'text-muted'
          }`}
        >
          Join Circle
        </button>
      </div>

      {tab === 'create' ? (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input placeholder="Circle name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-sm text-muted">All circles use play money.</p>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              Create Circle
            </Button>
          </form>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              className="uppercase tracking-widest"
            />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              Join Circle
            </Button>
          </form>
        </Card>
      )}

      {error && <p className="text-sm text-loss">{error}</p>}

      <Button variant="ghost" className="w-full" onClick={() => navigate('/home')}>
        Skip to home
      </Button>
    </div>
  );
}
