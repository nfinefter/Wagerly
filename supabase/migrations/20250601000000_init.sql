-- MarketLeague schema (run in Supabase SQL Editor or via Supabase CLI)

CREATE TYPE money_mode AS ENUM ('PLAY', 'REAL');
CREATE TYPE member_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE bet_type AS ENUM ('YES_NO', 'OVER_UNDER', 'MULTIPLE_CHOICE');
CREATE TYPE bet_status AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'SETTLED', 'CANCELLED', 'DISPUTED');
CREATE TYPE ledger_type AS ENUM ('ADJUSTMENT', 'BET_STAKE', 'BET_PAYOUT', 'DEPOSIT', 'WITHDRAW');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  money_mode money_mode NOT NULL,
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, money_mode)
);

CREATE TABLE public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  money_mode money_mode NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  type ledger_type NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wallet_ledger_user_id_created_at_idx ON public.wallet_ledger (user_id, created_at);

CREATE TABLE public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES public.users (id),
  invite_code TEXT NOT NULL UNIQUE,
  money_mode money_mode NOT NULL DEFAULT 'PLAY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX circles_creator_id_idx ON public.circles (creator_id);

CREATE TABLE public.circle_members (
  circle_id UUID NOT NULL REFERENCES public.circles (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'MEMBER',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (circle_id, user_id)
);

CREATE INDEX circle_members_user_id_idx ON public.circle_members (user_id);

CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles (id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.users (id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  bet_type bet_type NOT NULL DEFAULT 'YES_NO',
  end_date TIMESTAMPTZ NOT NULL,
  status bet_status NOT NULL DEFAULT 'OPEN',
  winning_option_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bets_circle_id_status_idx ON public.bets (circle_id, status);

CREATE TABLE public.bet_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL REFERENCES public.bets (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX bet_options_bet_id_idx ON public.bet_options (bet_id);

ALTER TABLE public.bets
  ADD CONSTRAINT bets_winning_option_id_fkey
  FOREIGN KEY (winning_option_id) REFERENCES public.bet_options (id) ON DELETE SET NULL;

CREATE TABLE public.bet_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  bet_option_id UUID NOT NULL REFERENCES public.bet_options (id) ON DELETE RESTRICT,
  amount NUMERIC(18, 2) NOT NULL,
  money_mode money_mode NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bet_placements_user_id_idx ON public.bet_placements (user_id);
CREATE INDEX bet_placements_bet_option_id_idx ON public.bet_placements (bet_option_id);

-- Auto-create profile + wallets on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@placeholder.local'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  INSERT INTO public.wallets (user_id, money_mode, balance)
  VALUES (NEW.id, 'PLAY', 10000)
  ON CONFLICT (user_id, money_mode) DO NOTHING;

  INSERT INTO public.wallets (user_id, money_mode, balance)
  VALUES (NEW.id, 'REAL', 0)
  ON CONFLICT (user_id, money_mode) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Join circle by invite code
CREATE OR REPLACE FUNCTION public.join_circle(p_invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_circle public.circles%ROWTYPE;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_circle FROM public.circles
  WHERE invite_code = upper(trim(p_invite_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.circle_members (circle_id, user_id, role)
  VALUES (v_circle.id, v_uid, 'MEMBER')
  ON CONFLICT (circle_id, user_id) DO NOTHING;

  RETURN json_build_object(
    'id', v_circle.id,
    'name', v_circle.name,
    'description', v_circle.description,
    'creator_id', v_circle.creator_id,
    'invite_code', v_circle.invite_code,
    'money_mode', v_circle.money_mode,
    'created_at', v_circle.created_at,
    'updated_at', v_circle.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_circle(TEXT) TO authenticated;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER circles_updated_at BEFORE UPDATE ON public.circles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bets_updated_at BEFORE UPDATE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_placements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_circle_member(p_circle_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = p_circle_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.circle_member_role(p_circle_id UUID)
RETURNS member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.circle_members
  WHERE circle_id = p_circle_id AND user_id = auth.uid()
  LIMIT 1;
$$;

-- users
CREATE POLICY users_select_own ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY users_select_circle_mates ON public.users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.circle_members cm1
    JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
    WHERE cm1.user_id = auth.uid() AND cm2.user_id = users.id
  )
);

-- wallets
CREATE POLICY wallets_own ON public.wallets FOR ALL USING (user_id = auth.uid());

-- wallet_ledger
CREATE POLICY wallet_ledger_own ON public.wallet_ledger FOR SELECT USING (user_id = auth.uid());

-- circles
CREATE POLICY circles_select_member ON public.circles FOR SELECT USING (public.is_circle_member(id));
CREATE POLICY circles_select_creator ON public.circles FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY circles_insert ON public.circles FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY circles_update_admin ON public.circles FOR UPDATE USING (
  public.circle_member_role(id) IN ('OWNER', 'ADMIN')
);

-- circle_members
CREATE POLICY circle_members_select ON public.circle_members FOR SELECT USING (
  public.is_circle_member(circle_id)
);
CREATE POLICY circle_members_insert_owner ON public.circle_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    role = 'OWNER'
    AND EXISTS (SELECT 1 FROM public.circles c WHERE c.id = circle_id AND c.creator_id = auth.uid())
  )
);

-- bets
CREATE POLICY bets_select_member ON public.bets FOR SELECT USING (public.is_circle_member(circle_id));
CREATE POLICY bets_insert_member ON public.bets FOR INSERT WITH CHECK (
  public.is_circle_member(circle_id) AND creator_id = auth.uid()
);
CREATE POLICY bets_update_creator ON public.bets FOR UPDATE USING (creator_id = auth.uid());

-- bet_options
CREATE POLICY bet_options_select ON public.bet_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bets b WHERE b.id = bet_id AND public.is_circle_member(b.circle_id))
);
CREATE POLICY bet_options_insert ON public.bet_options FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bets b
    WHERE b.id = bet_id AND b.creator_id = auth.uid()
  )
);
CREATE POLICY bet_options_update ON public.bet_options FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bets b WHERE b.id = bet_id AND b.creator_id = auth.uid())
);

-- bet_placements (read for phase 2)
CREATE POLICY bet_placements_select ON public.bet_placements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bet_options bo
    JOIN public.bets b ON b.id = bo.bet_id
    WHERE bo.id = bet_option_id AND public.is_circle_member(b.circle_id)
  )
);
