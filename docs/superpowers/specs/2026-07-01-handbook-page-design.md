# Handbook Page — Design Spec

**Date:** 2026-07-01  
**Status:** Approved

## Overview

Add a public `/handbook` page to the Riverside Marlins site where coaches can publish Markdown handbooks for swimmers and parents. Content is maintained as `.md` files in the repository; no in-browser editing is required. The page supports sidebar navigation between multiple handbook sections and is designed to be extended with additional sections in the future.

## Architecture

### Content Storage

Markdown source files live in `content/handbooks/` at the repo root, named by section slug:

```
content/handbooks/
  index.ts        # ordered section config
  swimmers.md
  parents.md
```

`index.ts` exports an ordered array of section entries:

```ts
export const handbookSections = [
  { slug: 'swimmers', label: 'Swimmer Handbook' },
  { slug: 'parents',  label: 'Parent Handbook' },
]
```

Adding a new section requires:
1. Creating `content/handbooks/<slug>.md`
2. Adding an entry to `handbookSections` in `index.ts`

### Page Route

`app/handbook/page.tsx` — a Next.js Server Component (no `"use client"`).

**Request flow:**
1. Read `section` from search params; fall back to `handbookSections[0].slug` if missing or unrecognized
2. Read the corresponding `.md` file from disk via `fs.readFile`
3. Render the markdown with `react-markdown` inside a `prose`-styled content area
4. If the file is missing (content not yet written), render a "Content coming soon" placeholder instead of throwing

The URL `?section=swimmers` is bookmarkable and shareable. Switching sections triggers a server re-render.

## UI Layout

Two-column layout matching the visual style of other public pages in the app:

- **Left sidebar** (~1/4 width): lists all sections from `handbookSections`. Active section is highlighted. Each item is an `<a>` linking to `?section=<slug>`.
- **Right content area** (~3/4 width): renders the selected section's Markdown with Tailwind `prose` typography styles.

The page is linked from the public navigation (alongside `/schedule`, `/records`, `/coaches`).

## Dependencies

- **`react-markdown`** — renders Markdown strings to React elements; works in Server Components
- **`@tailwindcss/typography`** — provides `prose` classes for styling rendered HTML content

## Error Handling

| Scenario | Behavior |
|---|---|
| `section` param missing or unrecognized | Fall back to first configured section |
| `.md` file missing for a valid slug | Render "Content coming soon" message |
| Unhandled read error | Next.js default error boundary |

## Testing

Render smoke tests for each configured section slug — verify the page renders without throwing and displays either the expected content or the placeholder.

## Out of Scope

- In-browser editing
- Auth-gating
- File upload or CMS integration
- Per-section access control
