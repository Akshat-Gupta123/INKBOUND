/** Every ranked course must be cleared; duplicates and tutorial IDs never count. */
export function hasClearedEveryLevel(completed: readonly number[], total: number): boolean {
  if (!Number.isInteger(total) || total < 1) return false;
  const cleared = new Set(completed);
  for (let i = 0; i < total; i++) if (!cleared.has(i)) return false;
  return true;
}
