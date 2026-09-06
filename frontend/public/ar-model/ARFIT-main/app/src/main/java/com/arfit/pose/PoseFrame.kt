package com.arfit.pose

data class PoseLandmark(
    val x: Float,
    val y: Float,
    val z: Float,
    val visibility: Float,
    val presence: Float
)

@Suppress("unused")
enum class MpLandmark(val index: Int) {
    NOSE(0),
    LEFT_SHOULDER(11), RIGHT_SHOULDER(12),
    LEFT_ELBOW(13), RIGHT_ELBOW(14),
    LEFT_WRIST(15), RIGHT_WRIST(16),
    LEFT_HIP(23), RIGHT_HIP(24),
    LEFT_KNEE(25), RIGHT_KNEE(26),
    LEFT_ANKLE(27), RIGHT_ANKLE(28),
    LEFT_HEEL(29), RIGHT_HEEL(30),
    LEFT_FOOT_INDEX(31), RIGHT_FOOT_INDEX(32)
}

data class PoseFrame(
    val raw: List<PoseLandmark>,
    val timestampMs: Long,
    val imageWidth: Int,   // width of the input image in pixels
    val imageHeight: Int   // height of the input image in pixels
) {
    operator fun get(landmark: MpLandmark): PoseLandmark = raw[landmark.index]

    fun hasRequiredLandmarks(required: Set<MpLandmark>, minVisibility: Float = 0.6f): Boolean =
        raw.size >= 33 && required.all { raw[it.index].visibility >= minVisibility }
}