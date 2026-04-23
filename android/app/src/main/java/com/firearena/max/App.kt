package com.firearena.max

import android.app.Application
import android.util.Log
import com.firearena.max.data.AppContainer
import com.onesignal.OneSignal
import com.onesignal.debug.LogLevel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class App : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        container = AppContainer(this)
        initOneSignal()
    }

    /**
     * OneSignal initializes lazily; if the app id is blank we skip (e.g. dev builds).
     * Once the user is logged in we push our internal user id as the OneSignal
     * externalUserId so the backend can target pushes by our Prisma `userId`.
     */
    private fun initOneSignal() {
        val appId = getString(R.string.onesignal_app_id)
        if (appId.isBlank()) return
        try {
            OneSignal.Debug.logLevel = LogLevel.WARN
            OneSignal.initWithContext(this, appId)
            // We request permission lazily from the first notification-aware screen.

            val userId = container.prefs.userId
            if (!userId.isNullOrBlank()) {
                OneSignal.login(userId)
                val playerId = OneSignal.User.pushSubscription.id
                if (!playerId.isNullOrBlank()) {
                    CoroutineScope(Dispatchers.IO).launch {
                        runCatching { container.pushRepo.register(playerId) }
                    }
                }
            }
        } catch (t: Throwable) {
            Log.w("App", "OneSignal init skipped: ${t.message}")
        }
    }

    companion object {
        lateinit var instance: App
            private set
    }
}
