package com.arfit.ar

import dev.romainguy.kotlin.math.Float3

/**
 * Approximate keyframes for a ~1.7m person, anchor at floor between feet.
 * These are intentionally simple/hand-tuned for a clean MVP demo — swap
 * in motion-captured or MediaPipe-derived reference poses later without
 * touching any rendering or AR code, since GhostSkeletonNode only reads
 * from GhostAnimation.
 */
object PoseLibrary {

    private fun j(vararg pairs: Pair<Joint, Float3>) = pairs.toMap()

    val SQUAT_STAND = PoseKeyframe(
        "squat_stand",
        j(
            Joint.HEAD to Float3(0f, 1.55f, 0f),
            Joint.NECK to Float3(0f, 1.40f, 0f),
            Joint.LEFT_SHOULDER to Float3(-0.18f, 1.38f, 0f),
            Joint.RIGHT_SHOULDER to Float3(0.18f, 1.38f, 0f),
            Joint.LEFT_ELBOW to Float3(-0.20f, 1.10f, 0.05f),
            Joint.RIGHT_ELBOW to Float3(0.20f, 1.10f, 0.05f),
            Joint.LEFT_WRIST to Float3(-0.20f, 0.85f, 0.05f),
            Joint.RIGHT_WRIST to Float3(0.20f, 0.85f, 0.05f),
            Joint.SPINE_MID to Float3(0f, 1.05f, 0f),
            Joint.LEFT_HIP to Float3(-0.12f, 0.90f, 0f),
            Joint.RIGHT_HIP to Float3(0.12f, 0.90f, 0f),
            Joint.LEFT_KNEE to Float3(-0.13f, 0.48f, 0f),
            Joint.RIGHT_KNEE to Float3(0.13f, 0.48f, 0f),
            Joint.LEFT_ANKLE to Float3(-0.14f, 0.08f, 0f),
            Joint.RIGHT_ANKLE to Float3(0.14f, 0.08f, 0f)
        )
    )

    val SQUAT_BOTTOM = PoseKeyframe(
        "squat_bottom",
        j(
            Joint.HEAD to Float3(0f, 1.10f, 0.10f),
            Joint.NECK to Float3(0f, 0.98f, 0.08f),
            Joint.LEFT_SHOULDER to Float3(-0.18f, 0.96f, 0.08f),
            Joint.RIGHT_SHOULDER to Float3(0.18f, 0.96f, 0.08f),
            Joint.LEFT_ELBOW to Float3(-0.24f, 0.80f, 0.22f),
            Joint.RIGHT_ELBOW to Float3(0.24f, 0.80f, 0.22f),
            Joint.LEFT_WRIST to Float3(-0.26f, 0.70f, 0.34f),
            Joint.RIGHT_WRIST to Float3(0.26f, 0.70f, 0.34f),
            Joint.SPINE_MID to Float3(0f, 0.72f, 0.04f),
            Joint.LEFT_HIP to Float3(-0.13f, 0.52f, -0.02f),
            Joint.RIGHT_HIP to Float3(0.13f, 0.52f, -0.02f),
            Joint.LEFT_KNEE to Float3(-0.17f, 0.32f, 0.20f),
            Joint.RIGHT_KNEE to Float3(0.17f, 0.32f, 0.20f),
            Joint.LEFT_ANKLE to Float3(-0.14f, 0.08f, 0f),
            Joint.RIGHT_ANKLE to Float3(0.14f, 0.08f, 0f)
        )
    )

    val PUSHUP_TOP = PoseKeyframe(
        "pushup_top",
        j(
            Joint.HEAD to Float3(0f, 0.55f, 0.75f),
            Joint.NECK to Float3(0f, 0.52f, 0.62f),
            Joint.LEFT_SHOULDER to Float3(-0.18f, 0.50f, 0.55f),
            Joint.RIGHT_SHOULDER to Float3(0.18f, 0.50f, 0.55f),
            Joint.LEFT_ELBOW to Float3(-0.20f, 0.42f, 0.30f),
            Joint.RIGHT_ELBOW to Float3(0.20f, 0.42f, 0.30f),
            Joint.LEFT_WRIST to Float3(-0.22f, 0.10f, 0.42f),
            Joint.RIGHT_WRIST to Float3(0.22f, 0.10f, 0.42f),
            Joint.SPINE_MID to Float3(0f, 0.48f, 0.15f),
            Joint.LEFT_HIP to Float3(-0.10f, 0.46f, -0.20f),
            Joint.RIGHT_HIP to Float3(0.10f, 0.46f, -0.20f),
            Joint.LEFT_KNEE to Float3(-0.10f, 0.20f, -0.75f),
            Joint.RIGHT_KNEE to Float3(0.10f, 0.20f, -0.75f),
            Joint.LEFT_ANKLE to Float3(-0.10f, 0.08f, -1.10f),
            Joint.RIGHT_ANKLE to Float3(0.10f, 0.08f, -1.10f)
        )
    )

    val PUSHUP_BOTTOM = PoseKeyframe(
        "pushup_bottom",
        j(
            Joint.HEAD to Float3(0f, 0.22f, 0.75f),
            Joint.NECK to Float3(0f, 0.20f, 0.62f),
            Joint.LEFT_SHOULDER to Float3(-0.18f, 0.19f, 0.55f),
            Joint.RIGHT_SHOULDER to Float3(0.18f, 0.19f, 0.55f),
            Joint.LEFT_ELBOW to Float3(-0.26f, 0.16f, 0.44f),
            Joint.RIGHT_ELBOW to Float3(0.26f, 0.16f, 0.44f),
            Joint.LEFT_WRIST to Float3(-0.22f, 0.08f, 0.44f),
            Joint.RIGHT_WRIST to Float3(0.22f, 0.08f, 0.44f),
            Joint.SPINE_MID to Float3(0f, 0.17f, 0.15f),
            Joint.LEFT_HIP to Float3(-0.10f, 0.16f, -0.20f),
            Joint.RIGHT_HIP to Float3(0.10f, 0.16f, -0.20f),
            Joint.LEFT_KNEE to Float3(-0.10f, 0.10f, -0.75f),
            Joint.RIGHT_KNEE to Float3(0.10f, 0.10f, -0.75f),
            Joint.LEFT_ANKLE to Float3(-0.10f, 0.08f, -1.10f),
            Joint.RIGHT_ANKLE to Float3(0.10f, 0.08f, -1.10f)
        )
    )

    fun animationFor(exerciseId: String): GhostAnimation = when (exerciseId) {
        "squat" -> GhostAnimation("squat", listOf(SQUAT_STAND, SQUAT_BOTTOM, SQUAT_STAND))
        "pushup" -> GhostAnimation("pushup", listOf(PUSHUP_TOP, PUSHUP_BOTTOM, PUSHUP_TOP))
        else -> GhostAnimation(exerciseId, listOf(SQUAT_STAND))
    }
}
