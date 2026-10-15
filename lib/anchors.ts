import { Vector3, type Camera, type Object3D } from "three";

/**
 * Projects 3D anchors to the screen so HTML labels and SVG leader lines stay attached to the
 * geometry as the camera and objects move. No React state is involved: DOM nodes are updated
 * imperatively from the render loop.
 */

export interface WorldAnchor {
  object: Object3D;
  local: readonly [number, number, number];
}

export interface LeaderBinding {
  /** Id of the world anchor to follow (may change while the binding lives). */
  worldId: string | null;
  /** Label box the leader attaches to. */
  box: HTMLElement;
  line: SVGLineElement;
  dot: SVGCircleElement;
  /** Group whose `visibility` (animated by GSAP) tells us whether to bother updating. */
  group: SVGGElement;
}

export interface LabelBinding {
  worldId: string;
  el: HTMLElement;
}

const worldAnchors = new Map<string, WorldAnchor>();
const leaders = new Map<string, LeaderBinding>();
const labels = new Map<string, LabelBinding>();

export const registerWorldAnchor = (id: string, anchor: WorldAnchor): (() => void) => {
  worldAnchors.set(id, anchor);
  return () => {
    if (worldAnchors.get(id) === anchor) worldAnchors.delete(id);
  };
};

export const registerLeader = (id: string, binding: LeaderBinding): (() => void) => {
  leaders.set(id, binding);
  return () => {
    if (leaders.get(id) === binding) leaders.delete(id);
  };
};

export const registerLabel = (id: string, binding: LabelBinding): (() => void) => {
  labels.set(id, binding);
  return () => {
    if (labels.get(id) === binding) labels.delete(id);
  };
};

const tmp = new Vector3();

const isHidden = (el: Element): boolean => (el as HTMLElement | SVGElement).style.visibility === "hidden";

/** Projects `id` into pixels relative to the canvas; returns false when unavailable or behind the camera. */
const project = (id: string, camera: Camera, w: number, h: number, out: { x: number; y: number }): boolean => {
  const a = worldAnchors.get(id);
  if (!a) return false;
  tmp.set(a.local[0], a.local[1], a.local[2]);
  a.object.localToWorld(tmp);
  tmp.project(camera);
  if (tmp.z > 1) return false;
  out.x = (tmp.x * 0.5 + 0.5) * w;
  out.y = (-tmp.y * 0.5 + 0.5) * h;
  return true;
};

const pt = { x: 0, y: 0 };

/**
 * Screen positions (stage pixels) of a few anchors that canvas effects, not HTML labels, need to
 * follow: the power button the swarm leaves from, and the origin the bridge digits gather around.
 * `ok` stays true after the last successful projection, so an anchor that has left the scene keeps
 * its last known position.
 */
export const trackedScreen: Record<string, { x: number; y: number; ok: boolean }> = {
  "sw:power": { x: 0, y: 0, ok: false },
  "sw:origin": { x: 0, y: 0, ok: false },
};
const trackedIds = Object.keys(trackedScreen);

export const updateAnchors = (camera: Camera, canvas: HTMLCanvasElement): void => {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  camera.updateMatrixWorld();

  for (const id of trackedIds) {
    const t = trackedScreen[id];
    if (t && project(id, camera, w, h, pt)) {
      t.x = pt.x;
      t.y = pt.y;
      t.ok = true;
    }
  }

  labels.forEach((l) => {
    if (isHidden(l.el)) return;
    if (project(l.worldId, camera, w, h, pt)) {
      l.el.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`;
    }
  });

  if (leaders.size === 0) return;
  const origin = canvas.getBoundingClientRect();
  leaders.forEach((l) => {
    if (isHidden(l.group)) return;
    if (!l.worldId || !project(l.worldId, camera, w, h, pt)) {
      l.line.style.display = "none";
      l.dot.style.display = "none";
      return;
    }
    l.dot.style.display = "";
    const r = l.box.getBoundingClientRect();
    const left = r.left - origin.left;
    const top = r.top - origin.top;
    const right = left + r.width;
    const bottom = top + r.height;
    // Nearest point on the label box to the anchor.
    const nx = Math.min(Math.max(pt.x, left), right);
    const ny = Math.min(Math.max(pt.y, top), bottom);
    const inside = pt.x > left && pt.x < right && pt.y > top && pt.y < bottom;
    l.line.style.display = inside ? "none" : "";
    l.line.setAttribute("x1", nx.toFixed(1));
    l.line.setAttribute("y1", ny.toFixed(1));
    l.line.setAttribute("x2", pt.x.toFixed(1));
    l.line.setAttribute("y2", pt.y.toFixed(1));
    l.dot.setAttribute("cx", pt.x.toFixed(1));
    l.dot.setAttribute("cy", pt.y.toFixed(1));
  });
};
