import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import {
  AvatarPreview,
  ItemSwatch,
  type AvatarConfig,
} from "@/components/AvatarPreview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp } from "@/lib/levels";
import { useAvatarItems, useLedger, useProfile } from "@/hooks/useBearings";

export const Route = createFileRoute("/_authenticated/avatar")({
  head: () => ({
    meta: [
      { title: "Avatar builder — Bearings" },
      {
        name: "description",
        content: "Dress your bear with the hair, outfits and accessories you've unlocked.",
      },
      { property: "og:title", content: "Avatar builder — Bearings" },
      {
        property: "og:description",
        content: "Dress your bear with the hair, outfits and accessories you've unlocked.",
      },
    ],
  }),
  component: AvatarPage,
});

const SLOTS = ["body", "hair", "outfit", "accessory", "background"] as const;

function AvatarPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: items = [] } = useAvatarItems();
  const { data: ledger = [] } = useLedger();
  const [config, setConfig] = useState<AvatarConfig>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setConfig(profile.avatar_config ?? {});
  }, [profile]);

  const level = levelFromXp(ledger.reduce((sum, entry) => sum + entry.amount, 0));

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_config: config })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your look. Try again.");
      return;
    }
    toast.success("Looking good. Avatar saved.");
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <h1 className="font-display text-2xl font-extrabold text-primary">Avatar builder</h1>
      <p className="text-sm text-muted-foreground">You're level {level}.</p>

      <div className="surface-card sun-wash mt-4 grid place-items-center p-6">
        <AvatarPreview config={config} items={items} className="size-52 rounded-3xl" />
      </div>

      <Tabs defaultValue="body" className="mt-6">
        <TabsList className="grid w-full grid-cols-5 rounded-full">
          {SLOTS.map((slot) => (
            <TabsTrigger key={slot} value={slot} className="rounded-full text-xs capitalize">
              {slot}
            </TabsTrigger>
          ))}
        </TabsList>

        {SLOTS.map((slot) => (
          <TabsContent key={slot} value={slot} className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, [slot]: null }))}
                className={`surface-card grid aspect-square place-items-center text-xs font-semibold ${
                  !config[slot] ? "ring-2 ring-primary" : ""
                }`}
              >
                None
              </button>
              {items
                .filter((item) => item.slot === slot)
                .map((item) => {
                  const locked = item.required_level > level;
                  const active = config[slot] === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={locked}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, [slot]: item.id }))
                      }
                      className={`surface-card relative overflow-hidden p-2 text-left ${
                        active ? "ring-2 ring-primary" : ""
                      } ${locked ? "opacity-50" : ""}`}
                    >
                      <ItemSwatch item={item} className="aspect-square w-full rounded-xl" />
                      <p className="mt-1 truncate text-[11px] font-semibold">{item.name}</p>
                      {locked && (
                        <span className="absolute inset-0 grid place-items-center bg-card/70 text-center text-[11px] font-bold">
                          <span>
                            <Lock className="mx-auto mb-1 size-4" />
                            Unlocks at level {item.required_level}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 h-12 w-full rounded-full text-base font-bold"
      >
        {saving ? <Loader2 className="size-5 animate-spin" /> : "Save avatar"}
      </Button>
    </div>
  );
}
