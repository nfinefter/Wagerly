import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { syncUserProfile } from '@/lib/data';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function finishAuth() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (mounted) navigate('/login?error=auth', { replace: true });
          return;
        }
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !session) {
        navigate('/login?error=auth', { replace: true });
        return;
      }

      try {
        await syncUserProfile();
      } catch {
        /* ok */
      }
      navigate('/home', { replace: true });
    }

    finishAuth().catch(() => {
      if (mounted) navigate('/login?error=auth', { replace: true });
    });

    const timeout = window.setTimeout(() => {
      if (mounted) navigate('/login?error=auth', { replace: true });
    }, 10000);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted">
      Signing you in…
    </div>
  );
}
