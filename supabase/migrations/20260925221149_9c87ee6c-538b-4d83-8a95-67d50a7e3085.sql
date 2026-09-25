
CREATE TYPE public.org_category AS ENUM ('club','fraternity','sorority','cultural','sports','other');
CREATE TYPE public.org_status AS ENUM ('pending','approved');
CREATE TYPE public.membership_role AS ENUM ('member','leader');
CREATE TYPE public.membership_status AS ENUM ('pending','approved');

CREATE TABLE private.admin_emails (email text PRIMARY KEY);

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category public.org_category NOT NULL DEFAULT 'club',
  description text NOT NULL DEFAULT '',
  logo_svg text NOT NULL DEFAULT '',
  status public.org_status NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.org_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.membership_role NOT NULL DEFAULT 'member',
  status public.membership_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  team_lock_at timestamptz NOT NULL,
  leaderboard_freeze_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX seasons_one_active ON public.seasons (is_active) WHERE is_active;
CREATE TABLE public.season_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, user_id)
);
ALTER TABLE public.xp_ledger
  ADD COLUMN season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  ADD COLUMN counts_for_competition boolean NOT NULL DEFAULT false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations, public.org_memberships, public.seasons, public.season_teams TO authenticated;
GRANT ALL ON public.organizations, public.org_memberships, public.seasons, public.season_teams TO service_role;

-- helpers
CREATE OR REPLACE FUNCTION private.is_admin(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users u JOIN private.admin_emails a ON lower(a.email) = lower(u.email) WHERE u.id = _uid)
$$;
CREATE OR REPLACE FUNCTION private.is_org_leader(_uid uuid, _org uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_memberships WHERE user_id=_uid AND org_id=_org AND role='leader' AND status='approved')
$$;
CREATE OR REPLACE FUNCTION private.is_approved_member(_uid uuid, _org uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_memberships m JOIN public.organizations o ON o.id=m.org_id
    WHERE m.user_id=_uid AND m.org_id=_org AND m.status='approved' AND o.status='approved')
