import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

import type { Place } from "@/hooks/useBearings";

export default function MapView({
  places,
  visitedIds,
  onSelect,
}: {
  places: Place[];
  visitedIds: string[];
  onSelect: (place: Place) => void;
}) {
  const visited = new Set(visitedIds);

  return (
    <div className="map-shell h-full w-full">
      <MapContainer
        center={[37.8735, -122.2585]}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((place) => {
          const isVisited = visited.has(place.id);
          return (
            <CircleMarker
              key={place.id}
              center={[place.latitude, place.longitude]}
              radius={isVisited ? 11 : 9}
              pathOptions={{
                color: isVisited ? "#B4830B" : "#16307A",
                weight: 3,
                fillColor: isVisited ? "#F2C14E" : "#FFFFFF",
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => onSelect(place) }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {place.name}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
