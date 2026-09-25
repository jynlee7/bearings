import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Snowflake } from "lucide-react";

import { OrgLogo } from "@/components/OrgLogo";
import { Badge } from "@/components/ui/badge";
import { useActiveSeason, useIsAdmin, useSeasonScores, type OrgScore } from "@/hooks/useSeason";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Semester Leaderboard — Bearings" },
      { name: "description", content: "See which Berkeley student orgs lead the current Bearings semester." },
      { property: "og:title", content: "Semester Leaderboard — Bearings" },
      { property: "og:description", content: "See which Berkeley student orgs lead the current Bearings semester." },
    ],
  }),
  component: LeaderboardPage,
});

function useCountdown(target?: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target || now === null) return "";
  const ms = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

const PODIUM = [
  { place: 2, cls: "bg-[var(--silver)] h-24" },
  { place: 1, cls: "bg-gold h-32" },
  { place: 3, cls: "bg-[var(--bronze)] h-20" },
];

function LeaderboardPage() {
  const { data: season, isLoading } = useActiveSeason();
  const { data: scores = [] } = useSeasonScores(season?.id);
  const { data: isAdmin } = useIsAdmin();
  const countdown = useCountdown(season?.ends_at);

  if (isLoading) return null;
  if (!season)
    return <p className="mx-auto max-w-md p-6 text-center text-muted-foreground">No active semester right now.</p>;

  const frozen = new Date() >= new Date(season.leaderboard_freeze_at);
  const hideChanges = frozen && !isAdmin;
  const byPlace = (n: number): OrgScore | undefined => scores.find((s) => s.rank === n && s.qualified);

  return (
    <div className="mx-auto max-w-md space-y-5 px-5 py-6 pb-28">
      <div className="surface-card sun-wash p-5 text-center">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Current semester</p>
        <h1 className="font-display text-2xl font-extrabold text-primary">{season.name}</h1>
        <p className="mt-1 font-display text-lg font-bold tabular-nums">{countdown} left</p>
      </div>

      {frozen && (
        <div className="surface-card flex items-center gap-3 p-4 text-sm font-semibold">
          <Snowflake className="size-5 shrink-0 text-primary" />
          Leaderboard frozen — winners revealed at the end of the semester!
          {isAdmin && <Badge variant="secondary" className="ml-auto shrink-0">Admin: live</Badge>}
        </div>
      )}

      <div className="flex items-end justify-center gap-3 pt-4">
        {PODIUM.map(({ place, cls }) => {
          const org = byPlace(place);
          return (
            <div key={place} className="flex w-1/3 flex-col items-center gap-2">
              {org ? (
                <Link to="/orgs/$orgId" params={{ orgId: org.org_id }} className="flex flex-col items-center gap-1 text-center">
                  <OrgLogo svg={org.logo_svg} name={org.name} className="size-14" />
                  <span className="line-clamp-2 text-xs font-bold">{org.name}</span>
                  {!hideChanges && <span className="text-xs text-muted-foreground">{org.score}</span>}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">Open spot</span>
              )}
              <div className={`${cls} grid w-full place-items-center rounded-t-2xl font-display text-3xl font-extrabold text-gold-foreground`}>
                {place}
              </div>
            </div>
          );
        })}
      </div>

      <ol className="space-y-2">
        {scores.map((s) => (
          <li key={s.org_id}>
            <Link to="/orgs/$orgId" params={{ orgId: s.org_id }} className="surface-card flex items-center gap-3 p-3">
              <span className="w-7 text-center font-display text-lg font-bold text-primary">
                {s.qualified ? s.rank : "—"}
              </span>
              <OrgLogo svg={s.logo_svg} name={s.name} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.member_count} members · {s.team_size} on team
                  {!s.qualified && " · Not yet qualified"}
                </p>
              </div>
              <span className="font-display font-bold">{s.score}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
