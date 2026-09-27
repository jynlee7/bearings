import { RetroBadge } from "./RetroBadge";

export function LevelBadge({ level }: { level: number }) {
  return (
    <RetroBadge tone="gold" aria-label={`Level ${level}`}>
      LVL {level}
    </RetroBadge>
  );
}
