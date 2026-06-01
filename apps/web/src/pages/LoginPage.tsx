import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth-form';

export function LoginPage() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>
    );
  }
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">MarketLeague</h1>
          <p className="mt-2 text-muted">Sign in to your circles</p>
        </div>
        <AuthForm mode="login" />
        <p className="text-center text-sm text-muted">
          No account?{' '}
          <Link to="/signup" className="text-brand hover:text-brand-hover">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
