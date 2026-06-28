import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockStmt = vi.hoisted(() => ({
  all: vi.fn(),
  get: vi.fn(),
  run: vi.fn(),
}))

vi.mock('../../db', () => ({
  conn: {
    prepare: vi.fn().mockResolvedValue(mockStmt),
  },
}))

import { createUser, getUserByEmail } from '../users'
import { createSwimmer, getSwimmerByUserId, getAllSwimmers } from '../swimmers'
import { getAllEvents, createEvent, deleteEvent, getEventById } from '../events'
import { signUpForEvent, withdrawFromEvent, isSignedUp, getSignupsForUser } from '../signups'
import { getTeamRecords } from '../records'
import { getAllMeets } from '../meets'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('users queries', () => {
  it('createUser calls run and returns lastInsertRowid', async () => {
    mockStmt.run.mockResolvedValue({ lastInsertRowid: 1 })
    const id = await createUser({ name: 'Alice', email: 'alice@test.com', passwordHash: 'hash', role: 'swimmer' })
    expect(id).toBe(1)
    expect(mockStmt.run).toHaveBeenCalledWith(['Alice', 'alice@test.com', 'hash', 'swimmer'])
  })

  it('getUserByEmail returns the row from get', async () => {
    const fakeUser = { id: 1, name: 'Alice', email: 'alice@test.com', password_hash: 'hash', role: 'swimmer', created_at: '' }
    mockStmt.get.mockResolvedValue(fakeUser)
    const user = await getUserByEmail('alice@test.com')
    expect(user).toEqual(fakeUser)
    expect(mockStmt.get).toHaveBeenCalledWith('alice@test.com')
  })

  it('getUserByEmail returns undefined when not found', async () => {
    mockStmt.get.mockResolvedValue(undefined)
    const user = await getUserByEmail('nobody@test.com')
    expect(user).toBeUndefined()
  })
})

describe('swimmers queries', () => {
  it('createSwimmer calls run and returns lastInsertRowid', async () => {
    mockStmt.run.mockResolvedValue({ lastInsertRowid: 5 })
    const id = await createSwimmer({ userId: 1, age: 14, strokeSpecialty: 'freestyle' })
    expect(id).toBe(5)
    expect(mockStmt.run).toHaveBeenCalledWith([1, 14, 'freestyle'])
  })

  it('getSwimmerByUserId returns the row from get', async () => {
    const fakeSwimmer = { id: 5, user_id: 1, age: 14, stroke_specialty: 'freestyle', joined_at: '' }
    mockStmt.get.mockResolvedValue(fakeSwimmer)
    const swimmer = await getSwimmerByUserId(1)
    expect(swimmer).toEqual(fakeSwimmer)
  })

  it('getAllSwimmers returns all rows', async () => {
    const fakeSwimmers = [
      { id: 1, user_id: 1, age: 12, stroke_specialty: 'backstroke', joined_at: '', name: 'C1', email: 'c1@test.com' },
      { id: 2, user_id: 2, age: 13, stroke_specialty: 'butterfly', joined_at: '', name: 'C2', email: 'c2@test.com' },
    ]
    mockStmt.all.mockResolvedValue(fakeSwimmers)
    const all = await getAllSwimmers()
    expect(all).toHaveLength(2)
    expect(all.map(s => s.name)).toContain('C1')
  })
})

describe('events queries', () => {
  it('createEvent calls run and returns lastInsertRowid', async () => {
    mockStmt.run.mockResolvedValue({ lastInsertRowid: 3 })
    const id = await createEvent({ title: 'Morning Practice', description: 'Early bird', eventDate: '2026-07-01T08:00', location: 'Pool A', eventType: 'practice', createdBy: null })
    expect(id).toBe(3)
  })

  it('getEventById returns the row from get', async () => {
    const fakeEvent = { id: 3, title: 'Morning Practice', description: null, event_date: '2026-07-01', location: null, event_type: 'practice', created_by: null }
    mockStmt.get.mockResolvedValue(fakeEvent)
    const event = await getEventById(3)
    expect(event!.title).toBe('Morning Practice')
  })

  it('deleteEvent calls run', async () => {
    mockStmt.run.mockResolvedValue({})
    await deleteEvent(3)
    expect(mockStmt.run).toHaveBeenCalledWith(3)
  })

  it('getAllEvents returns all rows', async () => {
    mockStmt.all.mockResolvedValue([{ id: 1 }, { id: 2 }])
    const events = await getAllEvents()
    expect(events).toHaveLength(2)
  })
})

describe('signups queries', () => {
  it('isSignedUp returns false when row is undefined', async () => {
    mockStmt.get.mockResolvedValue(undefined)
    expect(await isSignedUp(1, 1)).toBe(false)
  })

  it('isSignedUp returns true when row exists', async () => {
    mockStmt.get.mockResolvedValue({ id: 1 })
    expect(await isSignedUp(1, 1)).toBe(true)
  })

  it('signUpForEvent calls run', async () => {
    mockStmt.run.mockResolvedValue({})
    await signUpForEvent(1, 1)
    expect(mockStmt.run).toHaveBeenCalledWith([1, 1])
  })

  it('withdrawFromEvent calls run', async () => {
    mockStmt.run.mockResolvedValue({})
    await withdrawFromEvent(1, 1)
    expect(mockStmt.run).toHaveBeenCalledWith([1, 1])
  })

  it('getSignupsForUser returns rows from all', async () => {
    const fakeSignups = [{ id: 1, event_id: 2, user_id: 1, signed_up_at: '' }]
    mockStmt.all.mockResolvedValue(fakeSignups)
    const signups = await getSignupsForUser(1)
    expect(signups).toHaveLength(1)
    expect(signups[0].event_id).toBe(2)
  })
})

describe('records queries', () => {
  it('getTeamRecords returns all rows', async () => {
    const fakeRecords = [{ id: 1, swimmer_id: 1, stroke: 'freestyle', distance: 100, time_seconds: 58.4, recorded_at: '', name: 'R' }]
    mockStmt.all.mockResolvedValue(fakeRecords)
    const records = await getTeamRecords()
    expect(records).toHaveLength(1)
    expect(records[0].stroke).toBe('freestyle')
  })
})

describe('meets queries', () => {
  it('getAllMeets returns all rows', async () => {
    const fakeMeets = [{ id: 1, name: 'Spring Invite', date: '2026-05-10', location: 'City Pool', results_summary: '1st place' }]
    mockStmt.all.mockResolvedValue(fakeMeets)
    const meets = await getAllMeets()
    expect(meets).toHaveLength(1)
    expect(meets[0].name).toBe('Spring Invite')
  })
})
