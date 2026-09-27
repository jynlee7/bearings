import { useMemo, useState } from "react";
import {
  ArrowDown,
  Binoculars,
  Compass,
  Mountain,
  RadioTower,
  Sun,
  Trees,
  Waves,
  X,
} from "lucide-react";
import { InteractiveBackground } from "../components/retro/InteractiveBackground";
import { FeaturedSightings } from "../components/retro/FeaturedSightings";
import { LevelBadge } from "../components/retro/LevelBadge";
import { RetroBadge } from "../components/retro/RetroBadge";
import { RetroButton } from "../components/retro/RetroButton";
import { SearchBar } from "../components/retro/SearchBar";
import { type Sighting } from "../components/retro/SightingCard";
import { XPBar } from "../components/retro/XPBar";
import "../styles/retro-theme.css";
import "../components/retro/retro-components.css";

const places: Sighting[] = [
  {
    id: "campanile",
    name: "The Campanile",
    category: "Landmarks",
    xp: 120,
    distance: "0.3 mi",
    visited: true,
    description: "A tower above the trees with a view in every direction.",
    tone: "gold",
    illustration: <RadioTower size={68} strokeWidth={1.35} />,
  },
  {
    id: "botanical",
    name: "Botanical Garden",
    category: "Nature",
    xp: 90,
    distance: "1.8 mi",
    visited: false,
    description: "Take the winding path through a world of plants.",
    tone: "forest",
    illustration: <Trees size={72} strokeWidth={1.35} />,
  },
  {
    id: "indian-rock",
    name: "Indian Rock",
    category: "Lookouts",
    xp: 150,
    distance: "2.5 mi",
    visited: false,
    description: "Find the stone steps and watch the city turn gold.",
    tone: "brick",
    illustration: <Mountain size={76} strokeWidth={1.35} />,
  },
  {
    id: "strawberry-creek",
    name: "Strawberry Creek",
    category: "Nature",
    xp: 65,
    distance: "0.5 mi",
    visited: true,
    description: "Follow the water under the campus canopy.",
    tone: "sky",
    illustration: <Waves size={76} strokeWidth={1.35} />,
  },
  {
    id: "big-c",
    name: "The Big C",
    category: "Lookouts",
    xp: 180,
    distance: "2.1 mi",
    visited: false,
    description: "Climb for the view that makes every step count.",
    tone: "gold",
    illustration: <Mountain size={76} strokeWidth={1.35} />,
  },
  {
    id: "berkeley-marina",
    name: "Berkeley Marina",
    category: "Waterfront",
    xp: 110,
    distance: "3.4 mi",
    visited: false,
    description: "Catch the bay breeze at the edge of town.",
    tone: "sky",
    illustration: <Waves size={76} strokeWidth={1.35} />,
  },
  {
    id: "rose-garden",
    name: "Berkeley Rose Garden",
    category: "Nature",
    xp: 85,
    distance: "1.7 mi",
    visited: false,
    description: "A hillside amphitheater of color and calm.",
    tone: "brick",
    illustration: <Sun size={74} strokeWidth={1.35} />,
  },
  {
    id: "fire-trails",
    name: "Fire Trails",
    category: "Trails",
    xp: 160,
    distance: "2.9 mi",
    visited: false,
    description: "Trade the street grid for a ridge line.",
    tone: "forest",
    illustration: <Trees size={72} strokeWidth={1.35} />,
  },
];

const categories = ["All", "Nature", "Lookouts", "Landmarks", "Waterfront", "Trails"];

