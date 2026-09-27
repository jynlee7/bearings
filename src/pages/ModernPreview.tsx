import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Compass, MapPin, Search, Sparkles } from "lucide-react";
import { CampanileBell } from "../components/modern/CampanileBell";
import "../components/modern/modern-preview.css";

const places = [
  {
    name: "The Campanile",
    category: "Landmarks",
    distance: "0.3 mi",
    xp: 120,
    detail: "A Berkeley icon with views in every direction.",
    icon: "◫",
  },
  {
    name: "Botanical Garden",
    category: "Nature",
    distance: "1.8 mi",
    xp: 90,
    detail: "Wander through plants from around the world.",
    icon: "✿",
  },
  {
    name: "Indian Rock",
    category: "Lookouts",
    distance: "2.5 mi",
    xp: 150,
    detail: "Catch a sunset above the city.",
    icon: "△",
  },
  {
    name: "Strawberry Creek",
    category: "Nature",
    distance: "0.5 mi",
    xp: 65,
    detail: "Find a quiet path beneath the trees.",
    icon: "≈",
  },
  {
    name: "The Big C",
    category: "Lookouts",
    distance: "2.1 mi",
    xp: 180,
    detail: "Climb the hill for a campus tradition.",
    icon: "◇",
  },
  {
    name: "Berkeley Marina",
    category: "Waterfront",
    distance: "3.4 mi",
    xp: 110,
    detail: "Follow the breeze to the bay.",
    icon: "~",
  },
  {
    name: "Rose Garden",
    category: "Nature",
    distance: "1.7 mi",
    xp: 85,
    detail: "Pause among blooms and hillside views.",
    icon: "✽",
  },
  {
    name: "Fire Trails",
    category: "Trails",
    distance: "2.9 mi",
    xp: 160,
    detail: "Take the long way through the hills.",
    icon: "↗",
  },
];

const categories = ["All", "Nature", "Lookouts", "Landmarks", "Waterfront", "Trails"];

export function ModernPreview() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<(typeof places)[number] | null>(null);
  const results = useMemo(
    () =>
      places.filter(
        (place) =>
          (category === "All" || place.category === category) &&
          `${place.name} ${place.category} ${place.detail}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [category, query],
  );

  return (
    <div className="modern-preview" data-hydrated={hydrated}>
      <header className="modern-header">
        <Link to="/" className="modern-logo" aria-label="Bearings home">
          <span className="modern-logo__icon">
            <Compass size={22} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span>
            bearings<span className="modern-logo__dot">.</span>
          </span>
        </Link>
        <nav aria-label="Preview navigation">
          <a href="#discover">Discover</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/auth" className="modern-header__cta">
            Get started <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main>
        <section className="modern-hero" aria-labelledby="modern-title">
          <div className="modern-hero__copy">
            <span className="modern-kicker">
              <span aria-hidden="true">✦</span> YOUR CITY, A LITTLE CLOSER
            </span>
            <h1 id="modern-title">
              Go somewhere <span>good.</span>
            </h1>
            <p>
              Discover Berkeley one memorable place at a time. Take a walk, check in, and make the
              city yours.
            </p>
            <div className="modern-hero__actions">
              <a href="#discover" className="modern-primary">
                Explore places <ArrowRight size={18} aria-hidden="true" />
              </a>
              <span>Free to explore · Made for curious feet</span>
            </div>
            <div className="modern-hero__facts" aria-label="How Bearings works">
              <span>
                <MapPin size={18} aria-hidden="true" /> Real places
              </span>
              <span>
                <Sparkles size={18} aria-hidden="true" /> Small rewards
              </span>
              <span>
                <Compass size={18} aria-hidden="true" /> Your pace
              </span>
            </div>
          </div>
          <CampanileBell />
        </section>

        <section className="modern-discover" id="discover" aria-labelledby="discover-title">
          <div className="modern-section-heading">
            <div>
              <span className="modern-kicker">THE GOOD STUFF IS OUT THERE</span>
              <h2 id="discover-title">Find your next stop</h2>
            </div>
            <p>Start with a favorite or follow your curiosity.</p>
          </div>
          <div className="modern-filters">
            <label className="modern-search">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">Search places</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search places"
                type="search"
              />
            </label>
            <div className="modern-chips" role="group" aria-label="Filter by category">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <p className="modern-count" role="status">
            {results.length} {results.length === 1 ? "place" : "places"} to explore
          </p>
          {results.length ? (
            <div className="modern-grid">
              {results.map((place, index) => (
                <button
                  type="button"
                  className="modern-place"
                  key={place.name}
                  onClick={() => setSelected(place)}
                >
                  <span
                    className={`modern-place__art modern-place__art--${index % 4}`}
                    aria-hidden="true"
                  >
                    <span>{place.icon}</span>
                  </span>
                  <span className="modern-place__body">
                    <span className="modern-place__meta">
                      {place.category} <span>·</span> {place.distance}
                    </span>
                    <strong>{place.name}</strong>
                    <span className="modern-place__detail">{place.detail}</span>
                    <span className="modern-place__footer">
                      <span>+{place.xp} XP</span>
                      <span>
                        See place <ArrowRight size={17} aria-hidden="true" />
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="modern-empty">
              <strong>No places found</strong>
              <p>Try another name or choose a different category.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="modern-how" id="how-it-works" aria-labelledby="how-title">
          <span className="modern-kicker">A SIMPLE WAY TO GET OUTSIDE</span>
          <h2 id="how-title">Walk. Discover. Remember.</h2>
          <p>
            Pick a place, head there, and check in when you arrive. Every stop adds a little XP to
            your journey.
          </p>
          <Link to="/auth" className="modern-primary">
            Start exploring <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>

      <Dialog.Root
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <Dialog.Portal>
            <Dialog.Overlay className="modern-dialog-backdrop" />
            <Dialog.Content className="modern-dialog">
              <Dialog.Close className="modern-dialog__close" aria-label="Close place details">
                ×
              </Dialog.Close>
              <span className="modern-kicker">
                {selected.category} · {selected.distance} away
              </span>
              <Dialog.Title>{selected.name}</Dialog.Title>
              <Dialog.Description>{selected.detail}</Dialog.Description>
              <strong>Earn {selected.xp} XP when you check in.</strong>
              <Link to="/auth" className="modern-primary">
                Start exploring <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </div>
  );
}
