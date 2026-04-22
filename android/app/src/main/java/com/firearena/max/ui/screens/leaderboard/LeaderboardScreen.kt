package com.firearena.max.ui.screens.leaderboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.LeaderboardRow
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import kotlinx.coroutines.launch

@Composable
fun LeaderboardScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.leaderboardRepo
    var tab by remember { mutableStateOf(0) }
    var rows by remember { mutableStateOf<List<LeaderboardRow>>(emptyList()) }

    LaunchedEffect(tab) {
        scope.launch {
            rows = runCatching {
                when (tab) {
                    0 -> repo.winnings()
                    1 -> repo.kills()
                    else -> repo.referrers()
                }
            }.getOrDefault(emptyList())
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("Leaderboard") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            NeonHeader("Top players", "Winnings • Kills • Referrers")
            TabRow(selectedTabIndex = tab) {
                Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("Winnings") })
                Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("Kills") })
                Tab(selected = tab == 2, onClick = { tab = 2 }, text = { Text("Referrers") })
            }
            LazyColumn(Modifier.padding(16.dp)) {
                items(rows) { r ->
                    NeonCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("#${r.rank}", fontWeight = FontWeight.Black, modifier = Modifier.width(40.dp))
                            Column(Modifier.weight(1f)) {
                                Text(r.user?.username ?: r.userId, fontWeight = FontWeight.Bold)
                            }
                            val metric = when (tab) {
                                0 -> "${r.prizeCoins ?: 0} 🪙"
                                1 -> "${r.kills ?: 0} 🔫"
                                else -> "${r.referralCount ?: 0} refs • ${r.earnedCoins ?: 0} 🪙"
                            }
                            Text(metric)
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                }
            }
        }
    }
}
