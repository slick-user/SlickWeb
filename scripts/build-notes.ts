import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type Note = { title: string; date: string; tag: string; category: string; url: string }

const NOTES_DIR = join(process.cwd(), 'public', 'pages', 'notes')
const ASSETS_DIR = join(process.cwd(), 'public', 'assets', 'notes')
const OUT = join(process.cwd(), 'public', 'notes.json')

function parseFrontmatter(text: string): { meta: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return { meta: {}, body: text }
  const meta: Record<string, string> = {}
  for (const line of (m[1] ?? '').split(/\r?\n/)) {
    const kv = /^([^:]+):\s*(.*)$/.exec(line)
    const key = kv?.[1]?.trim()
    const value = kv?.[2]?.trim() ?? ''
    if (key) meta[key] = value
  }
  return { meta, body: text.slice(m[0].length) }
}

function normalizeDate(date: string): string {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date)
  if (!m) throw new Error(`Invalid date "${date}" (expected YYYY-MM-DD)`)
  return `${m[1]}-${(m[2] ?? '0').padStart(2, '0')}-${(m[3] ?? '0').padStart(2, '0')}`
}

export function buildNotes(): Note[] {
  if (!existsSync(NOTES_DIR)) {
    console.error(`Notes dir not found: ${NOTES_DIR}`)
    process.exit(1)
  }

  const files = readdirSync(NOTES_DIR).filter(f => f.endsWith('.md')).sort()
  const notes: Note[] = []
  const warnings: string[] = []

  for (const file of files) {
    const slug = file.slice(0, -3)
    const { meta, body } = parseFrontmatter(readFileSync(join(NOTES_DIR, file), 'utf8'))

    const title = meta['title']
    const dateStr = meta['date']
    const tag = meta['tag']
    const category = meta['category']
    if (!title || !dateStr || !tag || !category) {
      throw new Error(`${file}: missing frontmatter key(s) ["title", "date", "tag", "category"]`)
    }

    notes.push({ title, date: normalizeDate(dateStr), tag, category, url: slug })

    const images = [...body.matchAll(/!\[\[([^\]]+)\]\]/g)]
    for (const match of images) {
      const filename = (match[1]?.split('|')[0] ?? '').trim()
      if (!filename) continue
      const dest = join(ASSETS_DIR, slug, filename)
      if (!existsSync(dest)) {
        warnings.push(`${file}: image "${filename}" not found at ${dest.replace(process.cwd() + '\\', '')}`)
      }
    }
  }

  notes.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : b.date.localeCompare(a.date)))

  writeFileSync(OUT, JSON.stringify(notes, null, 2) + '\n')

  console.log(`notes.json: ${notes.length} notes (${files.length} files)`)
  for (const w of warnings) console.warn(`WARN ${w}`)
  if (warnings.length > 0) console.warn('Missing images will appear broken on the site.')

  return notes
}

if (import.meta.main) {
  try {
    buildNotes()
  } catch (e) {
    console.error(`Failed: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }
}