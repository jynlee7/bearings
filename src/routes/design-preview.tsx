import { createFileRoute } from "@tanstack/react-router";
import { DesignPreview } from "../pages/DesignPreview";

export const Route = createFileRoute("/design-preview")({
  head: () => ({ meta: [{ title: "Design Preview | Bearings" }] }),
  component: DesignPreview,
});
