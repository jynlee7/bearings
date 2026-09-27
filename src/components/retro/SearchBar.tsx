import { Search, X } from "lucide-react";

export type SearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  categories: string[];
  category: string;
  onCategoryChange: (value: string) => void;
};

export function SearchBar({
  query,
  onQueryChange,
  categories,
  category,
  onCategoryChange,
}: SearchBarProps) {
  return (
    <div className="retro-search">
      <div className="retro-search__field">
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search sightings"
          placeholder="Search a place or trail..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {query && (
          <button
            type="button"
            className="retro-search__clear"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="retro-search__filters" role="group" aria-label="Filter by category">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={`retro-filter ${item === category ? "is-active" : ""}`}
            aria-pressed={item === category}
            onClick={() => onCategoryChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
