import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type OrgCategory = "club" | "fraternity" | "sorority" | "cultural" | "sports" | "other";
export const ORG_CATEGORIES: OrgCategory[] = [
  "club",
  "fraternity",
  "sorority",
  "cultural",
  "sports",
  "other",
];

export type Season = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  team_lock_at: string;
  leaderboard_freeze_at: string;
  is_active: boolean;
};

export type OrgScore = {
  org_id: string;
  name: string;
  category: OrgCategory;
  logo_svg: string;
  score: number;
  team_size: number;
  member_count: number;
  qualified: boolean;
  rank: number;
};

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useActiveSeason() {
  return useQuery({
    queryKey: ["season", "active"],
    queryFn: async (): Promise<Season | null> => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
  });
}

export function useSeasonScores(seasonId: string | undefined) {
  return useQuery({
    queryKey: ["season-scores", seasonId],
    enabled: !!seasonId,
    queryFn: async (): Promise<OrgScore[]> => {
      const { data, error } = await supabase.rpc("season_org_scores", {
        p_season: seasonId!,
      });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, score: Number(r.score) })) as OrgScore[];
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["am-i-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("am_i_admin");
      if (error) throw error;
      return !!data;
    },
  });
}

export type MyMembership = {
  id: string;
  org_id: string;
  role: "member" | "leader";
  status: "pending" | "approved";
  organizations: { id: string; name: string; logo_svg: string; status: string } | null;
};

export function useMyMemberships() {
  return useQuery({
    queryKey: ["my-memberships"],
    queryFn: async (): Promise<MyMembership[]> => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data, error } = await supabase
        .from("org_memberships")
        .select("id, org_id, role, status, organizations(id, name, logo_svg, status)")
        .eq("user_id", uid);
      if (error) throw error;
      return (data ?? []) as unknown as MyMembership[];
    },
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
