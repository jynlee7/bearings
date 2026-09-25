import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { OrgLogo } from "@/components/OrgLogo";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, formatDate, useActiveSeason, useIsAdmin, useMyMemberships } from "@/hooks/useSeason";

export function MyTeam() {
  const qc = useQueryClient();
  const { data: season } = useActiveSeason();
  const { data: memberships = [] } = useMyMemberships();
  const { data: isAdmin } = useIsAdmin();
  const { data: team } = useQuery({
    queryKey: ["my-team", season?.id],
    enabled: !!season,
    queryFn: async () => {
      const uid = await currentUserId();
      const { data } = await supabase
        .from("season_teams")
        .select("id, org_id")
        .eq("season_id", season!.id)
        .eq("user_id", uid!)
        .maybeSingle();
      return data;
    },
  });

  const eligible = memberships.filter((m) => m.status === "approved" && m.organizations?.status === "approved");
  const pendingOrgs = memberships.filter((m) => m.status === "pending" || m.organizations?.status === "pending");
  const leaderOf = memberships.filter((m) => m.role === "leader" && m.status === "approved");
  const locked = season ? new Date() >= new Date(season.team_lock_at) : true;

  async function choose(orgId: string) {
    if (!season || locked) return;
    const uid = await currentUserId();
    const { error } = team
      ? await supabase.from("season_teams").update({ org_id: orgId }).eq("id", team.id)
      : await supabase.from("season_teams").insert({ season_id: season.id, user_id: uid!, org_id: orgId });
    if (error) return toast.error("Couldn't save your team.");
    toast.success("Team saved!");
    qc.invalidateQueries({ queryKey: ["my-team"] });
    qc.invalidateQueries({ queryKey: ["season-scores"] });
  }

  return (
    <section className="mt-8 space-y-3">
      <h2 className="font-display text-lg font-bold">My Team</h2>
      {!season ? (
        <p className="surface-card p-4 text-sm text-muted-foreground">No active semester.</p>
      ) : (
        <div className="surface-card space-y-3 p-4">
          <p className="text-sm font-semibold">{season.name}</p>
          <div
            className={`flex gap-2 rounded-xl p-3 text-xs font-semibold ${locked ? "bg-secondary" : "bg-gold text-gold-foreground"}`}
          >
            {locked ? <Lock className="size-4 shrink-0" /> : <TriangleAlert className="size-4 shrink-0" />}
            {locked
              ? `Teams locked on ${formatDate(season.team_lock_at)}.`
              : `Choose carefully — your team locks on ${formatDate(season.team_lock_at)} and can't be changed after.`}
          </div>
          {eligible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Join an org first. <Link to="/orgs" className="font-bold text-primary underline">Browse orgs</Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {eligible.map((m) => {
                const selected = team?.org_id === m.org_id;
                return (
                  <li key={m.id}>
                    <button
                      disabled={locked}
                      onClick={() => choose(m.org_id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-2 text-left ${selected ? "border-primary bg-secondary" : "border-border"} disabled:opacity-70`}
                    >
                      <OrgLogo svg={m.organizations!.logo_svg} name={m.organizations!.name} className="size-10" />
                      <span className="flex-1 text-sm font-bold">{m.organizations!.name}</span>
                      {selected && <Badge>Competing</Badge>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {pendingOrgs.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Pending: {pendingOrgs.map((m) => m.organizations?.name).join(", ")}
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-sm">
        {leaderOf.map((m) => (
          <Link key={m.id} to="/manage/$orgId" params={{ orgId: m.org_id }} className="rounded-full bg-secondary px-3 py-1.5 font-bold text-primary">
            Manage {m.organizations?.name}
          </Link>
        ))}
        {isAdmin && (
          <Link to="/admin" className="rounded-full bg-primary px-3 py-1.5 font-bold text-primary-foreground">
            Admin page
          </Link>
        )}
      </div>
    </section>
  );
}
