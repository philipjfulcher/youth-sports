import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { handbookSections } from '@/content/handbooks/index'
import { getHandbookContent } from '@/lib/handbook'

export const dynamic = 'force-dynamic'

export default async function HandbookPage({
  searchParams,
}: {
  searchParams: { section?: string }
}) {
  const validSlugs = handbookSections.map((s) => s.slug)
  const section = Array.isArray(searchParams.section) ? searchParams.section[0] : searchParams.section
  const activeSlug =
    section && validSlugs.includes(section)
      ? section
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