export function DesignPreview() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [backgroundOn, setBackgroundOn] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Sighting | null>(null);

  const results = useMemo(
    () =>
      places.filter((place) => {
        const matchesCategory = category === "All" || place.category === category;
        const search = query.trim().toLocaleLowerCase();
        const matchesQuery =
          !search ||
          `${place.name} ${place.description} ${place.category}`
            .toLocaleLowerCase()
            .includes(search);
        return matchesCategory && matchesQuery;
      }),
    [query, category],
  );

  return (
    <div className="retro-system retro-preview" data-theme={theme} data-testid="design-preview">
      <InteractiveBackground intensity={0.6} colorScheme={theme} off={!backgroundOn} />
      <div className="retro-preview__content">
        <header className="retro-header">
          <div className="retro-brand" aria-label="Bearings">
            <span className="retro-brand__mark">
              <Compass size={22} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span>
              BEARINGS<span className="retro-brand__dot">.</span>
            </span>
          </div>
          <div className="retro-header__controls" aria-label="Preview settings">
            <RetroButton
              variant="paper"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? "☾" : "☀"}{" "}
              <span className="retro-control-label">{theme === "light" ? "Dark" : "Light"}</span>
            </RetroButton>
            <RetroButton
              variant="paper"
              data-testid="background-test-button"
              aria-pressed={backgroundOn}
              onClick={() => setBackgroundOn(!backgroundOn)}
            >
              <Waves size={17} aria-hidden="true" />{" "}
              <span className="retro-control-label">Contours {backgroundOn ? "on" : "off"}</span>
            </RetroButton>
          </div>
        </header>

        <main>
          <section className="retro-hero" aria-labelledby="retro-hero-title">
            <div className="retro-hero__copy">
              <RetroBadge tone="forest">
                <Binoculars size={13} aria-hidden="true" /> FIELD GUIDE / BERKELEY, CA
              </RetroBadge>
              <h1 id="retro-hero-title">
                Find your <em>next story.</em>
              </h1>
              <p>Big views, quiet paths, and little wonders are waiting around Berkeley.</p>
              <a className="retro-hero__jump" href="#sightings">
                Explore sightings <ArrowDown size={17} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section
            id="sightings"
            className="retro-sightings-section"
            aria-labelledby="retro-sightings-title"
          >
            <div className="retro-section-heading">
              <div>
                <span className="retro-eyebrow">01 / PLACES TO FIND</span>
                <h2 id="retro-sightings-title">
                  Featured Sightings<span>.</span>
                </h2>
                <p>Pick a direction. Every place has a story and a little XP waiting.</p>
              </div>
              <span className="retro-section-heading__count">
                {results.length.toString().padStart(2, "0")} SPOTS
              </span>
            </div>
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              categories={categories}
              category={category}
              onCategoryChange={setCategory}
            />
            <FeaturedSightings sightings={results} onSelect={setSelected} />
          </section>
          <section className="retro-field-notes" aria-label="Explorer progress">
            <div className="retro-hero__progress">
              <div className="retro-hero__progress-head">
                <span>YOUR FIELD NOTES</span>
                <LevelBadge level={3} />
              </div>
              <div className="retro-hero__progress-number">
                <strong>02</strong>
                <span>/ 08 places logged</span>
              </div>
              <XPBar value={420} max={600} label="Next level" />
              <p>One more stop and the trail gets longer.</p>
            </div>
          </section>
        </main>
        <footer className="retro-footer">
          <span>KEEP WANDERING ↗</span>
          <span>BEARINGS / FIELD GUIDE 01</span>
        </footer>
      </div>
      {selected && (
        <div className="retro-dialog-backdrop" onClick={() => setSelected(null)}>
          <div
            className="retro-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="retro-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="retro-dialog__close"
              aria-label="Close sighting details"
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </button>
            <RetroBadge tone={selected.tone ?? "sky"}>{selected.category}</RetroBadge>
            <h2 id="retro-dialog-title">{selected.name}</h2>
            <p>{selected.description}</p>
            <p>
              {selected.distance} away · +{selected.xp} XP ·{" "}
              {selected.visited ? "Already visited" : "Ready to find"}
            </p>
            <RetroButton onClick={() => setSelected(null)}>Back to sightings</RetroButton>
          </div>
        </div>
      )}
    </div>
  );
}
