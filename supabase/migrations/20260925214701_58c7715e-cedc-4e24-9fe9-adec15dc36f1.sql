
CREATE TYPE public.app_role AS ENUM ('student', 'visitor');
CREATE TYPE public.avatar_slot AS ENUM ('body', 'hair', 'outfit', 'accessory', 'background');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Explorer',
  role public.app_role NOT NULL DEFAULT 'visitor',
  avatar_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_config) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_verified boolean;
  assigned public.app_role := 'visitor';
BEGIN
  is_verified := NEW.email_confirmed_at IS NOT NULL
    OR COALESCE((NEW.raw_user_meta_data ->> 'email_verified')::boolean, false);
  IF is_verified AND lower(COALESCE(NEW.email, '')) LIKE '%@berkeley.edu' THEN
    assigned := 'student';
  END IF;
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(COALESCE(NEW.email, 'explorer'), '@', 1)),
    assigned
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.promote_verified_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND OLD.email_confirmed_at IS NULL
     AND lower(COALESCE(NEW.email, '')) LIKE '%@berkeley.edu' THEN
    UPDATE public.profiles SET role = 'student' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.promote_verified_student();

CREATE OR REPLACE FUNCTION public.is_student(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'student');
$$;

CREATE TABLE public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'campus',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_meters integer NOT NULL DEFAULT 75,
  xp_value integer NOT NULL DEFAULT 25,
  student_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.places TO authenticated;
GRANT ALL ON public.places TO service_role;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "places_select_visible" ON public.places FOR SELECT TO authenticated
  USING (student_only = false OR public.is_student(auth.uid()));

CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX checkins_user_place_idx ON public.checkins (user_id, place_id, created_at DESC);
GRANT SELECT ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_select_own" ON public.checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.xp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  source_type text NOT NULL DEFAULT 'checkin',
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX xp_ledger_user_idx ON public.xp_ledger (user_id, created_at DESC);
GRANT SELECT ON public.xp_ledger TO authenticated;
GRANT ALL ON public.xp_ledger TO service_role;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_ledger_select_own" ON public.xp_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.avatar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot public.avatar_slot NOT NULL,
  name text NOT NULL,
  svg_data text NOT NULL,
  required_level integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.avatar_items TO authenticated;
GRANT ALL ON public.avatar_items TO service_role;
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avatar_items_select_all" ON public.avatar_items FOR SELECT TO authenticated USING (true);

INSERT INTO public.places (name, description, category, latitude, longitude, radius_meters, xp_value, student_only) VALUES
('Sather Tower (Campanile)', 'The 307-foot bell tower at the heart of campus. Listen for the carillon on the hour.', 'landmark', 37.8721, -122.2578, 75, 25, false),
('Sproul Plaza', 'The busiest crossroads on campus, full of clubs, chalk art and free speech history.', 'campus', 37.8697, -122.2593, 75, 25, false),
('Memorial Glade', 'A wide green lawn where everyone naps, studies and throws frisbees.', 'nature', 37.8727, -122.2596, 75, 25, false),
('Doe Library', 'The grand main library with its vaulted reading room. Students only.', 'study', 37.8723, -122.2594, 75, 25, true),
('Moffitt Library', 'The round-the-clock study spot with the best late-night energy.', 'study', 37.87253255732292, -122.2608539697059, 75, 25, false),
('Faculty Glade', 'A shady creekside pocket of redwoods and oaks behind the Faculty Club.', 'nature', 37.8716, -122.2562, 75, 25, false),
('California Memorial Stadium', 'The hillside stadium with a view straight out across the bay.', 'landmark', 37.8712, -122.2508, 150, 25, false),
('The Big C', 'A short steep hike up to the golden concrete C and a panoramic overlook.', 'hike', 37.8755, -122.2476, 150, 60, false),
('UC Botanical Garden', 'Thirty-four acres of plants from every continent tucked in Strawberry Canyon.', 'nature', 37.8755, -122.2386, 150, 60, false),
('Lawrence Hall of Science', 'A hilltop science museum with the best sunset view of the bay.', 'landmark', 37.8793, -122.2468, 150, 60, false),
('Indian Rock Park', 'Volcanic outcrops in North Berkeley built for scrambling and sunset watching.', 'hike', 37.8925, -122.2717, 150, 60, false);

