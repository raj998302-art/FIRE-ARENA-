package com.firearena.max.data

import android.content.Context
import android.content.SharedPreferences

class AuthPrefs(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("auth", Context.MODE_PRIVATE)

    var accessToken: String?
        get() = prefs.getString("access", null)
        set(v) { prefs.edit().putString("access", v).apply() }

    var refreshToken: String?
        get() = prefs.getString("refresh", null)
        set(v) { prefs.edit().putString("refresh", v).apply() }

    var userId: String?
        get() = prefs.getString("uid", null)
        set(v) { prefs.edit().putString("uid", v).apply() }

    var username: String?
        get() = prefs.getString("uname", null)
        set(v) { prefs.edit().putString("uname", v).apply() }

    var roles: Set<String>
        get() = prefs.getStringSet("roles", emptySet()) ?: emptySet()
        set(v) { prefs.edit().putStringSet("roles", v).apply() }

    fun isLoggedIn(): Boolean = !accessToken.isNullOrEmpty()

    fun wasShown(flag: String): Boolean = prefs.getBoolean("shown_$flag", false)
    fun markShown(flag: String) { prefs.edit().putBoolean("shown_$flag", true).apply() }

    fun clear() {
        // Keep "shown_*" flags across logouts so popups don't re-trigger on every login.
        val shown = prefs.all.filterKeys { it.startsWith("shown_") }
        val editor = prefs.edit().clear()
        shown.forEach { (k, v) -> if (v is Boolean) editor.putBoolean(k, v) }
        editor.apply()
    }
}
