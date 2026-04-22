package com.firearena.max

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import com.firearena.max.ui.nav.AppNavHost
import com.firearena.max.ui.theme.FireArenaMaxTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FireArenaMaxTheme(darkTheme = true) {
                AppNavHost()
            }
        }
    }
}
