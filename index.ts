import { Hono } from "hono";
import path from "path";

import { marked } from 'marked';

const app = new Hono();
const BASE = process.cwd();

function safeResolve(folder: string, name: string): string | null {
  const root = path.join(BASE, folder);
  const normalized = path.normalize(path.join(root, name));

  return normalized.startsWith(root) ? normalized : null;
}

async function serveFile(c: any, folder: string, name: string) {

  const filePath = safeResolve(folder, name);
  if (!filePath) return c.text("Forbidden", 403);

  const file = Bun.file(filePath);
  if (!(await file.exists())) return c.text("Not Found", 404);

  if (name.endsWith('.md')) {
    const text = await file.text();
    return c.html(marked(text));
  }

  if (name.endsWith('.css')) {
    return new Response(file, {
      headers: { 'Content-Type': 'text/css' }
    })
  }

  if (name.endsWith('.html')) {
    return new Response(file, { headers: { 'Content-Type': 'text/html' } })
  }

  return new Response(file);
}

function shell(page: string, preload: string = '') {
  const contentAttrs = page ? `hx-get="${page}" hx-trigger="load delay:50ms" hx-swap="innerHTML" hx-indicator="#loader"`
    : '';
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

// Notes data — add entries here as you write
const notes: { title: string, date: string, tag: string, url: string }[] = [
  { title: "example 1", date: "2026-04-10", tag: "writeup", url: "help" },
  { title: "example 2", date: "2026-04-10", tag: "writeup", url: "test" },
]

function notesHtml(tag: string): string {
  const filtered = tag === 'all' ? notes : notes.filter(n => n.tag === tag)
  if (filtered.length === 0) {
    return `<div class="notes-empty">No notes yet — check back soon.</div>`
  }
  return filtered.map(n => `
    <div class="note-row">
      <a class="note-title" href="/note/${n.url}">${n.title}</a>
      <div class="note-meta">
        <span class="note-tag tag-${n.tag}">${n.tag}</span>
        <span>${n.date}</span>
      </div>
    </div>
  `).join('')
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

app.get('/note/:slug', async (c) => {
  const slug = c.req.param('slug')
  const filePath = safeResolve('pages/notes', slug + '.md')
  if (!filePath) return c.html(shell('/pages/notes.html'), 403)
  const file = Bun.file(filePath)
  if (!await file.exists()) return c.html(shell('/pages/notes.html'), 404)
  const text = await file.text()
  const content = await marked(text) as string
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  // HTMX sidebar click — only return the article
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

// Filter endpoint for tab clicks
app.get('/notes/filter', (c) => {
  const tag = c.req.query('tag') || 'all'
  return c.html(notesHtml(tag))
})

// Routing
app.get("/", (c) => c.html(shell("/pages/about.html")));
app.get("/notes", (c) => c.html(shell("/pages/notes.html", notesHtml('all'))));
app.get("/about", (c) => c.html(shell("/pages/about.html")));

app.get('/styles/:file', async (c) => {
  const fileName = c.req.param('file');
  return serveFile(c, 'styles', fileName);
})

app.get('/pages/:page', async (c) => serveFile(c, 'pages', c.req.param('page')));
app.get('/partials/:partial', (c) => serveFile(c, 'partials', c.req.param('partial')));

app.get('/assets/:file', async (c) => serveFile(c, 'assets', c.req.param('file')));

console.log("Hello via Bun! Serving from: ", BASE);

export default app;
