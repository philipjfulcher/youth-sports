# Youth Swimming Team Manager — Design Spec

**Date:** 2026-06-26  
**Purpose:** Example app with many routes and mocked functionality to provide rich, varied data for an analytics platform.

---

## Overview

A youth swimming team manager app themed around a fictional team ("Riverside Marlins"). The app has public-facing pages, swimmer registration, authenticated swimmer views, and a coach role with elevated permissions. Fully self-contained — no external services.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** SQLite via `better-sqlite3`
- **Auth:** `iron-session` (cookie-based sessions, username/password)
- **Styling:** Tailwind CSS
- **Password hashing:** `bcrypt`

---

## Data Model

All tables live in a single SQLite file (`data/youth-sports.db`), initialized on startup via `lib/db.ts`.

| Table | Key Columns |
|---|---|
| `users` | id, name, email, password_hash, role (`swimmer`\|`coach`), created_at |
| `swimmers` | id, user_id (FK), age, stroke_specialty, joined_at |
| `coaches` | id, user_id (FK), bio, years_experience |
| `events` | id, title, description, event_date, location, event_type (`meet`\|`practice`\|`other`), created_by |
| `event_signups` | id, event_id (FK), user_id (FK), signed_up_at |
| `records` | id, swimmer_id (FK), stroke, distance, time_seconds, recorded_at |
| `meets` | id, name, date, location, results_summary |

**Seed data:** 2 coaches, 8 swimmers, ~10 upcoming events, team records across strokes/distances, and 3 past meets with results.

---

## Routes

### Public (unauthenticated)

| Route | Description |
|---|---|
| `/` | Landing page: team name, hero banner, tagline |
| `/about` | Coach bios |
| `/schedule` | Upcoming meets |
| `/records` | Team best times by stroke & distance |
| `/register` | New swimmer registration form |
| `/login` | Login form |

### Authenticated — Swimmer

| Route | Description |
|---|---|
| `/dashboard` | Welcome, upcoming events signed up for |
| `/events` | Browse all events, sign up / withdraw |
| `/profile` | Own times and records |

### Authenticated — Coach

| Route | Description |
|---|---|
| `/dashboard` | Swimmer dashboard + quick stats |
| `/events` | Event list + Create/Delete buttons |
| `/events/new` | Create event form |
| `/roster` | All swimmers and their records |

---

## Auth Flow

- `middleware.ts` protects all `/dashboard`, `/events`, `/profile`, `/roster` routes
- Unauthenticated users are redirected to `/login`
- Role is stored in the iron-session cookie (`{ userId, role, name }`)
- Coach-only actions (create/delete event) are validated server-side via session role

---

## Server Actions

No separate API layer — all mutations use Next.js Server Actions.

| Action | Who | Effect |
|---|---|---|
| `register(formData)` | Public | Creates user + swimmer row, sets session |
| `login(formData)` | Public | Validates credentials, sets session |
| `signUpForEvent(eventId)` | Swimmer/Coach | Creates event_signups row (idempotent) |
| `withdrawFromEvent(eventId)` | Swimmer/Coach | Deletes event_signups row |
| `createEvent(formData)` | Coach only | Inserts into events |
| `deleteEvent(eventId)` | Coach only | Deletes event, cascades signups |

---

## File Structure

```
lib/
  db.ts              # DB init, migrations
  session.ts         # iron-session config
  queries/
    users.ts
    events.ts
    records.ts
    meets.ts
app/
  (public)/          # Public route group
  (auth)/            # Protected route group
  actions/           # Server actions
data/
  seed.ts            # Seed script
  youth-sports.db    # SQLite file (gitignored)
```

---

## Verification

1. `npm run dev` starts the app on localhost:3000
2. Public pages render without login
3. `/login` with seeded coach credentials shows coach dashboard with create/delete controls
4. `/login` with seeded swimmer credentials shows swimmer dashboard without coach controls
5. Swimmer can sign up for and withdraw from events
6. Coach can create and delete events
7. `/register` creates a new swimmer and logs them in
8. Direct navigation to `/dashboard` while logged out redirects to `/login`
