/**
 * Shared model-byte cache.
 * Fetching is started from the exercise dashboard, before the preview is opened,
 * and the same ArrayBuffer is reused by FBXLoader (no second network request).
 */
const modelBytes = new Map();
const MODEL_FETCH_TIMEOUT_MS = 45_000;

export function getModelBytes(url) {
  const key = String(url);
  const existing = modelBytes.get(key);
  if (existing) return existing;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_FETCH_TIMEOUT_MS);
  const request = fetch(key, { cache: "force-cache", signal: controller.signal }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Trainer model request failed (${response.status} ${response.statusText}) at ${new URL(key).pathname}`);
    }
    const data = await response.arrayBuffer();
    if (data.byteLength < 1024) {
      throw new Error(`Trainer model file is empty or incomplete: ${new URL(key).pathname}`);
    }
    return data;
  }).catch((error) => {
    // Give users a useful failure instead of leaving the loading screen up for minutes.
    if (error?.name === "AbortError") {
      throw new Error(`Trainer model download timed out after ${Math.round(MODEL_FETCH_TIMEOUT_MS / 1000)} seconds. Check your connection and retry.`);
    }
    throw error;
  }).catch((error) => {
    // Permit a later retry if the network request failed.
    modelBytes.delete(key);
    throw error;
  }).finally(() => {
    clearTimeout(timeout);
  });

  modelBytes.set(key, request);
  return request;
}

export function preloadModelBytes(url) {
  return getModelBytes(url).then(() => true);
}
