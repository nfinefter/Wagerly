import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseConfigured } from '@/lib/supabase';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { HomePage } from '@/pages/HomePage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { CircleDetailPage } from '@/pages/CircleDetailPage';
import { CircleMembersPage } from '@/pages/CircleMembersPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { CreateBetPage } from '@/pages/CreateBetPage';
import { BetDetailPage } from '@/pages/BetDetailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-2 text-center">
          <h1 className="text-xl font-bold">Supabase not configured</h1>
          <p className="text-sm text-muted">
            Add <code className="text-brand">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-brand">VITE_SUPABASE_ANON_KEY</code> to the repo root{' '}
            <code className="text-brand">.env</code>, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/circles/:id" element={<CircleDetailPage />} />
        <Route path="/circles/:id/members" element={<CircleMembersPage />} />
        <Route path="/circles/:id/leaderboard" element={<LeaderboardPage />} />
        <Route path="/circles/:id/bets/new" element={<CreateBetPage />} />
        <Route path="/bets/:id" element={<BetDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
