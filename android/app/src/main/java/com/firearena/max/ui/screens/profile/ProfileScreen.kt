package com.firearena.max.ui.screens.profile

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.Me
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.nav.Routes
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val container = App.instance.container
    var me by remember { mutableStateOf<Me?>(null) }
    LaunchedEffect(Unit) { scope.launch { runCatching { me = container.authRepo.me() } } }

    Scaffold(topBar = { TopAppBar(title = { Text("Profile") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            NeonHeader(me?.displayName ?: me?.username ?: "Player", me?.email)
            Column(Modifier.padding(16.dp)) {
                NeonCard {
                    Text("Username: ${me?.username ?: "-"}")
                    Text("Game UID: ${me?.gameUid ?: "-"}")
                    Text("Referral code: ${me?.referralCode ?: "-"}", fontWeight = FontWeight.Bold)
                    Text("Roles: ${me?.roles?.joinToString() ?: "-"}")
                    if (me?.vip != null) Text("VIP until: ${me?.vip?.expiresAt}")
                }
                Spacer(Modifier.height(16.dp))
                OutlinedButton(modifier = Modifier.fillMaxWidth(), onClick = {
                    scope.launch {
                        container.authRepo.logout()
                        nav.navigate(Routes.Login) { popUpTo(0) }
                    }
                }) { Text("Logout") }
            }
        }
    }
}
