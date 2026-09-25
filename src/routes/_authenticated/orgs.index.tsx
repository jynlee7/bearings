import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";

import { OrgLogo } from "@/components/OrgLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useBearings";
import { ORG_CATEGORIES, type OrgCategory } from "@/hooks/useSeason";

export const Route = createFileRoute("/_authenticated/orgs/")({
  head: () => ({
    meta: [
      { title: "Student Orgs — Bearings" },
      { name: "description", content: "Find Berkeley student organizations competing this season." },
      { property: "og:title", content: "Student Orgs — Bearings" },
      { property: "og:description", content: "Find Berkeley student organizations competing this season." },
    ],
  }),
  component: OrgsPage,
});

function OrgsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<OrgCategory | "all">("all");
  const { data: profile } = useProfile();
  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, category, description, logo_svg, status")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () =>
      orgs.filter(
        (o) =>
          (cat === "all" || o.category === cat) &&
          o.name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [orgs, q, cat],
  );

  return (
    <div className="mx-auto max-w-md px-5 py-6 pb-28">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold text-primary">Orgs</h1>
        {profile?.role === "student" && (
          <Button asChild size="sm" className="rounded-full font-bold">
            <Link to="/orgs/new">
              <Plus className="mr-1 size-4" /> New org
            </Link>
          </Button>
        )}
      </div>
      <div className="relative mt-4">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search orgs"
          className="h-11 rounded-full pl-9"
        />
      </div>
      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {(["all", ...ORG_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${
              cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {filtered.map((o) => (
          <li key={o.id}>
            <Link
              to="/orgs/$orgId"
              params={{ orgId: o.id }}
              className="surface-card flex items-center gap-3 p-4"
            >
              <OrgLogo svg={o.logo_svg} name={o.name} />
              <div className="min-w-0">
                <p className="truncate font-bold">{o.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{o.category}</p>
              </div>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <p className="surface-card p-5 text-sm text-muted-foreground">No orgs match.</p>
        )}
      </ul>
    </div>
  );
}
