package com.arfit.engine

import com.arfit.ar.Joint
import com.arfit.pose.MpLandmark
import com.arfit.pose.PoseFrame

/** Minimal 3-float vector so this module doesn't pull in Filament's Float3 (an AR-only dep). */
data class Vec3(val x: Float, val y: Float, val z: Float)

/**
 * Maps a MediaPipe [PoseFrame] onto the same [Joint] vocabulary the AR
 * ghost uses (com.arfit.ar.Joint), so exercise analyzers and the pose
 * comparator can work with one joint model regardless of source.
 *
 * MediaPipe doesn't give NECK, SPINE_MID, or HEAD directly — they're
 * derived from landmarks that do exist. Positions stay in MediaPipe's
 * normalized-image space (x, y in [0,1], y grows DOWNWARD) — callers that
 * need AR's y-up convention (e.g. PoseComparator) flip y themselves rather
 * than this mapper silently changing axes.
 */
object JointMapper {

    private val DIRECT: Map<Joint, MpLandmark> = mapOf(
        Joint.LEFT_SHOULDER to MpLandmark.LEFT_SHOULDER,
        Joint.RIGHT_SHOULDER to MpLandmark.RIGHT_SHOULDER,
        Joint.LEFT_ELBOW to MpLandmark.LEFT_ELBOW,
        Joint.RIGHT_ELBOW to MpLandmark.RIGHT_ELBOW,
        Joint.LEFT_WRIST to MpLandmark.LEFT_WRIST,
        Joint.RIGHT_WRIST to MpLandmark.RIGHT_WRIST,
        Joint.LEFT_HIP to MpLandmark.LEFT_HIP,
        Joint.RIGHT_HIP to MpLandmark.RIGHT_HIP,
        Joint.LEFT_KNEE to MpLandmark.LEFT_KNEE,
        Joint.RIGHT_KNEE to MpLandmark.RIGHT_KNEE,
        Joint.LEFT_ANKLE to MpLandmark.LEFT_ANKLE,
        Joint.RIGHT_ANKLE to MpLandmark.RIGHT_ANKLE
    )

    fun toJointPositions(frame: PoseFrame): Map<Joint, Vec3> {
        val positions = mutableMapOf<Joint, Vec3>()
        DIRECT.forEach { (joint, mp) ->
            val lm = frame[mp]
            positions[joint] = Vec3(lm.x, lm.y, lm.z)
        }

        val ls = frame[MpLandmark.LEFT_SHOULDER]; val rs = frame[MpLandmark.RIGHT_SHOULDER]
        val lh = frame[MpLandmark.LEFT_HIP]; val rh = frame[MpLandmark.RIGHT_HIP]
        val nose = frame[MpLandmark.NOSE]

        val neck = Vec3((ls.x + rs.x) / 2f, (ls.y + rs.y) / 2f, (ls.z + rs.z) / 2f)
        val hipMid = Vec3((lh.x + rh.x) / 2f, (lh.y + rh.y) / 2f, (lh.z + rh.z) / 2f)

        positions[Joint.NECK] = neck
        positions[Joint.SPINE_MID] = Vec3(
            (neck.x + hipMid.x) / 2f, (neck.y + hipMid.y) / 2f, (neck.z + hipMid.z) / 2f
        )
        positions[Joint.HEAD] = Vec3(nose.x, nose.y, nose.z)
        return positions
    }
}