INSERT INTO public.avatar_items (slot, name, svg_data, required_level, sort_order) VALUES
('background', 'Golden Hour', '<rect x="0" y="0" width="200" height="200" rx="28" fill="#FFE9B8"/><circle cx="100" cy="150" r="70" fill="#FFD066" opacity="0.7"/>', 1, 1),
('background', 'Bay Dusk', '<rect x="0" y="0" width="200" height="200" rx="28" fill="#1B2A6B"/><circle cx="150" cy="50" r="22" fill="#FFD066"/><path d="M0 150 Q50 120 100 150 T200 150 V200 H0Z" fill="#2E4099"/>', 4, 2),
('body', 'Honey Bear', '<circle cx="62" cy="62" r="20" fill="#C98A4B"/><circle cx="138" cy="62" r="20" fill="#C98A4B"/><circle cx="100" cy="120" r="62" fill="#D9A066"/><ellipse cx="100" cy="140" rx="30" ry="24" fill="#F2DCC0"/><circle cx="80" cy="112" r="6" fill="#3B2A1A"/><circle cx="120" cy="112" r="6" fill="#3B2A1A"/><ellipse cx="100" cy="132" rx="9" ry="6" fill="#3B2A1A"/>', 1, 1),
('body', 'Cocoa Bear', '<circle cx="62" cy="62" r="20" fill="#6B4630"/><circle cx="138" cy="62" r="20" fill="#6B4630"/><circle cx="100" cy="120" r="62" fill="#8A5A3C"/><ellipse cx="100" cy="140" rx="30" ry="24" fill="#E3C6A8"/><circle cx="80" cy="112" r="6" fill="#2B1B10"/><circle cx="120" cy="112" r="6" fill="#2B1B10"/><ellipse cx="100" cy="132" rx="9" ry="6" fill="#2B1B10"/>', 1, 2),
('body', 'Snow Bear', '<circle cx="62" cy="62" r="20" fill="#E4E9F2"/><circle cx="138" cy="62" r="20" fill="#E4E9F2"/><circle cx="100" cy="120" r="62" fill="#F4F7FC"/><ellipse cx="100" cy="140" rx="30" ry="24" fill="#FFFFFF"/><circle cx="80" cy="112" r="6" fill="#39425C"/><circle cx="120" cy="112" r="6" fill="#39425C"/><ellipse cx="100" cy="132" rx="9" ry="6" fill="#39425C"/>', 3, 3),
('hair', 'Swoop', '<path d="M52 92 Q70 44 120 52 Q156 58 152 92 Q130 66 96 74 Q70 80 52 92Z" fill="#2B2440"/>', 1, 1),
('hair', 'Curls', '<circle cx="66" cy="80" r="17" fill="#4A2F1B"/><circle cx="92" cy="66" r="19" fill="#4A2F1B"/><circle cx="120" cy="68" r="18" fill="#4A2F1B"/><circle cx="142" cy="84" r="16" fill="#4A2F1B"/>', 2, 2),
('hair', 'Sun Streak', '<path d="M50 94 Q62 50 100 50 Q140 50 150 94 Q142 74 122 70 L118 100 L108 72 Q74 70 50 94Z" fill="#E8A13A"/>', 5, 3),
('outfit', 'Blue Hoodie', '<path d="M46 156 Q52 122 78 112 L100 128 L122 112 Q148 122 154 156 Q154 182 100 182 Q46 182 46 156Z" fill="#1B3A8F"/><path d="M92 120 L100 140 L108 120" fill="#0F2666"/>', 1, 1),
('outfit', 'Field Tee', '<path d="M48 158 Q56 126 80 116 L100 130 L120 116 Q144 126 152 158 Q150 182 100 182 Q50 182 48 158Z" fill="#F2C14E"/><circle cx="100" cy="152" r="12" fill="#1B3A8F"/>', 2, 2),
('outfit', 'Trail Jacket', '<path d="M48 158 Q56 124 80 114 L100 130 L120 114 Q144 124 152 158 Q150 182 100 182 Q50 182 48 158Z" fill="#2E6F52"/><rect x="96" y="126" width="8" height="56" rx="4" fill="#E9F0E6"/>', 6, 3),
('accessory', 'Round Glasses', '<circle cx="80" cy="112" r="16" fill="none" stroke="#2B2440" stroke-width="5"/><circle cx="120" cy="112" r="16" fill="none" stroke="#2B2440" stroke-width="5"/><path d="M96 112 H104" stroke="#2B2440" stroke-width="5"/>', 1, 1),
('accessory', 'Gold Scarf', '<path d="M62 150 Q100 170 138 150 L142 166 Q100 186 58 166Z" fill="#F2C14E"/><path d="M132 162 L142 196 L124 192Z" fill="#E0A82E"/>', 3, 2);
