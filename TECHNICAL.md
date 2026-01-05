# Technical Documentation - CronOwl

This document is for developers/maintainers and describes all external services, APIs, and technologies used in CronOwl.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [External Services](#external-services)
   - [Firebase](#1-firebase)
   - [Resend](#2-resend-email)
   - [Telegram Bot API](#3-telegram-bot-api)
   - [Paddle](#4-paddle-payments)
   - [cron-job.org](#5-cron-joborg)
   - [Slack/Discord Webhooks](#6-slackdiscord-webhooks)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Rate Limiting](#rate-limiting)
7. [Background Jobs](#background-jobs)
8. [Security Considerations](#security-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CronOwl Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│   │   Next.js    │     │   Vercel     │     │    Firebase      │   │
│   │   Frontend   │────▶│   Hosting    │────▶│    Firestore     │   │
│   │   (React)    │     │   + Edge     │     │    (Database)    │   │
│   └──────────────┘     └──────────────┘     └──────────────────┘   │
│          │                    │                      │              │
│          │                    │                      │              │
│          ▼                    ▼                      ▼              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│   │   Firebase   │     │  API Routes  │     │  Firebase Admin  │   │
│   │     Auth     │     │  (Next.js)   │     │      SDK         │   │
│   └──────────────┘     └──────────────┘     └──────────────────┘   │
│                               │                                      │
│          ┌────────────────────┼────────────────────┐                │
│          ▼                    ▼                    ▼                │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│   │    Resend    │     │   Telegram   │     │     Paddle       │   │
│   │   (Email)    │     │   Bot API    │     │   (Payments)     │   │
│   └──────────────┘     └──────────────┘     └──────────────────┘   │
│          │                    │                    │                │
│          └────────────────────┼────────────────────┘                │
│                               ▼                                      │
│                    ┌──────────────────┐                             │
│                    │  Push/Webhooks   │                             │
│                    │  (FCM, Slack,    │                             │
│                    │   Discord, etc)  │                             │
│                    └──────────────────┘                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## External Services

### 1. Firebase

**Website**: https://firebase.google.com
**Console**: https://console.firebase.google.com
**Purpose**: Authentication, Database, Push Notifications

#### 1.1 Firebase Authentication

Used for user login via Google OAuth.

**Setup**:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Add authorized domains (localhost, your-domain.com)

**Client SDK** (used in frontend):
```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
```

**Environment Variables**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
```

#### 1.2 Firestore Database

NoSQL document database for all data storage.

**Collections**:
- `users` - User profiles and settings
- `checks` - Monitoring checks (with `pings` and `statusHistory` subcollections)
- `statusPages` - Public status pages
- `incidents` - Incidents with updates
- `rateLimits` - Rate limiting counters
- `apiKeys` - User API keys (subcollection of users)

**Required Indexes** (create in Firebase Console → Firestore → Indexes):
```
Collection: incidents
Fields: statusPageId (Asc), status (Asc), createdAt (Desc)

Collection: incidents
Fields: statusPageId (Asc), createdAt (Desc)

Collection: checks
Fields: userId (Asc), createdAt (Desc)

Collection: statusPages
Fields: userId (Asc), createdAt (Desc)
```

**Admin SDK** (used in API routes):
```typescript
import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore();
await db.collection('checks').doc(id).get();
```

**Environment Variables**:
```env
FIREBASE_PROJECT_ID=project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### 1.3 Firebase Cloud Messaging (FCM)

Push notifications to browsers and mobile devices.

**Setup**:
1. Firebase Console → Project Settings → Cloud Messaging
2. Generate Web Push certificate (VAPID key)
3. Service Worker registers for push events

**Sending push** (from API):
```typescript
import { getMessaging } from 'firebase-admin/messaging';

await getMessaging().send({
  token: userPushToken,
  notification: {
    title: '🔴 Check DOWN',
    body: 'Database Backup is not responding'
  }
});
```

**Environment Variables**:
```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BObgnPP0Ao8...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
```

---

### 2. Resend (Email)

**Website**: https://resend.com
**Dashboard**: https://resend.com/emails
**API Docs**: https://resend.com/docs
**Purpose**: Transactional email delivery

#### Setup

1. Create account at resend.com
2. Verify your domain (add DNS records)
3. Create API key with "Sending access"

#### Usage in CronOwl

**File**: `src/lib/email.ts`

```typescript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'CronOwl <noreply@cronowl.com>',
    to: userEmail,
    subject: '🚨 Alert: Database Backup is DOWN',
    html: emailHtmlContent
  }),
});
```

#### Email Types

| Event | Subject | Description |
|-------|---------|-------------|
| Check DOWN | `🚨 Alert: {name} is DOWN` | Sent when check misses expected ping |
| Recovery | `✅ Recovered: {name} is back UP` | Sent when check recovers |
| Slow Job | `⏱️ Slow Job: {name} took {duration}s` | Sent when duration > maxDuration |
| Payment Failed | `⚠️ Payment Failed - Action Required` | Sent on subscription payment failure |

#### Environment Variables

```env
RESEND_API_KEY=re_abc123...
```

#### Pricing (as of 2025)

- Free: 3,000 emails/month
- Pro: $20/month for 50,000 emails

---

### 3. Telegram Bot API

**Website**: https://core.telegram.org/bots
**BotFather**: https://t.me/BotFather
**Purpose**: Instant messaging alerts

#### Setup

1. **Create Bot**:
   - Open @BotFather in Telegram
   - Send `/newbot`
   - Follow prompts to name your bot
   - Copy the bot token

2. **Set Webhook** (required for receiving messages):
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://cronowl.com/api/telegram/webhook&secret_token=<SECRET>"
   ```

3. **Verify webhook**:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

#### Usage in CronOwl

**Sending messages** (`src/lib/telegram.ts`):
```typescript
await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: userTelegramChatId,
    text: '🔴 *Database Backup* is DOWN',
    parse_mode: 'Markdown'
  }),
});
```

**Receiving commands** (`src/app/api/telegram/webhook/route.ts`):
- Receives POST from Telegram when user sends message to bot
- Handles `/link CODE` command to link user account
- Validates webhook signature via `X-Telegram-Bot-Api-Secret-Token` header

#### User Linking Flow

1. User clicks "Link Telegram" in CronOwl dashboard
2. CronOwl generates 6-character code (valid 10 minutes)
3. User opens bot in Telegram, sends `/link CODE123`
4. Bot webhook receives message, validates code
5. CronOwl saves `telegramChatId` to user document
6. Future alerts sent to that chat ID

#### Environment Variables

```env
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
TELEGRAM_WEBHOOK_SECRET=random-secret-string-here
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername
```

#### Commands Supported

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/link CODE` | Link Telegram to CronOwl account |
| `/status` | Show linked account status |
| `/help` | Show available commands |

---

### 4. Paddle (Payments)

**Website**: https://paddle.com
**Sandbox**: https://sandbox-vendors.paddle.com
**Production**: https://vendors.paddle.com
**API Docs**: https://developer.paddle.com
**Purpose**: Subscription billing and payments

#### Why Paddle?

- Handles global tax compliance (VAT, Sales Tax)
- Merchant of Record (they handle all payment liability)
- Supports credit cards, PayPal, Apple Pay
- No need for separate payment gateway

#### Setup

1. **Create Paddle account** (sandbox for testing, production for live)
2. **Create Products** → Create pricing:
   - Starter Plan: $4/month (or your price)
   - Pro Plan: $9/month (or your price)
3. **Get credentials**:
   - Client-side token (for Paddle.js)
   - API Key (for server-side calls)
   - Webhook secret (for event verification)

#### Usage in CronOwl

**Client-side checkout** (`src/components/PaddleCheckout.tsx`):
```typescript
import { initializePaddle } from '@paddle/paddle-js';

const paddle = await initializePaddle({
  environment: 'sandbox', // or 'production'
  token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
});

paddle.Checkout.open({
  items: [{ priceId: 'pri_xxx', quantity: 1 }],
  customer: { email: user.email },
  customData: { userId: user.uid },
});
```

**Webhook handler** (`src/app/api/paddle/webhook/route.ts`):
```typescript
// Verify signature
const signature = req.headers.get('paddle-signature');
const isValid = verifyPaddleSignature(body, signature, PADDLE_WEBHOOK_SECRET);

// Handle events
switch (event.event_type) {
  case 'subscription.created':
  case 'subscription.activated':
    // Upgrade user plan
    break;
  case 'subscription.canceled':
    // Downgrade to free
    break;
  case 'subscription.past_due':
    // Send payment failed email
    break;
}
```

#### Paddle Events

| Event | Action |
|-------|--------|
| `subscription.created` | Create subscription record |
| `subscription.activated` | Activate plan |
| `subscription.updated` | Update plan details |
| `subscription.canceled` | Schedule downgrade at period end |
| `subscription.past_due` | Send payment failure notification |
| `transaction.completed` | Log successful payment |

#### Environment Variables

```env
# Client-side (exposed to browser)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_abc123...
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # 'sandbox' or 'production'
NEXT_PUBLIC_PADDLE_PRICE_STARTER=pri_01kcrqndhavchav36qazd8gnsk
NEXT_PUBLIC_PADDLE_PRICE_PRO=pri_01kcrqgxrvnt77bwb99t209py1

# Server-side (secret)
PADDLE_API_KEY=pdl_sbox_apikey_xxx...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx...
```

#### Pricing in Paddle

| Plan | Monthly | Annual (20% off) |
|------|---------|-----------------|
| Starter | $4 | $38.40 |
| Pro | $9 | $86.40 |

---

### 5. cron-job.org

**Website**: https://cron-job.org
**Dashboard**: https://console.cron-job.org
**Purpose**: External cron scheduler to trigger CronOwl's status check

#### Why External Cron?

CronOwl needs to check all checks every minute for overdue pings. Options:
1. **Vercel Cron** - Limited to 1 execution/minute on hobby plan, may have cold starts
2. **cron-job.org** - Free, reliable, executes every minute precisely
3. **Self-hosted cron** - Requires server maintenance

#### Setup

1. Create free account at cron-job.org
2. Create new cronjob:
   - **URL**: `https://cronowl.com/api/cron/check-status?secret=YOUR_SECRET`
   - **Schedule**: Every 1 minute (`* * * * *`)
   - **Method**: GET
   - **Timeout**: 30 seconds

3. (Optional) Create cleanup job:
   - **URL**: `https://cronowl.com/api/cron/cleanup-history?secret=YOUR_SECRET`
   - **Schedule**: Once per day (`0 3 * * *`)
   - **Method**: GET

#### CronOwl Endpoints Called

| Endpoint | Purpose | Schedule |
|----------|---------|----------|
| `/api/cron/check-status` | Check all checks for overdue pings, send alerts | Every minute |
| `/api/cron/cleanup-history` | Delete old ping history based on plan limits | Daily |

#### Alternative: Vercel Cron

If using Vercel Pro/Enterprise, add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-status?secret=YOUR_SECRET",
      "schedule": "* * * * *"
    }
  ]
}
```

#### Environment Variables

```env
CRON_SECRET=your-random-secret-here
```

---

### 6. Slack/Discord Webhooks

**Purpose**: Send alerts to team chat channels

#### Slack Setup

1. Go to https://api.slack.com/apps
2. Create new app → "From scratch"
3. Features → Incoming Webhooks → Activate
4. Add new webhook to workspace
5. Copy webhook URL: `https://hooks.slack.com/services/T.../B.../xxx`

**Slack message format** (used by CronOwl):
```typescript
{
  attachments: [{
    color: '#dc2626', // red for DOWN, green for recovery
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🔴 Database Backup is DOWN*\nMissed expected ping'
        }
      }
    ]
  }]
}
```

#### Discord Setup

1. Server Settings → Integrations → Webhooks
2. Create new webhook
3. Copy URL: `https://discord.com/api/webhooks/123.../xxx`

**Discord message format**:
```typescript
{
  embeds: [{
    title: '🔴 Database Backup is DOWN',
    description: 'Missed expected ping',
    color: 0xdc2626, // decimal color
    timestamp: new Date().toISOString()
  }]
}
```

#### Usage in CronOwl

Webhooks are per-check. Users add webhook URL when creating/editing a check.

**File**: `src/lib/notifications.ts`

```typescript
// Auto-detect platform and format accordingly
if (webhookUrl.includes('hooks.slack.com')) {
  // Slack format
} else if (webhookUrl.includes('discord.com/api/webhooks')) {
  // Discord format
} else {
  // Generic JSON
}
```

#### Security

CronOwl validates webhook URLs:
- Must be HTTPS
- Cannot be localhost or private IPs (10.x, 192.168.x, 127.x)
- 10 second timeout
- Max 2 retries with exponential backoff

---

## Environment Variables

### Complete List

```env
# ============================================
# Firebase Client SDK (public, exposed to browser)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BObgnPP0...

# ============================================
# Firebase Admin SDK (server-side, secret)
# ============================================
FIREBASE_PROJECT_ID=project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ============================================
# Resend (Email)
# ============================================
RESEND_API_KEY=re_abc123...

# ============================================
# Telegram Bot
# ============================================
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_WEBHOOK_SECRET=random-secret
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=CronOwlBot

# ============================================
# Paddle Billing
# ============================================
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx...
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_PRICE_STARTER=pri_xxx...
NEXT_PUBLIC_PADDLE_PRICE_PRO=pri_xxx...
PADDLE_API_KEY=pdl_sbox_apikey_xxx...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxx...

# ============================================
# Cron Jobs
# ============================================
CRON_SECRET=your-cron-secret

# ============================================
# Optional
# ============================================
NEXT_PUBLIC_APP_URL=https://cronowl.com
```

---

## Database Schema

### users/{userId}

```typescript
interface User {
  email: string;
  plan: 'free' | 'starter' | 'pro';
  subscription?: {
    status: 'active' | 'canceled' | 'past_due';
    plan: string;
    paddleSubscriptionId: string;
    paddleCustomerId: string;
    currentPeriodEnd: Timestamp;
    cancelAtPeriodEnd: boolean;
  };
  pushTokens: string[];           // FCM tokens
  telegramChatId?: string;        // Telegram chat ID
  telegramLinkCode?: string;      // Temporary linking code
  telegramLinkCodeExpiry?: Timestamp;
  pushNotifications: boolean;     // Enable/disable push
  emailNotifications: boolean;    // Enable/disable email
  telegramNotifications: boolean; // Enable/disable telegram
  createdAt: Timestamp;
}
```

### checks/{checkId}

```typescript
interface Check {
  userId: string;
  name: string;
  slug: string;                   // Unique, for ping URL
  schedule: string;               // "every 5 minutes", "every day"
  scheduleType: 'preset' | 'cron';
  cronExpression?: string;        // "*/5 * * * *"
  timezone: string;               // "UTC", "America/New_York"
  gracePeriod: number;            // Minutes (1-60)
  status: 'up' | 'down' | 'new';
  lastPing?: Timestamp;
  lastDuration?: number;          // Milliseconds
  webhookUrl?: string;
  maxDuration?: number;           // For slow job detection
  tags: string[];
  paused: boolean;
  createdAt: Timestamp;
}

// Subcollection: checks/{checkId}/pings/{pingId}
interface Ping {
  timestamp: Timestamp;
  ip: string;
  userAgent: string;
  duration?: number;
  exitCode?: number;
  output?: string;
  status: 'success' | 'failure' | 'start' | 'unknown';
}

// Subcollection: checks/{checkId}/statusHistory/{eventId}
interface StatusEvent {
  status: 'up' | 'down';
  timestamp: Timestamp;
  duration?: number;              // Seconds in previous state
}
```

### statusPages/{pageId}

```typescript
interface StatusPage {
  userId: string;
  slug: string;                   // Public URL slug
  title: string;
  description?: string;
  checkIds: string[];             // Checks to display
  isPublic: boolean;
  showTags: boolean;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;        // Pro only
    hidePoweredBy?: boolean;      // Pro only
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### incidents/{incidentId}

```typescript
interface Incident {
  statusPageId: string;
  userId: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  affectedCheckIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

// Subcollection: incidents/{incidentId}/updates/{updateId}
interface IncidentUpdate {
  message: string;
  status: string;
  createdAt: Timestamp;
}
```

---

## API Endpoints

### Public Endpoints (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/ping/{slug}` | Receive ping from user's job |
| GET | `/api/status/{slug}` | Get public status page data |
| GET | `/api/status/{slug}/badge` | SVG status badge |
| GET | `/api/health` | Health check |

### Protected Endpoints (Require Auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/checks` | List user's checks |
| POST | `/api/v1/checks` | Create new check |
| GET | `/api/v1/checks/{id}` | Get check details |
| PUT | `/api/v1/checks/{id}` | Update check |
| DELETE | `/api/v1/checks/{id}` | Delete check |
| POST | `/api/v1/checks/{id}/pause` | Pause check |
| POST | `/api/v1/checks/{id}/resume` | Resume check |
| GET | `/api/v1/checks/{id}/pings` | Get ping history |

### Webhook Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/telegram/webhook` | Telegram bot webhook |
| POST | `/api/paddle/webhook` | Paddle billing webhook |

### Cron Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cron/check-status` | Check all checks for overdue |
| GET | `/api/cron/cleanup-history` | Delete old history |

---

## Rate Limiting

Implemented in `src/lib/rate-limit.ts` using Firestore.

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Ping | 100 req | 1 minute |
| Auth | 10 req | 1 minute |
| API (free) | 30 req | 1 minute |
| API (starter) | 120 req | 1 minute |
| API (pro) | 300 req | 1 minute |
| Webhook test | 5 req | 1 minute |

Rate limit exceeded returns:
```json
{
  "error": "Too many requests",
  "retryAfter": 45
}
```

---

## Background Jobs

### check-status (Every minute)

**File**: `src/app/api/cron/check-status/route.ts`

1. Query all checks where `status != 'new'` and `paused != true`
2. For each check:
   - Calculate expected interval from schedule
   - Add grace period
   - Compare with `lastPing` timestamp
   - If overdue and status is 'up' → mark DOWN, send alerts
   - If on time and status is 'down' → already handled by ping endpoint

### cleanup-history (Daily)

**File**: `src/app/api/cron/cleanup-history/route.ts`

1. Query all users with their plans
2. For each user's checks:
   - Delete pings older than plan limit (7/30/90 days)
   - Delete status history older than plan limit

---

## Security Considerations

### Webhook URL Validation

```typescript
// Block localhost and private IPs
const blockedPatterns = [
  /^localhost/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
];
```

### API Key Storage

API keys are hashed before storage:
```typescript
const hashedKey = await bcrypt.hash(rawKey, 10);
// Store only hash, return raw key once to user
```

### Cron Endpoint Protection

```typescript
const secret = searchParams.get('secret');
if (secret !== process.env.CRON_SECRET) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Telegram Webhook Verification

```typescript
const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Paddle Webhook Verification

Uses HMAC-SHA256 signature verification:
```typescript
const signature = req.headers.get('paddle-signature');
const isValid = verifySignature(rawBody, signature, PADDLE_WEBHOOK_SECRET);
```

---

## Useful Links

| Service | Dashboard | Docs |
|---------|-----------|------|
| Firebase | https://console.firebase.google.com | https://firebase.google.com/docs |
| Resend | https://resend.com/emails | https://resend.com/docs |
| Telegram | https://t.me/BotFather | https://core.telegram.org/bots/api |
| Paddle | https://vendors.paddle.com | https://developer.paddle.com |
| cron-job.org | https://console.cron-job.org | https://docs.cron-job.org |
| Vercel | https://vercel.com/dashboard | https://vercel.com/docs |

---

## Troubleshooting

### Emails not sending

1. Check `RESEND_API_KEY` is valid
2. Verify domain in Resend dashboard
3. Check Resend logs for errors

### Push notifications not working

1. Verify VAPID key matches in Firebase Console
2. Check browser permissions
3. Ensure Service Worker is registered
4. Check Firebase Cloud Messaging quota

### Telegram bot not responding

1. Verify webhook is set: `GET /getWebhookInfo`
2. Check webhook secret matches
3. Review Telegram bot logs in your API

### Paddle webhooks failing

1. Verify webhook URL in Paddle dashboard
2. Check signature verification
3. Ensure `PADDLE_WEBHOOK_SECRET` is correct

### Cron jobs not running

1. Check cron-job.org dashboard for errors
2. Verify `CRON_SECRET` matches
3. Check API response times (must be < 30s)

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

### Testing Webhooks Locally

Use ngrok to expose local server:
```bash
ngrok http 3000
# Use the ngrok URL for Telegram/Paddle webhooks
```

---

*Last updated: January 2025*
