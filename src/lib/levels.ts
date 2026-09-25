/**
 * Shared level math for Bearings.
 *
 * XP required to reach level n is cumulative: round(100 * (n - 1)^1.5).
 * Level 1 starts at 0 XP, level 2 at 100 XP, level 3 at 283 XP, and so on.
 */
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (totalXpForLevel(level + 1) <= totalXp) {
    level += 1;
    if (level > 999) break;
  }
  return level;
}

export type LevelProgress = {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
};

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelFromXp(totalXp);
  const currentLevelXp = totalXpForLevel(level);
  const nextLevelXp = totalXpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  return {
    level,
    totalXp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1,
  };
}
