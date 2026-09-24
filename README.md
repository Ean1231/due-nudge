# DueNudge

A simple paid tool for freelancers and small businesses: track unpaid invoices and automatically email clients at **due+3**, **+7**, and **+14** days.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- Auth.js (credentials)
- Stripe Checkout subscriptions ($12/mo, 7-day trial after 3 free sends)
- Gmail OAuth/API for reminder emails
- Private Vercel Blob storage for optional invoice PDFs
- Daily cron at `GET /api/cron/reminders`

## Quick start (local demo)

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With Stripe/Google env vars empty:

- Billing is **not required** — you can use the full app after register/login
- Reminder emails are **logged to the server console** instead of sent

Trigger reminders manually:

```bash
curl "http://localhost:3000/api/cron/reminders"
```

## Production setup

1. Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to PostgreSQL
2. Set `AUTH_SECRET` (long random string) and `AUTH_URL` / `NEXT_PUBLIC_APP_URL`
3. Create a Stripe Product/Price at $12/mo and set:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET` (endpoint: `/api/stripe/webhook`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional for this MVP)
4. Enable the Gmail API and configure a Google OAuth web client:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - Redirect URI: `{NEXT_PUBLIC_APP_URL}/api/gmail/callback`
5. Connect a **private Vercel Blob store** so `BLOB_READ_WRITE_TOKEN` is available.
6. Set `CRON_SECRET` and deploy so Vercel Cron can call `/api/cron/reminders` daily.

Stripe webhook events used: `checkout.session.completed`, `customer.subscription.*`.

## MVP features

- Register / login
- Clients CRUD (create + list)
- Invoices create + list + mark paid/unpaid
- One reusable custom reminder template per account
- Optional private PDF attachment (maximum 3 MB)
- Four-design step-by-step invoice builder with logos, signature styling, line items, tax, business/client details, and generated private PDFs
- Optional original PDF/DOC/DOCX invoice stored privately and attached alongside the generated PDF
- Manual “Send now” reminder with a 24-hour cooldown
- Auto email reminders at day 3 / 7 / 14 past due
- Stripe subscription with 7-day trial

## Reminder delivery safety

- Each invoice/milestone is claimed in the database before Gmail is called.
- Confirmed sends count toward the three-free-send allowance; failed sends do not.
- Failed sends can retry. Ambiguous Gmail/network outcomes are not retried automatically—check Gmail Sent Mail first.
- Attachments are private and only download through an authenticated, ownership-checked route.
