import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'path'

// Mock fs/promises so tests don't read real files
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}))

import * as fs from 'fs/promises'

// Import after mocking
import { getHandbookContent } from './page'

describe('getHandbookContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns file content for a valid slug', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('# Hello' as any)
    const result = await getHandbookContent('swimmers')
    expect(result).toBe('# Hello')
  })

  it('returns null when file is missing', async () => {
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    vi.mocked(fs.readFile).mockRejectedValue(err)
    const result = await getHandbookContent('swimmers')
    expect(result).toBeNull()
  })
})
