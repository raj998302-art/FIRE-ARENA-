package com.firearena.max.ui.screens.teams

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.Team
import com.firearena.max.ui.common.*
import kotlinx.coroutines.launch

@Composable
fun TeamsScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.teamRepo
    var list by remember { mutableStateOf<List<Team>>(emptyList()) }
    var name by remember { mutableStateOf("") }
    var tag by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) { scope.launch { runCatching { list = repo.list() } } }

    Scaffold(topBar = { TopAppBar(title = { Text("Teams") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            NeonHeader("Teams", "Create or join a team")
            Column(Modifier.padding(16.dp)) {
                NeonCard {
                    Text("Create a team", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    LabelField(name, { name = it }, "Team name")
                    Spacer(Modifier.height(8.dp))
                    LabelField(tag, { tag = it.uppercase().take(6) }, "Tag (2–6, A–Z0–9)")
                    Spacer(Modifier.height(10.dp))
                    ErrorBanner(error)
                    if (message != null) Text(message!!, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(8.dp))
                    PrimaryButton("Create", enabled = name.length in 3..32 && tag.length in 2..6) {
                        error = null; message = null
                        scope.launch {
                            runCatching { repo.create(name.trim(), tag) }
                                .onSuccess { message = "Team '${it.name}' created"; list = repo.list(); name = ""; tag = "" }
                                .onFailure { error = (it.message ?: "failed").shortErr() }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                Text("All teams", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                LazyColumn {
                    items(list) { t ->
                        NeonCard {
                            Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text("[${t.tag}] ${t.name}", fontWeight = FontWeight.Bold)
                                    if (!t.description.isNullOrBlank()) Text(t.description)
                                }
                                TextButton(onClick = {
                                    scope.launch {
                                        runCatching { repo.join(t.id) }
                                            .onSuccess { message = "Joined ${t.name}" }
                                            .onFailure { error = (it.message ?: "failed").shortErr() }
                                    }
                                }) { Text("Join") }
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}
