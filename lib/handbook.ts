import { readFile } from 'fs/promises'
import path from 'path'

export async function getHandbookContent(slug: string): Promise<string | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid handbook slug: ${slug}`)
  const filePath = path.join(process.cwd(), 'content', 'handbooks', `${slug}.md`)
  try {
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') return null
    throw err
  }
}
