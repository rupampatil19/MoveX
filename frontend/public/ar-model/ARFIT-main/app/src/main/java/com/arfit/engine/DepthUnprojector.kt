package com.arfit.engine

import android.media.Image
import com.google.ar.core.CameraIntrinsics
import com.google.ar.core.Pose

/**
 * Converts 2D pixels with depth to 3D world coordinates.
 */
@Suppress("SpellCheckingInspection")
class DepthUnprojector {

    /**
     * Reads depth (metres) from ARCore depth image at pixel (u, v).
     * Returns a fallback of 2.0 meters if invalid or unavailable.
     */
    fun sampleDepth(depthImage: Image?, u: Int, v: Int): Float {
        val fallbackDepth = 2.0f
        if (depthImage == null) return fallbackDepth
        if (u < 0 || v < 0 || u >= depthImage.width || v >= depthImage.height) return fallbackDepth

        val plane = depthImage.planes[0]
        val buffer = plane.buffer
        val rowStride = plane.rowStride
        val pixelStride = plane.pixelStride
        val position = v * rowStride + u * pixelStride

        if (position + 1 > buffer.capacity()) return fallbackDepth
        val shortValue = buffer.getShort(position)
        if (shortValue <= 0) return fallbackDepth

        return shortValue / 1000f // mm → m
    }

    /**
     * Unprojects pixel (u, v) with depth to a 3D world coordinate.
     * Uses camera intrinsics and the camera pose (translation + quaternion).
     */
    fun unprojectToWorld(
        u: Float,
        v: Float,
        depth: Float,
        intrinsics: CameraIntrinsics,
        cameraPose: Pose
    ): Vec3 {
        val fx = intrinsics.focalLength[0]
        val fy = intrinsics.focalLength[1]
        val cx = intrinsics.principalPoint[0]
        val cy = intrinsics.principalPoint[1]

        val xCam = (u - cx) * depth / fx
        val yCam = (v - cy) * depth / fy

        val translation = FloatArray(3)
        val quaternion = FloatArray(4)
        cameraPose.getTranslation(translation, 0)
        cameraPose.getRotationQuaternion(quaternion, 0)

        val qx = quaternion[0]
        val qy = quaternion[1]
        val qz = quaternion[2]
        val qw = quaternion[3]

        val rot = FloatArray(9)
        rot[0] = 1 - 2 * (qy * qy + qz * qz)
        rot[1] = 2 * (qx * qy - qw * qz)
        rot[2] = 2 * (qx * qz + qw * qy)
        rot[3] = 2 * (qx * qy + qw * qz)
        rot[4] = 1 - 2 * (qx * qx + qz * qz)
        rot[5] = 2 * (qy * qz - qw * qx)
        rot[6] = 2 * (qx * qz - qw * qy)
        rot[7] = 2 * (qy * qz + qw * qx)
        rot[8] = 1 - 2 * (qx * qx + qy * qy)

        val worldX = rot[0] * xCam + rot[1] * yCam + rot[2] * depth + translation[0]
        val worldY = rot[3] * xCam + rot[4] * yCam + rot[5] * depth + translation[1]
        val worldZ = rot[6] * xCam + rot[7] * yCam + rot[8] * depth + translation[2]

        return Vec3(worldX, worldY, worldZ)
    }
}