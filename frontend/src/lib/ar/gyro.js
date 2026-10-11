/**
 * gyro.js - Camera AR for phones without WebXR (iOS Safari, older Android, in-app browsers).
 * The gyroscope turns a virtual camera, so a trainer placed on the floor stays put while you pan.
 * 3-DoF: rotation only, not walking. Floor is assumed flat at camHeight below the phone.
 * Ported from ARFit v6 gyro.ts (TypeScript -> JavaScript).
 */
import * as THREE from "three";

/** iOS needs this called directly from a tap. Resolves true when motion data may be used. */
export async function requestMotionPermission() {
  const D = window.DeviceOrientationEvent;
  if (!D) return false;
  if (typeof D.requestPermission === "function") {
    try {
      return (await D.requestPermission()) === "granted";
    } catch {
      return false;
    }
  }
  return true;
}

const ZEE = new THREE.Vector3(0, 0, 1);
const EULER = new THREE.Euler();
const Q0 = new THREE.Quaternion();
const Q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

function screenAngle() {
  const a = window.screen?.orientation?.angle ?? window.orientation ?? 0;
  return THREE.MathUtils.degToRad(a);
}

export function createGyroCamera(camera, camHeight = 1.35) {
  let alpha = 0, beta = 0, gamma = 0;
  let have = false;
  let snapped = false;
  const target = new THREE.Quaternion();
  camera.position.set(0, camHeight, 0);

  const onOrient = (e) => {
    if (e.alpha === null || e.beta === null || e.gamma === null) return;
    alpha = THREE.MathUtils.degToRad(e.alpha);
    beta = THREE.MathUtils.degToRad(e.beta);
    gamma = THREE.MathUtils.degToRad(e.gamma);
    have = true;
  };

  return {
    start: () =>
      new Promise((resolve) => {
        window.addEventListener("deviceorientation", onOrient);
        const t0 = performance.now();
        const poll = () => {
          if (have) return resolve(true);
          if (performance.now() - t0 > 1200) return resolve(false);
          setTimeout(poll, 50);
        };
        poll();
      }),
    update: () => {
      if (!have) return;
      EULER.set(beta, alpha, -gamma, "YXZ");
      target.setFromEuler(EULER);
      target.multiply(Q1);
      target.multiply(Q0.setFromAxisAngle(ZEE, -screenAngle()));
      if (!snapped) {
        camera.quaternion.copy(target);
        snapped = true;
      } else {
        camera.quaternion.slerp(target, 0.35);
      }
    },
    stop: () => window.removeEventListener("deviceorientation", onOrient),
  };
}

const RAY = new THREE.Raycaster();
const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

/** Where a screen point (NDC -1..1) hits the floor, or null when looking at the ceiling / too far away. */
export function floorHit(camera, ndcX, ndcY, out, maxDist = 6) {
  camera.updateMatrixWorld(true);
  RAY.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  if (RAY.ray.direction.y > -0.08) return false;
  const hit = RAY.ray.intersectPlane(FLOOR, out);
  if (!hit) return false;
  return Math.hypot(out.x - camera.position.x, out.z - camera.position.z) <= maxDist;
}