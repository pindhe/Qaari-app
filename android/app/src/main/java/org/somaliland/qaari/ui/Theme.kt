package org.somaliland.qaari.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Green = Color(0xFF0B7A3E)
val GreenDark = Color(0xFF065028)
val Cream = Color(0xFFF6F1E8)
val Gold = Color(0xFFC9A227)
val Red = Color(0xFFC8102E)
val Ink = Color(0xFF1B241F)

private val colors = lightColorScheme(
    primary = Green,
    onPrimary = Color.White,
    secondary = Gold,
    background = Cream,
    surface = Color.White,
    onBackground = Ink,
    onSurface = Ink,
    error = Red,
)

@Composable
fun QaariTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, content = content)
}
