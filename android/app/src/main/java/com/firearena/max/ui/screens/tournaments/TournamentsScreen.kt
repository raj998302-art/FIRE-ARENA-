package com.firearena.max.ui.screens.tournaments

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.Tournament
import com.firearena.max.ui.common.EmptyState
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.theme.NeonCyan
import kotlinx.coroutines.launch

@Composable
fun TournamentsScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.tournamentRepo
    var list by remember { mutableStateOf<List<Tournament>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) { scope.launch {
        runCatching { list = repo.list() }.onFailure { error = it.message }
    } }

    Scaffold(topBar = {
        TopAppBar(title = { Text("Tournaments") }, navigationIcon = {
            TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
        })
    }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            NeonHeader("Upcoming & Live", "Tap a tournament to view details and join")
            if (error != null) Text(error!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(16.dp))
            if (list.isEmpty() && error == null) EmptyState("No tournaments yet")
            LazyColumn(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                items(list) { t ->
                    Surface(onClick = { nav.navigate("tournaments/${t.id}") }, color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                        NeonCard {
                            Text(t.title, fontWeight = FontWeight.Black, fontSize = 18.sp)
                            Spacer(Modifier.height(4.dp))
                            Text("${t.game} • ${t.mode} • ${t.status}", color = NeonCyan, fontSize = 12.sp)
                            Spacer(Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("🎟️ ${t.entryFeeCoins} 🪙", fontSize = 13.sp)
                                Spacer(Modifier.width(16.dp))
                                Text("🏆 ${t.prizePoolCoins} 🪙", fontSize = 13.sp)
                                Spacer(Modifier.width(16.dp))
                                Text("${t.filledSlots}/${t.maxSlots} slots", fontSize = 13.sp)
                                if (t.vipOnly) { Spacer(Modifier.width(16.dp)); Text("👑 VIP", fontSize = 13.sp) }
                            }
                            Spacer(Modifier.height(4.dp))
                            Text("Starts: ${t.startAt.take(16).replace("T"," ")}", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
