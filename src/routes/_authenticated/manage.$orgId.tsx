import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useSeason";

export const Route = createFileRoute("/_authenticated/manage/$orgId")({
  head: () => ({
    meta: [
      { title: "Leader Dashboard — Bearings" },
      { name: "description", content: "Manage join requests and members for your org." },
      { property: "og:title", content: "Leader Dashboard — Bearings" },
      { property: "og:description", content: "Manage join requests and members for your org." },
    ],
  }),
  component: ManagePage,
});

function ManagePage() {
  const { orgId } = Route.useParams();
  const qc = useQueryClient();
  const { data: season } = useActiveSeason();
  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: async () => (await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle()).data,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("org_members", { p_org: orgId });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: top = [] } = useQuery({
    queryKey: ["org-top", orgId, season?.id],
    enabled: !!season,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("org_top_contributors", { p_org: orgId, p_season: season!.id });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["org-members", orgId] });

  async function update(id: string, patch: { status?: "approved"; role?: "leader" }) {
    const { error } = await supabase.from("org_memberships").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function reject(id: string) {
    const { error } = await supabase.from("org_memberships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");

  return (
    <div className="mx-auto max-w-md space-y-4 px-5 py-6 pb-28">
      <h1 className="font-display text-2xl font-extrabold text-primary">{org?.name ?? "Org"} · Leaders</h1>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Join requests ({pending.length})</h2>
        <ul className="surface-card divide-y divide-border">
          {pending.length === 0 && <li className="p-4 text-sm text-muted-foreground">No pending requests.</li>}
          {pending.map((m) => (
            <li key={m.membership_id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <span className="truncate">{m.display_name}</span>
              <div className="flex gap-2">
                <Button size="icon" aria-label="Approve" onClick={() => update(m.membership_id, { status: "approved" })}><Check className="size-4" /></Button>
                <Button size="icon" variant="secondary" aria-label="Reject" onClick={() => reject(m.membership_id)}><X className="size-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Members ({approved.length})</h2>
        <ul className="surface-card divide-y divide-border">
          {approved.map((m) => (
            <li key={m.membership_id} className="flex items-center justify-between p-3 text-sm">
              <span className="truncate">{m.display_name}</span>
              {m.role === "leader" ? (
                <Badge variant="secondary">Leader</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => update(m.membership_id, { role: "leader" })}>
                  <Crown className="mr-1 size-3.5" /> Promote
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Top contributors {season ? `· ${season.name}` : ""}</h2>
        <ol className="surface-card divide-y divide-border">
          {top.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nobody on the semester team yet.</li>}
          {top.map((t, i) => (
            <li key={t.user_id} className="flex justify-between p-3 text-sm">
              <span>{i + 1}. {t.display_name}</span>
              <span className="font-bold">{t.score} XP</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
