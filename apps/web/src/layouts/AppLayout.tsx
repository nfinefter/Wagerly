import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/nav';

export function AppLayout() {
  return (
    <div className="min-h-screen pb-20">
      <main className="mx-auto max-w-lg px-4 py-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
