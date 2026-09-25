import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, LogOut, MapPin, Sparkles } from "lucide-react";

import { AvatarPreview } from "@/components/AvatarPreview";
import { MyTeam } from "@/components/MyTeam";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { levelProgress } from "@/lib/levels";
import { useAvatarItems, useLedger, useProfile } from "@/hooks/useBearings";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Bearings" },
      {
        name: "description",
        content: "Your Bearings level, total XP and recent Berkeley check-ins.",
      },
      { property: "og:title", content: "Profile — Bearings" },
      {
        property: "og:description",
        content: "Your Bearings level, total XP and recent Berkeley check-ins.",
      },
    ],
  }),
  component: ProfilePage,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: ledger = [] } = useLedger();
  const { data: items = [] } = useAvatarItems();

  const totalXp = ledger.reduce((sum, entry) => sum + entry.amount, 0);
  const progress = levelProgress(totalXp);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <div className="surface-card overflow-hidden">
        <div className="sun-wash flex items-center gap-4 p-5">
          <AvatarPreview
            config={profile?.avatar_config ?? {}}
            items={items}
            className="size-24 shrink-0 rounded-2xl"
          />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold text-primary">
              {profile?.display_name ?? "Explorer"}
            </h1>
            <Badge
              className={
                profile?.role === "student"
                  ? "mt-1 rounded-full bg-primary text-primary-foreground"
                  : "mt-1 rounded-full bg-gold text-gold-foreground"
              }
            >
              {profile?.role === "student" ? (
                <>
                  <GraduationCap className="mr-1 size-3.5" /> Student
                </>
              ) : (
                <>
                  <MapPin className="mr-1 size-3.5" /> Visitor
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-bold">Level {progress.level}</span>
            <span className="text-sm text-muted-foreground">{totalXp} XP total</span>
          </div>
          <Progress value={progress.progress * 100} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {progress.xpForNextLevel - progress.xpIntoLevel} XP to level{" "}
            {progress.level + 1}
          </p>
        </div>
      </div>

      <MyTeam />

      <h2 className="mt-8 mb-3 font-display text-lg font-bold">Recent activity</h2>
      {ledger.length === 0 ? (
        <p className="surface-card p-5 text-sm text-muted-foreground">
          No check-ins yet. Head to the map and find your first spot.
        </p>
      ) : (
        <ul className="space-y-2">
          {ledger.map((entry) => (
            <li key={entry.id} className="surface-card flex items-center gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold text-gold-foreground">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  +{entry.amount} XP · {entry.reason}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(entry.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="secondary"
        onClick={handleSignOut}
        className="mt-8 h-11 w-full rounded-full font-bold"
      >
        <LogOut className="mr-2 size-4" /> Sign out
      </Button>
    </div>
  );
}
