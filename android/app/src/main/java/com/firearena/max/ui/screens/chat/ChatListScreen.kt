package com.firearena.max.ui.screens.chat

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
import com.firearena.max.data.api.ChatChannel
import com.firearena.max.ui.common.NeonCard
import com.firearena.max.ui.common.NeonHeader
import kotlinx.coroutines.launch

@Composable
fun ChatListScreen(nav: NavHostController) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.chatRepo
    var items by remember { mutableStateOf<List<ChatChannel>>(emptyList()) }

    LaunchedEffect(Unit) { scope.launch { runCatching { items = repo.channels() } } }

    Scaffold(topBar = { TopAppBar(title = { Text("Chat") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            NeonHeader("Channels", "Global • Team • VIP • Support")
            LazyColumn(Modifier.padding(16.dp)) {
                items(items) { ch ->
                    Surface(onClick = { nav.navigate("chat/${ch.id}") }, color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                        NeonCard {
                            Text(ch.name ?: ch.type, fontWeight = FontWeight.Bold)
                            Text(ch.type, style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
        }
    }
}
