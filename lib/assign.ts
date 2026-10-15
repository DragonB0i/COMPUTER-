/**
 * Writes properties onto a Three.js object from inside a render-loop callback. The objects involved
 * (materials, attributes) are owned by the component and meant to be mutated every frame; going
 * through this helper keeps that intent explicit.
 */
export const assign = <T extends object>(target: T, patch: Partial<T>): void => {
  Object.assign(target, patch);
};
