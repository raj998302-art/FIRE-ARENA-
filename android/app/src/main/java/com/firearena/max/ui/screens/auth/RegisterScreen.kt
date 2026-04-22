package com.firearena.max.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import com.firearena.max.ui.nav.Routes
import kotlinx.coroutines.launch

@Composable
fun RegisterScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var gameUid by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var refCode by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val repo = App.instance.container.authRepo

    Scaffold(topBar = {
        TopAppBar(title = { Text("Create account") }, navigationIcon = {
            TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
        })
    }) { pv ->
        Column(
            Modifier.padding(pv).fillMaxSize().padding(24.dp).verticalScroll(rememberScrollState())
        ) {
            NeonCard {
                LabelField(email, { email = it }, "Email")
                Spacer(Modifier.height(10.dp))
                LabelField(username, { username = it }, "Username (3–24, letters/numbers/_)")
                Spacer(Modifier.height(10.dp))
                LabelField(password, { password = it }, "Password (min 8)", isPassword = true)
                Spacer(Modifier.height(10.dp))
                LabelField(gameUid, { gameUid = it }, "In-game UID (optional)")
                Spacer(Modifier.height(10.dp))
                LabelField(phone, { phone = it }, "Phone (optional)")
                Spacer(Modifier.height(10.dp))
                LabelField(refCode, { refCode = it.uppercase() }, "Referral code (optional)")
                Spacer(Modifier.height(14.dp))
                ErrorBanner(error)
                Spacer(Modifier.height(10.dp))
                PrimaryButton("Register", loading = loading,
                    enabled = email.isNotBlank() && username.isNotBlank() && password.length >= 8) {
                    error = null; loading = true
                    scope.launch {
                        try {
                            repo.register(
                                email = email.trim(),
                                username = username.trim(),
                                password = password,
                                gameUid = gameUid.takeIf { it.isNotBlank() },
                                phone = phone.takeIf { it.isNotBlank() },
                                referralCode = refCode.takeIf { it.length == 8 },
                            )
                            nav.navigate(Routes.Dashboard) { popUpTo(0) }
                        } catch (e: Exception) {
                            error = (e.message ?: "Registration failed").shortErr()
                        } finally { loading = false }
                    }
                }
            }
        }
    }
}
