package com.firearena.max.ui.screens.auth

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.R
import com.firearena.max.data.OAuthBus
import com.firearena.max.data.OAuthResult
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import com.firearena.max.ui.nav.Routes
import com.firearena.max.ui.theme.NeonOrange
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.flow.filterIsInstance
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(nav: NavHostController) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val repo = App.instance.container.authRepo

    val googleClientId = ctx.getString(R.string.google_oauth_web_client_id)
    val discordClientId = ctx.getString(R.string.discord_oauth_client_id)
    val discordRedirectUri = ctx.getString(R.string.discord_oauth_redirect_uri)

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
            Spacer(Modifier.height(20.dp))
            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                HorizontalDivider(modifier = Modifier.weight(1f))
                Text("or continue with", fontSize = 12.sp, color = Color.Gray)
                HorizontalDivider(modifier = Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    modifier = Modifier.weight(1f).height(48.dp),
                    enabled = googleClientId.isNotBlank() && !loading,
                    onClick = {
                        scope.launch {
                            try {
                                loading = true; error = null
                                val option = GetGoogleIdOption.Builder()
                                    .setFilterByAuthorizedAccounts(false)
                                    .setServerClientId(googleClientId)
                                    .build()
                                val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
                                val cm = CredentialManager.create(ctx)
                                val result = cm.getCredential(context = ctx, request = request)
                                val cred = result.credential
                                if (cred is CustomCredential &&
                                    cred.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                                    val gid = GoogleIdTokenCredential.createFrom(cred.data)
                                    repo.signInWithGoogle(gid.idToken)
                                    nav.navigate(Routes.Dashboard) { popUpTo(0) }
                                } else {
                                    error = "Unsupported Google credential"
                                }
                            } catch (e: Exception) {
                                error = (e.message ?: "Google sign-in failed").shortErr()
                            } finally { loading = false }
                        }
                    }
                ) { Text(if (googleClientId.isBlank()) "Google (not configured)" else "Google") }

                OutlinedButton(
                    modifier = Modifier.weight(1f).height(48.dp),
                    enabled = discordClientId.isNotBlank() && !loading,
                    onClick = {
                        if (discordClientId.isBlank()) return@OutlinedButton
                        val url = "https://discord.com/api/oauth2/authorize" +
                            "?client_id=" + discordClientId +
                            "&redirect_uri=" + Uri.encode(discordRedirectUri) +
                            "&response_type=code&scope=identify%20email"
                        ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        scope.launch {
                            try {
                                loading = true
                                val r = OAuthBus.results.filterIsInstance<OAuthResult>().first()
                                if (r is OAuthResult.DiscordCode) {
                                    repo.signInWithDiscord(r.code, discordRedirectUri)
                                    nav.navigate(Routes.Dashboard) { popUpTo(0) }
                                } else if (r is OAuthResult.Error) {
                                    error = "Discord: ${r.message}"
                                }
                            } catch (e: Exception) {
                                error = (e.message ?: "Discord sign-in failed").shortErr()
                            } finally { loading = false }
                        }
                    }
                ) { Text(if (discordClientId.isBlank()) "Discord (not configured)" else "Discord") }
            }
            Spacer(Modifier.height(16.dp))
            TextButton(onClick = { nav.navigate(Routes.Register) }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
                Text("New here? Create an account")
            }
        }
    }
}
