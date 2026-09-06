package com.arfit.engine

import com.arfit.ar.Bone
import com.arfit.ar.Joint
import com.arfit.ar.STANDARD_BONES
import kotlin.math.abs
import kotlin.math.atan2

data class AlignmentResult(val percent: Int, val worstBone: Bone?)

/**
 * Generic pose-vs-target comparator. Compares SHAPE, not absolute position.
 * For every bone in STANDARD_BONES, computes the angle in 2D (screen-plane projection)
 * for both the user and the target, then averages the angular error.
 *
 * Now accepts two maps of joint positions – useful for comparing against
 * the ghost's current animated pose.
 */
object PoseComparator {

    fun compare(
        userPositions: Map<Joint, Vec3>,
        targetPositions: Map<Joint, Vec3>
    ): AlignmentResult {
        var totalError = 0f
        var count = 0
        var worstBone: Bone? = null
        var worstError = -1f

        STANDARD_BONES.forEach { bone ->
            val ua = userPositions[bone.a]; val ub = userPositions[bone.b]
            val ta = targetPositions[bone.a]; val tb = targetPositions[bone.b]
            if (ua == null || ub == null || ta == null || tb == null) return@forEach

            val userAngle = userBoneAngleDegrees(ua, ub)
            val targetAngle = targetBoneAngleDegrees(ta, tb)
            val error = angleDiff(userAngle, targetAngle)

            totalError += error
            count++
            if (error > worstError) {
                worstError = error
                worstBone = bone
            }
        }

        if (count == 0) return AlignmentResult(0, null)
        val avgError = totalError / count
        val percent = (100f - (avgError / 60f) * 100f).coerceIn(0f, 100f).toInt()
        return AlignmentResult(percent, worstBone)
    }

    private fun userBoneAngleDegrees(a: Vec3, b: Vec3): Float {
        val dx = b.x - a.x
        val dy = -(b.y - a.y) // flip: MediaPipe y‑down → AR y‑up
        return Math.toDegrees(atan2(dx.toDouble(), dy.toDouble())).toFloat()
    }

    private fun targetBoneAngleDegrees(a: Vec3, b: Vec3): Float {
        val dx = b.x - a.x
        val dy = b.y - a.y
        return Math.toDegrees(atan2(dx.toDouble(), dy.toDouble())).toFloat()
    }

    private fun angleDiff(a: Float, b: Float): Float {
        var diff = abs(a - b) % 360f
        if (diff > 180f) diff = 360f - diff
        return diff
    }
}