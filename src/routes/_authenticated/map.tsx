import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Check, Loader2, MapPin, Lock } from "lucide-react";
import { toast } from "sonner";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LevelUpModal, type LevelUpInfo } from "@/components/LevelUpModal";
import { usePlaces, useVisitedPlaceIds, type Place } from "@/hooks/useBearings";
import { checkIn } from "@/lib/checkin.functions";

const MapView = lazy(() => import("@/components/MapView"));

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Map — Bearings" },
      {
        name: "description",
        content: "Find check-in spots around Berkeley and collect XP on the Bearings map.",
      },
      { property: "og:title", content: "Map — Bearings" },
      {
        property: "og:description",
        content: "Find check-in spots around Berkeley and collect XP on the Bearings map.",
      },
    ],
  }),
  component: MapPage,
});

function MapSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center bg-muted">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function MapPage() {
  const { data: places = [] } = usePlaces();
  const { data: visitedIds = [] } = useVisitedPlaceIds();
  const [selected, setSelected] = useState<Place | null>(null);
  const [busy, setBusy] = useState(false);
  const [levelUp, setLevelUp] = useState<LevelUpInfo | null>(null);
  const queryClient = useQueryClient();
  const runCheckIn = useServerFn(checkIn);

  async function handleCheckIn(place: Place) {
    if (!("geolocation" in navigator)) {
      toast.error("This device can't share your location.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await runCheckIn({
            data: {
              place_id: place.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          toast.success(`+${result.xpGained} XP · ${result.placeName}`);
          setSelected(null);
          await queryClient.invalidateQueries();
          if (result.leveledUp) {
            setLevelUp({ level: result.level, unlockedItems: result.unlockedItems });
          }
        } catch {
          toast.error("Check-in failed. Try again in a moment.");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        toast.error("Turn on location access to check in here.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  const visited = new Set(visitedIds);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-primary">Explore</h1>
          <p className="text-sm text-muted-foreground">
            {visited.size} of {places.length} spots visited
          </p>
        </div>
        <Badge className="rounded-full bg-gold px-3 py-1 text-gold-foreground">
          <MapPin className="mr-1 size-3.5" /> Berkeley
        </Badge>
      </header>

      <div className="flex-1 overflow-hidden rounded-t-3xl border-t border-border">
        <ClientOnly fallback={<MapSkeleton />}>
          <Suspense fallback={<MapSkeleton />}>
            <MapView places={places} visitedIds={visitedIds} onSelect={setSelected} />
          </Suspense>
        </ClientOnly>
      </div>

      <Drawer open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DrawerContent className="mx-auto max-w-md">
          {selected && (
            <>
              <DrawerHeader className="text-left">
                <div className="flex items-center gap-2">
                  <DrawerTitle className="font-display text-xl font-extrabold">
                    {selected.name}
                  </DrawerTitle>
                  {selected.student_only && (
                    <Badge variant="secondary" className="rounded-full">
                      <Lock className="mr-1 size-3" /> Students
                    </Badge>
                  )}
                </div>
                <DrawerDescription>{selected.description}</DrawerDescription>
              </DrawerHeader>
              <div className="flex items-center gap-2 px-4">
                <Badge className="rounded-full bg-gold text-gold-foreground">
                  {selected.xp_value} XP
                </Badge>
                <Badge variant="secondary" className="rounded-full capitalize">
                  {selected.category}
                </Badge>
                {visited.has(selected.id) && (
                  <Badge variant="secondary" className="rounded-full">
                    <Check className="mr-1 size-3" /> Visited
                  </Badge>
                )}
              </div>
              <div className="p-4 pt-5">
                <Button
                  onClick={() => handleCheckIn(selected)}
                  disabled={busy}
                  className="h-12 w-full rounded-full text-base font-bold"
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : "Check in"}
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  You need to be within {selected.radius_meters}m of this spot.
                </p>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <LevelUpModal info={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  );
}
