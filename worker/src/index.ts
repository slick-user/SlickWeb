import { Hono } from 'hono'
import { marked } from 'marked'

type Env = { ASSETS: Fetcher }

const app = new Hono<{ Bindings: Env }>()

type Note = { title: string, date: string, tag: string, category: string, url: string }

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Notes data — add entries here as you write
const notes: Note[] = [
  { title: "Example 1", date: "2026-04-10", tag: "writeup", category: "general", url: "help" },
  { title: "Example 2", date: "2026-4-23", tag: "writeup", category: "general", url: "test" },
  { title: "Pico CTF", date: "2026-4-24", tag: "writeup", category: "picoctf", url: "PicoCTF" },
  { title: "Silly Shenanigans", date: "2026-5-26", tag: "writeup", category: "pwn-college", url: "sillyShenanigans" },
  { title: "Linux Luminarium", date: "2026-4-24", tag: "writeup", category: "pwn-college", url: "linuxLuminarium" },
  { title: "intercepting Web", date: "2026-5-26", tag: "writeup", category: "pwn-college", url: "interceptingWeb" },
  { title: "PWN College", date: "2026-4-24", tag: "writeup", category: "pwn-college", url: "pwn-college" },
]

// Categorization and Filtering
function buildTaxonomy() {
  const taxonomy: Record<string, Set<string>> = {}
  for (const n of notes) {
    if (!taxonomy[n.tag]) taxonomy[n.tag] = new Set()
    taxonomy[n.tag].add(n.category)
  }
  return taxonomy
}

function filterTabsHtml(activeTag: string, activeCategory: string): string {
  const taxonomy = buildTaxonomy()

  const tagButtons = ['all', ...Object.keys(taxonomy)].map(t => `
    <button class="filter-btn ${t === activeTag ? 'active' : ''}"
            hx-get="/notes/filter?tag=${t}&category=all"
            hx-target="#notes-list"
            hx-push-url="/notes?tag=${t}"
            onclick="this.closest('.filter-bar').dataset.activeTag='${t}'">
      ${t}
    </button>
  `).join('')

  // Category sub-buttons — only shown when a specific tag is selected
  const categoryButtons = activeTag !== 'all'
    ? [...(taxonomy[activeTag] ?? [])].map(cat => `
        <button class="filter-btn filter-sub ${cat === activeCategory ? 'active' : ''}"
                hx-get="/notes/filter?tag=${activeTag}&category=${cat}"
                hx-target="#notes-list">
          ${cat}
        </button>
      `).join('')
    : ''

  return `
    <div class="filter-bar" data-active-tag="${activeTag}">
      <div class="filter-tags">${tagButtons}</div>
      ${categoryButtons ? `<div class="filter-categories">${categoryButtons}</div>` : ''}
    </div>
  `
}

function noteRowHtml(n: Note): string {
  return `
    <div class="note-row">
      <a class="note-title" href="/note/${n.url}">${escapeHtml(n.title)}</a>
      <div class="note-meta">
        <span class="note-tag tag-${escapeHtml(n.tag)}">${escapeHtml(n.tag)}</span>
        <span class="note-category">${escapeHtml(n.category)}</span>
        <span>${escapeHtml(n.date)}</span>
      </div>
    </div>
  `
}

function notesHtml(tag: string, category: string): string {
  let filtered = tag === 'all' ? notes : notes.filter(n => n.tag === tag)
  if (category !== 'all') filtered = filtered.filter(n => n.category === category)

  if (filtered.length === 0) {
    return `<div class="notes-empty">No notes yet — check back soon.</div>`
  }
  return filtered.map(noteRowHtml).join('')
}

