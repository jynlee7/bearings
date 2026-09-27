import type { HTMLAttributes } from "react";

export type RetroBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "gold" | "forest" | "brick" | "sky" | "neutral";
};

export function RetroBadge({ tone = "neutral", className = "", ...props }: RetroBadgeProps) {
  return <span className={`retro-badge retro-badge--${tone} ${className}`.trim()} {...props} />;
}
