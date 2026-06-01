import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { syncUserProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      setMessage('Check your email to confirm your account, or sign in if already confirmed.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    try {
      await syncUserProfile();
    } catch {
      /* ok */
    }
    navigate('/home');
    setLoading(false);
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleEmail} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleOAuth('google')}
          disabled={loading}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleOAuth('apple')}
          disabled={loading}
        >
          Apple
        </Button>
      </div>

      {message && (
        <p className="text-center text-sm text-muted" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
