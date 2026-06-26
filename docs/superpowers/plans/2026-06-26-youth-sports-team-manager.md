# Youth Swimming Team Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained youth swimming team manager app ("Riverside Marlins") with public pages, swimmer registration/auth, event signup, and a coach role with create/delete permissions.

**Architecture:** Next.js 14 App Router with server components and server actions for all mutations. SQLite via better-sqlite3 initialized at startup with inline schema migrations. iron-session cookie stores `{ userId, role, name }` and middleware protects all authenticated routes.

**Tech Stack:** Next.js 14, TypeScript, better-sqlite3, iron-session, bcrypt, Tailwind CSS, Vitest

## Global Constraints

- Node 20+
- Next.js 14 (App Router only — no pages/ directory)
- SQLite file lives at `data/youth-sports.db` (gitignored)
- All mutations via Server Actions — no separate API routes
- No external services or network calls
- Roles: `swimmer` | `coach` — stored on `users.role`
- Coach-only actions validated server-side via session role (never trust client)
- Tailwind for all styling — no CSS modules, no styled-components

---

## File Map

| File | Responsibility |
|---|---|
| `lib/db.ts` | Open SQLite connection, run CREATE TABLE IF NOT EXISTS migrations |
| `lib/session.ts` | iron-session config, `getSession()` helper, `requireAuth()` / `requireCoach()` |
| `lib/queries/users.ts` | `getUserByEmail`, `createUser` |
| `lib/queries/swimmers.ts` | `createSwimmer`, `getSwimmerByUserId`, `getAllSwimmers` |
| `lib/queries/coaches.ts` | `getAllCoaches`, `getCoachByUserId` |
| `lib/queries/events.ts` | `getAllEvents`, `getEventById`, `createEvent`, `deleteEvent` |
| `lib/queries/signups.ts` | `getSignupsForUser`, `isSignedUp`, `signUpForEvent`, `withdrawFromEvent` |
| `lib/queries/records.ts` | `getTeamRecords`, `getRecordsForSwimmer` |
| `lib/queries/meets.ts` | `getAllMeets` |
| `data/seed.ts` | Runnable script: insert coaches, swimmers, events, records, meets |
| `middleware.ts` | Redirect unauthenticated users from protected routes to `/login` |
| `app/layout.tsx` | Root layout with Tailwind, nav bar (public) |
| `app/page.tsx` | `/` landing |
| `app/about/page.tsx` | Coach bios |
| `app/schedule/page.tsx` | Upcoming meets (public) |
| `app/records/page.tsx` | Team best times |
| `app/login/page.tsx` | Login form |
| `app/register/page.tsx` | Registration form |
| `app/actions/auth.ts` | `register`, `login`, `logout` server actions |
| `app/actions/events.ts` | `signUpForEvent`, `withdrawFromEvent`, `createEvent`, `deleteEvent` |
| `app/(auth)/layout.tsx` | Authenticated layout: nav with user name + logout |
| `app/(auth)/dashboard/page.tsx` | Welcome + upcoming signups |
| `app/(auth)/events/page.tsx` | Event list; swimmer sees signup buttons, coach sees create/delete |
| `app/(auth)/events/new/page.tsx` | Coach-only create event form |
| `app/(auth)/profile/page.tsx` | Swimmer's own records |
| `app/(auth)/roster/page.tsx` | Coach-only: all swimmers + records |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`

**Interfaces:**
- Produces: working `npm run dev`, `npm test`, `npm run seed`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/philipfulcher/personal-repos/youth-sports
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

Accept all defaults. This creates `app/`, `public/`, `tailwind.config.ts`, `tsconfig.json`, `next.config.ts`.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install better-sqlite3 iron-session bcrypt
npm install --save-dev @types/better-sqlite3 @types/bcrypt vitest @vitejs/plugin-react vite-tsconfig-paths
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 4: Add scripts to package.json**

Add to the `"scripts"` section:
```json
"test": "vitest run",
"test:watch": "vitest",
"seed": "npx tsx data/seed.ts"
```

- [ ] **Step 5: Add data/ to .gitignore**

Append to `.gitignore`:
```
data/*.db
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: server starts on http://localhost:3000 with default Next.js page.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, Vitest, and deps"
```

---

## Task 2: Database Layer

**Files:**
- Create: `lib/db.ts`
- Create: `lib/queries/users.ts`
- Create: `lib/queries/swimmers.ts`
- Create: `lib/queries/coaches.ts`
- Create: `lib/queries/events.ts`
- Create: `lib/queries/signups.ts`
- Create: `lib/queries/records.ts`
- Create: `lib/queries/meets.ts`
- Create: `lib/queries/__tests__/queries.test.ts`

**Interfaces:**
- Produces:
  - `getDb(): Database` — returns initialized better-sqlite3 instance
  - `getUserByEmail(db, email): User | undefined`
  - `createUser(db, data): number` — returns new user id
  - `createSwimmer(db, data): number`
  - `getSwimmerByUserId(db, userId): Swimmer | undefined`
  - `getAllSwimmers(db): SwimmerWithUser[]`
  - `getAllCoaches(db): CoachWithUser[]`
  - `getCoachByUserId(db, userId): Coach | undefined`
  - `getAllEvents(db): Event[]`
  - `getEventById(db, id): Event | undefined`
  - `createEvent(db, data): number`
  - `deleteEvent(db, id): void`
  - `getSignupsForUser(db, userId): EventSignup[]`
  - `isSignedUp(db, eventId, userId): boolean`
  - `signUpForEvent(db, eventId, userId): void`
  - `withdrawFromEvent(db, eventId, userId): void`
  - `getTeamRecords(db): Record[]`
  - `getRecordsForSwimmer(db, swimmerId): Record[]`
  - `getAllMeets(db): Meet[]`

- [ ] **Step 1: Write failing tests for DB queries**

Create `lib/queries/__tests__/queries.test.ts`:
```typescript
import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { createUser, getUserByEmail } from '../users'
import { createSwimmer, getSwimmerByUserId, getAllSwimmers } from '../swimmers'
import { getAllEvents, createEvent, deleteEvent, getEventById } from '../events'
import { signUpForEvent, withdrawFromEvent, isSignedUp, getSignupsForUser } from '../signups'
import { getTeamRecords, getRecordsForSwimmer } from '../records'
import { getAllMeets } from '../meets'
import { getAllCoaches } from '../coaches'

function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'swimmer',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE swimmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      age INTEGER,
      stroke_specialty TEXT,
      joined_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      bio TEXT,
      years_experience INTEGER
    );
    CREATE TABLE events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      location TEXT,
      event_type TEXT NOT NULL DEFAULT 'practice',
      created_by INTEGER REFERENCES users(id)
    );
    CREATE TABLE event_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      signed_up_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(event_id, user_id)
    );
    CREATE TABLE records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      swimmer_id INTEGER NOT NULL REFERENCES swimmers(id),
      stroke TEXT NOT NULL,
      distance INTEGER NOT NULL,
      time_seconds REAL NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE meets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      results_summary TEXT
    );
  `)
  return db
}

describe('users queries', () => {
  let db: Database.Database
  beforeEach(() => { db = createTestDb() })

  it('createUser inserts and getUserByEmail retrieves', () => {
    const id = createUser(db, { name: 'Alice', email: 'alice@test.com', passwordHash: 'hash', role: 'swimmer' })
    expect(id).toBeGreaterThan(0)
    const user = getUserByEmail(db, 'alice@test.com')
    expect(user).toBeDefined()
    expect(user!.name).toBe('Alice')
    expect(user!.role).toBe('swimmer')
  })

  it('getUserByEmail returns undefined for unknown email', () => {
    expect(getUserByEmail(db, 'nobody@test.com')).toBeUndefined()
  })
})

describe('swimmers queries', () => {
  let db: Database.Database
  beforeEach(() => { db = createTestDb() })

  it('createSwimmer and getSwimmerByUserId round-trips', () => {
    const userId = createUser(db, { name: 'Bob', email: 'bob@test.com', passwordHash: 'hash', role: 'swimmer' })
    const swimmerId = createSwimmer(db, { userId, age: 14, strokeSpecialty: 'freestyle' })
    expect(swimmerId).toBeGreaterThan(0)
    const swimmer = getSwimmerByUserId(db, userId)
    expect(swimmer).toBeDefined()
    expect(swimmer!.stroke_specialty).toBe('freestyle')
  })

  it('getAllSwimmers returns all with user names', () => {
    const u1 = createUser(db, { name: 'C1', email: 'c1@test.com', passwordHash: 'h', role: 'swimmer' })
    const u2 = createUser(db, { name: 'C2', email: 'c2@test.com', passwordHash: 'h', role: 'swimmer' })
    createSwimmer(db, { userId: u1, age: 12, strokeSpecialty: 'backstroke' })
    createSwimmer(db, { userId: u2, age: 13, strokeSpecialty: 'butterfly' })
    const all = getAllSwimmers(db)
    expect(all).toHaveLength(2)
    expect(all.map(s => s.name)).toContain('C1')
  })
})

describe('events queries', () => {
  let db: Database.Database
  beforeEach(() => { db = createTestDb() })

  it('createEvent, getEventById, deleteEvent', () => {
    const id = createEvent(db, { title: 'Morning Practice', description: 'Early bird', eventDate: '2026-07-01T08:00', location: 'Pool A', eventType: 'practice', createdBy: null })
    expect(id).toBeGreaterThan(0)
    const event = getEventById(db, id)
    expect(event!.title).toBe('Morning Practice')
    deleteEvent(db, id)
    expect(getEventById(db, id)).toBeUndefined()
  })

  it('getAllEvents returns all events', () => {
    createEvent(db, { title: 'E1', description: '', eventDate: '2026-07-01', location: '', eventType: 'meet', createdBy: null })
    createEvent(db, { title: 'E2', description: '', eventDate: '2026-07-02', location: '', eventType: 'practice', createdBy: null })
    expect(getAllEvents(db)).toHaveLength(2)
  })
})

describe('signups queries', () => {
  let db: Database.Database
  let userId: number
  let eventId: number
  beforeEach(() => {
    db = createTestDb()
    userId = createUser(db, { name: 'S', email: 's@test.com', passwordHash: 'h', role: 'swimmer' })
    eventId = createEvent(db, { title: 'E', description: '', eventDate: '2026-07-01', location: '', eventType: 'practice', createdBy: null })
  })

  it('signUpForEvent and isSignedUp', () => {
    expect(isSignedUp(db, eventId, userId)).toBe(false)
    signUpForEvent(db, eventId, userId)
    expect(isSignedUp(db, eventId, userId)).toBe(true)
  })

  it('withdrawFromEvent removes signup', () => {
    signUpForEvent(db, eventId, userId)
    withdrawFromEvent(db, eventId, userId)
    expect(isSignedUp(db, eventId, userId)).toBe(false)
  })

  it('getSignupsForUser returns signed-up events', () => {
    signUpForEvent(db, eventId, userId)
    const signups = getSignupsForUser(db, userId)
    expect(signups).toHaveLength(1)
    expect(signups[0].event_id).toBe(eventId)
  })
})

describe('records queries', () => {
  let db: Database.Database
  beforeEach(() => { db = createTestDb() })

  it('getTeamRecords returns records with swimmer info', () => {
    const uid = createUser(db, { name: 'R', email: 'r@test.com', passwordHash: 'h', role: 'swimmer' })
    const sid = createSwimmer(db, { userId: uid, age: 15, strokeSpecialty: 'freestyle' })
    db.prepare(`INSERT INTO records (swimmer_id, stroke, distance, time_seconds) VALUES (?, ?, ?, ?)`).run(sid, 'freestyle', 100, 58.4)
    const records = getTeamRecords(db)
    expect(records).toHaveLength(1)
    expect(records[0].stroke).toBe('freestyle')
  })
})

describe('meets queries', () => {
  let db: Database.Database
  beforeEach(() => { db = createTestDb() })

  it('getAllMeets returns all meets', () => {
    db.prepare(`INSERT INTO meets (name, date, location, results_summary) VALUES (?, ?, ?, ?)`).run('Spring Invite', '2026-05-10', 'City Pool', '1st place')
    const meets = getAllMeets(db)
    expect(meets).toHaveLength(1)
    expect(meets[0].name).toBe('Spring Invite')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```
Expected: FAIL — modules not found

- [ ] **Step 3: Create lib/db.ts**

```typescript
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  const dbPath = path.join(process.cwd(), 'data', 'youth-sports.db')
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  return db
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'swimmer',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS swimmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      age INTEGER,
      stroke_specialty TEXT,
      joined_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      bio TEXT,
      years_experience INTEGER
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      location TEXT,
      event_type TEXT NOT NULL DEFAULT 'practice',
      created_by INTEGER REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS event_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      signed_up_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(event_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      swimmer_id INTEGER NOT NULL REFERENCES swimmers(id),
      stroke TEXT NOT NULL,
      distance INTEGER NOT NULL,
      time_seconds REAL NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS meets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT,
      results_summary TEXT
    );
  `)
}
```

- [ ] **Step 4: Create lib/queries/users.ts**

```typescript
import type Database from 'better-sqlite3'

export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  role: 'swimmer' | 'coach'
  created_at: string
}

export function getUserByEmail(db: Database.Database, email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined
}

export function createUser(
  db: Database.Database,
  data: { name: string; email: string; passwordHash: string; role: 'swimmer' | 'coach' }
): number {
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(data.name, data.email, data.passwordHash, data.role)
  return result.lastInsertRowid as number
}
```

- [ ] **Step 5: Create lib/queries/swimmers.ts**

```typescript
import type Database from 'better-sqlite3'

export interface Swimmer {
  id: number
  user_id: number
  age: number | null
  stroke_specialty: string | null
  joined_at: string
}

export interface SwimmerWithUser extends Swimmer {
  name: string
  email: string
}

export function createSwimmer(
  db: Database.Database,
  data: { userId: number; age: number | null; strokeSpecialty: string | null }
): number {
  const result = db
    .prepare('INSERT INTO swimmers (user_id, age, stroke_specialty) VALUES (?, ?, ?)')
    .run(data.userId, data.age, data.strokeSpecialty)
  return result.lastInsertRowid as number
}

export function getSwimmerByUserId(db: Database.Database, userId: number): Swimmer | undefined {
  return db.prepare('SELECT * FROM swimmers WHERE user_id = ?').get(userId) as Swimmer | undefined
}

export function getAllSwimmers(db: Database.Database): SwimmerWithUser[] {
  return db.prepare(`
    SELECT s.*, u.name, u.email
    FROM swimmers s
    JOIN users u ON u.id = s.user_id
    ORDER BY u.name
  `).all() as SwimmerWithUser[]
}
```

- [ ] **Step 6: Create lib/queries/coaches.ts**

```typescript
import type Database from 'better-sqlite3'

export interface Coach {
  id: number
  user_id: number
  bio: string | null
  years_experience: number | null
}

export interface CoachWithUser extends Coach {
  name: string
  email: string
}

export function getAllCoaches(db: Database.Database): CoachWithUser[] {
  return db.prepare(`
    SELECT c.*, u.name, u.email
    FROM coaches c
    JOIN users u ON u.id = c.user_id
    ORDER BY u.name
  `).all() as CoachWithUser[]
}

export function getCoachByUserId(db: Database.Database, userId: number): Coach | undefined {
  return db.prepare('SELECT * FROM coaches WHERE user_id = ?').get(userId) as Coach | undefined
}
```

- [ ] **Step 7: Create lib/queries/events.ts**

```typescript
import type Database from 'better-sqlite3'

export interface Event {
  id: number
  title: string
  description: string | null
  event_date: string
  location: string | null
  event_type: 'meet' | 'practice' | 'other'
  created_by: number | null
}

export function getAllEvents(db: Database.Database): Event[] {
  return db.prepare('SELECT * FROM events ORDER BY event_date ASC').all() as Event[]
}

export function getEventById(db: Database.Database, id: number): Event | undefined {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined
}

export function createEvent(
  db: Database.Database,
  data: { title: string; description: string; eventDate: string; location: string; eventType: string; createdBy: number | null }
): number {
  const result = db
    .prepare('INSERT INTO events (title, description, event_date, location, event_type, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(data.title, data.description, data.eventDate, data.location, data.eventType, data.createdBy)
  return result.lastInsertRowid as number
}

export function deleteEvent(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM events WHERE id = ?').run(id)
}
```

- [ ] **Step 8: Create lib/queries/signups.ts**

```typescript
import type Database from 'better-sqlite3'

export interface EventSignup {
  id: number
  event_id: number
  user_id: number
  signed_up_at: string
}

export function getSignupsForUser(db: Database.Database, userId: number): EventSignup[] {
  return db.prepare('SELECT * FROM event_signups WHERE user_id = ?').all(userId) as EventSignup[]
}

export function isSignedUp(db: Database.Database, eventId: number, userId: number): boolean {
  const row = db.prepare('SELECT id FROM event_signups WHERE event_id = ? AND user_id = ?').get(eventId, userId)
  return row !== undefined
}

export function signUpForEvent(db: Database.Database, eventId: number, userId: number): void {
  db.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventId, userId)
}

export function withdrawFromEvent(db: Database.Database, eventId: number, userId: number): void {
  db.prepare('DELETE FROM event_signups WHERE event_id = ? AND user_id = ?').run(eventId, userId)
}
```

- [ ] **Step 9: Create lib/queries/records.ts**

```typescript
import type Database from 'better-sqlite3'

export interface Record {
  id: number
  swimmer_id: number
  stroke: string
  distance: number
  time_seconds: number
  recorded_at: string
  name?: string
}

export function getTeamRecords(db: Database.Database): Record[] {
  return db.prepare(`
    SELECT r.*, u.name
    FROM records r
    JOIN swimmers s ON s.id = r.swimmer_id
    JOIN users u ON u.id = s.user_id
    ORDER BY r.stroke, r.distance, r.time_seconds ASC
  `).all() as Record[]
}

export function getRecordsForSwimmer(db: Database.Database, swimmerId: number): Record[] {
  return db.prepare('SELECT * FROM records WHERE swimmer_id = ? ORDER BY stroke, distance').all(swimmerId) as Record[]
}
```

- [ ] **Step 10: Create lib/queries/meets.ts**

```typescript
import type Database from 'better-sqlite3'

export interface Meet {
  id: number
  name: string
  date: string
  location: string | null
  results_summary: string | null
}

export function getAllMeets(db: Database.Database): Meet[] {
  return db.prepare('SELECT * FROM meets ORDER BY date DESC').all() as Meet[]
}
```

- [ ] **Step 11: Run tests — verify they pass**

```bash
npm test
```
Expected: all tests PASS

- [ ] **Step 12: Commit**

```bash
git add lib/ lib/queries/__tests__/
git commit -m "feat: add database layer with schema and tested query functions"
```

---

## Task 3: Seed Data

**Files:**
- Create: `data/seed.ts`

**Interfaces:**
- Consumes: `getDb`, all query functions from Task 2
- Produces: `npm run seed` populates DB with 2 coaches, 8 swimmers, events, records, meets

- [ ] **Step 1: Create data/seed.ts**

```typescript
import Database from 'better-sqlite3'
import bcrypt from 'bcrypt'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'data', 'youth-sports.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

// Delete existing DB for fresh seed
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'swimmer',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS swimmers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    age INTEGER,
    stroke_specialty TEXT,
    joined_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    bio TEXT,
    years_experience INTEGER
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    location TEXT,
    event_type TEXT NOT NULL DEFAULT 'practice',
    created_by INTEGER REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS event_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    signed_up_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(event_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    swimmer_id INTEGER NOT NULL REFERENCES swimmers(id),
    stroke TEXT NOT NULL,
    distance INTEGER NOT NULL,
    time_seconds REAL NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS meets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT,
    results_summary TEXT
  );
`)

const password = bcrypt.hashSync('password123', 10)

// Coaches
const coach1Id = (db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Coach Sarah Mitchell', 'sarah@marlins.com', password, 'coach')).lastInsertRowid as number
const coach2Id = (db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Coach David Torres', 'david@marlins.com', password, 'coach')).lastInsertRowid as number

db.prepare('INSERT INTO coaches (user_id, bio, years_experience) VALUES (?, ?, ?)').run(coach1Id, 'Sarah has 12 years of competitive swimming coaching experience. Former NCAA Division I swimmer at UNC. Specializes in butterfly and individual medley.', 12)
db.prepare('INSERT INTO coaches (user_id, bio, years_experience) VALUES (?, ?, ?)').run(coach2Id, 'David is a USA Swimming certified coach with a focus on sprint freestyle and backstroke. He brings energy and technical precision to every practice.', 7)

// Swimmers
const swimmerData = [
  { name: 'Emma Johnson', email: 'emma@marlins.com', age: 14, stroke: 'freestyle' },
  { name: 'Liam Park', email: 'liam@marlins.com', age: 13, stroke: 'backstroke' },
  { name: 'Olivia Chen', email: 'olivia@marlins.com', age: 15, stroke: 'butterfly' },
  { name: 'Noah Williams', email: 'noah@marlins.com', age: 12, stroke: 'breaststroke' },
  { name: 'Ava Martinez', email: 'ava@marlins.com', age: 14, stroke: 'freestyle' },
  { name: 'Ethan Brown', email: 'ethan@marlins.com', age: 16, stroke: 'backstroke' },
  { name: 'Sophia Davis', email: 'sophia@marlins.com', age: 13, stroke: 'individual medley' },
  { name: 'Mason Wilson', email: 'mason@marlins.com', age: 15, stroke: 'butterfly' },
]

const swimmerIds: number[] = []
for (const s of swimmerData) {
  const userId = (db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(s.name, s.email, password, 'swimmer')).lastInsertRowid as number
  const swimmerId = (db.prepare('INSERT INTO swimmers (user_id, age, stroke_specialty) VALUES (?, ?, ?)').run(userId, s.age, s.stroke)).lastInsertRowid as number
  swimmerIds.push(swimmerId)
}

// Records
const recordData = [
  [swimmerIds[0], 'freestyle', 100, 58.42],
  [swimmerIds[0], 'freestyle', 200, 2 * 60 + 8.31],
  [swimmerIds[1], 'backstroke', 100, 61.15],
  [swimmerIds[1], 'backstroke', 200, 2 * 60 + 14.88],
  [swimmerIds[2], 'butterfly', 100, 63.02],
  [swimmerIds[2], 'butterfly', 50, 28.77],
  [swimmerIds[3], 'breaststroke', 100, 67.45],
  [swimmerIds[4], 'freestyle', 100, 59.81],
  [swimmerIds[4], 'freestyle', 50, 26.33],
  [swimmerIds[5], 'backstroke', 100, 59.90],
  [swimmerIds[6], 'individual medley', 200, 2 * 60 + 22.10],
  [swimmerIds[7], 'butterfly', 100, 62.44],
]
for (const [sid, stroke, distance, time] of recordData) {
  db.prepare('INSERT INTO records (swimmer_id, stroke, distance, time_seconds) VALUES (?, ?, ?, ?)').run(sid, stroke, distance, time)
}

// Meets (past)
db.prepare('INSERT INTO meets (name, date, location, results_summary) VALUES (?, ?, ?, ?)').run('Spring Invitational', '2026-03-15', 'Riverside Aquatic Center', '2nd place overall — 4 individual event wins, 1 relay championship')
db.prepare('INSERT INTO meets (name, date, location, results_summary) VALUES (?, ?, ?, ?)').run('County Championships', '2026-04-22', 'Westfield Natatorium', '1st place — team scored 312 points, 6 personal records broken')
db.prepare('INSERT INTO meets (name, date, location, results_summary) VALUES (?, ?, ?, ?)').run('Tri-City Dual Meet', '2026-05-08', 'Lakeside YMCA', 'Won 58-42 — strong showing in backstroke and butterfly events')

// Upcoming events
const eventDates = [
  ['Morning Practice', 'Regular weekday morning practice. Focus on turns and underwaters.', '2026-07-07T07:00', 'Riverside Aquatic Center', 'practice'],
  ['Evening Practice', 'Technique and endurance sets. All strokes.', '2026-07-08T18:00', 'Riverside Aquatic Center', 'practice'],
  ['Summer Splash Meet', 'Home meet. All swimmers expected to compete in at least 2 events.', '2026-07-12T09:00', 'Riverside Aquatic Center', 'meet'],
  ['Dryland Training', 'Strength and conditioning — no pool needed. Bring workout clothes.', '2026-07-14T09:00', 'Riverside Community Center', 'practice'],
  ['Regional Qualifier', 'Away meet. Top 3 finishes advance to state championships.', '2026-07-19T08:00', 'Northside Natatorium', 'meet'],
  ['Morning Practice', 'Sprint sets and race prep for Regional Qualifier.', '2026-07-21T07:00', 'Riverside Aquatic Center', 'practice'],
  ['End-of-Season Banquet', 'Team celebration and awards. Families welcome!', '2026-08-02T18:00', 'Riverside Community Center', 'other'],
]

const eventIds: number[] = []
for (const [title, description, date, location, type] of eventDates) {
  const id = (db.prepare('INSERT INTO events (title, description, event_date, location, event_type, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(title, description, date, location, type, coach1Id)).lastInsertRowid as number
  eventIds.push(id)
}

// Some signups
const swimmerUserIds = swimmerData.map((_, i) => i + 3) // user IDs start at 3 (after 2 coaches)
db.prepare('INSERT INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[0], swimmerUserIds[0])
db.prepare('INSERT INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[0], swimmerUserIds[1])
db.prepare('INSERT INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[0], swimmerUserIds[2])
db.prepare('INSERT INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[2], swimmerUserIds[0])
db.prepare('INSERT INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[2], swimmerUserIds[3])
db.prepare('INSERT INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[2], swimmerUserIds[4])

console.log('✓ Database seeded successfully')
console.log('  Coach logins: sarah@marlins.com / password123, david@marlins.com / password123')
console.log('  Swimmer login example: emma@marlins.com / password123')
```

- [ ] **Step 2: Run seed and verify output**

```bash
npm run seed
```
Expected:
```
✓ Database seeded successfully
  Coach logins: sarah@marlins.com / password123, david@marlins.com / password123
  Swimmer login example: emma@marlins.com / password123
```

- [ ] **Step 3: Commit**

```bash
git add data/seed.ts
git commit -m "feat: add seed script with coaches, swimmers, events, records, meets"
```

---

## Task 4: Auth Layer

**Files:**
- Create: `lib/session.ts`
- Create: `app/actions/auth.ts`
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `getUserByEmail`, `createUser`, `createSwimmer` from Task 2
- Produces:
  - `getSession(request?): Promise<SessionData>` — returns session or empty object
  - `requireAuth(): Promise<SessionData>` — throws redirect if not logged in
  - `requireCoach(): Promise<SessionData>` — throws redirect if not coach
  - Server actions: `login(formData)`, `register(formData)`, `logout()`

- [ ] **Step 1: Install iron-session types and verify install**

```bash
npm ls iron-session
```
Expected: iron-session listed (already installed in Task 1)

- [ ] **Step 2: Create lib/session.ts**

```typescript
import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface SessionData {
  userId?: number
  role?: 'swimmer' | 'coach'
  name?: string
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET ?? 'riverside-marlins-super-secret-key-change-in-prod-32chars',
  cookieName: 'marlins-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  if (!session.userId) redirect('/login')
  return session
}

export async function requireCoach(): Promise<SessionData> {
  const session = await getSession()
  if (!session.userId) redirect('/login')
  if (session.role !== 'coach') redirect('/dashboard')
  return session
}
```

- [ ] **Step 3: Create app/actions/auth.ts**

```typescript
'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcrypt'
import { getDb } from '@/lib/db'
import { getUserByEmail, createUser } from '@/lib/queries/users'
import { createSwimmer } from '@/lib/queries/swimmers'
import { getSession } from '@/lib/session'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const db = getDb()
  const user = getUserByEmail(db, email)
  if (!user) return { error: 'Invalid email or password' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return { error: 'Invalid email or password' }

  const session = await getSession()
  session.userId = user.id
  session.role = user.role
  session.name = user.name
  await session.save()

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const age = parseInt(formData.get('age') as string) || null
  const strokeSpecialty = formData.get('strokeSpecialty') as string || null

  const db = getDb()
  const existing = getUserByEmail(db, email)
  if (existing) return { error: 'An account with that email already exists' }

  const passwordHash = await bcrypt.hash(password, 10)
  const userId = createUser(db, { name, email, passwordHash, role: 'swimmer' })
  createSwimmer(db, { userId, age, strokeSpecialty })

  const session = await getSession()
  session.userId = userId
  session.role = 'swimmer'
  session.name = name
  await session.save()

  redirect('/dashboard')
}

export async function logout() {
  const session = await getSession()
  session.destroy()
  redirect('/login')
}
```

- [ ] **Step 4: Create middleware.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/lib/session'

const protectedRoutes = ['/dashboard', '/events', '/profile', '/roster']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  if (!isProtected) return NextResponse.next()

  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*', '/profile/:path*', '/roster/:path*'],
}
```

- [ ] **Step 5: Verify dev server still starts**

```bash
npm run dev
```
Expected: starts without TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add lib/session.ts app/actions/auth.ts middleware.ts
git commit -m "feat: add iron-session auth layer with login, register, logout, and middleware"
```

---

## Task 5: Public Pages

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/about/page.tsx`
- Create: `app/schedule/page.tsx`
- Create: `app/records/page.tsx`
- Create: `app/login/page.tsx`
- Create: `app/register/page.tsx`

**Interfaces:**
- Consumes: `getAllCoaches`, `getAllMeets`, `getTeamRecords` from Task 2; `login`, `register` server actions from Task 4
- Produces: all public routes render correctly unauthenticated

- [ ] **Step 1: Update app/layout.tsx with nav and branding**

Replace contents of `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Riverside Marlins',
  description: 'Youth Swimming Team',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between shadow">
          <Link href="/" className="text-xl font-bold tracking-tight">🐟 Riverside Marlins</Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/about" className="hover:text-blue-200">Coaches</Link>
            <Link href="/schedule" className="hover:text-blue-200">Schedule</Link>
            <Link href="/records" className="hover:text-blue-200">Records</Link>
            <Link href="/register" className="hover:text-blue-200">Join the Team</Link>
            <Link href="/login" className="bg-white text-blue-800 px-3 py-1 rounded hover:bg-blue-100">Login</Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update app/page.tsx (landing)**

```tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white">
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold mb-4">Riverside Marlins</h1>
        <p className="text-xl text-blue-200 mb-2">Youth Competitive Swimming</p>
        <p className="text-blue-300 mb-10">Building champions in the water and in life since 2008.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="bg-white text-blue-900 font-bold px-6 py-3 rounded-lg hover:bg-blue-100 transition">
            Join the Team
          </Link>
          <Link href="/schedule" className="border border-white px-6 py-3 rounded-lg hover:bg-blue-800 transition">
            View Schedule
          </Link>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-3 gap-8 text-center">
        <div className="bg-blue-800 rounded-xl p-6">
          <div className="text-3xl font-bold">8+</div>
          <div className="text-blue-300 text-sm mt-1">Active Swimmers</div>
        </div>
        <div className="bg-blue-800 rounded-xl p-6">
          <div className="text-3xl font-bold">2</div>
          <div className="text-blue-300 text-sm mt-1">Certified Coaches</div>
        </div>
        <div className="bg-blue-800 rounded-xl p-6">
          <div className="text-3xl font-bold">18+</div>
          <div className="text-blue-300 text-sm mt-1">Years Together</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app/about/page.tsx**

```tsx
import { getDb } from '@/lib/db'
import { getAllCoaches } from '@/lib/queries/coaches'

export default function AboutPage() {
  const db = getDb()
  const coaches = getAllCoaches(db)

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Our Coaching Staff</h1>
      <p className="text-gray-600 mb-10">Meet the dedicated coaches behind the Riverside Marlins.</p>
      <div className="space-y-8">
        {coaches.map(coach => (
          <div key={coach.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-blue-800">{coach.name}</h2>
            <p className="text-sm text-gray-500 mb-3">{coach.years_experience} years experience</p>
            <p className="text-gray-700">{coach.bio}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create app/schedule/page.tsx**

```tsx
import { getDb } from '@/lib/db'
import { getAllMeets } from '@/lib/queries/meets'

export default function SchedulePage() {
  const db = getDb()
  const meets = getAllMeets(db)

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Meet Schedule</h1>
      <p className="text-gray-600 mb-10">Past and upcoming competition schedule for the Riverside Marlins.</p>
      <div className="space-y-4">
        {meets.map(meet => (
          <div key={meet.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{meet.name}</h2>
                <p className="text-sm text-gray-500">{meet.location}</p>
              </div>
              <span className="text-sm text-gray-500">{new Date(meet.date).toLocaleDateString()}</span>
            </div>
            {meet.results_summary && (
              <p className="mt-3 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">{meet.results_summary}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create app/records/page.tsx**

```tsx
import { getDb } from '@/lib/db'
import { getTeamRecords } from '@/lib/queries/records'

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

export default function RecordsPage() {
  const db = getDb()
  const records = getTeamRecords(db)

  const grouped = records.reduce<Record<string, typeof records>>((acc, r) => {
    const key = `${r.stroke} — ${r.distance}m`
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Team Records</h1>
      <p className="text-gray-600 mb-10">Best times recorded by Riverside Marlins swimmers.</p>
      <div className="space-y-6">
        {Object.entries(grouped).map(([event, times]) => (
          <div key={event} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-blue-900 capitalize">{event}</h2>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {times.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-5 py-3 text-right font-mono text-blue-700">{formatTime(r.time_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create app/login/page.tsx**

```tsx
'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Sign In</h1>
        <form action={action} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={pending} className="w-full bg-blue-800 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          New swimmer? <Link href="/register" className="text-blue-700 hover:underline">Join the team</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create app/register/page.tsx**

```tsx
'use client'

import { useActionState } from 'react'
import { register } from '@/app/actions/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Join the Marlins</h1>
        <form action={action} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required minLength={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input name="age" type="number" min={8} max={18} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stroke Specialty</label>
            <select name="strokeSpecialty" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a stroke</option>
              <option value="freestyle">Freestyle</option>
              <option value="backstroke">Backstroke</option>
              <option value="breaststroke">Breaststroke</option>
              <option value="butterfly">Butterfly</option>
              <option value="individual medley">Individual Medley</option>
            </select>
          </div>
          <button type="submit" disabled={pending} className="w-full bg-blue-800 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {pending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already a member? <Link href="/login" className="text-blue-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Verify all public pages render**

```bash
npm run seed && npm run dev
```
Visit each page and verify it renders without errors:
- http://localhost:3000/
- http://localhost:3000/about
- http://localhost:3000/schedule
- http://localhost:3000/records
- http://localhost:3000/login
- http://localhost:3000/register

- [ ] **Step 9: Commit**

```bash
git add app/
git commit -m "feat: add public pages — landing, about, schedule, records, login, register"
```

---

## Task 6: Authenticated Layout & Dashboard

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `requireAuth`, `getSession` from Task 4; `getAllEvents`, `getSignupsForUser` from Task 2
- Produces: `/dashboard` shows personalized welcome and upcoming signups

- [ ] **Step 1: Create app/(auth)/layout.tsx**

```tsx
import { getSession } from '@/lib/session'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session.userId) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/dashboard" className="text-lg font-bold">🐟 Riverside Marlins</Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="hover:text-blue-200">Dashboard</Link>
          <Link href="/events" className="hover:text-blue-200">Events</Link>
          {session.role === 'swimmer' && <Link href="/profile" className="hover:text-blue-200">My Profile</Link>}
          {session.role === 'coach' && <Link href="/roster" className="hover:text-blue-200">Roster</Link>}
          <span className="text-blue-300">|</span>
          <span className="text-blue-200">{session.name}</span>
          <form action={logout}>
            <button type="submit" className="text-blue-300 hover:text-white">Sign out</button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Create app/(auth)/dashboard/page.tsx**

```tsx
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { getAllEvents } from '@/lib/queries/events'
import { getSignupsForUser } from '@/lib/queries/signups'
import Link from 'next/link'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function DashboardPage() {
  const session = await getSession()
  const db = getDb()
  const allEvents = getAllEvents(db)
  const signups = getSignupsForUser(db, session.userId!)
  const signedUpIds = new Set(signups.map(s => s.event_id))
  const upcomingSignups = allEvents.filter(e => signedUpIds.has(e.id))

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-1">Welcome back, {session.name}!</h1>
      <p className="text-gray-500 mb-8 capitalize">Signed in as {session.role}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Your Upcoming Events ({upcomingSignups.length})</h2>
          {upcomingSignups.length === 0 ? (
            <p className="text-sm text-gray-500">You haven't signed up for any events yet. <Link href="/events" className="text-blue-700 hover:underline">Browse events</Link></p>
          ) : (
            <ul className="space-y-3">
              {upcomingSignups.map(event => (
                <li key={event.id} className="text-sm">
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-gray-500">{formatDate(event.event_date)} · {event.location}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/events" className="text-blue-700 hover:underline">Browse & sign up for events →</Link></li>
            {session.role === 'swimmer' && <li><Link href="/profile" className="text-blue-700 hover:underline">View my times & records →</Link></li>}
            {session.role === 'coach' && <li><Link href="/events/new" className="text-blue-700 hover:underline">Create a new event →</Link></li>}
            {session.role === 'coach' && <li><Link href="/roster" className="text-blue-700 hover:underline">View team roster →</Link></li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify login flow and dashboard**

```bash
npm run dev
```
1. Navigate to http://localhost:3000/login
2. Log in as `emma@marlins.com` / `password123` — should land on `/dashboard` showing swimmer nav
3. Log out and log in as `sarah@marlins.com` / `password123` — should show coach nav with Roster link
4. Navigate to http://localhost:3000/dashboard while logged out — should redirect to `/login`

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add authenticated layout and dashboard with event signup summary"
```

---

## Task 7: Events Pages & Signup Actions

**Files:**
- Create: `app/actions/events.ts`
- Create: `app/(auth)/events/page.tsx`
- Create: `app/(auth)/events/new/page.tsx`

**Interfaces:**
- Consumes: `getAllEvents`, `createEvent`, `deleteEvent` from Task 2; `getSignupsForUser`, `signUpForEvent`, `withdrawFromEvent` from Task 2; `requireAuth`, `requireCoach` from Task 4
- Produces: swimmer can sign up/withdraw; coach can create/delete events

- [ ] **Step 1: Create app/actions/events.ts**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import { createEvent, deleteEvent } from '@/lib/queries/events'
import { signUpForEvent, withdrawFromEvent } from '@/lib/queries/signups'
import { requireAuth, requireCoach } from '@/lib/session'

export async function signUp(eventId: number) {
  const session = await requireAuth()
  const db = getDb()
  signUpForEvent(db, eventId, session.userId!)
  revalidatePath('/events')
  revalidatePath('/dashboard')
}

export async function withdraw(eventId: number) {
  const session = await requireAuth()
  const db = getDb()
  withdrawFromEvent(db, eventId, session.userId!)
  revalidatePath('/events')
  revalidatePath('/dashboard')
}

export async function createNewEvent(formData: FormData) {
  const session = await requireCoach()
  const db = getDb()
  createEvent(db, {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    eventDate: formData.get('eventDate') as string,
    location: formData.get('location') as string,
    eventType: formData.get('eventType') as string,
    createdBy: session.userId!,
  })
  redirect('/events')
}

export async function removeEvent(eventId: number) {
  await requireCoach()
  const db = getDb()
  deleteEvent(db, eventId)
  revalidatePath('/events')
}
```

- [ ] **Step 2: Create app/(auth)/events/page.tsx**

```tsx
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { getAllEvents } from '@/lib/queries/events'
import { getSignupsForUser, isSignedUp } from '@/lib/queries/signups'
import { signUp, withdraw, removeEvent } from '@/app/actions/events'
import Link from 'next/link'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const eventTypeBadge: Record<string, string> = {
  meet: 'bg-red-100 text-red-700',
  practice: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-600',
}

export default async function EventsPage() {
  const session = await getSession()
  const db = getDb()
  const events = getAllEvents(db)
  const signups = getSignupsForUser(db, session.userId!)
  const signedUpIds = new Set(signups.map(s => s.event_id))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Upcoming Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} events scheduled</p>
        </div>
        {session.role === 'coach' && (
          <Link href="/events/new" className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Create Event
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {events.map(event => {
          const signed = signedUpIds.has(event.id)
          return (
            <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-semibold text-gray-900">{event.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventTypeBadge[event.event_type]}`}>
                    {event.event_type}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{formatDate(event.event_date)} · {event.location}</p>
                {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {signed ? (
                  <form action={withdraw.bind(null, event.id)}>
                    <button type="submit" className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                      Withdraw
                    </button>
                  </form>
                ) : (
                  <form action={signUp.bind(null, event.id)}>
                    <button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-blue-800 text-white hover:bg-blue-700">
                      Sign Up
                    </button>
                  </form>
                )}
                {session.role === 'coach' && (
                  <form action={removeEvent.bind(null, event.id)}>
                    <button type="submit" className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app/(auth)/events/new/page.tsx**

```tsx
import { requireCoach } from '@/lib/session'
import { createNewEvent } from '@/app/actions/events'

export default async function NewEventPage() {
  await requireCoach()

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Create New Event</h1>
      <form action={createNewEvent} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input name="title" type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
          <input name="eventDate" type="datetime-local" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input name="location" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
          <select name="eventType" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="practice">Practice</option>
            <option value="meet">Meet</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-800 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
          Create Event
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Verify events flow**

```bash
npm run dev
```
1. Log in as `emma@marlins.com` — visit `/events`, sign up for an event, verify button changes to "Withdraw"
2. Log in as `sarah@marlins.com` — visit `/events`, verify "Delete" buttons appear, create a new event via `/events/new`
3. Try navigating to `/events/new` as swimmer — should redirect to `/dashboard`

- [ ] **Step 5: Commit**

```bash
git add app/actions/events.ts app/\(auth\)/events/
git commit -m "feat: add events pages with signup/withdraw for swimmers and create/delete for coaches"
```

---

## Task 8: Profile & Roster Pages

**Files:**
- Create: `app/(auth)/profile/page.tsx`
- Create: `app/(auth)/roster/page.tsx`

**Interfaces:**
- Consumes: `getSwimmerByUserId`, `getAllSwimmers` from Task 2; `getRecordsForSwimmer`, `getTeamRecords` from Task 2; `requireCoach` from Task 4

- [ ] **Step 1: Create app/(auth)/profile/page.tsx**

```tsx
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { getSwimmerByUserId } from '@/lib/queries/swimmers'
import { getRecordsForSwimmer } from '@/lib/queries/records'

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

export default async function ProfilePage() {
  const session = await getSession()
  const db = getDb()
  const swimmer = getSwimmerByUserId(db, session.userId!)
  const records = swimmer ? getRecordsForSwimmer(db, swimmer.id) : []

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-blue-900 mb-1">{session.name}</h1>
      <p className="text-gray-500 mb-8">
        {swimmer?.age ? `Age ${swimmer.age} · ` : ''}
        {swimmer?.stroke_specialty ? `Specialty: ${swimmer.stroke_specialty}` : 'No specialty set'}
      </p>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-5 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-blue-900">My Times</h2>
        </div>
        {records.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500">No recorded times yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Stroke</th>
                <th className="px-5 py-3 text-left">Distance</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-5 py-3 capitalize">{r.stroke}</td>
                  <td className="px-5 py-3">{r.distance}m</td>
                  <td className="px-5 py-3 text-right font-mono text-blue-700">{formatTime(r.time_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create app/(auth)/roster/page.tsx**

```tsx
import { requireCoach } from '@/lib/session'
import { getDb } from '@/lib/db'
import { getAllSwimmers } from '@/lib/queries/swimmers'
import { getRecordsForSwimmer } from '@/lib/queries/records'

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

export default async function RosterPage() {
  await requireCoach()
  const db = getDb()
  const swimmers = getAllSwimmers(db)

  return (
    <div>
      <h1 className="text-2xl font-bold text-blue-900 mb-8">Team Roster ({swimmers.length} swimmers)</h1>
      <div className="space-y-4">
        {swimmers.map(swimmer => {
          const records = getRecordsForSwimmer(db, swimmer.id)
          return (
            <div key={swimmer.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                <div>
                  <div className="font-semibold text-gray-900">{swimmer.name}</div>
                  <div className="text-sm text-gray-500">
                    {swimmer.age ? `Age ${swimmer.age} · ` : ''}
                    {swimmer.stroke_specialty ?? 'No specialty'}
                  </div>
                </div>
                <span className="text-sm text-gray-400">{records.length} times recorded</span>
              </div>
              {records.length > 0 && (
                <table className="w-full text-sm">
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-5 py-2 text-gray-500 capitalize">{r.stroke}</td>
                        <td className="px-5 py-2 text-gray-500">{r.distance}m</td>
                        <td className="px-5 py-2 text-right font-mono text-blue-700">{formatTime(r.time_seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify profile and roster**

```bash
npm run dev
```
1. Log in as `emma@marlins.com` — visit `/profile`, verify times are displayed
2. Log in as `sarah@marlins.com` — visit `/roster`, verify all swimmers and their records are listed
3. Log in as `emma@marlins.com` — navigate to `/roster`, verify redirect to `/dashboard`

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/profile/ app/\(auth\)/roster/
git commit -m "feat: add profile page for swimmers and roster page for coaches"
```

---

## Self-Review

**Spec coverage check:**
- ✓ Public pages: /, /about, /schedule, /records, /register, /login
- ✓ Swimmer auth: /dashboard, /events (signup/withdraw), /profile
- ✓ Coach auth: /dashboard, /events (create/delete), /events/new, /roster
- ✓ Username/password with SQLite
- ✓ iron-session cookie auth
- ✓ better-sqlite3 + server actions, no external services
- ✓ Seed data: 2 coaches, 8 swimmers, records, meets, events
- ✓ Middleware protecting all auth routes
- ✓ Role enforcement server-side on coach actions

**Placeholder scan:** No TBDs or incomplete steps found.

**Type consistency:** All function signatures defined in Task 2 are used consistently in Tasks 4-8. `formatTime` is duplicated in records/profile/roster — acceptable since each file is self-contained; a shared utility can be extracted later if desired.
