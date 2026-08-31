# AtomList-3.0

Spring Boot 4.1 / Java 21 backend with passwordless (email code) authentication, JWT access tokens and cookie-based refresh tokens.


---

## Running locally

Locally every variable has a working default except the datasource and the JWT secret. The app starts with no mail provider configured and writes login codes to the console instead of sending them,
which is enough to sign in during development.

Minimum local environment:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/atomlist
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_SECRET=any-random-string-of-at-least-32-characters
```

---

## Deploying to Railway

### Step 1 - Set the service Root Directory to `backend`

### Step 2 - Create the database

### Step 3 - Set the environment variables

**Your service → Variables → Raw Editor**, then paste the block below and edit the placeholder values.

```
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=${{PORT}}

SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}

JWT_SECRET=<random string, 32+ characters>

RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=no-reply@yourdomain.com
MAIL_VERIFICATION_URL=https://your-frontend.pages.dev/verify-email?token={token}

CORS_ALLOWED_ORIGIN_PATTERNS=https://your-frontend.com
TRUSTED_PROXY_COUNT=1
REFRESH_COOKIE_SAME_SITE=Lax/None (See below)
```

`Postgres` in those `${{ }}` references is the **service name** of the database. If the service is named something else in your project, use that name instead.

---

## Environment variables

### Required — the app will not start without these

There is no default for any of these in `application.yaml`.

| Variable                     | Notes                                                                                                                                                                                                                 |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SPRING_DATASOURCE_URL`      | Must be the JDBC form: `jdbc:postgresql://host:port/database`. Railway's own `DATABASE_URL` is `postgresql://user:pass@host/db`, which the JDBC driver rejects. Build the URL from the parts instead, as shown above. |
| `SPRING_DATASOURCE_USERNAME` | Username to for DB connection                                                                                                                                                                                         |
| `SPRING_DATASOURCE_PASSWORD` | Password for the DB connection                                                                                                                                                                                        |
| `JWT_SECRET`                 | At least 32 characters. HS256 signing key. Generate with `openssl rand -base64 48`. Changing it invalidates every issued access token.                                                                                |

### Required in production — defaults exist but are wrong once deployed

| Variable                       | Production value                          | Why the default fails                                                                                                                                                                                               |
|--------------------------------|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SPRING_PROFILES_ACTIVE`       | `prod`                                    | Without it `application-prod.yaml` never loads, so Swagger UI stays publicly exposed and SQL statement logging stays on.                                                                                            |
| `RESEND_API_KEY`               | Your key from resend.com                  | Unset selects the log-only mailer, which **refuses to start** under the `prod` profile rather than silently dropping login codes.                                                                                   |
| `MAIL_FROM`                    | An address on a domain verified in Resend | Defaults to `no-reply@localhost`, which Resend rejects.                                                                                                                                                             |
| `MAIL_VERIFICATION_URL`        | Your frontend verification page           | Defaults to `http://localhost:5173/...`. Keep the literal `{token}` placeholder - it is substituted per message. This is a **frontend** URL; the page it opens is what posts the token to `/api/auth/email/verify`. |
| `CORS_ALLOWED_ORIGIN_PATTERNS` | Your frontend origin                      | Defaults to `http://localhost:5173`, so the deployed frontend is blocked.                                                                                                                                           |
| `TRUSTED_PROXY_COUNT`          | `1` or `2` — see below                    | Defaults to `0`, so the rate limiter sees Railway's edge IP for every request and buckets all users together: one user hitting the limit locks out everyone.                                                        |

**Choosing `TRUSTED_PROXY_COUNT`** - the number of reverse-proxy hops in front of the app, i.e. how many trailing `X-Forwarded-For` entries were written by infrastructure rather than by the caller.

| Setup                                                                                                | Value |
|------------------------------------------------------------------------------------------------------|-------|
| API served from `*.up.railway.app`, or a custom domain with Cloudflare proxying **off** (grey cloud) | `1`   |
| API custom domain proxied through Cloudflare (orange cloud)                                          | `2`   |

Setting it higher than the real hop count lets callers forge their own source address and bypass the limiter entirely. Setting it lower collapses everyone into a single bucket.

**`CORS_ALLOWED_ORIGIN_PATTERNS` format** - comma-separated. Because the API sends credentials, a wildcard covering a whole public suffix would let any site hosted there read authenticated responses,
so the app refuses to start on one.

A wildcard is accepted only when it stands in for labels **below a domain we own**, and it has to be anchored with a dot. `*.atomlist-3.pages.dev` can only ever match hosts of our own Pages project,
because the `atomlist-3` label is ours; `*atomlist-3.pages.dev` without the dot also matches `evilatomlist-3.pages.dev`, a project name anyone may still claim.

