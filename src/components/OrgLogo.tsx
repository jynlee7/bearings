import { cn } from "@/lib/utils";

/** Renders an org SVG logo safely as an image (scripts inside SVG never run). */
export function OrgLogo({ svg, name, className }: { svg: string; name: string; className?: string }) {
  if (!svg) {
    return (
      <div
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl bg-primary font-display font-bold text-primary-foreground",
          className,
        )}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
      alt={`${name} logo`}
      className={cn("size-12 shrink-0 rounded-2xl", className)}
    />
  );
}

export function makeInitialsLogo(name: string, color: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
    .replace(/[^A-Z0-9]/g, "");
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#1e3a8a";
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="16" fill="${safeColor}"/><text x="32" y="41" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="24" fill="#fff4d6">${initials || "?"}</text></svg>`;
}
