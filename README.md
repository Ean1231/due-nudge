# DueNudge

A simple paid tool for freelancers and small businesses: track unpaid invoices and automatically email clients at **due+3**, **+7**, and **+14** days.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (swap to Postgres for production)
- Auth.js (credentials)
- Stripe Checkout subscriptions ($12/mo, 7-day trial)
- Resend for reminder emails
- Daily cron at `GET /api/cron/reminders`

## Quick start (local demo)

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With Stripe/Resend env vars empty:

- Billing is **not required** — you can use the full app after register/login
- Reminder emails are **logged to the server console** instead of sent

Trigger reminders manually:

```bash
curl "http://localhost:3000/api/cron/reminders"
```

## Production setup

1. Set `DATABASE_URL` to Postgres and change the Prisma provider to `postgresql`
2. Set `AUTH_SECRET` (long random string) and `AUTH_URL` / `NEXT_PUBLIC_APP_URL`
3. Create a Stripe Product/Price at $12/mo and set:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET` (endpoint: `/api/stripe/webhook`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional for this MVP)
4. Set Resend:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` (verified domain)
5. Set `CRON_SECRET` and deploy so Vercel Cron can call `/api/cron/reminders` daily

Stripe webhook events used: `checkout.session.completed`, `customer.subscription.*`.

## MVP features

- Register / login
- Clients CRUD (create + list)
- Invoices create + list + mark paid/unpaid
- Auto email reminders at day 3 / 7 / 14 past due
- Stripe subscription with 7-day trial

## Not in this MVP (phase 2)

- Custom reminder templates
- PDF invoice attachments
- Manual “nudge now” button
