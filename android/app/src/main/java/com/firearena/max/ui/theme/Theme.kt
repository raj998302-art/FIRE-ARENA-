package com.firearena.max.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Dark + Neon gaming palette
val NeonOrange    = Color(0xFFFF6A00)
val NeonMagenta   = Color(0xFFE100FF)
val NeonCyan      = Color(0xFF00F5FF)
val NeonGreen     = Color(0xFF39FF14)
val BgDeep        = Color(0xFF07070F)
val BgSurface     = Color(0xFF10121B)
val BgSurfaceHi   = Color(0xFF1A1D2B)
val TextMain      = Color(0xFFF2F2F5)
val TextMuted     = Color(0xFF9AA0B4)
val Danger        = Color(0xFFFF3B5C)

private val DarkColors = darkColorScheme(
    primary = NeonOrange,
    onPrimary = Color.Black,
    secondary = NeonMagenta,
    onSecondary = Color.White,
    tertiary = NeonCyan,
    background = BgDeep,
    onBackground = TextMain,
    surface = BgSurface,
    surfaceVariant = BgSurfaceHi,
    onSurface = TextMain,
    onSurfaceVariant = TextMuted,
    error = Danger,
)

private val AppTypography = Typography(
    titleLarge = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp),
    titleMedium = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold),
    bodyLarge = TextStyle(fontSize = 15.sp),
    bodyMedium = TextStyle(fontSize = 14.sp),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
)

@Composable
fun FireArenaMaxTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = DarkColors, typography = AppTypography, content = content)
}
