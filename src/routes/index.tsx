import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, MapPin, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bearings — A gamified guide to Berkeley" },
      {
        name: "description",
        content:
          "Visit real places around UC Berkeley, earn XP, level up and unlock gear for your bear. Berkeley students unlock extra spots.",
      },
      { property: "og:title", content: "Bearings — A gamified guide to Berkeley" },
      {
        property: "og:description",
        content:
          "Visit real places around UC Berkeley, earn XP, level up and unlock gear for your bear.",
      },
    ],
  }),
  component: Landing,
});

const highlights = [
  {
    icon: MapPin,
    title: "Check in for real",
    body: "Stand at the Campanile, Indian Rock or the Big C and check in from your phone.",
  },
  {
    icon: Trophy,
    title: "Earn XP, level up",
    body: "Every visit adds to your ledger. Harder-to-reach spots are worth more.",
  },
  {
    icon: Sparkles,
    title: "Dress your bear",
    body: "Unlock hair, outfits and accessories as you climb the levels.",
  },
];

function Landing() {
  return (
    <div className="sun-wash min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <header className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Compass className="size-5" />
          </span>
          <span className="font-display text-xl font-bold">Bearings</span>
        </header>

        <main className="mt-12 flex-1">
          <h1 className="font-display text-4xl leading-tight font-extrabold text-primary">
            Berkeley is the game board.
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Wander the campus and the hills, check in at real places, and turn the walk
            home into XP. Level up and kit out your own little bear.
          </p>

          <div className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div key={title} className="surface-card flex gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold text-gold-foreground">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-display font-bold">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="mt-10 space-y-3">
          <Link
            to="/auth"
            className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground shadow-[var(--shadow-lift)] transition-transform active:scale-[0.98]"
          >
            Sign in to start exploring
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            Signing in with a verified <strong>@berkeley.edu</strong> address unlocks
            student-only spots on the map.
          </p>
        </footer>
      </div>
    </div>
  );
}
