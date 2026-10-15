export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
export const easeInOutCubic = (t: number): number => {
  const x = Math.min(Math.max(t, 0), 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
