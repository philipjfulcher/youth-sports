import Database from 'better-sqlite3'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  // /tmp is the only writable directory in serverless environments (Netlify, Vercel, etc.)
  const dbPath = '/tmp/youth-sports.db'
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  runMigrations(db)
  autoSeed(db)
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

function autoSeed(db: Database.Database): void {
  // Use an exclusive transaction so parallel build workers don't race each other
  const seed = db.transaction(() => {
    const count = (db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n
    if (count > 0) return

  // Inline seed — bcryptjs hashSync is sync-safe
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcryptjs')
  const password = bcrypt.hashSync('password123', 10)

  const coach1Id = (db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Coach Sarah Mitchell', 'sarah@marlins.com', password, 'coach')).lastInsertRowid as number
  const coach2Id = (db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Coach David Torres', 'david@marlins.com', password, 'coach')).lastInsertRowid as number

  db.prepare('INSERT OR IGNORE INTO coaches (user_id, bio, years_experience) VALUES (?, ?, ?)').run(coach1Id, 'Sarah has 12 years of competitive swimming coaching experience. Former NCAA Division I swimmer at UNC. Specializes in butterfly and individual medley.', 12)
  db.prepare('INSERT OR IGNORE INTO coaches (user_id, bio, years_experience) VALUES (?, ?, ?)').run(coach2Id, 'David is a USA Swimming certified coach with a focus on sprint freestyle and backstroke. He brings energy and technical precision to every practice.', 7)

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
  const swimmerUserIds: number[] = []
  for (const s of swimmerData) {
    const userId = (db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(s.name, s.email, password, 'swimmer')).lastInsertRowid as number
    const swimmerId = (db.prepare('INSERT OR IGNORE INTO swimmers (user_id, age, stroke_specialty) VALUES (?, ?, ?)').run(userId, s.age, s.stroke)).lastInsertRowid as number
    swimmerIds.push(swimmerId)
    swimmerUserIds.push(userId)
  }

  const recordData: [number, string, number, number][] = [
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
    db.prepare('INSERT OR IGNORE INTO records (swimmer_id, stroke, distance, time_seconds) VALUES (?, ?, ?, ?)').run(sid, stroke, distance, time)
  }

  db.prepare('INSERT OR IGNORE INTO meets (name, date, location, results_summary) VALUES (?, ?, ?, ?)').run('Spring Invitational', '2026-03-15', 'Riverside Aquatic Center', '2nd place overall — 4 individual event wins, 1 relay championship')
  db.prepare('INSERT OR IGNORE INTO meets (name, date, location, results_summary) VALUES (?, ?, ?, ?)').run('County Championships', '2026-04-22', 'Westfield Natatorium', '1st place — team scored 312 points, 6 personal records broken')
  db.prepare('INSERT OR IGNORE INTO meets (name, date, location, results_summary) VALUES (?, ?, ?, ?)').run('Tri-City Dual Meet', '2026-05-08', 'Lakeside YMCA', 'Won 58-42 — strong showing in backstroke and butterfly events')

  const eventDates: [string, string, string, string, string][] = [
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
    const id = (db.prepare('INSERT OR IGNORE INTO events (title, description, event_date, location, event_type, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(title, description, date, location, type, coach1Id)).lastInsertRowid as number
    eventIds.push(id)
  }

  db.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[0], swimmerUserIds[0])
  db.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[0], swimmerUserIds[1])
  db.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[0], swimmerUserIds[2])
  db.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[2], swimmerUserIds[0])
  db.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[2], swimmerUserIds[3])
  db.prepare('INSERT OR IGNORE INTO event_signups (event_id, user_id) VALUES (?, ?)').run(eventIds[2], swimmerUserIds[4])
  }) // end transaction

  seed()
}
