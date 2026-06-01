-- Creators must be able to read circles they just created (before circle_members row exists).
-- Without this, insert().select() fails with RLS error 42501.

CREATE POLICY circles_select_creator ON public.circles
  FOR SELECT USING (creator_id = auth.uid());
