import { Hono } from 'hono'
import { marked } from 'marked'

type Env = { ASSETS: Fetcher }

const app = new Hono<{ Bindings: Env }>()

// Notes data — add entries here as you write
const notes: { title: string, date: string, tag: string, category: string, url: string }[] = [
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

function notesHtml(tag: string, category: string): string {
  let filtered = tag === 'all' ? notes : notes.filter(n => n.tag === tag)
  if (category !== 'all') filtered = filtered.filter(n => n.category === category)

  if (filtered.length === 0) {
    return `<div class="notes-empty">No notes yet — check back soon.</div>`
  }
  return filtered.map(n => `
    <div class="note-row">
      <a class="note-title" href="/note/${n.url}">${n.title}</a>
      <div class="note-meta">
        <span class="note-tag tag-${n.tag}">${n.tag}</span>
        <span class="note-category">${n.category}</span>
        <span>${n.date}</span>
      </div>
    </div>
  `).join('')
}

// Shell Rendering
function shell(page: string, preload: string = '') {
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
    <main>
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
        <article class="note-content">
          <h1>${title}</h1>
          ${content}
        </article>
      </div>
    </div>
  `
}


function obsidianToMd(text: string, slug: string): string {
  // convert ![[image.png]] to the appropriate image
  return text.replace(/!\[\[(.+?)\]\]/g, (_, filename) => {
    return `![${filename}](/assets/notes/${slug}/${filename})`
  })
}

// Note route — reads markdown from assets
app.get('/note/:slug', async (c) => {
  const slug = c.req.param('slug')
  const assetUrl = new URL(`/pages/notes/${slug}.md`, c.req.url)
  const res = await c.env.ASSETS.fetch(new Request(assetUrl))
  if (!res.ok) return c.html(shell('/pages/notes.html'), 404)
  const text = await res.text()
  const processed = obsidianToMd(text, slug)
  const content = await marked(processed) as string
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  if (c.req.header('HX-Request')) {
    return c.html(`
      <article class="note-content">
        <h1>${title}</h1>
        ${content}
      </article>
    `)
  }

  return c.html(shell('', noteShell(title, content, slug)))
})

// Filter endpoint
app.get('/notes/filter', (c) => {
  const tag = c.req.query('tag') || 'all'
  const category = c.req.query('category') || 'all'
  return c.html(notesHtml(tag, category))
})

// Notes page — renders filter UI + list together
app.get('/notes', (c) => {
  const tag = c.req.query('tag') || 'all'
  const category = c.req.query('category') || 'all'
  const preload = filterTabsHtml(tag, category) + `<div id="notes-list">` + notesHtml(tag, category) + `</div>`
  return c.html(shell('/pages/notes.html', preload))
})

// Shell routes
app.get('/', (c) => c.html(shell('/pages/about.html')))
app.get('/about', (c) => c.html(shell('/pages/about.html')))

// Fall through to static assets for everything else
app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
