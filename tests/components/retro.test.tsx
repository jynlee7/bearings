// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FeaturedSightings } from "../../src/components/retro/FeaturedSightings";
import { LevelBadge } from "../../src/components/retro/LevelBadge";
import { RetroBadge } from "../../src/components/retro/RetroBadge";
import { RetroButton } from "../../src/components/retro/RetroButton";
import { SearchBar } from "../../src/components/retro/SearchBar";
import { SightingCard, type Sighting } from "../../src/components/retro/SightingCard";
import { XPBar } from "../../src/components/retro/XPBar";
import { DesignPreview } from "../../src/pages/DesignPreview";

vi.mock("../../src/components/retro/InteractiveBackground", () => ({
  InteractiveBackground: ({ off }: { off: boolean }) => (
    <div data-testid="mock-background" data-off={String(off)} />
  ),
}));

afterEach(cleanup);

const place: Sighting = {
  id: "garden",
  name: "Garden Path",
  category: "Nature",
  xp: 80,
  distance: "1.2 mi",
  visited: false,
  description: "A quiet path through green space.",
  tone: "forest",
};

describe("retro controls", () => {
  it("renders button variants, handles presses, and respects disabled state", () => {
    const onClick = vi.fn();
    const { rerender } = render(<RetroButton onClick={onClick}>Explore</RetroButton>);
    expect(screen.getByRole("button", { name: "Explore" }).className).toContain(
      "retro-button--gold",
    );
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    expect(onClick).toHaveBeenCalledOnce();
    rerender(
      <RetroButton variant="paper" disabled onClick={onClick}>
        Explore
      </RetroButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Explore" }).className).toContain(
      "retro-button--paper",
    );
    rerender(<RetroButton variant="quiet">Explore</RetroButton>);
    expect(screen.getByRole("button", { name: "Explore" }).className).toContain(
      "retro-button--quiet",
    );
  });

  it("renders every badge tone and the level label", () => {
    const { rerender } = render(<RetroBadge>Field note</RetroBadge>);
    for (const tone of ["neutral", "gold", "forest", "brick", "sky"] as const) {
      rerender(<RetroBadge tone={tone}>Field note</RetroBadge>);
      expect(screen.getByText("Field note").className).toContain(`retro-badge--${tone}`);
    }
    rerender(<LevelBadge level={3} />);
    expect(screen.getByLabelText("Level 3").textContent).toBe("LVL 3");
  });

  it("clamps XP progress and renders segmented states", () => {
    const { rerender, container } = render(<XPBar value={40} max={100} segments={5} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("40");
    expect(container.querySelectorAll(".is-filled")).toHaveLength(2);
    rerender(<XPBar value={200} max={100} segments={5} />);
    expect(container.querySelectorAll(".is-filled")).toHaveLength(5);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
    rerender(<XPBar value={-10} max={100} segments={5} />);
    expect(container.querySelectorAll(".is-filled")).toHaveLength(0);
  });
});

describe("sighting discovery", () => {
  it("shows an unvisited place with its category, XP, distance and illustration slot", () => {
    const { container } = render(
      <SightingCard sighting={{ ...place, illustration: <span>Custom art</span> }} />,
    );
    expect(screen.getByText("Garden Path")).toBeTruthy();
    expect(screen.getByText("Not visited")).toBeTruthy();
    expect(screen.getByText("+80 XP")).toBeTruthy();
    expect(screen.getByText("1.2 mi")).toBeTruthy();
    expect(container.querySelector(".retro-sighting__art")?.textContent).toContain("Custom art");
  });

  it("shows visited state and sends selection when pressed", () => {
    const onSelect = vi.fn();
    render(<SightingCard sighting={{ ...place, visited: true }} onSelect={onSelect} />);
    expect(screen.getByText("Visited")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View Garden Path" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "garden", visited: true }));
  });

  it("renders a collection and a useful empty state", () => {
    const { rerender } = render(<FeaturedSightings sightings={[place]} />);
    expect(screen.getByText("Garden Path")).toBeTruthy();
    rerender(<FeaturedSightings sightings={[]} />);
    expect(screen.getByRole("status").textContent).toContain("No sightings");
  });

  it("edits and clears search and updates pressed category chips", () => {
    const onQueryChange = vi.fn();
    const onCategoryChange = vi.fn();
    const { rerender } = render(
      <SearchBar
        query=""
        onQueryChange={onQueryChange}
        categories={["All", "Nature"]}
        category="All"
        onCategoryChange={onCategoryChange}
      />,
    );
    fireEvent.change(screen.getByRole("searchbox", { name: "Search sightings" }), {
      target: { value: "rock" },
    });
    expect(onQueryChange).toHaveBeenCalledWith("rock");
    fireEvent.click(screen.getByRole("button", { name: "Nature" }));
    expect(onCategoryChange).toHaveBeenCalledWith("Nature");
    rerender(
      <SearchBar
        query="rock"
        onQueryChange={onQueryChange}
        categories={["All", "Nature"]}
        category="Nature"
        onCategoryChange={onCategoryChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Nature" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onQueryChange).toHaveBeenCalledWith("");
  });
});

describe("design preview", () => {
  it("switches themes and background state", () => {
    render(<DesignPreview />);
    const preview = screen.getByTestId("design-preview");
    expect(preview.getAttribute("data-theme")).toBe("light");
    expect(screen.getByTestId("mock-background").getAttribute("data-off")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(preview.getAttribute("data-theme")).toBe("dark");
    fireEvent.click(screen.getByTestId("background-test-button"));
    expect(screen.getByTestId("mock-background").getAttribute("data-off")).toBe("true");
  });

  it("filters eight places, opens a sighting, and closes its details", () => {
    render(<DesignPreview />);
    expect(screen.getAllByRole("button", { name: /^View / })).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "Nature" }));
    expect(screen.getAllByRole("button", { name: /^View / })).toHaveLength(3);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search sightings" }), {
      target: { value: "no match" },
    });
    expect(screen.getByRole("status").textContent).toContain("No sightings");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search sightings" }), {
      target: { value: "garden" },
    });
    fireEvent.click(screen.getByRole("button", { name: "View Botanical Garden" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close sighting details" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
