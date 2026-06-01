export type MoneyMode = 'PLAY' | 'REAL';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type BetType = 'YES_NO' | 'OVER_UNDER' | 'MULTIPLE_CHOICE';
export type BetStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'SETTLED' | 'CANCELLED' | 'DISPUTED';

export type UserRow = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CircleRow = {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  invite_code: string;
  money_mode: MoneyMode;
  created_at: string;
  updated_at: string;
};

export type CircleMemberRow = {
  circle_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
};

export type BetRow = {
  id: string;
  circle_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  bet_type: BetType;
  end_date: string;
  status: BetStatus;
  winning_option_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BetOptionRow = {
  id: string;
  bet_id: string;
  name: string;
  total_amount: number;
  sort_order: number;
};

export type WalletRow = {
  id: string;
  user_id: string;
  money_mode: MoneyMode;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type BetPlacementRow = {
  id: string;
  user_id: string;
  bet_option_id: string;
  amount: number;
  money_mode: MoneyMode;
  created_at: string;
};
