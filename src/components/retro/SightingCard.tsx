import type { ReactNode } from "react";
import { ArrowUpRight, Check, MapPin, Sparkles } from "lucide-react";
import { RetroBadge } from "./RetroBadge";

export type Sighting = {
  id: string;
  name: string;
  category: string;
  xp: number;
  distance: string;
  visited: boolean;
  description: string;
  illustration?: ReactNode;
  tone?: "gold" | "forest" | "brick" | "sky";
};

export type SightingCardProps = {
  sighting: Sighting;
  onSelect?: ((sighting: Sighting) => void) | undefined;
};

export function SightingCard({ sighting, onSelect }: SightingCardProps) {
  const content = (
    <>
      <div
        className={`retro-sighting__art retro-sighting__art--${sighting.tone ?? "sky"}`}
        aria-hidden="true"
      >
        {sighting.illustration ?? <span className="retro-sighting__default-art">✦</span>}
        <span className="retro-sighting__art-corner">
          {sighting.visited ? "LOGGED" : "FIND ME"}
        </span>
      </div>
      <div className="retro-sighting__body">
        <div className="retro-sighting__topline">
          <RetroBadge tone={sighting.tone ?? "sky"}>{sighting.category}</RetroBadge>
          <span className="retro-sighting__xp">
            <Sparkles size={14} aria-hidden="true" /> +{sighting.xp} XP
          </span>
        </div>
        <div className="retro-sighting__title-row">
          <h3>{sighting.name}</h3>
          {onSelect && <ArrowUpRight size={20} aria-hidden="true" />}
        </div>
        <p className="retro-sighting__description">{sighting.description}</p>
        <div className="retro-sighting__footer">
          <span>
            <MapPin size={15} aria-hidden="true" /> {sighting.distance}
          </span>
          <span
            className={sighting.visited ? "retro-sighting__visited" : "retro-sighting__unvisited"}
          >
            {sighting.visited && <Check size={14} aria-hidden="true" />}
            {sighting.visited ? "Visited" : "Not visited"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <article className={`retro-sighting ${sighting.visited ? "is-visited" : ""}`}>
      {onSelect ? (
        <button
          type="button"
          className="retro-sighting__action"
          onClick={() => onSelect(sighting)}
          aria-label={`View ${sighting.name}`}
        >
          {content}
        </button>
      ) : (
        <div className="retro-sighting__action">{content}</div>
      )}
    </article>
  );
}
