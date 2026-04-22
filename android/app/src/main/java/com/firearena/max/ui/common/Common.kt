package com.firearena.max.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.firearena.max.ui.theme.BgSurface
import com.firearena.max.ui.theme.BgSurfaceHi
import com.firearena.max.ui.theme.NeonCyan
import com.firearena.max.ui.theme.NeonMagenta
import com.firearena.max.ui.theme.NeonOrange
import com.firearena.max.ui.theme.TextMuted

@Composable
fun NeonHeader(title: String, subtitle: String? = null) {
    Column(
        Modifier.fillMaxWidth()
            .background(
                Brush.horizontalGradient(listOf(NeonOrange.copy(alpha = 0.25f), NeonMagenta.copy(alpha = 0.25f)))
            )
            .padding(horizontal = 20.dp, vertical = 18.dp)
    ) {
        Text(title, color = Color.White, fontWeight = FontWeight.Black, fontSize = 22.sp)
        if (subtitle != null) {
            Spacer(Modifier.height(4.dp))
            Text(subtitle, color = TextMuted, fontSize = 13.sp)
        }
    }
}

@Composable
fun NeonCard(content: @Composable ColumnScope.() -> Unit) {
    Column(
        Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(BgSurface)
            .border(1.dp, NeonCyan.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
            .padding(16.dp),
        content = content
    )
}

@Composable
fun PrimaryButton(
    text: String,
    enabled: Boolean = true,
    loading: Boolean = false,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = Modifier.fillMaxWidth().height(52.dp),
        shape = RoundedCornerShape(12.dp),
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.onPrimary
            )
        } else {
            Text(text, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

@Composable
fun LabelField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    singleLine: Boolean = true,
    isPassword: Boolean = false,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = singleLine,
        visualTransformation = if (isPassword) androidx.compose.ui.text.input.PasswordVisualTransformation()
                                else androidx.compose.ui.text.input.VisualTransformation.None,
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
fun ErrorBanner(msg: String?) {
    if (!msg.isNullOrBlank()) {
        Surface(
            color = MaterialTheme.colorScheme.error.copy(alpha = 0.15f),
            contentColor = MaterialTheme.colorScheme.error,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(msg, modifier = Modifier.padding(12.dp))
        }
    }
}

@Composable
fun EmptyState(text: String) {
    Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
        Text(text, color = TextMuted)
    }
}

fun String.shortErr(): String = take(160)
