import {
  mapBet,
  mapBetOption,
  mapBetPlacement,
  mapCircle,
  mapUser,
  mapWallet,
  type BetOptionRow,
  type BetPlacementRow,
  type BetRow,
  type CircleRow,
  type MemberRole,
  type UserRow,
  type WalletRow,
} from '@wagerly/supabase';
import {
  createBetSchema,
  createCircleSchema,
  generateInviteCode,
  joinCircleSchema,
  placeBetSchema,
  updateBetStatusSchema,
  type CreateBetInput,
  type CreateCircleInput,
} from '@wagerly/shared';
import { defaultOptionsForBetType } from '@/lib/bets';
import { supabase } from '@/lib/supabase';

const ROLE_RANK: Record<MemberRole, number> = {
  MEMBER: 0,
  ADMIN: 1,
  OWNER: 2,
};

export async function syncUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const email = user.email ?? `${user.id}@placeholder.local`;
  const meta = user.user_metadata ?? {};
  const display_name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    null;
  const avatar_url =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    null;

  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email,
      display_name,
      avatar_url,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return mapUser(data as UserRow);
}

export async function getPlayWalletBalance() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .eq('money_mode', 'PLAY')
    .maybeSingle();

  if (error) throw error;
  if (!data) return 0;
  return mapWallet(data as WalletRow).balance;
}

export async function placeBet(betOptionId: string, amount: number) {
  placeBetSchema.parse({ betOptionId, amount });
  const { data, error } = await supabase.rpc('place_bet', {
    p_bet_option_id: betOptionId,
    p_amount: amount,
  });
  if (error) throw new Error(error.message);
  return data as { placement_id: string; bet_id: string; amount: number; new_balance: number };
}

export async function settleBet(betId: string, winningOptionId: string) {
  const { data, error } = await supabase.rpc('settle_bet', {
    p_bet_id: betId,
    p_winning_option_id: winningOptionId,
  });
  if (error) throw new Error(error.message);
  return data as { bet_id: string; winning_option_id: string; total_pool: number; payout_count: number };
}

export async function cancelBet(betId: string) {
  const { data, error } = await supabase.rpc('cancel_bet', {
    p_bet_id: betId,
  });
  if (error) throw new Error(error.message);
  return data as { bet_id: string; refund_count: number; total_refunded: number };
}

export async function getMyPlacements(betId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: options } = await supabase.from('bet_options').select('id').eq('bet_id', betId);
  const optionIds = (options ?? []).map((o) => o.id);
  if (optionIds.length === 0) return [];

  const { data, error } = await supabase
    .from('bet_placements')
    .select('*')
    .eq('user_id', user.id)
    .in('bet_option_id', optionIds);

  if (error) throw error;
  return (data ?? []).map((p) => mapBetPlacement(p as BetPlacementRow));
}

export type LeaderboardEntry = {
  userId: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  profit: number;
};

type LeaderboardRow = {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  profit: number;
};

export async function getCircleLeaderboard(circleId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('circle_leaderboard', {
    p_circle_id: circleId,
  });
  if (error) throw error;

  return ((data as LeaderboardRow[] | null) ?? []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    profit: Number(row.profit),
  }));
}

export async function listMyCircles() {
  const { data: memberships, error } = await supabase
    .from('circle_members')
    .select(
      `role, circle:circles (id, name, description, creator_id, invite_code, money_mode, created_at, updated_at)`,
    )
    .order('joined_at', { ascending: false });

  if (error) throw error;

  return Promise.all(
    (memberships ?? []).map(async (m) => {
      const raw = m.circle;
      const circle = (Array.isArray(raw) ? raw[0] : raw) as CircleRow;
      const [{ count: memberCount }, { count: betCount }] = await Promise.all([
        supabase
          .from('circle_members')
          .select('*', { count: 'exact', head: true })
          .eq('circle_id', circle.id),
        supabase.from('bets').select('*', { count: 'exact', head: true }).eq('circle_id', circle.id),
      ]);
      return {
        ...mapCircle(circle),
        role: m.role as MemberRole,
        memberCount: memberCount ?? 0,
        betCount: betCount ?? 0,
      };
    }),
  );
}

export async function createCircle(input: CreateCircleInput) {
  const parsed = createCircleSchema.parse(input);
  let inviteCode = generateInviteCode();

  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from('circles')
      .select('id')
      .eq('invite_code', inviteCode)
      .maybeSingle();
    if (!existing) break;
    inviteCode = generateInviteCode();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: circle, error } = await supabase
    .from('circles')
    .insert({
      name: parsed.name,
      description: parsed.description ?? null,
      money_mode: parsed.moneyMode,
      invite_code: inviteCode,
      creator_id: user.id,
    })
    .select('id, name, description, creator_id, invite_code, money_mode, created_at, updated_at')
    .single();

  if (error) throw error;

  const { error: memberError } = await supabase.from('circle_members').insert({
    circle_id: circle.id,
    user_id: user.id,
    role: 'OWNER',
  });

  if (memberError) {
    await supabase.from('circles').delete().eq('id', circle.id);
    throw memberError;
  }

  return mapCircle(circle as CircleRow);
}

