import { useEffect } from "react";
import { PartyPopper, Sparkles } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type LevelUpInfo = {
  level: number;
  unlockedItems: { id: string; name: string; slot: string }[];
};

export function LevelUpModal({
  info,
  onClose,
}: {
  info: LevelUpInfo | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!info) return;
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#F2C14E", "#16307A", "#FFE9B8", "#2E4099"],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [info]);

  return (
    <Dialog open={info !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl text-center">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold text-primary">
            <PartyPopper className="mx-auto mb-2 size-8 text-gold" />
            Level {info?.level}!
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Nice wandering. You just leveled up.
        </p>
        {info && info.unlockedItems.length > 0 && (
          <div className="mt-2 space-y-2 rounded-2xl bg-secondary p-4 text-left">
            <p className="font-display text-sm font-bold">New avatar items unlocked</p>
            {info.unlockedItems.map((item) => (
              <p key={item.id} className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-gold" />
                {item.name}
                <span className="text-xs text-muted-foreground">({item.slot})</span>
              </p>
            ))}
          </div>
        )}
        <Button onClick={onClose} className="mt-4 h-11 w-full rounded-full font-bold">
          Keep exploring
        </Button>
      </DialogContent>
    </Dialog>
  );
}
