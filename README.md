# 🦉 CronOwl

A modern cron job monitoring service ("Dead Man's Switch") built with Next.js, Firebase, and Vercel.

**Live Demo**: [cronowl.vercel.app](https://cronowl.vercel.app)

## What is CronOwl?

CronOwl monitors your scheduled tasks (cron jobs, backups, ETL pipelines, etc.) by expecting regular "pings". If a ping doesn't arrive on time, CronOwl alerts you via email and push notifications.

### How It Works

```
┌─────────────────┐     ping      ┌─────────────┐
│   Your Cron Job │ ───────────▶  │   CronOwl   │
│   (every 5 min) │               │   Server    │
└─────────────────┘               └──────┬──────┘
                                         │
                           ┌─────────────┼─────────────┐
                           │             │             │
                           ▼             ▼             ▼
                      ┌────────┐   ┌──────────┐  ┌───────────┐
                      │ ✅ UP  │   │ 🔴 DOWN  │  │ Dashboard │
                      │ (ping  │   │ (no ping │  │  (status  │
                      │ on time│   │ received)│  │   view)   │
                      └────────┘   └────┬─────┘  └───────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │  📧 Email Alert │
                              │  🔔 Push Notif  │
                              └─────────────────┘
```

## Features

### Core Monitoring
- ✅ **Dead Man's Switch** - Expects regular pings from your jobs
- ✅ **Flexible Schedules** - 1min, 5min, 1hour, 1day, 1week intervals
- ✅ **Grace Period** - Configurable buffer before alerting (1-60 min)
- ✅ **Real-time Status** - See all checks at a glance

### Alerting
- ✅ **Email Alerts** - Instant notification when jobs fail or recover
- ✅ **Push Notifications** - Browser and mobile push via FCM
- ✅ **Telegram Notifications** - Alerts via Telegram bot
- ✅ **Recovery Alerts** - Know when services come back online

### Execution Metrics
- ✅ **Duration Tracking** - See how long each job takes
- ✅ **Exit Codes** - Capture success/failure status
- ✅ **Output Logging** - Store stdout/stderr (up to 1KB)
- ✅ **Performance Graphs** - Visual execution time trends

### User Experience
- ✅ **PWA Support** - Install as mobile app
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Dark Mode** - Easy on the eyes
- ✅ **Auto-Refresh** - Live updates (5s to 5min intervals)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/pilgrim-12/cronowl.git
cd cronowl
npm install
```

### 2. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database**
3. Enable **Authentication** → Google Sign-In
4. Enable **Cloud Messaging** for push notifications
5. Generate a **Service Account Key** (Settings → Service Accounts)

### 3. Environment Variables

Create `.env.local`:

```env
# Firebase Client SDK (from Firebase Console → Project Settings → Your Apps)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase VAPID Key (Cloud Messaging → Web Push certificates)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BObgnPP0Ao8...

# Firebase Admin SDK (from Service Account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Resend (for email alerts - get key at resend.com)
RESEND_API_KEY=re_abc123...

# Telegram Bot (optional - for Telegram alerts)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_WEBHOOK_SECRET=your-random-webhook-secret
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotName

# Optional: Secret for cron endpoint
CRON_SECRET=your-random-secret
```

### 4. Telegram Bot Setup (Optional)

To enable Telegram notifications:

1. Create a bot with [@BotFather](https://t.me/BotFather):
   - Send `/newbot` and follow the prompts
   - Copy the bot token to `TELEGRAM_BOT_TOKEN`

2. Set up the webhook:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook&secret_token=<YOUR_WEBHOOK_SECRET>"
   ```

3. Link your account in the dashboard:
   - Click "Link Telegram" in the header
   - Copy the 6-character code
   - Send it to your bot in Telegram

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Ping API

Your ping URL looks like: `https://cronowl.vercel.app/api/ping/abc123xyz`

### Simple Ping

```bash
# Just confirm the job ran
curl https://cronowl.vercel.app/api/ping/YOUR_SLUG
```

### With Execution Metrics

```bash
# GET request with query params
curl "https://cronowl.vercel.app/api/ping/YOUR_SLUG?duration=1500&status=success"

# POST request with JSON (for longer output)
curl -X POST https://cronowl.vercel.app/api/ping/YOUR_SLUG \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 1500,
    "exit_code": 0,
    "status": "success",
    "output": "Backup completed: 150 files, 2.3GB"
  }'
```

### API Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `duration` | number | Execution time in milliseconds |
| `exit_code` | number | Exit code (0 = success, non-zero = failure) |
| `status` | string | "success" or "failure" |
| `output` | string | stdout/stderr (truncated to 1KB) |

### Bash Wrapper Script

Automatically track all your cron jobs:

```bash
#!/bin/bash
# /usr/local/bin/cronowl-wrap

PING_URL="$1"
shift

START=$(date +%s%N)
OUTPUT=$("$@" 2>&1)
EXIT_CODE=$?
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

STATUS="success"
[ $EXIT_CODE -ne 0 ] && STATUS="failure"

curl -s -X POST "$PING_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"duration\": $DURATION,
    \"exit_code\": $EXIT_CODE,
    \"status\": \"$STATUS\",
    \"output\": $(echo "$OUTPUT" | head -c 1000 | jq -Rs .)
  }" > /dev/null

exit $EXIT_CODE
```

Usage in crontab:
```cron
# Every 5 minutes - backup database
*/5 * * * * cronowl-wrap "https://cronowl.vercel.app/api/ping/abc123" /scripts/backup.sh

# Every hour - sync files
0 * * * * cronowl-wrap "https://cronowl.vercel.app/api/ping/def456" /scripts/sync.sh
```

## Dashboard

### Status Indicators
- 🟢 **UP** - Received ping within expected interval
- 🔴 **DOWN** - No ping received (missed deadline + grace period)
- ⚪ **NEW** - Waiting for first ping

### Check Card
Each check displays:
- Name and schedule (e.g., "Daily Backup - every day")
- Ping URL (click to copy)
- Last ping time and duration
- Status indicator

### History View
Click "History" on any check to see:
- **Execution Time Graph** - Bar chart of recent durations
- **Status History** - Timeline of UP/DOWN events with durations
- **Recent Pings** - Last 10 pings with metrics

### View Modes
- **List View** - Full details, better for few checks
- **Grid View** - Compact cards, better for many checks

## Firestore Structure

```
/users/{userId}
  - email: string
  - pushTokens: string[]  // FCM tokens for push notifications

/checks/{checkId}
  - userId: string
  - name: string
  - slug: string          // unique identifier for ping URL
  - schedule: string      // "every 5 minutes", "every day", etc.
  - gracePeriod: number   // minutes to wait before alerting
  - status: "up" | "down" | "new"
  - lastPing: timestamp
  - lastDuration: number  // ms
  - createdAt: timestamp

/checks/{checkId}/pings/{pingId}
  - timestamp: timestamp
  - ip: string
  - userAgent: string
  - duration?: number     // ms
  - exitCode?: number
  - output?: string
  - status?: "success" | "failure" | "unknown"

/checks/{checkId}/statusHistory/{eventId}
  - status: "up" | "down"
  - timestamp: timestamp
  - duration?: number     // seconds in previous status
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google) |
| Push | Firebase Cloud Messaging |
| Email | Resend |
| Hosting | Vercel |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ping/[slug]/route.ts   # Ping endpoint
│   │   ├── check-down/route.ts    # Cron to check for down jobs
│   │   └── test-push/route.ts     # Test push notifications
│   ├── dashboard/page.tsx         # Main dashboard
│   ├── login/page.tsx             # Login page
│   └── page.tsx                   # Landing page
├── components/
│   ├── InstallPrompt.tsx          # PWA install banner
│   └── PushToggle.tsx             # Push notification toggle
└── lib/
    ├── auth-context.tsx           # Auth state provider
    ├── checks.ts                  # Firestore CRUD for checks
    ├── constants.ts               # Schedule definitions
    ├── email.ts                   # Resend email functions
    ├── firebase.ts                # Firebase client SDK
    └── firebase-admin.ts          # Firebase Admin SDK
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy!

### Environment Variables on Vercel

Add these in Vercel dashboard → Settings → Environment Variables:
- All `NEXT_PUBLIC_*` variables
- All Firebase Admin SDK variables
- `RESEND_API_KEY`
- `CRON_SECRET`
- `TELEGRAM_BOT_TOKEN` (if using Telegram)
- `TELEGRAM_WEBHOOK_SECRET` (if using Telegram)

### Cron Job for Down Detection

Set up a Vercel Cron or external cron to call:
```
GET https://your-domain.com/api/check-down?secret=YOUR_CRON_SECRET
```

This checks all active jobs and sends alerts for any that are overdue.

## Roadmap

- [ ] Slow execution alerts (notify if job takes too long)
- [ ] Public status page
- [x] Telegram integration
- [ ] Slack integration
- [ ] Webhook notifications
- [ ] Multiple notification channels per check
- [ ] Team/organization support

## Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT © 2025

---

Built with ❤️ by [pilgrim-12](https://github.com/pilgrim-12)