export async function joinCircle(inviteCode: string) {
  joinCircleSchema.parse({ inviteCode });
  const { data, error } = await supabase.rpc('join_circle', {
    p_invite_code: inviteCode,
  });
  if (error) throw new Error(error.message.includes('Invalid') ? 'Invalid invite code' : error.message);
  return mapCircle(data as CircleRow);
}

export async function getCircle(id: string) {
  const { data: circle, error } = await supabase.from('circles').select('*').eq('id', id).single();
  if (error) throw error;

  const [{ count: memberCount }, { data: bets }] = await Promise.all([
    supabase.from('circle_members').select('*', { count: 'exact', head: true }).eq('circle_id', id),
    supabase
      .from('bets')
      .select('*, options:bet_options(*)')
      .eq('circle_id', id)
      .in('status', ['OPEN', 'LOCKED'])
      .order('created_at', { ascending: false }),
  ]);

  return {
    ...mapCircle(circle as CircleRow),
    memberCount: memberCount ?? 0,
    bets: bets ?? [],
  };
}

export async function listCircleMembers(circleId: string) {
  const { data, error } = await supabase
    .from('circle_members')
    .select('role, user:users(id, display_name, avatar_url, email, username)')
    .eq('circle_id', circleId)
    .order('role', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((m) => ({
    role: m.role,
    user: m.user ? mapUser((Array.isArray(m.user) ? m.user[0] : m.user) as UserRow) : null,
  }));
}

export async function createBet(circleId: string, input: CreateBetInput) {
  const parsed = createBetSchema.parse(input);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const optionRows = defaultOptionsForBetType(parsed.betType, parsed.options);

  const { data: bet, error } = await supabase
    .from('bets')
    .insert({
      circle_id: circleId,
      creator_id: user.id,
      title: parsed.title,
      description: parsed.description ?? null,
      category: parsed.category ?? null,
      image_url: parsed.imageUrl ?? null,
      bet_type: parsed.betType,
      end_date: parsed.endDate.toISOString(),
      status: 'OPEN',
    })
    .select()
    .single();

  if (error) throw error;

  const { data: options, error: optError } = await supabase
    .from('bet_options')
    .insert(optionRows.map((o) => ({ bet_id: bet.id, name: o.name, sort_order: o.sort_order })))
    .select();

  if (optError) throw optError;

  return {
    ...mapBet(bet as BetRow),
    options: (options ?? []).map((o) => mapBetOption(o as BetOptionRow)),
  };
}

export async function getBet(id: string) {
  const { data: bet, error } = await supabase.from('bets').select('*').eq('id', id).single();
  if (error) throw error;

  const [{ data: options }, { data: circle }] = await Promise.all([
    supabase.from('bet_options').select('*').eq('bet_id', id).order('sort_order', { ascending: true }),
    supabase.from('circles').select('id, name, money_mode').eq('id', bet.circle_id).single(),
  ]);

  const totalPool = (options ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  const mapped = mapBet(bet as BetRow);

  return {
    ...mapped,
    circle: circle ? { id: circle.id, name: circle.name, moneyMode: circle.money_mode } : null,
    options: (options ?? []).map((opt) => {
      const pool = Number(opt.total_amount);
      return {
        ...mapBetOption(opt as BetOptionRow),
        odds: pool > 0 && totalPool > 0 ? totalPool / pool : null,
        impliedProb: totalPool > 0 ? (pool / totalPool) * 100 : null,
      };
    }),
    totalPool,
  };
}

export async function updateBetStatus(
  betId: string,
  status: 'LOCKED' | 'SETTLED' | 'CANCELLED',
  winningOptionId?: string,
) {
  updateBetStatusSchema.parse({ status, winningOptionId });

  if (status === 'SETTLED') {
    if (!winningOptionId) throw new Error('Winning option required');
    await settleBet(betId, winningOptionId);
    return;
  }

  if (status === 'CANCELLED') {
    await cancelBet(betId);
    return;
  }

  const { error } = await supabase.from('bets').update({ status }).eq('id', betId);
  if (error) throw error;
}

export async function listActiveBetsForUser() {
  const { data: memberships } = await supabase.from('circle_members').select('circle_id');
  const circleIds = (memberships ?? []).map((m) => m.circle_id);
  if (circleIds.length === 0) return [];

  const { data, error } = await supabase
    .from('bets')
    .select('id, title, status, end_date, circle:circles (id, name)')
    .in('circle_id', circleIds)
    .in('status', ['OPEN', 'LOCKED'])
    .order('end_date', { ascending: true })
    .limit(10);

  if (error) throw error;

  return (data ?? []).map((b) => {
    const c = Array.isArray(b.circle) ? b.circle[0] : b.circle;
    return {
      id: b.id,
      title: b.title,
      status: b.status,
      endDate: b.end_date,
      circle: c as { id: string; name: string },
    };
  });
}

export function hasMinRole(role: MemberRole, min: MemberRole) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
