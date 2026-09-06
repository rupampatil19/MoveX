package com.arfit.pose

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import android.os.Handler
import android.os.Looper
import androidx.camera.core.ImageProxy
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import java.io.ByteArrayOutputStream

class PoseDetector(
    context: Context,
    modelAssetPath: String = "pose_landmarker_lite.task",
    private val onResult: (PoseFrame?) -> Unit
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val landmarker: PoseLandmarker
    private var lastWidth = 0
    private var lastHeight = 0

    init {
        val baseOptions = BaseOptions.builder()
            .setModelAssetPath(modelAssetPath)
            .setDelegate(Delegate.GPU)
            .build()

        val options = PoseLandmarker.PoseLandmarkerOptions.builder()
            .setBaseOptions(baseOptions)
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setNumPoses(1)
            .setMinPoseDetectionConfidence(0.5f)
            .setMinPosePresenceConfidence(0.5f)
            .setMinTrackingConfidence(0.5f)
            .setResultListener { result, _ ->
                mainHandler.post {
                    handleResult(result, lastWidth, lastHeight)
                }
            }
            .setErrorListener { _ ->
                mainHandler.post { onResult(null) }
            }
            .build()

        landmarker = PoseLandmarker.createFromOptions(context, options)
    }

    fun detectAsync(imageProxy: ImageProxy) {
        val bitmap = imageProxy.toBitmapNv21Jpeg()
        lastWidth = imageProxy.width
        lastHeight = imageProxy.height
        val mpImage = BitmapImageBuilder(bitmap).build()
        val timestampMs = imageProxy.imageInfo.timestamp / 1_000_000
        imageProxy.close()
        landmarker.detectAsync(mpImage, timestampMs)
    }

    fun detectBitmap(bitmap: Bitmap) {
        // Not used in current flow, but kept for potential fallback
        lastWidth = bitmap.width
        lastHeight = bitmap.height
        val mpImage = BitmapImageBuilder(bitmap).build()
        landmarker.detectAsync(mpImage, System.currentTimeMillis())
    }

    private fun handleResult(result: PoseLandmarkerResult, width: Int, height: Int) {
        val landmarks = result.landmarks().firstOrNull()
        if (landmarks == null) {
            onResult(null)
            return
        }
        val frame = PoseFrame(
            raw = landmarks.map { lm ->
                PoseLandmark(
                    x = lm.x(), y = lm.y(), z = lm.z(),
                    visibility = lm.visibility().orElse(0f),
                    presence = lm.presence().orElse(0f)
                )
            },
            timestampMs = System.currentTimeMillis(),
            imageWidth = width,
            imageHeight = height
        )
        onResult(frame)
    }

    fun close() = landmarker.close()

    // ---- ImageProxy to Bitmap conversion (unchanged) ----
    private fun ImageProxy.toBitmapNv21Jpeg(): Bitmap {
        val yPlane = planes[0]
        val uPlane = planes[1]
        val vPlane = planes[2]

        val nv21 = ByteArray(width * height + 2 * ((width + 1) / 2) * ((height + 1) / 2))

        var pos = 0
        val yBuffer = yPlane.buffer
        val yRowStride = yPlane.rowStride
        for (row in 0 until height) {
            yBuffer.position(row * yRowStride)
            yBuffer.get(nv21, pos, width)
            pos += width
        }

        val chromaWidth = (width + 1) / 2
        val chromaHeight = (height + 1) / 2
        val uBuffer = uPlane.buffer
        val vBuffer = vPlane.buffer
        val uRowStride = uPlane.rowStride
        val uPixelStride = uPlane.pixelStride
        val vRowStride = vPlane.rowStride
        val vPixelStride = vPlane.pixelStride

        var uvPos = width * height
        for (row in 0 until chromaHeight) {
            for (col in 0 until chromaWidth) {
                val vIndex = row * vRowStride + col * vPixelStride
                val uIndex = row * uRowStride + col * uPixelStride
                nv21[uvPos++] = vBuffer.get(vIndex)
                nv21[uvPos++] = uBuffer.get(uIndex)
            }
        }

        val yuvImage = YuvImage(nv21, ImageFormat.NV21, width, height, null)
        val out = ByteArrayOutputStream()
        yuvImage.compressToJpeg(Rect(0, 0, width, height), 90, out)
        val bytes = out.toByteArray()
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    }
}