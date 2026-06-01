import type { BetType } from '@wagerly/supabase';

export function defaultOptionsForBetType(
  betType: BetType,
  customOptions?: string[],
): { name: string; sort_order: number }[] {
  if (betType === 'YES_NO') {
    return [
      { name: 'Yes', sort_order: 0 },
      { name: 'No', sort_order: 1 },
    ];
  }
  if (betType === 'OVER_UNDER') {
    return [
      { name: 'Over', sort_order: 0 },
      { name: 'Under', sort_order: 1 },
    ];
  }
  return (customOptions ?? []).map((name, i) => ({ name, sort_order: i }));
}
