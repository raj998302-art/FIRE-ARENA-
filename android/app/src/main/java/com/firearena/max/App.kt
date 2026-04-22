package com.firearena.max

import android.app.Application
import com.firearena.max.data.AppContainer

class App : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        container = AppContainer(this)
    }

    companion object {
        lateinit var instance: App
            private set
    }
}
