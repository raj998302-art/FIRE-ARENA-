# Architecture

## Overview

```
Android (Kotlin/Compose) ──HTTPS──▶ Node.js backend ──▶ PostgreSQL
                         └─WebSocket──▶ Socket.IO (real-time chat + presence)
                         └─Checkout──▶ Razorpay
                                         │
                                         └─ Webhooks (future) ──▶ backend
```

## Backend

- **Runtime**: Node 20 + Express 4 + TypeScript (strict).
- **DB**: PostgreSQL via Prisma. All monetary amounts are stored as integer **coins** (1 coin = ₹1). The `WalletTransaction` table is an append-only ledger. Wallet mutations are always wrapped in `prisma.$transaction` and derived from a single `postTransaction` helper so balances cannot diverge from the ledger.
- **Auth**: JWT access tokens + DB-backed rotating refresh tokens (Session table). `requireAuth` / `requireRoles` middleware enforce RBAC. A user can hold multiple roles; VIP role expires via `UserRole.expiresAt` and is reconciled by a cron job every 5 minutes.
- **Payments**:
  - Razorpay: server-side order creation (`/api/payments/razorpay/order`) and HMAC-SHA256 signature verification (`/api/payments/razorpay/verify`). Client opens Razorpay Checkout with `key_id`+`order_id` returned by the server.
  - Manual UPI: user pays externally, then POSTs UTR. The schema enforces `@@unique([provider, utr])` so duplicate UTR submissions are impossible at the DB level. Admins approve/reject via `/api/payments/admin/:id/{approve,reject}`.
- **Withdrawals**: request → `LOCK` coins → admin approves (`UNLOCK` then `WITHDRAW`) → admin marks PAID with payout reference.
- **Tournaments**: slot counter updates atomically; entry fee deducted in the same transaction as the entry insert; leaving before lock issues a refund.
- **Referrals**: `ReferralReward.refereeId` is `@@unique` so each referee can only grant one reward. Trigger fires after every successful deposit once `wallet.totalDeposited >= REFERRAL_MIN_DEPOSIT_INR` (default ₹100) and credits `REFERRAL_REWARD_COINS` (default 10) to the referrer.
- **Chat**: Socket.IO at `/socket.io`. Global / VIP / Support / Team / Private channels. Access checks per channel type; mod mute support. Messages persist in `ChatMessage`; reads tracked in `MessageRead`.
- **Admin**: /api/admin/* routes protected by `requireAdmin`. Owner-only routes use `requireOwner` (e.g. maintenance mode).

## Android

- **Stack**: Kotlin + Jetpack Compose, Material 3 dark theme with neon accents.
- **Data layer**: Retrofit + OkHttp + kotlinx.serialization. A single `AppContainer` (in `App.onCreate`) wires the `ApiService` and repositories — no DI framework to keep the surface small.
- **Auth state**: `AuthPrefs` (SharedPreferences) holds access/refresh tokens and role cache; an OkHttp interceptor injects `Authorization: Bearer`.
- **Nav**: `androidx.navigation.compose` with a central `AppNavHost`. Start destination depends on login state.

## Deploy

- **Backend → Fly.io**: `backend/Dockerfile` + `backend/fly.toml`. Launch once, attach a Fly Postgres, set secrets, deploy. The container runs `prisma migrate deploy` at boot.
- **Android**: open `android/` in Android Studio; set `api_base_url` and `razorpay_key_id` in `app/src/main/res/values/config.xml` before building.
