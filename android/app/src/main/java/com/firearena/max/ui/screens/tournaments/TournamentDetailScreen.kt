package com.firearena.max.ui.screens.tournaments

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.Tournament
import com.firearena.max.ui.common.*
import kotlinx.coroutines.launch

@Composable
fun TournamentDetailScreen(nav: NavHostController, id: String) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.tournamentRepo
    var t by remember { mutableStateOf<Tournament?>(null) }
    var uid by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    var refresh by remember { mutableStateOf(0) }

    LaunchedEffect(refresh) {
        scope.launch { runCatching { t = repo.detail(id) }.onFailure { error = it.message } }
    }

    Scaffold(topBar = {
        TopAppBar(title = { Text(t?.title ?: "Tournament") }, navigationIcon = {
            TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
        })
    }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
            val tt = t ?: return@Column
            NeonCard {
                Text(tt.title, fontWeight = FontWeight.Black, fontSize = 20.sp)
                Spacer(Modifier.height(6.dp))
                Text("${tt.game} • ${tt.mode} • ${tt.status}")
                Spacer(Modifier.height(10.dp))
                Text("Entry: ${tt.entryFeeCoins} 🪙    Prize: ${tt.prizePoolCoins} 🪙")
                Text("Slots: ${tt.filledSlots}/${tt.maxSlots}")
                if (tt.vipOnly) Text("👑 VIP-only")
                Spacer(Modifier.height(10.dp))
                Text("Starts: ${tt.startAt}")
                Text("Lock at: ${tt.lockAt}")
                if (!tt.rules.isNullOrBlank()) {
                    Spacer(Modifier.height(10.dp))
                    Text("Rules", fontWeight = FontWeight.SemiBold)
                    Text(tt.rules)
                }
                if (!tt.roomId.isNullOrBlank()) {
                    Spacer(Modifier.height(10.dp))
                    Text("Room: ${tt.roomId}", fontWeight = FontWeight.Bold)
                    Text("Password: ${tt.roomPassword}")
                }
            }
            Spacer(Modifier.height(16.dp))
            ErrorBanner(error)
            if (message != null) Text(message!!, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
            NeonCard {
                Text("Join this tournament", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                LabelField(uid, { uid = it }, "Your in-game UID")
                Spacer(Modifier.height(12.dp))
                PrimaryButton("Join (pay ${tt.entryFeeCoins} 🪙)", loading = loading,
                    enabled = uid.length >= 3 && tt.status == "OPEN") {
                    error = null; loading = true
                    scope.launch {
                        try {
                            repo.join(tt.id, uid)
                            message = "Joined. Good luck!"
                            refresh++
                        } catch (e: Exception) {
                            error = (e.message ?: "Failed").shortErr()
                        } finally { loading = false }
                    }
                }
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = {
                    scope.launch {
                        runCatching { repo.leave(tt.id) }
                            .onSuccess { message = "Left — refund queued."; refresh++ }
                            .onFailure { error = it.message }
                    }
                }, modifier = Modifier.fillMaxWidth()) { Text("Leave") }
            }
        }
    }
}
