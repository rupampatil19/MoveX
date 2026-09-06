package com.arfit.ar

import dev.romainguy.kotlin.math.Float3

/**
 * A joint name shared across every exercise. Only the joints an exercise
 * actually needs get populated in a given PoseKeyframe — see PoseLibrary.
 */
enum class Joint {
    HEAD, NECK,
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_ELBOW, RIGHT_ELBOW,
    LEFT_WRIST, RIGHT_WRIST,
    SPINE_MID,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE
}

/** Two joints that should be connected with a "bone" cylinder. */
data class Bone(val a: Joint, val b: Joint)

/**
 * One static pose. Positions are in meters, relative to the AR anchor
 * placed on the floor (anchor origin = point between the feet).
 * X = left/right, Y = up, Z = toward the camera.
 */
data class PoseKeyframe(
    val name: String,
    val joints: Map<Joint, Float3>
)

/**
 * An exercise's full ghost animation: a loop of keyframes the ghost
 * interpolates between to demonstrate the movement. Static exercises
 * (e.g. plank) just use a single keyframe list of size 1.
 */
data class GhostAnimation(
    val exerciseId: String,
    val keyframes: List<PoseKeyframe>,
    val secondsPerKeyframe: Float = 1.4f
)

/** Standard bone connections — same skeleton topology for every exercise. */
val STANDARD_BONES = listOf(
    Bone(Joint.HEAD, Joint.NECK),
    Bone(Joint.NECK, Joint.LEFT_SHOULDER),
    Bone(Joint.NECK, Joint.RIGHT_SHOULDER),
    Bone(Joint.LEFT_SHOULDER, Joint.LEFT_ELBOW),
    Bone(Joint.LEFT_ELBOW, Joint.LEFT_WRIST),
    Bone(Joint.RIGHT_SHOULDER, Joint.RIGHT_ELBOW),
    Bone(Joint.RIGHT_ELBOW, Joint.RIGHT_WRIST),
    Bone(Joint.NECK, Joint.SPINE_MID),
    Bone(Joint.SPINE_MID, Joint.LEFT_HIP),
    Bone(Joint.SPINE_MID, Joint.RIGHT_HIP),
    Bone(Joint.LEFT_HIP, Joint.RIGHT_HIP),
    Bone(Joint.LEFT_HIP, Joint.LEFT_KNEE),
    Bone(Joint.LEFT_KNEE, Joint.LEFT_ANKLE),
    Bone(Joint.RIGHT_HIP, Joint.RIGHT_KNEE),
    Bone(Joint.RIGHT_KNEE, Joint.RIGHT_ANKLE)
)
