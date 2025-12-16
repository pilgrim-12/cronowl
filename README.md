# 🦉 CronOwl

A modern cron job monitoring service built with Next.js, Firebase, and Vercel.

## Features

- ✅ **Dead Man's Switch** - Monitor your cron jobs by expecting regular pings
- ✅ **Email Alerts** - Get notified when jobs go down or recover
- ✅ **Push Notifications** - Browser and mobile push notifications
- ✅ **PWA Support** - Install as a mobile app
- ✅ **Execution Metrics** - Track duration, exit codes, and output
- ✅ **Status History** - Visual timeline of up/down events
- ✅ **Execution Graphs** - See performance trends over time

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/cronowl.git
cd cronowl
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin SDK (for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Resend (email service)
RESEND_API_KEY=re_your_api_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Ping API

### Basic Ping

Send a simple ping when your cron job runs:

```bash
# Simple ping
curl https://your-domain.com/api/ping/YOUR_SLUG

# Using wget
wget -q -O /dev/null https://your-domain.com/api/ping/YOUR_SLUG
```

### With Execution Metrics (GET)

Track execution time, exit codes, and output:

```bash
# With duration (in milliseconds)
curl "https://your-domain.com/api/ping/YOUR_SLUG?duration=1500"

# With exit code (0 = success, non-zero = failure)
curl "https://your-domain.com/api/ping/YOUR_SLUG?exit_code=0"

# With status
curl "https://your-domain.com/api/ping/YOUR_SLUG?status=success"

# With output (truncated to 1KB)
curl "https://your-domain.com/api/ping/YOUR_SLUG?output=Backup%20completed"

# All parameters combined
curl "https://your-domain.com/api/ping/YOUR_SLUG?duration=1500&exit_code=0&status=success&output=Done"
```

### With Execution Metrics (POST)

For longer output, use POST with JSON body:

```bash
curl -X POST https://your-domain.com/api/ping/YOUR_SLUG \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 1500,
    "exit_code": 0,
    "status": "success",
    "output": "Backup completed successfully\nFiles: 150\nSize: 2.3GB"
  }'
```

### Bash Wrapper Script

Create a wrapper script to track your cron jobs automatically:

```bash
#!/bin/bash
# cronowl-wrapper.sh

PING_URL="https://your-domain.com/api/ping/YOUR_SLUG"

# Record start time
START=$(date +%s%N)

# Run the actual command and capture output
OUTPUT=$("$@" 2>&1)
EXIT_CODE=$?

# Calculate duration in milliseconds
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))

# Determine status
if [ $EXIT_CODE -eq 0 ]; then
  STATUS="success"
else
  STATUS="failure"
fi

# Send ping with metrics
curl -s -X POST "$PING_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"duration\": $DURATION,
    \"exit_code\": $EXIT_CODE,
    \"status\": \"$STATUS\",
    \"output\": $(echo "$OUTPUT" | head -c 1000 | jq -Rs .)
  }" > /dev/null

# Exit with original exit code
exit $EXIT_CODE
```

Usage:
```bash
# In your crontab
*/5 * * * * /path/to/cronowl-wrapper.sh /path/to/your-script.sh
```

## API Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `duration` | number | Execution time in milliseconds |
| `exit_code` / `exitCode` | number | Exit code (0 = success) |
| `status` | string | "success" or "failure" |
| `output` | string | stdout/stderr (max 1KB) |

## Dashboard Features

### Status Indicators
- 🟢 **UP** - Job is running as expected
- 🔴 **DOWN** - Job hasn't pinged within expected interval + grace period
- ⚪ **NEW** - Waiting for first ping

### History View
Click "History" on any check to see:
- **Execution Time Graph** - Bar chart showing duration trends
- **Status History** - Timeline of up/down events with durations
- **Recent Pings** - Last 10 pings with timestamps and metrics

### View Modes
- **List View** - Detailed view with inline metrics
- **Grid View** - Compact cards for many checks

### Auto-Refresh
Configurable refresh interval: 5s, 10s, 15s, 30s, 1m, 2m, 5m

## Notifications

### Email Alerts
Automatically sent when:
- A check goes **DOWN** (missed expected ping)
- A check **RECOVERS** (starts pinging again)

### Push Notifications
1. Click the bell icon 🔔 in the header to enable
2. Allow browser notifications when prompted
3. Receive alerts on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google Sign-In)
- **Email**: Resend
- **Push**: Firebase Cloud Messaging
- **Hosting**: Vercel

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ping/[slug]/    # Ping endpoint
│   │   └── test-push/      # Test push notifications
│   ├── dashboard/          # Main dashboard
│   ├── login/              # Login page
│   └── page.tsx            # Landing page
├── components/
│   ├── InstallPrompt.tsx   # PWA install prompt
│   └── PushToggle.tsx      # Push notification toggle
└── lib/
    ├── auth-context.tsx    # Auth state management
    ├── checks.ts           # Check CRUD operations
    ├── constants.ts        # Schedule definitions
    ├── email.ts            # Email sending
    ├── firebase.ts         # Firebase client config
    └── firebase-admin.ts   # Firebase admin for push
```

## Deploy on Vercel

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

## License

MIT
