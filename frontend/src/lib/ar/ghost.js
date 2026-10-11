/**
 * ghost.js - 3D trainer model loader + stage + reticle.
 * Ported from ARFit v6 ghost.ts (TypeScript -> JavaScript).
 */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { getModelBytes } from "./modelCache.js";

/** Fallback colours (the ones baked into the Mixamo "Beta" FBX) if a material has none. */
const SURFACE_FALLBACK = new THREE.Color("#ab3e36");
const JOINT_FALLBACK = new THREE.Color("#441915");

/**
 * Load a Mixamo FBX and keep its own look: opaque skin-toned body + dark joints,
 * lit like a real object. The animation loops.
 */
export async function loadGhost(url, animationMode = "loop") {
  const absoluteUrl = new URL(url, window.location.href);
  const data = await getModelBytes(absoluteUrl.href);

  let fbx;
  try {
    fbx = new FBXLoader().parse(data, new URL(".", absoluteUrl).href);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse the FBX trainer model at ${absoluteUrl.pathname}: ${detail}`);
  }

  let meshCount = 0;
  fbx.traverse((object) => {
    if (object.isMesh && object.geometry?.attributes?.position?.count) meshCount += 1;
  });
  if (meshCount === 0) {
    throw new Error(`The FBX file contains no renderable mesh: ${absoluteUrl.pathname}`);
  }

  return buildGhost(fbx, animationMode);
}

export function buildGhost(fbx, animationMode = "loop") {
  fbx.scale.setScalar(0.01);

  const mats = [];
  const meshMats = [];
  fbx.traverse((o) => {
    if (!o.isMesh) return;
    const isJoints = /joint/i.test(o.name);
    const src = Array.isArray(o.material) ? o.material[0] : o.material;
    const hasColor = src?.color && !(src.color.r === 1 && src.color.g === 1 && src.color.b === 1);
    const color = hasColor ? src.color.clone() : (isJoints ? JOINT_FALLBACK : SURFACE_FALLBACK).clone();
    if (!isJoints) color.lerp(new THREE.Color("#ffffff"), 0.1);

    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: isJoints ? 0.7 : 0.5,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    o.material = m;
    meshMats.push(m);
    o.castShadow = true;
    o.frustumCulled = false;
    mats.push(m);
  });

  const root = new THREE.Group();
  root.add(fbx);

  const mixer = new THREE.AnimationMixer(fbx);
  const clip = fbx.animations.find((a) => a.tracks.length > 0) ?? fbx.animations[0];
  if (clip) {
    const action = mixer.clipAction(clip);
    if (animationMode === "hold-end") {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    action.play();
  }

  const skinned = [];
  fbx.traverse((o) => {
    if (o.isSkinnedMesh) skinned.push(o);
  });
  const total = new THREE.Box3();
  const tmp = new THREE.Box3();
  const dur = clip?.duration ?? 0;
  const sampleTimes = dur > 0 ? [0, dur * 0.5, dur] : [0];
  for (const sampleTime of sampleTimes) {
    mixer.setTime(sampleTime);
    fbx.updateMatrixWorld(true);
    skinned.forEach((m) => { m.boundingBox = null; });
    tmp.setFromObject(fbx);
    if (Number.isFinite(tmp.min.x) && Number.isFinite(tmp.max.x)) total.union(tmp);
  }
  mixer.setTime(0);
  if (animationMode === "hold-end" && clip) {
    const action = mixer.existingAction(clip);
    if (action) action.paused = true;
  }

  const width = Math.max(0.3, total.max.x - total.min.x);
  const depth = Math.max(0.3, total.max.z - total.min.z);
  const cx = (total.max.x + total.min.x) / 2;
  const cz = (total.max.z + total.min.z) / 2;
  fbx.position.set(-cx, -total.min.y, -cz);

  return {
    root,
    mixer,
    startIntro: () => {
      if (animationMode !== "hold-end" || !clip) return;
      const action = mixer.existingAction(clip);
      if (!action) return;
      action.reset();
      action.paused = false;
      action.play();
    },
    setPreviewMode: (preview) => {
      for (const mat of meshMats) {
        mat.transparent = preview;
        mat.opacity = preview ? 0.84 : 1;
        mat.depthWrite = !preview;
        mat.needsUpdate = true;
      }
    },
    duration: dur || 2,
    footprint: { width, depth },
    height: total.max.y - total.min.y,
    dispose: () => {
      mats.forEach((m) => m.dispose());
      fbx.traverse((o) => {
        if (o.isMesh) o.geometry?.dispose();
      });
    },
  };
}
export const FOOTPRINT_MARGIN = 0.25;

/**
 * Soft key light + a shadow catcher so the trainer looks planted on the floor.
 */
export function makeStage() {
  const lights = new THREE.Group();
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.6);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(1.2, 3, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -1.8;
  sun.shadow.camera.right = 1.8;
  sun.shadow.camera.top = 1.8;
  sun.shadow.camera.bottom = -1.8;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 8;
  sun.shadow.bias = -0.0005;
  sun.shadow.radius = 4;
  sun.target.position.set(0, 0, 0);
  lights.add(hemi, sun, sun.target);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.ShadowMaterial({ opacity: 0.35 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;
  shadow.receiveShadow = true;
  shadow.renderOrder = 1;

  return {
    lights,
    shadow,
    moveTo: (p) => {
      lights.position.copy(p);
      shadow.position.set(p.x, p.y + 0.001, p.z);
    },
    setLightsEnabled: (on) => {
      lights.visible = on;
    },
  };
}

/** Soft white dots on the floor, used while scanning. */
export function makeFloorDots(radius = 1.4, spacing = 0.11) {
  const pts = [];
  const alphas = [];
  for (let x = -radius; x <= radius; x += spacing) {
    for (let z = -radius; z <= radius; z += spacing) {
      const d = Math.hypot(x, z);
      if (d > radius) continue;
      pts.push(x, 0.002, z);
      alphas.push(1 - d / radius);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  g.setAttribute("aAlpha", new THREE.Float32BufferAttribute(alphas, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uSize: { value: 0.3 * Math.min(window.devicePixelRatio || 1, 3) } },
    vertexShader: [
      "attribute float aAlpha; varying float vA; uniform float uSize;",
      "void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0);",
      "  gl_PointSize = max(2.0, uSize * 40.0 / -mv.z); gl_Position = projectionMatrix * mv; }",
    ].join("\n"),
    fragmentShader: [
      "varying float vA;",
      "void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard;",
      "  gl_FragColor = vec4(1.0,1.0,1.0, 0.1 + 0.7*vA); }",
    ].join("\n"),
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

/**
 * Placement marker: an outlined rectangle exactly as big as the floor space the exercise needs.
 * White when the space is clear, amber when it is not.
 */
export function makeReticle(footprint) {
  const hx = footprint.width / 2 + FOOTPRINT_MARGIN;
  const hz = footprint.depth / 2 + FOOTPRINT_MARGIN;
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const group = new THREE.Group();
  const t = 0.025;
  const bar = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.003, z);
    group.add(m);
  };
  bar(hx * 2, t, 0, -hz);
  bar(hx * 2, t, 0, hz);
  bar(t, hz * 2, -hx, 0);
  bar(t, hz * 2, hx, 0);
  bar(0.16, t, 0, 0);
  bar(t, 0.16, 0, 0);
  group.add(makeFloorDots(Math.max(hx, hz) + 0.3, 0.12));
  return {
    group,
    half: { x: hx, z: hz },
    setFit: (fit) => mat.color.set(fit ? 0xffffff : 0xf5a524),
  };
}