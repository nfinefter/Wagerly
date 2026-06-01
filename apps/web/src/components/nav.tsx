import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Users, Trophy } from 'lucide-react';

const links = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/onboarding', label: 'Circles', icon: Users },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors',
                active ? 'text-brand' : 'text-muted',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
        <Link
          to="/home"
          className={cn('flex flex-col items-center gap-0.5 px-4 py-2 text-xs text-muted')}
        >
          <Trophy className="h-5 w-5" />
          Bets
        </Link>
      </div>
    </nav>
  );
}
