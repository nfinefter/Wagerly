import type { BetOptionRow, BetPlacementRow, BetRow, CircleRow, UserRow, WalletRow } from './types';

export function mapUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCircle(row: CircleRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    creatorId: row.creator_id,
    inviteCode: row.invite_code,
    moneyMode: row.money_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBet(row: BetRow) {
  return {
    id: row.id,
    circleId: row.circle_id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    betType: row.bet_type,
    endDate: row.end_date,
    status: row.status,
    winningOptionId: row.winning_option_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBetOption(row: BetOptionRow) {
  return {
    id: row.id,
    betId: row.bet_id,
    name: row.name,
    totalAmount: Number(row.total_amount),
    sortOrder: row.sort_order,
  };
}

export function mapWallet(row: WalletRow) {
  return {
    id: row.id,
    userId: row.user_id,
    moneyMode: row.money_mode,
    balance: Number(row.balance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBetPlacement(row: BetPlacementRow) {
  return {
    id: row.id,
    userId: row.user_id,
    betOptionId: row.bet_option_id,
    amount: Number(row.amount),
    moneyMode: row.money_mode,
    createdAt: row.created_at,
  };
}
