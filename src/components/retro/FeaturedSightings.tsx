import { SightingCard, type Sighting } from "./SightingCard";

export type FeaturedSightingsProps = {
  sightings: Sighting[];
  onSelect?: (sighting: Sighting) => void;
};

export function FeaturedSightings({ sightings, onSelect }: FeaturedSightingsProps) {
  if (sightings.length === 0) {
    return (
      <div className="retro-empty" role="status">
        No sightings on this trail. Try another search or category.
      </div>
    );
  }

  return (
    <div className="retro-featured" aria-label="Featured sightings">
      {sightings.map((sighting) => (
        <SightingCard key={sighting.id} sighting={sighting} onSelect={onSelect} />
      ))}
    </div>
  );
}
