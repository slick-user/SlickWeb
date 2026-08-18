import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildNotes } from './build-notes.ts'

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function parseArgs(argv: string[]): { title: string; flags: Record<string, string> } {
  const positional: string[] = []
  const flags: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a) continue
    if (a.startsWith('--')) {
      flags[a.slice(2)] = argv[i + 1] ?? ''
      i++
    } else {
      positional.push(a)
    }
  }
  return { title: positional[0] ?? flags.title ?? '', flags }
}

const USAGE = `Usage: bun run new:note "Note Title" [--tag writeup] [--category general] [--date 2026-01-01]`

const { title, flags } = parseArgs(process.argv.slice(2))
if (!title) {
  console.error(USAGE)
  process.exit(1)
}

const slug = slugify(title)
if (!slug) {
  console.error(`Could not slugify title "${title}"`)
  process.exit(1)
}

const NOTES_DIR = join(process.cwd(), 'public', 'pages', 'notes')
const mdPath = join(NOTES_DIR, `${slug}.md`)
if (existsSync(mdPath)) {
  console.error(`Already exists: ${mdPath}`)
  process.exit(1)
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
const date = flags.date ?? new Date().toISOString().slice(0, 10)
const tag = flags.tag ?? 'writeup'
const category = flags.category ?? 'general'

const md = [
  '---',
  `title: "${esc(title)}"`,
  `date: ${date}`,
  `tag: ${tag}`,
  `category: ${category}`,
  '---',
  '',
  `# ${title}`,
  '',
  'Start writing your note here.',
  '',
].join('\n')

mkdirSync(join(process.cwd(), 'public', 'assets', 'notes', slug), { recursive: true })
writeFileSync(mdPath, md)

console.log(`Created ${mdPath}`)
console.log(`Created public/assets/notes/${slug}/ — drop images here and embed with ![[name.png]]`)

buildNotes()