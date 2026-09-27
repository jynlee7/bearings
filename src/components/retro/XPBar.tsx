export type XPBarProps = { value: number; max: number; segments?: number; label?: string };

export function XPBar({ value, max, segments = 10, label = "Level progress" }: XPBarProps) {
  const safeMax = Math.max(1, max);
  const progress = Math.min(1, Math.max(0, value / safeMax));
  const count = Math.max(1, Math.floor(segments));
  const filled = Math.round(progress * count);

  return (
    <div className="retro-xp">
      <div className="retro-xp__copy">
        <span>{label}</span>
        <strong>
          {Math.max(0, value)} / {max} XP
        </strong>
      </div>
      <div
        className="retro-xp__segments"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.min(safeMax, Math.max(0, value))}
      >
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className={index < filled ? "is-filled" : ""} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}
