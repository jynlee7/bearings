
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.promote_verified_student() FROM anon, authenticated, public;

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_student(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'student');
$$;
REVOKE EXECUTE ON FUNCTION private.is_student(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION private.is_student(uuid) TO authenticated, service_role;

DROP POLICY "places_select_visible" ON public.places;
CREATE POLICY "places_select_visible" ON public.places FOR SELECT TO authenticated
  USING (student_only = false OR private.is_student(auth.uid()));

DROP FUNCTION public.is_student(uuid);
