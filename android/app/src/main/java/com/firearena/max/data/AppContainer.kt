package com.firearena.max.data

import android.content.Context
import com.firearena.max.R
import com.firearena.max.data.api.ApiFactory
import com.firearena.max.data.api.ApiService
import com.firearena.max.data.repo.AuthRepository
import com.firearena.max.data.repo.WalletRepository
import com.firearena.max.data.repo.TournamentRepository
import com.firearena.max.data.repo.ChatRepository
import com.firearena.max.data.repo.PaymentRepository
import com.firearena.max.data.repo.AdminRepository
import com.firearena.max.data.repo.VipRepository
import com.firearena.max.data.repo.TeamRepository
import com.firearena.max.data.repo.NotificationRepository
import com.firearena.max.data.repo.ReferralRepository
import com.firearena.max.data.repo.LeaderboardRepository
import com.firearena.max.data.repo.WithdrawalRepository

class AppContainer(context: Context) {
    val prefs = AuthPrefs(context)
    val baseUrl: String = context.getString(R.string.api_base_url)
    val razorpayKey: String = context.getString(R.string.razorpay_key_id)
    val api: ApiService = ApiFactory.create(baseUrl, prefs)

    val authRepo = AuthRepository(api, prefs)
    val walletRepo = WalletRepository(api)
    val tournamentRepo = TournamentRepository(api)
    val chatRepo = ChatRepository(api)
    val paymentRepo = PaymentRepository(api)
    val adminRepo = AdminRepository(api)
    val vipRepo = VipRepository(api)
    val teamRepo = TeamRepository(api)
    val notificationRepo = NotificationRepository(api)
    val referralRepo = ReferralRepository(api)
    val leaderboardRepo = LeaderboardRepository(api)
    val withdrawalRepo = WithdrawalRepository(api)
}
