# Honest status

This is a **first-pass scaffold**, not a finished product. Breakdown of what's done vs stubbed vs missing:

## Backend — mostly complete ✅

| Area | State |
| --- | --- |
| Auth (JWT, refresh rotation, multi-device) | Done |
| RBAC with multiple roles per user | Done |
| Wallet + ledger (atomic, locked balance) | Done |
| Razorpay create-order + HMAC verify | Done (needs real test keys to run) |
| Manual UPI w/ UTR dedupe + approval | Done |
| Withdrawals (lock → approve → paid) | Done |
| Tournaments (create/join/leave/room/results) | Done |
| VIP (plans, stacking, expiry cron) | Done |
| Teams + team chat | Done |
| Chat (global/team/VIP/support/private, Socket.IO) | Done — polling used in Android MVP, sockets work server-side |
| Notifications (in-app) | Done |
| Notifications (push via FCM/OneSignal) | **Not done** — would require FCM setup since we're avoiding Firebase Auth, or a third-party push provider |
| Referrals (code + ₹100 deposit trigger + 10 🪙) | Done |
| Admin master panel endpoints | Done |
| Leaderboards (winnings/kills/referrers) | Done |
| Events/Campaigns | Minimal — create/list/toggle active |
| Maintenance mode, broadcast, audit log | Done (audit log writes are wired in a few places only) |
| Rate limiting, helmet, CORS | Done |
| Anti-fraud | **MVP** — duplicate-UTR block at DB, login throttle, basic input validation. Device-fingerprint / IP-reputation / velocity checks are not implemented. |
| Google / Discord OAuth login | **Not done** |

## Android — working skeleton, needs polish

| Screen | State |
| --- | --- |
| Login, Register | Wired to API |
| Dashboard | Wired, shows wallet + role tiles |
| Wallet, Deposit (Razorpay + UTR), Withdraw | Wired. Razorpay Checkout opens — the `PaymentResultListener` → `verifyRazorpay` callback is documented but **not yet wired**, so credit won't post automatically until you add an `Activity` that implements `PaymentResultListener` and calls `paymentRepo.verifyRazorpay(...)`. |
| Tournaments list + detail + join | Wired |
| Chat list + channel (polling, 3s) | Wired |
| Socket.IO realtime chat on Android | **Not wired** — the server supports it; the Android client uses polling |
| Profile, VIP, Teams, Referrals, Notifications, Leaderboard | Wired |
| Admin (stats, users, pending UTR, pending withdrawals, broadcast) | Wired |
| Theming (dark + neon) | Done |
| Gradle wrapper binaries | **Not committed** — run `gradle wrapper --gradle-version 8.9` locally once, or open in Android Studio which provides it |
| Push notification receiver | **Not wired** |

## Legal / production readiness — NOT READY
- No KYC/AML
- No GST handling on deposits (28% rule from Oct-2023)
- No responsible-gaming limits / self-exclusion
- Razorpay gaming-MCC onboarding + business entity is a prerequisite
- No penetration testing, no SOC2 / ISO 27001 controls

Do not ship to end users until a lawyer has reviewed this and the production hardening checklist (KYC provider, monitoring, backups, DR, incident response, T&Cs, privacy policy) is complete.
