package com.arfit

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.arfit.ar.FloorScanArScreen
import com.arfit.engine.WorkoutSummary
import com.arfit.ui.ExerciseSelectionScreen
import com.arfit.ui.WorkoutSummaryScreen
import com.arfit.ui.WorkoutViewModel
import com.arfit.ui.WorkoutViewModelFactory
import com.google.ar.core.ArCoreApk

private sealed class Screen {
    object Selection : Screen()
    data class FloorScan(val exerciseId: String) : Screen()
    data class Summary(val summary: WorkoutSummary) : Screen()
}

class MainActivity : ComponentActivity() {

    private val requestCameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* no-op */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            requestCameraPermission.launch(Manifest.permission.CAMERA)
        }

        val arSupported = ArCoreApk.getInstance().checkAvailability(this).isSupported

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var screen by remember { mutableStateOf<Screen>(Screen.Selection) }

                    when (val current = screen) {
                        is Screen.Selection -> ExerciseSelectionScreen(
                            onSelect = { id ->
                                screen = if (arSupported) Screen.FloorScan(id) else {
                                    // If AR is not supported, we could still go to FloorScan but it will show an error.
                                    // For now, just go to FloorScan.
                                    Screen.FloorScan(id)
                                }
                            }
                        )
                        is Screen.FloorScan -> {
                            val viewModel: WorkoutViewModel = viewModel(
                                factory = WorkoutViewModelFactory(current.exerciseId)
                            )
                            FloorScanArScreen(
                                exerciseId = current.exerciseId,
                                viewModel = viewModel,
                                onWorkoutFinished = { summary ->
                                    screen = Screen.Summary(summary)
                                }
                            )
                        }
                        is Screen.Summary -> WorkoutSummaryScreen(
                            summary = current.summary,
                            onDone = { screen = Screen.Selection }
                        )
                    }
                }
            }
        }
    }
}