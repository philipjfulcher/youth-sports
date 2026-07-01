# Handbook Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/handbook` page with a sidebar that lets visitors switch between Markdown-sourced handbook sections (swimmers, parents, and future additions).

**Architecture:** Markdown files live in `content/handbooks/`; a config file exports the ordered section list. The Next.js Server Component at `app/handbook/page.tsx` reads the `?section=` search param, loads the matching `.md` file from disk, and renders it with `react-markdown`. The sidebar renders links that update the search param.

**Tech Stack:** Next.js 14 App Router, React Server Components, `react-markdown`, `@tailwindcss/typography`, Vitest

## Global Constraints

- Next.js 14 — use Server Components (no `"use client"` unless required)
- Tailwind CSS — match existing page styles (`max-w-3xl mx-auto px-6 py-12`, blue-900 headings)
- No database calls on this page
- Page is public (no auth check)
- Vitest for tests (`npm test`)

---

### Task 1: Install dependencies and configure Tailwind typography

**Files:**
- Modify: `package.json`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Produces: `prose` Tailwind class available in JSX; `react-markdown` importable

- [ ] **Step 1: Install packages**

```bash
npm install react-markdown @tailwindcss/typography
```

Expected: packages added to `node_modules` and `package.json` dependencies.

- [ ] **Step 2: Add typography plugin to Tailwind config**

Open `tailwind.config.ts` and replace the plugins line:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
```

- [ ] **Step 3: Verify build compiles**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tailwind.config.ts
git commit -m "feat: install react-markdown and tailwindcss/typography"
```

---

### Task 2: Create handbook content files and section config

**Files:**
- Create: `content/handbooks/index.ts`
- Create: `content/handbooks/swimmers.md`
- Create: `content/handbooks/parents.md`

**Interfaces:**
- Produces: `handbookSections: Array<{ slug: string; label: string }>` exported from `content/handbooks/index.ts`

- [ ] **Step 1: Create the section config**

Create `content/handbooks/index.ts`:

```ts
export const handbookSections = [
  { slug: 'swimmers', label: 'Swimmer Handbook' },
  { slug: 'parents', label: 'Parent Handbook' },
] as const

export type HandbookSection = typeof handbookSections[number]
```

- [ ] **Step 2: Create the swimmer handbook**

Create `content/handbooks/swimmers.md`:

```markdown
# Swimmer Handbook

Welcome to the Riverside Marlins! This handbook covers everything you need to know as a swimmer on our team.

## Practice Expectations

- Arrive 10 minutes before practice begins
- Bring your own swimsuit, goggles, and swim cap
- Notify your coach in advance if you will miss a practice

## Meet Day

- Check the meet schedule posted on the website
- Warm up at least 30 minutes before your first event
- Cheer on your teammates — team spirit matters!

## Code of Conduct

All swimmers are expected to show respect to coaches, teammates, officials, and competitors at all times.
```

- [ ] **Step 3: Create the parent handbook**

Create `content/handbooks/parents.md`:

```markdown
# Parent Handbook

Thank you for being part of the Riverside Marlins family! This handbook explains how you can support your swimmer and our team.

## Communication

- Coaches communicate via email and the team website
- Direct coaching feedback through the head coach — do not approach officials at meets

## Volunteering

- Meets require parent volunteers for timekeeping and setup
- Sign up via the volunteer sheet shared before each meet

## Financial Obligations

- Dues are collected at the start of each season
- Meet entry fees are billed separately before each competition

## Code of Conduct

Parents are expected to model positive behavior and encourage all swimmers, not just their own child.
```

- [ ] **Step 4: Commit**

```bash
git add content/handbooks/
git commit -m "feat: add handbook content files and section config"
```

---

### Task 3: Build the handbook page

**Files:**
- Create: `app/handbook/page.tsx`

**Interfaces:**
- Consumes: `handbookSections` from `content/handbooks/index.ts`; `fs/promises.readFile` from Node; `ReactMarkdown` from `react-markdown`
- Produces: Server Component at `/handbook` that renders sidebar + markdown content

- [ ] **Step 1: Write the failing test**

Create `app/handbook/page.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- app/handbook/page.test.ts
```

Expected: FAIL — `getHandbookContent` not found.

- [ ] **Step 3: Implement the page**

Create `app/handbook/page.tsx`:

```tsx
import { readFile } from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { handbookSections } from '@/content/handbooks/index'

export const dynamic = 'force-dynamic'

export async function getHandbookContent(slug: string): Promise<string | null> {
  const filePath = path.join(process.cwd(), 'content', 'handbooks', `${slug}.md`)
  try {
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (err: any) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

export default async function HandbookPage({
  searchParams,
}: {
  searchParams: { section?: string }
}) {
  const validSlugs = handbookSections.map((s) => s.slug)
  const activeSlug =
    searchParams.section && validSlugs.includes(searchParams.section as any)
      ? searchParams.section
      : handbookSections[0].slug

  const content = await getHandbookContent(activeSlug)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex gap-8">
      {/* Sidebar */}
      <aside className="w-48 shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
          Handbooks
        </h2>
        <nav className="flex flex-col gap-1">
          {handbookSections.map((section) => (
            <Link
              key={section.slug}
              href={`/handbook?section=${section.slug}`}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                section.slug === activeSlug
                  ? 'bg-blue-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {content ? (
          <article className="prose prose-blue max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        ) : (
          <p className="text-gray-500 italic">Content coming soon.</p>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- app/handbook/page.test.ts
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add app/handbook/page.tsx app/handbook/page.test.ts
git commit -m "feat: add handbook page with sidebar and markdown rendering"
```

---

### Task 4: Add Handbook link to global navigation

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing new — just adds an `<Link>` to the existing nav

- [ ] **Step 1: Add the nav link**

Open `app/layout.tsx`. In the `<div className="flex gap-6 text-sm font-medium">` nav block, add a Handbook link after Records:

```tsx
<Link href="/coaches" className="hover:text-blue-200">Coaches</Link>
<Link href="/schedule" className="hover:text-blue-200">Schedule</Link>
<Link href="/records" className="hover:text-blue-200">Records</Link>
<Link href="/handbook" className="hover:text-blue-200">Handbook</Link>
<Link href="/register" className="hover:text-blue-200">Join the Team</Link>
<Link href="/login" className="bg-white text-blue-800 px-3 py-1 rounded hover:bg-blue-100">Login</Link>
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add Handbook link to global nav"
```
