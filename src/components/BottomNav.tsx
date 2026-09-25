import { Link } from "@tanstack/react-router";
import { Map, Shirt, Trophy, User, Users } from "lucide-react";

const items = [
  { to: "/map", label: "Map", icon: Map },
  { to: "/orgs", label: "Orgs", icon: Users },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/avatar", label: "Avatar", icon: Shirt },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1.5">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-xs font-semibold text-muted-foreground transition-colors"
            activeProps={{ className: "text-primary bg-secondary" }}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
