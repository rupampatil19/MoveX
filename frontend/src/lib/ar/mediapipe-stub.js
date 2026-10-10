// Stub module: we don't use MediaPipe (only TensorFlow MoveNet).
// This prevents the bundler from trying to parse @mediapipe/pose's UMD build.
export const Pose = class {};
export default { Pose };