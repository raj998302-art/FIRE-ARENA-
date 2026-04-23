package com.firearena.max.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.CreateTournamentRequest
import com.firearena.max.ui.common.ErrorBanner
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import com.firearena.max.ui.common.PrimaryButton
import com.firearena.max.ui.common.shortErr
import kotlinx.coroutines.launch

@Composable
fun AdminCreateTournamentScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.adminRepo

    var title by remember { mutableStateOf("") }
    var game by remember { mutableStateOf("FREE_FIRE") }
    var mode by remember { mutableStateOf("SQUAD") }
    var description by remember { mutableStateOf("") }
    var entryFee by remember { mutableStateOf("10") }
    var prizePool by remember { mutableStateOf("400") }
    var maxSlots by remember { mutableStateOf("48") }
    var startAt by remember { mutableStateOf("") }
    var lockAt by remember { mutableStateOf("") }
    var vipOnly by remember { mutableStateOf(false) }
    var rules by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var success by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    Scaffold(topBar = { TopAppBar(title = { Text("Create tournament") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize().verticalScroll(rememberScrollState())) {
            NeonHeader("🏆 New tournament", "Bracket, prize pool, room details")
            Column(Modifier.padding(16.dp)) {
                NeonCard {
                    LabelField(title, { title = it }, "Title")
                    Spacer(Modifier.height(8.dp))
                    LabelField(game, { game = it.uppercase() }, "Game (e.g. FREE_FIRE)")
                    Spacer(Modifier.height(8.dp))
                    LabelField(mode, { mode = it.uppercase() }, "Mode (e.g. SQUAD, DUO, SOLO)")
                    Spacer(Modifier.height(8.dp))
                    LabelField(description, { description = it }, "Description", singleLine = false)
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(Modifier.weight(1f)) { LabelField(entryFee, { entryFee = it.filter { c -> c.isDigit() } }, "Entry 🪙") }
                        Box(Modifier.weight(1f)) { LabelField(prizePool, { prizePool = it.filter { c -> c.isDigit() } }, "Prize 🪙") }
                        Box(Modifier.weight(1f)) { LabelField(maxSlots, { maxSlots = it.filter { c -> c.isDigit() } }, "Slots") }
                    }
                    Spacer(Modifier.height(8.dp))
                    LabelField(startAt, { startAt = it }, "Start at (ISO 8601, e.g. 2025-01-01T18:30:00Z)")
                    Spacer(Modifier.height(8.dp))
                    LabelField(lockAt, { lockAt = it }, "Lock at (ISO 8601)")
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Switch(checked = vipOnly, onCheckedChange = { vipOnly = it })
                        Spacer(Modifier.width(10.dp))
                        Text("VIP only")
                    }
                    Spacer(Modifier.height(8.dp))
                    LabelField(rules, { rules = it }, "Rules (optional)", singleLine = false)
                }

                Spacer(Modifier.height(12.dp))
                ErrorBanner(error)
                if (success != null) {
                    Text(success!!, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
                Spacer(Modifier.height(8.dp))
                PrimaryButton("Create tournament", loading = loading,
                    enabled = title.isNotBlank() && startAt.isNotBlank() && lockAt.isNotBlank() &&
                              entryFee.isNotBlank() && prizePool.isNotBlank() && maxSlots.isNotBlank()) {
                    scope.launch {
                        loading = true; error = null; success = null
                        runCatching {
                            repo.createTournament(
                                CreateTournamentRequest(
                                    title = title.trim(),
                                    game = game.trim(),
                                    mode = mode.trim(),
                                    description = description.ifBlank { null },
                                    entryFeeCoins = entryFee.toInt(),
                                    prizePoolCoins = prizePool.toInt(),
                                    maxSlots = maxSlots.toInt(),
                                    startAt = startAt.trim(),
                                    lockAt = lockAt.trim(),
                                    vipOnly = vipOnly,
                                    rules = rules.ifBlank { null },
                                )
                            )
                        }
                        .onSuccess {
                            success = "Created \"${it.title}\""
                            title = ""; description = ""; rules = ""
                        }
                        .onFailure { error = (it.message ?: "Failed").shortErr() }
                        loading = false
                    }
                }
            }
        }
    }
}
