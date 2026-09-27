import { createFileRoute } from "@tanstack/react-router";
import { ModernPreview } from "../pages/ModernPreview";

export const Route = createFileRoute("/design-preview")({
  head: () => ({ meta: [{ title: "Bearings — Modern design preview" }] }),
  component: ModernPreview,
});
