package com.arfit.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.arfit.engine.WorkoutSummary

/** Section 23. No medical/injury-prevention claims — form-quality language only. */
@Composable
fun WorkoutSummaryScreen(summary: WorkoutSummary, onDone: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("WORKOUT COMPLETE")
        Spacer(Modifier.height(16.dp))
        Text("Exercise: ${summary.exerciseName}")
        Text("Repetitions: ${summary.reps}")
        Text("Average Form: ${summary.averageForm}%")
        Text("Best Form: ${summary.bestForm}%")
        Text("Consistency: ${summary.consistency}%")
        val mins = summary.durationSeconds / 60
        val secs = summary.durationSeconds % 60
        Text("Duration: $mins:${secs.toString().padStart(2, '0')}")
        Spacer(Modifier.height(24.dp))
        Button(onClick = onDone) { Text("Done") }
    }
}
