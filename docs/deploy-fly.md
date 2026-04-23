# Deploying the backend to Fly.io

The backend lives in `backend/` and ships as a single container image.
`backend/Dockerfile` compiles TypeScript and runs `prisma migrate deploy`
before `node dist/server.js` starts.

## 0. Prerequisites

- A Fly.io account and the flyctl CLI:
  ```sh
  curl -L https://fly.io/install.sh | sh
  fly auth login       # or: fly auth signup
  ```
- A domain (optional) to put in front of the Fly machine.
- A Razorpay Live or Test key-id + key-secret.
- (Optional) OneSignal App ID + REST API key for push notifications.
- (Optional) Google / Discord OAuth client id & secret.

## 1. Create the app + Postgres (first time only)

```sh
cd backend
fly apps create fire-arena-max-api --org personal    # name is in fly.toml; change if taken
fly postgres create --name fire-arena-max-db \
  --region bom --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10
fly postgres attach --app fire-arena-max-api fire-arena-max-db
```

`fly postgres attach` writes the `DATABASE_URL` secret automatically.

## 2. Seed the rest of the secrets

Never commit these — they live only in Fly's secret store.

```sh
fly secrets set --app fire-arena-max-api \
  JWT_ACCESS_SECRET="$(openssl rand -hex 48)" \
  JWT_REFRESH_SECRET="$(openssl rand -hex 48)" \
  RAZORPAY_KEY_ID=rzp_test_SgUv92vbgNFr9z \
  RAZORPAY_KEY_SECRET=u41fKAkhMDts6svkCqFfs4dz \
  RAZORPAY_WEBHOOK_SECRET="$(openssl rand -hex 24)" \
  OWNER_USERNAME=Zenus_Carlos \
  ADMIN_EMAIL=raj998302@gmail.com

# Optional integrations — skip any you don't use yet.
fly secrets set --app fire-arena-max-api \
  ONESIGNAL_APP_ID=... \
  ONESIGNAL_REST_API_KEY=... \
  GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com \
  DISCORD_OAUTH_CLIENT_ID=... \
  DISCORD_OAUTH_CLIENT_SECRET=... \
  DISCORD_OAUTH_REDIRECT_URI=firearenamax://oauth/discord
```

## 3. Generate a Prisma migration locally (first time only)

We don't commit migrations yet. On your dev machine:

```sh
cd backend
cp .env.example .env   # fill in DATABASE_URL for a local Postgres
npx prisma migrate dev --name phase3_rewards_oauth_push
git add prisma/migrations
git commit -m "feat(backend): phase3 migration (rewards, oauth, push)"
git push
```

After this, future deploys run `prisma migrate deploy` automatically during
container startup.

## 4. Deploy

```sh
cd backend
fly deploy --app fire-arena-max-api
```

Health-check: `curl https://fire-arena-max-api.fly.dev/health` should
return `{"ok":true}` once the first machine is running.

## 5. Point the Android app at production

In `android/app/src/main/res/values/strings.xml` (or a local override):

```xml
<string name="api_base_url">https://fire-arena-max-api.fly.dev/</string>
```

## Notes & gotchas

- The container runs `prisma migrate deploy` before the server. If no
  committed migrations exist, this is a no-op, so make sure step 3 is done
  before the first real deploy.
- The seed script (`pnpm seed`) is not run automatically. To create the
  owner/admin accounts once after first deploy:
  ```sh
  fly ssh console --app fire-arena-max-api
  $ cd /app && npm run seed
  ```
- `min_machines_running = 1` keeps a warm instance so push/VIP cron runs.
  Set it to 0 for purely on-demand (cold starts).
- The OneSignal REST key lives **only** server-side. The Android app only
  needs the OneSignal App ID.
- For the Discord OAuth flow to complete on device, you must register
  `firearenamax://oauth/discord` as an authorized redirect URI in the
  Discord developer portal.
