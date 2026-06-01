-- Play money betting: secure wallet RPCs + RLS hardening

-- Replace permissive wallet policy with SELECT-only
DROP POLICY IF EXISTS wallets_own ON public.wallets;
CREATE POLICY wallets_select_own ON public.wallets FOR SELECT USING (user_id = auth.uid());

-- Place a stake on an open bet option
CREATE OR REPLACE FUNCTION public.place_bet(p_bet_option_id UUID, p_amount NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_option public.bet_options%ROWTYPE;
  v_bet public.bets%ROWTYPE;
  v_circle public.circles%ROWTYPE;
  v_wallet public.wallets%ROWTYPE;
  v_placement_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT * INTO v_option FROM public.bet_options WHERE id = p_bet_option_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet option not found';
  END IF;

  SELECT * INTO v_bet FROM public.bets WHERE id = v_option.bet_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found';
  END IF;

  IF v_bet.status <> 'OPEN' THEN
    RAISE EXCEPTION 'Bet is not open for staking';
  END IF;

  IF v_bet.end_date <= now() THEN
    RAISE EXCEPTION 'Bet has ended';
  END IF;

  SELECT * INTO v_circle FROM public.circles WHERE id = v_bet.circle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Circle not found';
  END IF;

  IF v_circle.money_mode <> 'PLAY' THEN
    RAISE EXCEPTION 'Only play money betting is supported';
  END IF;

  IF NOT public.is_circle_member(v_bet.circle_id) THEN
    RAISE EXCEPTION 'Not a circle member';
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_uid AND money_mode = 'PLAY'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Play wallet not found';
  END IF;

  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE id = v_wallet.id;

  UPDATE public.bet_options
  SET total_amount = total_amount + p_amount
  WHERE id = p_bet_option_id;

  INSERT INTO public.bet_placements (user_id, bet_option_id, amount, money_mode)
  VALUES (v_uid, p_bet_option_id, p_amount, 'PLAY')
  RETURNING id INTO v_placement_id;

  INSERT INTO public.wallet_ledger (user_id, money_mode, amount, type, reference_id)
  VALUES (v_uid, 'PLAY', -p_amount, 'BET_STAKE', v_bet.id::text);

  RETURN json_build_object(
    'placement_id', v_placement_id,
    'bet_id', v_bet.id,
    'amount', p_amount,
    'new_balance', v_wallet.balance - p_amount
  );
END;
$$;

-- Settle a bet with parimutuel payouts
CREATE OR REPLACE FUNCTION public.settle_bet(p_bet_id UUID, p_winning_option_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_bet public.bets%ROWTYPE;
  v_total_pool NUMERIC := 0;
  v_winning_pool NUMERIC := 0;
  v_rec RECORD;
  v_payout NUMERIC;
  v_payout_count INT := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_bet FROM public.bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found';
  END IF;

  IF v_bet.creator_id <> v_uid THEN
    RAISE EXCEPTION 'Only the bet creator can settle';
  END IF;

  IF v_bet.status NOT IN ('OPEN', 'LOCKED') THEN
    RAISE EXCEPTION 'Bet cannot be settled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.bet_options
    WHERE id = p_winning_option_id AND bet_id = p_bet_id
  ) THEN
    RAISE EXCEPTION 'Invalid winning option';
  END IF;

  SELECT COALESCE(SUM(bo.total_amount), 0) INTO v_total_pool
  FROM public.bet_options bo
  WHERE bo.bet_id = p_bet_id;

  SELECT COALESCE(total_amount, 0) INTO v_winning_pool
  FROM public.bet_options
  WHERE id = p_winning_option_id;

  IF v_total_pool > 0 AND v_winning_pool > 0 THEN
    FOR v_rec IN
      SELECT bp.user_id, bp.amount
      FROM public.bet_placements bp
      WHERE bp.bet_option_id = p_winning_option_id
    LOOP
      v_payout := (v_rec.amount / v_winning_pool) * v_total_pool;

      UPDATE public.wallets
      SET balance = balance + v_payout, updated_at = now()
      WHERE user_id = v_rec.user_id AND money_mode = 'PLAY';

      INSERT INTO public.wallet_ledger (user_id, money_mode, amount, type, reference_id)
      VALUES (v_rec.user_id, 'PLAY', v_payout, 'BET_PAYOUT', p_bet_id::text);

      v_payout_count := v_payout_count + 1;
    END LOOP;
  END IF;

  UPDATE public.bets
  SET status = 'SETTLED', winning_option_id = p_winning_option_id, updated_at = now()
  WHERE id = p_bet_id;

  RETURN json_build_object(
    'bet_id', p_bet_id,
    'winning_option_id', p_winning_option_id,
    'total_pool', v_total_pool,
    'payout_count', v_payout_count
  );
END;
$$;

-- Cancel a bet and refund all stakes
CREATE OR REPLACE FUNCTION public.cancel_bet(p_bet_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_bet public.bets%ROWTYPE;
  v_rec RECORD;
  v_refund_count INT := 0;
  v_total_refunded NUMERIC := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_bet FROM public.bets WHERE id = p_bet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bet not found';
  END IF;

  IF v_bet.creator_id <> v_uid THEN
    RAISE EXCEPTION 'Only the bet creator can cancel';
  END IF;

  IF v_bet.status NOT IN ('OPEN', 'LOCKED') THEN
    RAISE EXCEPTION 'Bet cannot be cancelled';
  END IF;

  FOR v_rec IN
    SELECT bp.user_id, bp.amount, bp.bet_option_id
    FROM public.bet_placements bp
    JOIN public.bet_options bo ON bo.id = bp.bet_option_id
    WHERE bo.bet_id = p_bet_id
  LOOP
    UPDATE public.wallets
    SET balance = balance + v_rec.amount, updated_at = now()
    WHERE user_id = v_rec.user_id AND money_mode = 'PLAY';

    UPDATE public.bet_options
    SET total_amount = total_amount - v_rec.amount
    WHERE id = v_rec.bet_option_id;

    INSERT INTO public.wallet_ledger (user_id, money_mode, amount, type, reference_id)
    VALUES (v_rec.user_id, 'PLAY', v_rec.amount, 'ADJUSTMENT', p_bet_id::text);

    v_refund_count := v_refund_count + 1;
    v_total_refunded := v_total_refunded + v_rec.amount;
  END LOOP;

  UPDATE public.bets
  SET status = 'CANCELLED', updated_at = now()
  WHERE id = p_bet_id;

  RETURN json_build_object(
    'bet_id', p_bet_id,
    'refund_count', v_refund_count,
    'total_refunded', v_total_refunded
  );
END;
$$;

-- Circle leaderboard: net profit per member from stakes and payouts
CREATE OR REPLACE FUNCTION public.circle_leaderboard(p_circle_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_circle_member(p_circle_id) THEN
    RAISE EXCEPTION 'Not a circle member';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.profit DESC), '[]'::json)
  INTO v_result
  FROM (
    SELECT
      cm.user_id,
      u.display_name,
      u.email,
      u.avatar_url,
      COALESCE(SUM(
        CASE
          WHEN wl.type = 'BET_PAYOUT' THEN wl.amount
          WHEN wl.type = 'BET_STAKE' THEN wl.amount
          WHEN wl.type = 'ADJUSTMENT' AND wl.amount > 0 THEN wl.amount
          ELSE 0
        END
      ), 0) AS profit
    FROM public.circle_members cm
    JOIN public.users u ON u.id = cm.user_id
    LEFT JOIN public.wallet_ledger wl ON wl.user_id = cm.user_id
      AND wl.money_mode = 'PLAY'
      AND wl.reference_id IN (
        SELECT b.id::text FROM public.bets b WHERE b.circle_id = p_circle_id
      )
    WHERE cm.circle_id = p_circle_id
    GROUP BY cm.user_id, u.display_name, u.email, u.avatar_url
  ) t;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_bet(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_bet(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_bet(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.circle_leaderboard(UUID) TO authenticated;