$$;
CREATE OR REPLACE FUNCTION private.org_is_approved(_org uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations WHERE id=_org AND status='approved')
$$;
REVOKE ALL ON FUNCTION private.is_admin(uuid), private.is_org_leader(uuid,uuid), private.is_approved_member(uuid,uuid), private.org_is_approved(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid), private.is_org_leader(uuid,uuid), private.is_approved_member(uuid,uuid), private.org_is_approved(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.am_i_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$ SELECT private.is_admin(auth.uid()) $$;
REVOKE ALL ON FUNCTION public.am_i_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.am_i_admin() TO authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY orgs_select ON public.organizations FOR SELECT TO authenticated
  USING (status='approved' OR created_by=auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY orgs_insert ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (created_by=auth.uid() AND status='pending' AND private.is_student(auth.uid()));
CREATE POLICY orgs_admin_update ON public.organizations FOR UPDATE TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY orgs_admin_delete ON public.organizations FOR DELETE TO authenticated
  USING (private.is_admin(auth.uid()));

CREATE POLICY mem_select ON public.org_memberships FOR SELECT TO authenticated
  USING (status='approved' OR user_id=auth.uid() OR private.is_org_leader(auth.uid(), org_id) OR private.is_admin(auth.uid()));
CREATE POLICY mem_request ON public.org_memberships FOR INSERT TO authenticated
  WITH CHECK (user_id=auth.uid() AND role='member' AND status='pending'
    AND private.is_student(auth.uid()) AND private.org_is_approved(org_id));
CREATE POLICY mem_leader_update ON public.org_memberships FOR UPDATE TO authenticated
  USING (private.is_org_leader(auth.uid(), org_id) OR private.is_admin(auth.uid()))
  WITH CHECK (private.is_org_leader(auth.uid(), org_id) OR private.is_admin(auth.uid()));
CREATE POLICY mem_delete ON public.org_memberships FOR DELETE TO authenticated
  USING (user_id=auth.uid() OR private.is_org_leader(auth.uid(), org_id) OR private.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION private.guard_membership_update() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.org_id <> OLD.org_id OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Membership org/user cannot change';
  END IF;
  IF NEW.role='leader' AND NEW.status<>'approved' THEN
    RAISE EXCEPTION 'Only approved members can be leaders';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_membership_update BEFORE UPDATE ON public.org_memberships
  FOR EACH ROW EXECUTE FUNCTION private.guard_membership_update();

-- creator becomes leader
CREATE OR REPLACE FUNCTION private.org_creator_leader() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.org_memberships (org_id,user_id,role,status) VALUES (NEW.id,NEW.created_by,'leader','approved')
    ON CONFLICT (org_id,user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER org_creator_leader AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION private.org_creator_leader();

CREATE POLICY seasons_select ON public.seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY seasons_admin_all ON public.seasons FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION private.season_unlocked(_season uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.seasons WHERE id=_season AND now() < team_lock_at AND now() < ends_at)
$$;
REVOKE ALL ON FUNCTION private.season_unlocked(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.season_unlocked(uuid) TO authenticated, service_role;

CREATE POLICY teams_select ON public.season_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY teams_insert ON public.season_teams FOR INSERT TO authenticated
  WITH CHECK (user_id=auth.uid() AND private.season_unlocked(season_id) AND private.is_approved_member(auth.uid(), org_id));
CREATE POLICY teams_update ON public.season_teams FOR UPDATE TO authenticated
  USING (user_id=auth.uid() AND private.season_unlocked(season_id))
  WITH CHECK (user_id=auth.uid() AND private.season_unlocked(season_id) AND private.is_approved_member(auth.uid(), org_id));
CREATE POLICY teams_delete ON public.season_teams FOR DELETE TO authenticated
  USING (user_id=auth.uid() AND private.season_unlocked(season_id));

-- scoring
CREATE OR REPLACE FUNCTION public.season_org_scores(p_season uuid)
RETURNS TABLE (org_id uuid, name text, category public.org_category, logo_svg text,
  score numeric, team_size int, member_count int, qualified boolean, rank int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  WITH s AS (
    SELECT id, CASE WHEN now() >= leaderboard_freeze_at AND NOT private.is_admin(auth.uid())
                    THEN leaderboard_freeze_at ELSE 'infinity'::timestamptz END AS cutoff
    FROM public.seasons WHERE id = p_season
  ), user_scores AS (
    SELECT t.org_id, t.user_id, COALESCE(SUM(l.amount) FILTER (WHERE l.id IS NOT NULL),0)::numeric AS us
    FROM public.season_teams t
    JOIN s ON s.id = t.season_id
    LEFT JOIN public.xp_ledger l ON l.user_id=t.user_id AND l.season_id=t.season_id
      AND l.counts_for_competition AND l.created_at < s.cutoff
    GROUP BY t.org_id, t.user_id
  ), ranked AS (
    SELECT *, row_number() OVER (PARTITION BY org_id ORDER BY us DESC) rn FROM user_scores
  ), agg AS (
    SELECT org_id, ROUND(AVG(us) FILTER (WHERE rn<=15),1) AS score, COUNT(*)::int AS team_size
    FROM ranked GROUP BY org_id
  )
  SELECT o.id, o.name, o.category, o.logo_svg,
    COALESCE(a.score,0), COALESCE(a.team_size,0),
    (SELECT COUNT(*)::int FROM public.org_memberships m WHERE m.org_id=o.id AND m.status='approved'),
    COALESCE(a.team_size,0) >= 5,
    (rank() OVER (ORDER BY (COALESCE(a.team_size,0) >= 5) DESC, COALESCE(a.score,0) DESC, o.name))::int
  FROM public.organizations o
  LEFT JOIN agg a ON a.org_id=o.id
  WHERE o.status='approved' AND EXISTS (SELECT 1 FROM s)
  ORDER BY 9;
$$;

CREATE OR REPLACE FUNCTION public.org_top_contributors(p_org uuid, p_season uuid)
RETURNS TABLE (user_id uuid, display_name text, score int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT t.user_id, p.display_name, COALESCE(SUM(l.amount),0)::int
  FROM public.season_teams t
  JOIN public.profiles p ON p.id=t.user_id
  JOIN public.seasons s ON s.id=t.season_id
  LEFT JOIN public.xp_ledger l ON l.user_id=t.user_id AND l.season_id=t.season_id AND l.counts_for_competition
    AND (now() < s.leaderboard_freeze_at OR private.is_admin(auth.uid()) OR l.created_at < s.leaderboard_freeze_at)
  WHERE t.org_id=p_org AND t.season_id=p_season
  GROUP BY t.user_id, p.display_name
  ORDER BY 3 DESC LIMIT 15;
$$;

CREATE OR REPLACE FUNCTION public.org_members(p_org uuid)
RETURNS TABLE (membership_id uuid, user_id uuid, display_name text, role public.membership_role, status public.membership_status, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT m.id, m.user_id, p.display_name, m.role, m.status, m.created_at
  FROM public.org_memberships m JOIN public.profiles p ON p.id=m.user_id
  WHERE m.org_id=p_org AND (m.status='approved' OR private.is_org_leader(auth.uid(), p_org) OR private.is_admin(auth.uid()))
  ORDER BY m.role DESC, p.display_name;
$$;

REVOKE ALL ON FUNCTION public.season_org_scores(uuid), public.org_top_contributors(uuid,uuid), public.org_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.season_org_scores(uuid), public.org_top_contributors(uuid,uuid), public.org_members(uuid) TO authenticated;

-- seed
INSERT INTO public.seasons (name, starts_at, ends_at, team_lock_at, leaderboard_freeze_at, is_active)
VALUES ('Fall 2026 Kickoff', now(), now() + interval '42 days', now() + interval '7 days', now() + interval '40 days', true);

INSERT INTO public.organizations (name, category, description, status, logo_svg) VALUES
('Hillside Hikers Collective','sports','Weekend trail runners and fire-road wanderers chasing every Berkeley hill view.','approved',
 '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#2f6b4f"/><path d="M8 48 L26 20 L36 34 L44 24 L56 48 Z" fill="#f4c542"/><circle cx="46" cy="16" r="5" fill="#fff4d6"/></svg>'),
('Byte Bay Coders','club','Hack nights, side projects and late-night debugging over boba.','approved',
 '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#1e3a8a"/><path d="M24 20 L12 32 L24 44 M40 20 L52 32 L40 44" stroke="#f4c542" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
('Lantern Cultural Circle','cultural','Sharing food, music and festivals from cultures across the Pacific Rim.','approved',
 '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#b4232c"/><rect x="30" y="8" width="4" height="8" fill="#f4c542"/><ellipse cx="32" cy="34" rx="14" ry="18" fill="#f4c542"/><path d="M22 34 H42" stroke="#b4232c" stroke-width="3"/></svg>'),
('Delta Tau Sigma','fraternity','Service-first brotherhood known for the annual Glade pancake breakfast.','approved',
 '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#3b2f63"/><path d="M32 12 L52 50 H12 Z" fill="none" stroke="#f4c542" stroke-width="5" stroke-linejoin="round"/><circle cx="32" cy="38" r="5" fill="#f4c542"/></svg>'),
('Alpha Rho Nu','sorority','Sisterhood, scholarship and the loudest cheering section at every campus event.','approved',
 '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="#d9577a"/><path d="M32 14 L37 27 L51 27 L40 36 L44 50 L32 42 L20 50 L24 36 L13 27 L27 27 Z" fill="#fff4d6"/></svg>');
