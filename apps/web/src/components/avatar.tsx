import { cn } from '@/lib/utils';

export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const initial = (name?.[0] ?? '?').toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'User'}
        className={cn('rounded-full object-cover', sizes[size])}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand/30 font-semibold text-brand-hover',
        sizes[size],
      )}
    >
      {initial}
    </div>
  );
}
