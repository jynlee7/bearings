export type AvatarConfig = {
  background?: string | null;
  body?: string | null;
  hair?: string | null;
  outfit?: string | null;
  accessory?: string | null;
};

export type AvatarItem = {
  id: string;
  slot: string;
  name: string;
  svg_data: string;
  required_level: number;
  sort_order?: number;
};

const LAYER_ORDER = ["background", "body", "outfit", "hair", "accessory"] as const;

export function AvatarPreview({
  config,
  items,
  className,
}: {
  config: AvatarConfig;
  items: AvatarItem[];
  className?: string;
}) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const layers = LAYER_ORDER.map((slot) => {
    const id = config[slot];
    return id ? byId.get(id) : undefined;
  }).filter(Boolean) as AvatarItem[];

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Your avatar"
    >
      <rect x="0" y="0" width="200" height="200" rx="28" className="fill-secondary" />
      {layers.map((layer) => (
        <g key={layer.id} dangerouslySetInnerHTML={{ __html: layer.svg_data }} />
      ))}
    </svg>
  );
}

export function ItemSwatch({ item, className }: { item: AvatarItem; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <rect x="0" y="0" width="200" height="200" rx="28" className="fill-muted" />
      <g dangerouslySetInnerHTML={{ __html: item.svg_data }} />
    </svg>
  );
}