| Pattern                                       |                                                       |
|-----------------------------------------------|-------------------------------------------------------|
| `https://atomlist.pl`                         | valid                                                 |
| `https://atomlist.pl,https://www.atomlist.pl` | valid - multiple origins                              |
| `https://*.atomlist-3.pages.dev`              | valid - matches every Cloudflare preview deploy       |
| `https://*.atomlist.pl`                       | valid - subdomains of a domain we own                 |
| `https://*.pages.dev`                         | **rejected** - anyone can deploy there                |
| `https://*atomlist-3.pages.dev`               | **rejected** - unanchored, matches other projects too |
| `https://*.pl` / `*`                          | **rejected**                                          |

The bare `https://atomlist-3.pages.dev` is **not** matched by `https://*.atomlist-3.pages.dev` and has to be listed separately if you use it.

---

## Frontend

React 19 + Vite + TypeScript + Tailwind v4, deployed separately to Cloudflare Pages. Lives in `frontend/`.

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Configuration

One variable, `VITE_API_BASE_URL` — the origin of the backend, scheme and host only. It is **inlined into the bundle at build time**, so it must be present wherever the build runs; a production build
fails fast if it is missing rather than shipping a frontend that calls its own origin.

| Where               | Value                                                                                                    |
|---------------------|----------------------------------------------------------------------------------------------------------|
| local (default)     | `http://localhost:8080` — committed in `.env.development`                                                |
| local → Railway dev | put `VITE_API_BASE_URL=https://atomlist-30-dev.up.railway.app` in `.env.development.local` (git-ignored) |
| Pages — Production  | `https://api.atomlist.pl`                                                                                |
| Pages — Preview     | the dev Railway origin                                                                                   |

Set the Pages values under **Settings → Environment variables**, per environment, then redeploy — the variable is read at build time, so changing it without a new build changes nothing.

Production points at the custom domain rather than the Railway hostname on purpose; see step 4 of the Railway section. Preview deploys stay cross-site permanently, because `pages.dev` is a public
suffix and no configuration changes that.

### Cloudflare Pages project settings

| Setting        | Value           |
|----------------|-----------------|
| Root directory | `frontend`      |
| Build command  | `npm run build` |
| Build output   | `dist`          |

`public/_redirects` sends every path to `index.html`, which is what makes `/verify-email?token=…` and a reload on any route work rather than returning the platform's 404.

`public/_headers` adds the security headers (CSP, `X-Frame-Options`, `Referrer-Policy`).

### Matching backend variables

Whatever origin serves the frontend must appear in the backend's `CORS_ALLOWED_ORIGIN_PATTERNS`, and each backend needs a `MAIL_VERIFICATION_URL` pointing at a frontend that talks to *that same*
backend - a confirmation token posted to the wrong instance reads as invalid.

**Dev backend** (`api-dev.atomlist.pl`):

```
CORS_ALLOWED_ORIGIN_PATTERNS=https://atomlist-3.pages.dev,https://*.atomlist-3.pages.dev,http://localhost:5173,http://127.0.0.1:5173
MAIL_VERIFICATION_URL=https://dev.atomlist-3.pages.dev/verify-email?token={token}
REFRESH_COOKIE_SAME_SITE=None
TRUSTED_PROXY_COUNT=1
```

`REFRESH_COOKIE_SAME_SITE` is **not** optional here even though the table below lists a default: dev is cross-site and the default is `Lax`, which the browser will not send to a different site.
Leaving it unset breaks the session on dev in every browser.

**Production backend** (`api.atomlist.pl`):

```
CORS_ALLOWED_ORIGIN_PATTERNS=https://atomlist.pl,https://www.atomlist.pl
MAIL_VERIFICATION_URL=https://atomlist.pl/verify-email?token={token}
REFRESH_COOKIE_SAME_SITE=Lax
TRUSTED_PROXY_COUNT=1
```

### How the session works

The access token is held **in memory only** and the refresh token in an `HttpOnly` cookie the browser attaches by itself. On load the frontend spends the cookie for a fresh access token, so a reload
keeps the session without anything sensitive ever being written to `localStorage`.

Because the backend treats a refresh token presented twice as theft and revokes every session the account holds, refreshes are serialised with a Web Lock shared across tabs - two tabs waking at the
same moment would otherwise log the user out everywhere.

That reload-survives-because-of-the-cookie design is why production runs the API on `api.atomlist.pl`. A cookie set by a host on a different registrable domain is third-party. Login would appear to
work and the session would vanish on the next load. Sharing `atomlist.pl` makes the cookie first-party, which also allows `SameSite=Lax` instead of `None`.

`CookieAuthCsrfFilter` still guards `/api/auth/refresh` and `/api/auth/logout` by requiring an `X-Auth-Request` header - those two endpoints are the only ones authenticating from a cookie, so they are
the only ones carrying authority a forged cross-site request could ride on. `Lax` makes that filter redundant on production, but **not** on dev, which still runs `None`. It stays until no deployment
uses `None`.

### Platform

| Variable      | Value       | Notes                                                                                                                   |
|---------------|-------------|-------------------------------------------------------------------------------------------------------------------------|
| `SERVER_PORT` | `${{PORT}}` | Railway injects `PORT`; the app reads `SERVER_PORT`. This bridges them. If Railway shows no `PORT`, set both to `8080`. |

