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

  return new Response(file);
}

// Routing
app.get("/", (c) => new Response(Bun.file("./index.html")));

app.get('/styles/:file', async (c) => {
  const fileName = c.req.param('file');
  return serveFile(c, 'styles', fileName);
})

app.get('/pages/:page', async (c) => serveFile(c, 'pages', c.req.param('page')));
app.get('/partials/:partial', (c) => serveFile(c, 'partials', c.req.param('partial')));

app.get('/assets/:file', async (c) => serveFile(c, 'assets', c.req.param('file')));

console.log("Hello via Bun! Serving from: ", BASE);

export default app;
