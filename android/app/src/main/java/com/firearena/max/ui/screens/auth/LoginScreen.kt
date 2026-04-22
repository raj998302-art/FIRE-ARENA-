package com.firearena.max.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import com.firearena.max.ui.nav.Routes
import com.firearena.max.ui.theme.NeonOrange
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val repo = App.instance.container.authRepo

    Scaffold { pv ->
        Column(
            Modifier.padding(pv).fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text("🔥 FIRE ARENA MAX", color = NeonOrange, fontWeight = FontWeight.Black, fontSize = 28.sp)
            Spacer(Modifier.height(6.dp))
            Text("Sign in to enter the arena", fontSize = 14.sp)
            Spacer(Modifier.height(24.dp))
            NeonCard {
                LabelField(identifier, { identifier = it }, "Email or username")
                Spacer(Modifier.height(12.dp))
                LabelField(password, { password = it }, "Password", isPassword = true)
                Spacer(Modifier.height(16.dp))
                ErrorBanner(error)
                Spacer(Modifier.height(12.dp))
                PrimaryButton("Login", loading = loading, enabled = identifier.isNotBlank() && password.isNotBlank()) {
                    error = null; loading = true
                    scope.launch {
                        try {
                            repo.login(identifier.trim(), password)
                            nav.navigate(Routes.Dashboard) { popUpTo(0) }
                        } catch (e: Exception) {
                            error = (e.message ?: "Login failed").shortErr()
                        } finally { loading = false }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            TextButton(onClick = { nav.navigate(Routes.Register) }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
                Text("New here? Create an account")
            }
        }
    }
}