### Waking a serverless API for scheduled work

Spring `@Scheduled` methods do not wake an API scaled to zero. Create a Bun **Railway Function** from [`railway-functions/wake-up-api.ts`](scripts/railway-functions/wake-up-api.ts) and set `WAKE_URL`
variable. Example below:

```text
WAKE_URL=http://${{"AtomList-3.0 DEV".RAILWAY_PRIVATE_DOMAIN}}:${{"AtomList-3.0 DEV".SERVER_PORT}}/actuator/health
```

The public, side-effect-free health endpoint lets the Function retry for up to three minutes while the API cold-starts.

Railway evaluates crons in UTC and supports a minimum interval of five minutes. Maintenance tasks use UTC; SMS reminders use `APP_TIME_ZONE` (`Europe/Warsaw` by default).

| Cron (UTC)        | Description                                                                                                                                                        |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `*/5 2 * * *`     | Keeps the API awake for the 02:00–03:00 UTC daily-maintenance window. The full hour accounts for the API idling again after a successful pre-warm.                 |
| `55 10,11 15 * *` | Pre-warms the API for the monthly SMS reminder at 13:00 Warsaw time on the 15th. It runs at both CEST and CET pre-warm times, so one run is redundant each season. |

### Optional - defaults are production-appropriate

Leave these unset unless you specifically want different behaviour.

| Variable                             | Default                                                                                                                                                                                                                                 |
|--------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `APP_TIME_ZONE`                      | `Europe/Warsaw`                                                                                                                                                                                                                         |
| `JWT_ISSUER`                         | `atomlist-app`                                                                                                                                                                                                                          |
| `ACCESS_TOKEN_TTL`                   | `10m`                                                                                                                                                                                                                                   |
| `REFRESH_TOKEN_TTL`                  | `10d`                                                                                                                                                                                                                                   |
| `REFRESH_COOKIE_NAME`                | `__Secure-refreshToken`                                                                                                                                                                                                                 |
| `REFRESH_COOKIE_PATH`                | `/api/auth`                                                                                                                                                                                                                             |
| `REFRESH_COOKIE_SECURE`              | `true`                                                                                                                                                                                                                                  |
| `REFRESH_COOKIE_SAME_SITE`           | `Lax` - correct only where the API shares a registrable domain with the frontend, as `api.atomlist.pl` does with `atomlist.pl`. Any deployment where it does not **must** set `None`, or the browser drops the cookie on every request. |
| `REFRESH_COOKIE_DOMAIN`              | empty (host-only cookie) - the cookie belongs to the API hostname alone. Setting `.atomlist.pl` would hand it to every subdomain, the frontend included, which has no use for a cookie it cannot read.                                  |
| `LOGIN_CODE_LENGTH`                  | `16`                                                                                                                                                                                                                                    |
| `LOGIN_CODE_TTL`                     | `15m`                                                                                                                                                                                                                                   |
| `LOGIN_CODE_RESEND_COOLDOWN`         | `60s`                                                                                                                                                                                                                                   |
| `LOGIN_CODE_MAX_ATTEMPTS`            | `5`                                                                                                                                                                                                                                     |
| `LOGIN_LOCKOUT_MAX_ATTEMPTS`         | `10`                                                                                                                                                                                                                                    |
| `LOGIN_LOCKOUT_DURATION`             | `60m`                                                                                                                                                                                                                                   |
| `EMAIL_VERIFICATION_TTL`             | `1d`                                                                                                                                                                                                                                    |
| `EMAIL_VERIFICATION_RESEND_COOLDOWN` | `5m`                                                                                                                                                                                                                                    |
| `RATE_LIMIT_ENABLED`                 | `true`                                                                                                                                                                                                                                  |
| `RATE_LIMIT_CAPACITY`                | `10`                                                                                                                                                                                                                                    |
| `RATE_LIMIT_REFILL_PERIOD`           | `1m`                                                                                                                                                                                                                                    |
| `MAIL_FROM_NAME`                     | `AtomList`                                                                                                                                                                                                                              |
| `DB_POOL_SIZE`                       | `5` - managed Postgres plans cap total connections low, and the cap is shared with migrations, `psql` sessions, and the outgoing instance during a rolling deploy.                                                                      |
| `DB_POOL_MIN_IDLE`                   | `1`                                                                                                                                                                                                                                     |

### FOR NOW - CHANGE LATER

| Variable         | Why                                                                                                                              |
|------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `FLYWAY_ENABLED` | There are no migration files under `src/main/resources/db/`. Flyway stays disabled; Hibernate owns the schema.                   |
| `DDL_AUTO`       | Leave at `update`. Since Flyway is off, this is what creates the tables - `validate` against an empty database fails at startup. |

> `ddl-auto=update` is fine for getting to production, but Hibernate will never drop or alter a
> column safely. Once there is real user data, move the schema to Flyway migrations.

---
