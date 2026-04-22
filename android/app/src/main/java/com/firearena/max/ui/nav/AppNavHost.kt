package com.firearena.max.ui.nav

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.firearena.max.App
import com.firearena.max.ui.screens.admin.AdminScreen
import com.firearena.max.ui.screens.admin.AdminPendingPaymentsScreen
import com.firearena.max.ui.screens.admin.AdminPendingWithdrawalsScreen
import com.firearena.max.ui.screens.admin.AdminUsersScreen
import com.firearena.max.ui.screens.auth.LoginScreen
import com.firearena.max.ui.screens.auth.RegisterScreen
import com.firearena.max.ui.screens.chat.ChatChannelScreen
import com.firearena.max.ui.screens.chat.ChatListScreen
import com.firearena.max.ui.screens.dashboard.DashboardScreen
import com.firearena.max.ui.screens.leaderboard.LeaderboardScreen
import com.firearena.max.ui.screens.notifications.NotificationsScreen
import com.firearena.max.ui.screens.profile.ProfileScreen
import com.firearena.max.ui.screens.referrals.ReferralsScreen
import com.firearena.max.ui.screens.teams.TeamsScreen
import com.firearena.max.ui.screens.tournaments.TournamentDetailScreen
import com.firearena.max.ui.screens.tournaments.TournamentsScreen
import com.firearena.max.ui.screens.vip.VipScreen
import com.firearena.max.ui.screens.wallet.WalletScreen
import com.firearena.max.ui.screens.wallet.DepositScreen
import com.firearena.max.ui.screens.wallet.WithdrawScreen

object Routes {
    const val Login = "login"
    const val Register = "register"
    const val Dashboard = "dashboard"
    const val Wallet = "wallet"
    const val Deposit = "deposit"
    const val Withdraw = "withdraw"
    const val Tournaments = "tournaments"
    const val TournamentDetail = "tournaments/{id}"
    const val ChatList = "chat"
    const val ChatChannel = "chat/{id}"
    const val Profile = "profile"
    const val Vip = "vip"
    const val Teams = "teams"
    const val Referrals = "referrals"
    const val Notifications = "notifications"
    const val Leaderboard = "leaderboard"
    const val Admin = "admin"
    const val AdminUsers = "admin/users"
    const val AdminPendingPayments = "admin/payments"
    const val AdminPendingWithdrawals = "admin/withdrawals"
}

@Composable
fun AppNavHost() {
    val nav = rememberNavController()
    val prefs = App.instance.container.prefs
    val start = if (prefs.isLoggedIn()) Routes.Dashboard else Routes.Login

    NavHost(navController = nav, startDestination = start) {
        composable(Routes.Login)       { LoginScreen(nav) }
        composable(Routes.Register)    { RegisterScreen(nav) }
        composable(Routes.Dashboard)   { DashboardScreen(nav) }
        composable(Routes.Wallet)      { WalletScreen(nav) }
        composable(Routes.Deposit)     { DepositScreen(nav) }
        composable(Routes.Withdraw)    { WithdrawScreen(nav) }
        composable(Routes.Tournaments) { TournamentsScreen(nav) }
        composable(Routes.TournamentDetail) { backStack ->
            val id = backStack.arguments?.getString("id") ?: return@composable
            TournamentDetailScreen(nav, id)
        }
        composable(Routes.ChatList)    { ChatListScreen(nav) }
        composable(Routes.ChatChannel) { backStack ->
            val id = backStack.arguments?.getString("id") ?: return@composable
            ChatChannelScreen(nav, id)
        }
        composable(Routes.Profile)     { ProfileScreen(nav) }
        composable(Routes.Vip)         { VipScreen(nav) }
        composable(Routes.Teams)       { TeamsScreen(nav) }
        composable(Routes.Referrals)   { ReferralsScreen(nav) }
        composable(Routes.Notifications) { NotificationsScreen(nav) }
        composable(Routes.Leaderboard) { LeaderboardScreen(nav) }
        composable(Routes.Admin)       { AdminScreen(nav) }
        composable(Routes.AdminUsers)  { AdminUsersScreen(nav) }
        composable(Routes.AdminPendingPayments) { AdminPendingPaymentsScreen(nav) }
        composable(Routes.AdminPendingWithdrawals) { AdminPendingWithdrawalsScreen(nav) }
    }
}