// Shell Rendering
function shell(page: string, preload: string = '', mainClass: string = '') {
  const contentAttrs = page
    ? `hx-get="${page}" hx-trigger="load delay:50ms" hx-swap="innerHTML" hx-indicator="#loader"`
    : ''
  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azlan Ali Khan</title>
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js"
      integrity="sha384-/TgkGk7p307TH7EXJDuUlgG3Ce1UVolAOFopFekQkkXihi5u/6OCvVKyz1W+idaz"
      crossorigin="anonymous"><\/script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css">
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-python.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-bash.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-json.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-c.min.js"><\/script>
    <script src="/assets/client.js" defer><\/script>
    <link rel="stylesheet" href="/styles/main.css">
  </head>
  <body>
    <div class="htmx-indicator" id="loader"></div>
    <nav>
      <span class="nav-brand">SLICK USER</span>
      <ul class="nav-links">
        <li><a href="/" hx-get="/pages/about.html" hx-target="#content" hx-push-url="/" hx-indicator="#loader">About</a></li>
        <li><a href="/notes" hx-get="/pages/notes.html" hx-target="#content" hx-push-url="/notes" hx-indicator="#loader">Notes</a></li>
      </ul>
    </nav>
    <main${mainClass ? ` class="${mainClass}"` : ''}>
      <div id="content" ${contentAttrs}>
        ${preload}
      </div>
    </main>
    <footer>
      <p>&copy; ${new Date().getFullYear()} Azlan Ali Khan. All rights reserved.</p>
    </footer>
  </body>
  </html>`
}

function noteShell(title: string, content: string, slug: string): string {
  const sidebarItems = notes.map(n => `
    <a class="sidebar-note ${n.url === slug ? 'active' : ''}"
       href="/note/${n.url}"
       hx-get="/note/${n.url}"
       hx-target="#note-article"
       hx-push-url="/note/${n.url}">
      <span class="sidebar-tag tag-${n.tag}">${n.tag}</span>
      ${n.title}
    </a>
  `).join('')

  return `
    <div class="note-layout">
      <aside class="note-sidebar">
        <a class="breadcrumb"
           href="/notes"
           hx-get="/pages/notes.html"
           hx-target="#content"
           hx-push-url="/notes">← Notes</a>
        <div class="sidebar-list">${sidebarItems}</div>
      </aside>
      <div id="note-article">
        <article class="note-content" data-slug="${slug}">
          <h1>${title}</h1>
          ${noteMetaHtml(slug, wordCount(content))}
          ${content}
        </article>
      </div>
    </div>
  `
}


function wordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(' ').length : 0
}

function noteMetaHtml(slug: string, wt: number): string {
  const n = notes.find(x => x.url === slug)
  const mins = Math.max(1, Math.round(wt / 200))
  const tag = n?.tag ?? 'note'
  return `
    <div class="note-meta-header">
      <span class="note-tag tag-${escapeHtml(tag)}">${escapeHtml(tag)}</span>
      ${n ? `<span class="note-category">${escapeHtml(n.category)}</span>` : ''}
      ${n ? `<span class="note-date">${escapeHtml(n.date)}</span>` : ''}
      <span class="note-readtime">${mins} min read</span>
    </div>
  `
}

function obsidianToMd(text: string, slug: string): string {
  // convert ![[image.png]] to the appropriate image
  return text.replace(/!\[\[(.+?)\]\]/g, (_, filename) => {
    return `![${filename}](/assets/notes/${slug}/${encodeURI(filename)})`
  })
}

const CALLOTYPES: Record<string, string> = {
  note: 'note', info: 'info', tip: 'tip', success: 'success',
  warning: 'warning', danger: 'danger', error: 'danger', question: 'question',
  example: 'example', abstract: 'abstract', todo: 'todo',
}

function calloutsToHtml(text: string, slug: string): string {
  return text.replace(/^> \[!(\w+)\]([^\n]*)(?:\n(?:> .*|>))*/gm, (block, rawType, rawTitle) => {
    const kind = CALLOTYPES[String(rawType).toLowerCase()] ?? 'note'
    const lines = block.split('\n')
    const heading = String(lines.shift() ?? '').replace(/^>\s*\[!\w+\]\s*/, '').trim() || String(rawType)
    const body = lines.map(l => l.replace(/^>\s?/, '')).join('\n').trim()
    const bodyHtml = body ? marked(obsidianToMd(body, slug)) : ''
    return `<div class="callout callout-${kind}"><p class="callout-title">${escapeHtml(heading)}</p>${bodyHtml}</div>`
  })
}

// Note route — reads markdown from assets
app.get('/note/:slug', async (c) => {
  const slug = c.req.param('slug')
  const assetUrl = new URL(`/pages/notes/${slug}.md`, c.req.url)
  const res = await c.env.ASSETS.fetch(new Request(assetUrl))
  if (!res.ok) return c.html(shell('/pages/notes.html'), 404)
  const text = await res.text()
  const processed = calloutsToHtml(obsidianToMd(text, slug), slug)
  const content = await marked(processed) as string
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  if (c.req.header('HX-Request')) {
    return c.html(`
      <article class="note-content" data-slug="${slug}">
        <h1>${title}</h1>
        ${noteMetaHtml(slug, wordCount(content))}
        ${content}
      </article>
    `)
  }

  return c.html(shell('', noteShell(title, content, slug), 'note-main'))
})

// Filter endpoint
app.get('/notes/filter', (c) => {
  const tag = c.req.query('tag') || 'all'
  const category = c.req.query('category') || 'all'
  return c.html(notesHtml(tag, category))
})

// Search endpoint — matches titles and note contents
app.get('/notes/search', async (c) => {
  const q = (c.req.query('q') || '').trim().toLowerCase()
  if (!q) return c.html(notesHtml('all', 'all'))

  const results: Note[] = []
  for (const n of notes) {
    const assetUrl = new URL(`/pages/notes/${n.url}.md`, c.req.url)
    const res = await c.env.ASSETS.fetch(new Request(assetUrl))
    if (!res.ok) continue
    const text = (await res.text()).toLowerCase()
    if (n.title.toLowerCase().includes(q) || text.includes(q)) results.push(n)
  }

  if (results.length === 0) {
    return c.html(`<div class="notes-empty">No notes match “${escapeHtml(c.req.query('q') || '')}”.</div>`)
  }
  return c.html(results.map(noteRowHtml).join(''))
})

// Notes page — static partial drawn via htmx; the list self-populates on load
app.get('/notes', (c) => c.html(shell('/pages/notes.html')))

// Shell routes
app.get('/', (c) => c.html(shell('/pages/about.html')))
app.get('/about', (c) => c.html(shell('/pages/about.html')))

// Fall through to static assets for everything else
app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
