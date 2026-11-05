/** Regular courses share one ruleset. Practice keeps enough time to learn each action. */
export const runRules = {
  maxInk: 3, regenMs: 1550, maxDrawings: 3, maxLength: 260, clickWidth: 96,
  strokeLifetime: 1100, arrowLifetime: 1000, loopLifetime: 700, sawBreakMs: 480,
};
export type RunRules = typeof runRules;
export const practiceRules: RunRules = {
  maxInk: 6, regenMs: 1100, maxDrawings: 5, maxLength: 420, clickWidth: 170,
  strokeLifetime: 3600, arrowLifetime: 4300, loopLifetime: 3000, sawBreakMs: 1800,
};
