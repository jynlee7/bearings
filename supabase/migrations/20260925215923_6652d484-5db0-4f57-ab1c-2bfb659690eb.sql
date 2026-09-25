CREATE OR REPLACE FUNCTION public.default_avatar_config()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'body', (SELECT id::text FROM public.avatar_items WHERE slot = 'body' AND name = 'Honey Bear' LIMIT 1),
    'background', (SELECT id::text FROM public.avatar_items WHERE slot = 'background' AND name = 'Golden Hour' LIMIT 1)
  ));
$$;

REVOKE EXECUTE ON FUNCTION public.default_avatar_config() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.default_avatar_config() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, avatar_config)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) LIKE '%@berkeley.edu'
        THEN 'student'::public.app_role
      ELSE 'visitor'::public.app_role
    END,
    public.default_avatar_config()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

UPDATE public.profiles
SET avatar_config = public.default_avatar_config()
WHERE avatar_config IS NULL OR avatar_config = '{}'::jsonb;