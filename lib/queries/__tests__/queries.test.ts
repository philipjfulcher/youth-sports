import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { createUser, getUserByEmail } from '../users'
import { createSwimmer, getSwimmerByUserId, getAllSwimmers } from '../swimmers'
import { getAllEvents, createEvent, deleteEvent, getEventById } from '../events'
import { signUpForEvent, withdrawFromEvent, isSignedUp, getSignupsForUser } from '../signups'
import { getTeamRecords } from '../records'
import { getAllMeets } from '../meets'

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
