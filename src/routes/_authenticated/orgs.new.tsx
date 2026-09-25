import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { makeInitialsLogo, OrgLogo } from "@/components/OrgLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useBearings";
import { currentUserId, ORG_CATEGORIES, type OrgCategory } from "@/hooks/useSeason";

export const Route = createFileRoute("/_authenticated/orgs/new")({
  head: () => ({
    meta: [
      { title: "Create an Org — Bearings" },
      { name: "description", content: "Register your student organization for the Bearings semester." },
      { property: "og:title", content: "Create an Org — Bearings" },
      { property: "og:description", content: "Register your student organization for the Bearings semester." },
    ],
  }),
  component: NewOrgPage,
});

const COLORS = ["#1e3a8a", "#2f6b4f", "#b4232c", "#3b2f63", "#d9577a", "#c2780f"];

function NewOrgPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<OrgCategory>("club");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]!);
  const [busy, setBusy] = useState(false);
  const logo = makeInitialsLogo(name, color);

  if (profile && profile.role !== "student") {
    return (
      <div className="mx-auto max-w-md px-5 py-10">
        <p className="surface-card p-5 text-sm">
          Only verified @berkeley.edu students can create orgs.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) return toast.error("Name must be at least 3 characters.");
    setBusy(true);
    const uid = await currentUserId();
    const { error } = await supabase.from("organizations").insert({
      name: name.trim().slice(0, 80),
      category,
      description: description.trim().slice(0, 600),
      logo_svg: logo,
      created_by: uid!,
      status: "pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message.includes("duplicate") ? "That name is taken." : error.message);
    toast.success("Submitted! An admin will review your org.");
    qc.invalidateQueries();
    navigate({ to: "/profile" });
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 px-5 py-6 pb-28">
      <h1 className="font-display text-3xl font-extrabold text-primary">New org</h1>
      <div className="flex items-center gap-3">
        <OrgLogo svg={logo} name={name || "Org"} className="size-16" />
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Logo color ${c}`}
              className={`size-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Org name" maxLength={80} className="h-11" />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as OrgCategory)}
        className="h-11 w-full rounded-md border border-input bg-card px-3 capitalize"
      >
        {ORG_CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's your org about?" maxLength={600} rows={4} />
      <Button disabled={busy} className="h-11 w-full rounded-full font-bold">
        Submit for approval
      </Button>
    </form>
  );
}
