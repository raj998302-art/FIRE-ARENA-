package com.firearena.max.data

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

sealed class OAuthResult {
    data class DiscordCode(val code: String) : OAuthResult()
    data class Error(val message: String) : OAuthResult()
}

/**
 * Relays OAuth redirect deep-link results (currently Discord authorization code)
 * from MainActivity.onNewIntent to any active Composable that's awaiting one.
 */
object OAuthBus {
    private val _results = MutableSharedFlow<OAuthResult>(
        replay = 0, extraBufferCapacity = 8,
    )
    val results: SharedFlow<OAuthResult> = _results.asSharedFlow()
    fun tryEmit(r: OAuthResult) { _results.tryEmit(r) }
}
