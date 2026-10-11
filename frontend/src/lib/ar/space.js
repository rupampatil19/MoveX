/**
 * space.js - WebXR plane fitting + camera-distance math.
 * Ported from ARFit v6 space.ts (TypeScript -> JavaScript).
 */
import * as THREE from "three";

export function pointInPoly(poly, x, z) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

/** Test points covering the exercise rectangle: 4 corners, 4 edge middles, and the centre. */
export function footprintPoints(cx, cz, yaw, hx, hz) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const out = [];
  const grid = [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]];
  for (const [lx, lz] of grid) {
    const px = lx * hx, pz = lz * hz;
    out.push({ x: cx + px * c + pz * s, z: cz - px * s + pz * c });
  }
  return out;
}

/** true / false when ARCore reports planes, null when plane data is not available on this device */
export function fitsDetectedPlane(frame, refSpace, pts, floorY) {
  const planes = frame.detectedPlanes;
  if (!planes) return null;
  const inv = new THREE.Matrix4();
  const v = new THREE.Vector3();
  for (const plane of planes) {
    if (plane.orientation && plane.orientation !== "horizontal") continue;
    const pose = frame.getPose(plane.planeSpace, refSpace);
    if (!pose) continue;
    inv.fromArray(pose.transform.matrix).invert();
    let all = true;
    for (const p of pts) {
      v.set(p.x, floorY, p.z).applyMatrix4(inv);
      if (Math.abs(v.y) > 0.2 || !pointInPoly(plane.polygon, v.x, v.z)) {
        all = false;
        break;
      }
    }
    if (all) return true;
  }
  return false;
}

/**
 * Closest distance (m) from the phone at which the whole trainer fits on screen.
 */
export function fitDistance(footprint, height, tanHalfH, tanHalfV, camHeight = 1.3, scale = 1) {
  const across = Math.max(footprint.width, footprint.depth) * scale + 0.2;
  const horizontal = across / 2 / Math.max(0.05, tanHalfH);
  const vertical = Math.max(camHeight, height * scale - camHeight) / Math.max(0.05, tanHalfV) / 0.9;
  return Math.max(1.2 + 0.6 * scale, horizontal, vertical * 0.5);
}

/** Sizes the trainer may be shown at, largest first. 1 = life-size. */
export const TRAINER_SCALES = [1, 0.85, 0.7, 0.55];