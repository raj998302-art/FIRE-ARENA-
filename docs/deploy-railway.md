# Deploy Fire Arena Max backend to Railway

Railway provisions the Docker app + a managed Postgres in one project, no
credit card needed to start. This guide assumes you already have the repo
pushed to GitHub (which you do — it's `raj998302-art/FIRE-ARENA-`).

Est. time: 10–15 minutes.

---

## 1. Create the Railway project

1. Go to <https://railway.app> → **Login with GitHub** (use the same account
   that owns this repo so the integration can see it).
2. Click **New Project** → **Deploy from GitHub repo** → authorize Railway
   → pick `raj998302-art/FIRE-ARENA-`.
3. When it asks "Which directory?" → set **Root Directory** to `backend`.
   Railway auto-detects the `backend/Dockerfile` and uses it.
4. It'll start a first build. **Cancel it for now** — we need to set env
   vars and add Postgres first, otherwise the container will crash-loop on
   missing `DATABASE_URL`.

## 2. Add Postgres

1. In the same project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Railway creates a `Postgres` service with its own `DATABASE_URL`. Open
   the service → **Variables** tab → copy the value of `DATABASE_URL`
   (it looks like `postgresql://postgres:...@containers-us-west-...:5432/railway`).

## 3. Set backend env vars

Open the **backend** service → **Variables** → **Raw Editor** → paste the
block below, filling in the secrets. All the ones marked `CHANGE ME` you
must replace with real values; the rest are safe defaults.

```env
# --- Core ---
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...                 # paste from the Postgres service
JWT_ACCESS_SECRET=CHANGE ME                   # openssl rand -hex 32
JWT_REFRESH_SECRET=CHANGE ME                  # openssl rand -hex 32
JWT_ACCESS_TTL_MIN=15
JWT_REFRESH_TTL_DAYS=14
CORS_ALLOWED_ORIGINS=*

# --- Razorpay (test keys you provided) ---
RAZORPAY_KEY_ID=rzp_test_SgUv92vbgNFr9z
RAZORPAY_KEY_SECRET=u41fKAkhMDts6svkCqFfs4dz

# --- OneSignal (push) ---
ONESIGNAL_APP_ID=CHANGE ME                    # from OneSignal dashboard
ONESIGNAL_REST_API_KEY=CHANGE ME

# --- Discord OAuth ---
DISCORD_OAUTH_CLIENT_ID=CHANGE ME
DISCORD_OAUTH_CLIENT_SECRET=CHANGE ME
DISCORD_OAUTH_REDIRECT_URI=firearenamax://oauth/discord

# --- Google OAuth (optional — leave blank to disable Google sign-in) ---
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=

# --- Seeds (do not change after first boot) ---
OWNER_USERNAME=Zenus_Carlos
OWNER_EMAIL=raj998302@gmail.com
OWNER_DEFAULT_PASSWORD=CHANGE ME              # min 10 chars; used once to seed

# --- Rewards tuning (fine to leave at defaults) ---
DAILY_SPIN_COOLDOWN_HOURS=24
STREAK_BONUS_EVERY_DAYS=7
STREAK_BONUS_COINS=20

# --- Manual UPI (optional) ---
MANUAL_UPI_ID=
MANUAL_UPI_QR_URL=
```

> **Generating JWT secrets:** on any terminal, `openssl rand -hex 32` — run
> it twice, one value for each secret. Do NOT reuse the same string.

## 4. Expose the backend publicly

Open the **backend** service → **Settings** → **Networking** → **Generate
Domain**. Railway gives you something like `fire-arena-max-api-production.up.railway.app`.
Copy this URL — you'll need it in the Android app.

## 5. Redeploy

Back on the **backend** service → **Deployments** → **Redeploy latest**.
The container boots with the Dockerfile CMD:

```
npx prisma migrate deploy && node dist/server.js
```

On first boot, `prisma migrate deploy` applies the committed migration at
`backend/prisma/migrations/20260423000000_init/migration.sql`, creating
every table. The seed (`OWNER_USERNAME`, `OWNER_EMAIL`, admin user, VIP
plans) runs at startup from `backend/src/seed.ts`.

## 6. Verify it's alive

```bash
curl https://<your-app>.up.railway.app/health
# {"ok":true,"time":"..."}
```

Log in via Postman / curl using the seeded admin account:

```bash
curl -X POST https://<your-app>.up.railway.app/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"identifier":"raj998302@gmail.com","password":"<OWNER_DEFAULT_PASSWORD>"}'
# → returns { accessToken, refreshToken, user }
```

## 7. Point Android at the Railway URL

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<string name="api_base_url">https://<your-app>.up.railway.app/</string>
```

Rebuild the APK in Android Studio. That's it — the app now talks to your
live backend.

## 8. Razorpay webhook (once you go live)

Razorpay dashboard → Settings → Webhooks → add:

```
URL:      https://<your-app>.up.railway.app/api/payments/razorpay/webhook
Secret:   (generate + paste into RAZORPAY_WEBHOOK_SECRET env var)
Events:   payment.captured, payment.failed, order.paid
```

> Test-mode webhooks are optional — the Android app already calls
> `/api/payments/razorpay/verify` directly after checkout, so wallet credit
> works without webhooks in test mode. Enable webhooks before going to
> production for the async reconciliation path.

---

## Troubleshooting

**Container keeps restarting with `prisma migrate deploy: no pending migrations`**
You're fine — that's just the info log. The app will stay up if the migrations were
already applied.

**`P1001: Can't reach database server`**
`DATABASE_URL` is wrong. Copy it from the Postgres service's Variables tab
(use the `${{Postgres.DATABASE_URL}}` reference if the raw editor allows
variable references — Railway will substitute on boot).

**Razorpay checkout opens but "Signature verification failed"**
`RAZORPAY_KEY_SECRET` doesn't match `RAZORPAY_KEY_ID`. Both must come from
the same Razorpay account / mode (test vs live).

**OneSignal push not delivering**
Check `ONESIGNAL_APP_ID` matches the app id in the Android
`strings.xml → onesignal_app_id`. The REST key is used server-side only.

---

## Alternative: Render

If Railway doesn't work for you, Render is similar:

1. <https://render.com> → **New +** → **Web Service** → connect the GitHub
   repo, **Root Directory** `backend`, **Runtime** Docker.
2. **New +** → **PostgreSQL** (free tier). Copy the **Internal Database URL**.
3. Web Service → **Environment** → paste the same env-var block as above,
   using Render's internal Postgres URL.
4. Render gives you a `*.onrender.com` URL. Use it in
   `android/app/src/main/res/values/strings.xml`.

The Dockerfile and migration both work identically on Render — the only
difference is the dashboard.
