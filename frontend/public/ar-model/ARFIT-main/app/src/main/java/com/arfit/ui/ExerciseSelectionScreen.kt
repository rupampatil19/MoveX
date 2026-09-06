package com.arfit.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.arfit.engine.ExerciseRegistry

private data class ExerciseCard(val id: String, val label: String, val category: String)

// Add a card here whenever a new analyzer gets registered in ExerciseRegistry (Section 30).
private val CARDS = listOf(
    ExerciseCard("pushup", "PUSH-UP", "Upper Body"),
    ExerciseCard("squat", "SQUAT", "Lower Body")
)

@Composable
fun ExerciseSelectionScreen(onSelect: (String) -> Unit) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(CARDS.filter { ExerciseRegistry.available.contains(it.id) }) { card ->
            Column(
                modifier = Modifier
                    .background(Color(0xFF1B1F27), RoundedCornerShape(16.dp))
                    .clickable { onSelect(card.id) }
                    .padding(20.dp)
                    .fillMaxWidth()
            ) {
                Text(card.label, color = Color.White)
                Text(card.category, color = Color.White.copy(alpha = 0.6f))
            }
        }
    }
}
