/** Every course and the tutorial share the original Overdrive mechanics. */
export const runRules = {
  maxInk: 6, regenMs: 1100, maxDrawings: 5, maxLength: 420, clickWidth: 170,
  strokeLifetime: 3600, arrowLifetime: 4300, loopLifetime: 3000, sawBreakMs: 1800,
};
export type RunRules = typeof runRules;
export const practiceRules: RunRules = runRules;
