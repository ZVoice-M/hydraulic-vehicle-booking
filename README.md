# Hydraulic Vehicle Booking & Key Management System

Mobile-first Next.js app for managing 4 church/fellowship hydraulic vehicles, vehicle availability, bookings, current key holders, and admin reporting.

## Features

- Public user booking view with only vehicle cards, current booking, today schedule, booking flow, and My Bookings by mobile number.
- Admin dashboard at `/admin` and `/dashboard` with all bookings, filters, search, CSV export, utilization counters, overdue/active/completed visibility.
- Editable booking rules in `config/bookingRules.ts`.
- Validation for 5 hour maximum bookings, 2 bookings per day, 2 simultaneous vehicles, no overlaps, no past-time bookings, and 15 minute handover buffer.
- Realtime demo mode through `localStorage` + `BroadcastChannel`, so multiple tabs update instantly without setup.
- Supabase schema in `supabase/schema.sql` for production tables, indexes, RLS starter policies, seed vehicles, seed bookings, and realtime publication.
- Mobile-first UI with Tailwind CSS, Lucide icons, toast notifications, modal booking flow, call links, WhatsApp links, and PWA manifest.

## Setup

1. Install Node.js with npm.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file:

```bash
cp .env.example .env.local
```

4. Start development:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Open Immediately Without Node

A plain browser-only web version is included at:

```text
web-version/index.html
```

Open that file directly in Chrome/Edge to test the booking flow now. It stores demo bookings in the browser with `localStorage`. This version is useful for quick sharing or testing, but the Next.js app is the production version.

## Admin

Set this before deployment:

```bash
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

The local demo fallback password is `admin123`. For a real deployment, replace the lightweight password gate with Supabase Auth or another server-side auth provider.

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The current app includes the Supabase client and schema. The included demo store is intentionally local-first so coordinators can test the workflow immediately; swapping `src/lib/useBookingStore.ts` to Supabase queries/subscriptions is the production integration point.

Recommended production hardening:

- Use Supabase Auth for admins.
- Tighten RLS policies so public users can only read active/today/relevant records.
- Move booking validation into Postgres functions or Edge Functions to prevent bypassing client-side rules.
- Add SMS/WhatsApp reminders through Twilio, Meta WhatsApp Cloud API, or another provider.

## Deployment

Deploy to Vercel:

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Add environment variables from `.env.example`.
4. Run production Supabase SQL.
5. Deploy.

## Important Files

- `config/bookingRules.ts` - change booking limits here.
- `src/app/page.tsx` - public booking view.
- `src/app/admin/page.tsx` - admin dashboard.
- `src/lib/useBookingStore.ts` - realtime data store.
- `src/lib/utils.ts` - booking validation and time helpers.
- `supabase/schema.sql` - database schema and demo seed data.
