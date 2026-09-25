import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { levelFromXp } from "@/lib/levels";

const checkInInput = z.object({
  place_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type CheckInResult =
  | {
      ok: true;
      xpGained: number;
      totalXp: number;
      level: number;
      previousLevel: number;
      leveledUp: boolean;
      placeName: string;
      unlockedItems: { id: string; name: string; slot: string }[];
    }
  | { ok: false; code: "too_far" | "cooldown" | "not_allowed"; message: string };

export const checkIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkInInput.parse(data))
  .handler(async ({ data, context }): Promise<CheckInResult> => {
    const { supabase, userId } = context;

    // RLS hides student_only places from visitors, so a miss here means no access.
    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("id, name, latitude, longitude, radius_meters, xp_value")
      .eq("id", data.place_id)
      .maybeSingle();

    if (placeError) throw placeError;
    if (!place) {
      return {
        ok: false,
        code: "not_allowed",
        message: "This spot is only open to verified Berkeley students.",
      };
    }

    const distance = haversineMeters(
      data.latitude,
      data.longitude,
      place.latitude,
      place.longitude,
    );

    if (distance > place.radius_meters) {
      return {
        ok: false,
        code: "too_far",
        message: `You're ${Math.round(distance)}m away — get closer!`,
      };
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent, error: recentError } = await supabase
      .from("checkins")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("place_id", place.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentError) throw recentError;
    const lastVisit = recent?.[0];
    if (lastVisit) {
      const next = new Date(
        new Date(lastVisit.created_at).getTime() + 24 * 60 * 60 * 1000,
      );
      const hours = Math.max(1, Math.ceil((next.getTime() - Date.now()) / 3600000));
      return {
        ok: false,
        code: "cooldown",
        message: `Already checked in here. Come back in about ${hours}h.`,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("checkins")
      .insert({ user_id: userId, place_id: place.id })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const { error: ledgerError } = await supabaseAdmin.from("xp_ledger").insert({
      user_id: userId,
      amount: place.xp_value,
      reason: `Visited ${place.name}`,
      source_type: "checkin",
      source_id: inserted.id,
    });
    if (ledgerError) throw ledgerError;

    const { data: ledger, error: sumError } = await supabaseAdmin
      .from("xp_ledger")
      .select("amount")
      .eq("user_id", userId);
    if (sumError) throw sumError;

    const totalXp = (ledger ?? []).reduce((sum, row) => sum + row.amount, 0);
    const level = levelFromXp(totalXp);
    const previousLevel = levelFromXp(totalXp - place.xp_value);
    const leveledUp = level > previousLevel;

    let unlockedItems: { id: string; name: string; slot: string }[] = [];
    if (leveledUp) {
      const { data: items } = await supabaseAdmin
        .from("avatar_items")
        .select("id, name, slot, required_level")
        .gt("required_level", previousLevel)
        .lte("required_level", level);
      unlockedItems = (items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        slot: item.slot as string,
      }));
    }

    return {
      ok: true,
      xpGained: place.xp_value,
      totalXp,
      level,
      previousLevel,
      leveledUp,
      placeName: place.name,
      unlockedItems,
    };
  });
