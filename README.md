# Qaari

Native Quran recitation apps for the **Ministry of Information, Culture and National Guidance** (Republic of Somaliland). Listeners browse verified Somaliland qaaris, stream each of the 30 Juz, and — after creating an account — save favorites and keep a daily streak.

The product is four pieces that share one API:

| Piece | Stack | Who uses it |
| --- | --- | --- |
| `backend/` | Node.js, Express, Prisma, PostgreSQL | Shared API |
| `admin/` | React + Vite | Ministry staff only |
| `ios/` | SwiftUI + AVFoundation | Public (App Store) |
| `android/` | Kotlin, Jetpack Compose, Media3 | Public (Play Store) |

Audio is never bundled in the apps. It is uploaded in the admin panel, stored on disk (swap for S3/B2 in production), and streamed with local player caching.

## Suggested build order (done in this repo)

1. Data model + REST API
2. Admin panel (populate qaaris and Juz recordings)
3. iOS guest browse → login → favorites → streak
4. Android, same feature order

## Quick start (API + admin)

**Requirements:** Docker, Node.js 20+, npm.

```bash
docker compose up -d
cd backend
copy .env.example .env    # Windows; on macOS/Linux: cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

In another terminal:

```bash
cd admin
npm install
npm run dev
```

- API: http://localhost:4000/health
- Admin: http://localhost:5173

Default admin (change immediately):

- Email: `admin@moin.govsomaliland.org`
- Password: `ChangeMeNow!`

Upload at least one qaari photo and AAC/M4A/MP3 files for Juz 1–30. Compressed AAC is preferred for typical mobile data in Somaliland.

Mobile apps cannot log in with the admin account. Public registration always creates a `user` role. Admin endpoints require an admin JWT from `POST /auth/admin-login`.

## API

Public:

- `GET /qaaris`
- `GET /qaaris/:id` — profile + 30 Juz slots
- `GET /qaaris/:id/juz/:number` — recording + stream URL
- `GET /search?q=` — qaari name or Juz number `1–30`
- `POST /auth/register` — `{ name, email?, phone?, password }`
- `POST /auth/login` — `{ identifier, password }` (users only; updates streak)

Authenticated users:

- `POST /auth/app-open` — call on each launch to update streak
- `GET /auth/me`
- `GET /favorites`
- `POST /favorites` — `{ qaariId, juzNumber? }`
- `DELETE /favorites/:id`

Admin:

- `POST /auth/admin-login`
- `GET /admin/qaaris` · `POST /admin/qaaris` · `PUT /admin/qaaris/:id` · `DELETE /admin/qaaris/:id`
- `POST /admin/qaaris/:id/juz` — multipart `juzNumber` + `audio`
- `DELETE /admin/recordings/:id`
- `GET /admin/stats`

Streak (East Africa calendar date, UTC+3):

- Last open was yesterday → `streakCount += 1`
- A day was missed → reset to `1`
- Already opened today → no change

## iOS

```bash
cd ios
# brew install xcodegen
xcodegen generate
open Qaari.xcodeproj
```

Set your team in Xcode Signing. Simulator can reach `http://127.0.0.1:4000`. On a physical device, change `Config.apiBase` in `ios/Qaari/Theme.swift` to your computer’s LAN IP (and keep the API bound to `0.0.0.0` if needed).

Background playback is enabled (`audio` background mode + Now Playing controls).

## Android

Open the `android/` folder in Android Studio (Ladybug/Koala or newer) and let Gradle sync. The emulator uses `http://10.0.2.2:4000` (`BuildConfig.API_BASE_URL` in `app/build.gradle.kts`). For a physical device, point that URL at your machine’s LAN IP.

Playback uses Media3 ExoPlayer with a `MediaSessionService` so audio continues in the background.

## Production notes

- Replace `JWT_SECRET` and `ADMIN_PASSWORD`.
- Put PostgreSQL and object storage (S3, Backblaze B2, or Firebase Storage) behind `PUBLIC_BASE_URL`.
- Serve the admin panel only on an internal/VPN host; never ship admin routes in the mobile clients.
- UI copy is English. Branding uses Somaliland flag green / white / red.
- Offline Juz download is intentionally left as phase 2.

## License / ownership

Built for the Ministry of Information, Republic of Somaliland.
