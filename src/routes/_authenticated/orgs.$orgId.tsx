import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { OrgLogo } from "@/components/OrgLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useBearings";
import { currentUserId, useActiveSeason, useMyMemberships, useSeasonScores } from "@/hooks/useSeason";

export const Route = createFileRoute("/_authenticated/orgs/$orgId")({
  head: () => ({
    meta: [
      { title: "Org — Bearings" },
      { name: "description", content: "Org details, members and semester standing on Bearings." },
      { property: "og:title", content: "Org — Bearings" },
      { property: "og:description", content: "Org details, members and semester standing on Bearings." },
    ],
  }),
  component: OrgPage,
});

function OrgPage() {
  const { orgId } = Route.useParams();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: season } = useActiveSeason();
  const { data: scores = [] } = useSeasonScores(season?.id);
  const { data: mine = [] } = useMyMemberships();
  const { data: org, isLoading } = useQuery({
    queryKey: ["org", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: members = [] } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("org_members", { p_org: orgId });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return null;
  if (!org) return <p className="p-6 text-center">Org not found.</p>;

  const standing = scores.find((s) => s.org_id === orgId);
  const approved = members.filter((m) => m.status === "approved");
  const membership = mine.find((m) => m.org_id === orgId);

  async function requestJoin() {
    const uid = await currentUserId();
    const { error } = await supabase.from("org_memberships").insert({ org_id: orgId, user_id: uid!, role: "member", status: "pending" });
    if (error) return toast.error(error.message);
    toast.success("Request sent to the org leaders.");
    qc.invalidateQueries({ queryKey: ["my-memberships"] });
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-5 py-6 pb-28">
      <div className="surface-card overflow-hidden">
        <div className="sun-wash flex items-center gap-4 p-5">
          <OrgLogo svg={org.logo_svg} name={org.name} className="size-20" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold text-primary">{org.name}</h1>
            <p className="text-sm capitalize text-muted-foreground">{org.category}</p>
            {org.status === "pending" && <Badge className="mt-1">Pending approval</Badge>}
          </div>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm">{org.description || "No description yet."}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Members" value={approved.length} />
            <Stat label="Rank" value={standing ? `#${standing.rank}` : "—"} />
            <Stat label="Score" value={standing ? standing.score : "—"} />
          </div>
          {standing && !standing.qualified && (
            <p className="text-xs text-muted-foreground">
              Not yet qualified — needs 5 members on its semester team ({standing.team_size}/5).
            </p>
          )}
          {membership?.role === "leader" && membership.status === "approved" ? (
            <Button asChild className="h-11 w-full rounded-full font-bold">
              <Link to="/manage/$orgId" params={{ orgId }}>Leader dashboard</Link>
            </Button>
          ) : membership ? (
            <Button disabled variant="secondary" className="h-11 w-full rounded-full font-bold">
              {membership.status === "pending" ? "Request pending" : "You're a member"}
            </Button>
          ) : profile?.role === "student" && org.status === "approved" ? (
            <Button onClick={requestJoin} className="h-11 w-full rounded-full font-bold">Request to join</Button>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Only verified Berkeley students can join orgs.</p>
          )}
        </div>
      </div>
      <h2 className="font-display text-lg font-bold">Members</h2>
      <ul className="surface-card divide-y divide-border">
        {approved.map((m) => (
          <li key={m.membership_id} className="flex items-center justify-between p-3 text-sm">
            <span>{m.display_name}</span>
            {m.role === "leader" && <Badge variant="secondary">Leader</Badge>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary p-2">
      <p className="font-display text-xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
