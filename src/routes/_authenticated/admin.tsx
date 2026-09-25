import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { OrgLogo } from "@/components/OrgLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, useIsAdmin, type Season } from "@/hooks/useSeason";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Bearings" },
      { name: "description", content: "Approve student orgs and manage Bearings semesters." },
      { property: "og:title", content: "Admin — Bearings" },
      { property: "og:description", content: "Approve student orgs and manage Bearings semesters." },
    ],
  }),
  component: AdminPage,
});

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function AdminPage() {
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { data: pending = [] } = useQuery({
    queryKey: ["admin-pending-orgs"],
    enabled: !!isAdmin,
    queryFn: async () =>
      (await supabase.from("organizations").select("*").eq("status", "pending").order("created_at")).data ?? [],
  });
  const { data: seasons = [] } = useQuery({
    queryKey: ["admin-seasons"],
    enabled: !!isAdmin,
    queryFn: async () =>
      ((await supabase.from("seasons").select("*").order("starts_at", { ascending: false })).data ?? []) as Season[],
  });

  const now = new Date();
  const [form, setForm] = useState({
    name: "",
    starts_at: toLocalInput(now),
    ends_at: toLocalInput(new Date(now.getTime() + 42 * 86400000)),
    team_lock_at: toLocalInput(new Date(now.getTime() + 7 * 86400000)),
    leaderboard_freeze_at: toLocalInput(new Date(now.getTime() + 40 * 86400000)),
  });

  if (isLoading) return null;
  if (!isAdmin) return <p className="mx-auto max-w-md p-6 text-center">Admins only.</p>;

  const refresh = () => qc.invalidateQueries();

  async function decide(id: string, approve: boolean) {
    const { error } = approve
      ? await supabase.from("organizations").update({ status: "approved" }).eq("id", id)
      : await supabase.from("organizations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  async function createSeason(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Give the semester a name."); return; }
    const iso = (v: string) => new Date(v).toISOString();
    const { error } = await supabase.from("seasons").insert({
      name: form.name.trim(),
      starts_at: iso(form.starts_at),
      ends_at: iso(form.ends_at),
      team_lock_at: iso(form.team_lock_at),
      leaderboard_freeze_at: iso(form.leaderboard_freeze_at),
      is_active: false,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Semester created.");
    setForm({ ...form, name: "" });
    refresh();
  }

  async function activate(id: string) {
    await supabase.from("seasons").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase.from("seasons").update({ is_active: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function deactivate(id: string) {
    const { error } = await supabase.from("seasons").update({ is_active: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-5 py-6 pb-28">
      <h1 className="font-display text-3xl font-extrabold text-primary">Admin</h1>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Pending orgs ({pending.length})</h2>
        <ul className="space-y-2">
          {pending.length === 0 && <li className="surface-card p-4 text-sm text-muted-foreground">Nothing to review.</li>}
          {pending.map((o) => (
            <li key={o.id} className="surface-card space-y-2 p-4">
              <div className="flex items-center gap-3">
                <OrgLogo svg={o.logo_svg} name={o.name} />
                <div className="min-w-0">
                  <p className="font-bold">{o.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{o.category}</p>
                </div>
              </div>
              <p className="text-sm">{o.description}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(o.id, true)}>Approve</Button>
                <Button size="sm" variant="secondary" onClick={() => decide(o.id, false)}>Reject</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Semesters</h2>
        <ul className="space-y-2">
          {seasons.map((s) => (
            <li key={s.id} className="surface-card space-y-1 p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-bold">{s.name}</p>
                {s.is_active && <Badge>Active</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(s.starts_at)} → {formatDate(s.ends_at)} · teams lock {formatDate(s.team_lock_at)} · freeze {formatDate(s.leaderboard_freeze_at)}
              </p>
              <Button size="sm" variant="outline" onClick={() => (s.is_active ? deactivate(s.id) : activate(s.id))}>
                {s.is_active ? "Deactivate" : "Make active"}
              </Button>
            </li>
          ))}
        </ul>
        <form onSubmit={createSeason} className="surface-card mt-3 space-y-2 p-4 text-sm">
          <p className="font-bold">New semester</p>
          <Input placeholder="Semester name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {(["starts_at", "ends_at", "team_lock_at", "leaderboard_freeze_at"] as const).map((k) => (
            <label key={k} className="block">
              <span className="text-xs text-muted-foreground">{k.replace(/_/g, " ")}</span>
              <Input type="datetime-local" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </label>
          ))}
          <Button className="w-full">Create semester</Button>
        </form>
      </section>
    </div>
  );
}
