import type React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToString } from 'react-dom/server'

// Mock lib/handbook before importing the page
vi.mock('@/lib/handbook', () => ({
  getHandbookContent: vi.fn(),
}))

// Mock next/link to avoid Next.js router dependency
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

// Mock react-markdown to avoid ESM issues in test env
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}))

import * as handbookLib from '@/lib/handbook'
import HandbookPage from './page'

describe('HandbookPage smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the default section when no section param is given', async () => {
    vi.mocked(handbookLib.getHandbookContent).mockResolvedValue('# Swimmer Handbook content')
    const element = await HandbookPage({ searchParams: {} })
    const html = renderToString(element)
    expect(html).toContain('Swimmer Handbook')
    expect(html).toContain('Swimmer Handbook content')
  })

  it('renders a valid section when section param is provided', async () => {
    vi.mocked(handbookLib.getHandbookContent).mockResolvedValue('# Parent Handbook content')
    const element = await HandbookPage({ searchParams: { section: 'parents' } })
    const html = renderToString(element)
    expect(html).toContain('Parent Handbook content')
    expect(handbookLib.getHandbookContent).toHaveBeenCalledWith('parents')
  })

  it('falls back to first section for an invalid/unrecognized section param', async () => {
    vi.mocked(handbookLib.getHandbookContent).mockResolvedValue('# Default content')
    const element = await HandbookPage({ searchParams: { section: 'unknown-section' } })
    const html = renderToString(element)
    // Should have called with the first section slug, not the invalid one
    expect(handbookLib.getHandbookContent).toHaveBeenCalledWith('swimmers')
    expect(html).toContain('Default content')
  })

  it('renders placeholder when content is null (missing file)', async () => {
    vi.mocked(handbookLib.getHandbookContent).mockResolvedValue(null)
    const element = await HandbookPage({ searchParams: { section: 'swimmers' } })
    const html = renderToString(element)
    expect(html).toContain('Content coming soon.')
  })
})
