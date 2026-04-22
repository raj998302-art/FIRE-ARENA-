package com.firearena.max.ui.screens.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.firearena.max.App
import com.firearena.max.data.api.ChatMessage
import com.firearena.max.ui.common.LabelField
import com.firearena.max.ui.common.NeonCard
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ChatChannelScreen(nav: NavHostController, channelId: String) {
    val scope = rememberCoroutineScope()
    val repo = App.instance.container.chatRepo
    var messages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
    var body by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Simple polling (socket integration would be ideal; kept MVP)
    LaunchedEffect(channelId) {
        while (true) {
            runCatching { messages = repo.messages(channelId, 100).reversed() }
            delay(3000)
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("Channel") }, navigationIcon = {
        TextButton(onClick = { nav.popBackStack() }) { Text("Back") }
    }) }) { pv ->
        Column(Modifier.padding(pv).fillMaxSize()) {
            LazyColumn(Modifier.weight(1f).padding(8.dp), state = listState) {
                items(messages) { m ->
                    NeonCard {
                        Text(m.sender?.username ?: m.senderId, style = MaterialTheme.typography.labelMedium)
                        Text(m.body)
                        Text(m.createdAt.take(16).replace("T", " "), style = MaterialTheme.typography.labelSmall)
                    }
                    Spacer(Modifier.height(6.dp))
                }
            }
            Row(Modifier.padding(8.dp)) {
                OutlinedTextField(value = body, onValueChange = { body = it },
                    modifier = Modifier.weight(1f), placeholder = { Text("Type a message…") })
                Spacer(Modifier.width(8.dp))
                Button(onClick = {
                    val t = body.trim()
                    if (t.isEmpty()) return@Button
                    scope.launch {
                        runCatching { repo.send(channelId, t) }
                        body = ""
                        runCatching { messages = repo.messages(channelId, 100).reversed() }
                    }
                }) { Text("Send") }
            }
        }
    }
}
