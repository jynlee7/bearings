import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AvatarConfig, AvatarItem } from "@/components/AvatarPreview";

export type Place = {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  xp_value: number;
  student_only: boolean;
};

export type Profile = {
  id: string;
  display_name: string;
  role: "student" | "visitor";
  avatar_config: AvatarConfig;
};

export type LedgerEntry = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, avatar_config")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        display_name: data.display_name,
        role: data.role as "student" | "visitor",
        avatar_config: (data.avatar_config ?? {}) as AvatarConfig,
      };
    },
  });
}

export function usePlaces() {
  return useQuery({
    queryKey: ["places"],
    queryFn: async (): Promise<Place[]> => {
      const { data, error } = await supabase
        .from("places")
        .select(
          "id, name, description, category, latitude, longitude, radius_meters, xp_value, student_only",
        )
        .order("name");
      if (error) throw error;
      return (data ?? []) as Place[];
    },
  });
}

export function useVisitedPlaceIds() {
  return useQuery({
    queryKey: ["checkins"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("checkins").select("place_id");
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((row) => row.place_id as string)));
    },
  });
}

export function useLedger() {
  return useQuery({
    queryKey: ["ledger"],
    queryFn: async (): Promise<LedgerEntry[]> => {
      const { data, error } = await supabase
        .from("xp_ledger")
        .select("id, amount, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as LedgerEntry[];
    },
  });
}

export function useAvatarItems() {
  return useQuery({
    queryKey: ["avatar_items"],
    queryFn: async (): Promise<AvatarItem[]> => {
      const { data, error } = await supabase
        .from("avatar_items")
        .select("id, slot, name, svg_data, required_level, sort_order")
        .order("required_level")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as AvatarItem[];
    },
  });
}
