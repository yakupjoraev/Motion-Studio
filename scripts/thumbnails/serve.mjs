import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

/**
 * A static server for `apps/storybook/storybook-static`. Eleven lines of Node rather than a
 * dependency: the generator needs an origin because a Storybook built for `file://` cannot fetch its
 * own index, and that is the entire requirement.
 */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

export function serveStatic(root, port) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    // `normalize` plus the prefix check is what keeps a crafted path inside the directory.
    const target = normalize(join(root, decodeURIComponent(url.pathname)))

    if (!target.startsWith(normalize(root))) {
      response.writeHead(403).end()

      return
    }

    const file =
      existsSync(target) && statSync(target).isDirectory() ? join(target, 'index.html') : target

    if (!existsSync(file)) {
      response.writeHead(404).end()

      return
    }

    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(response)
  })

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () =>
      resolve({ close: () => new Promise((done) => server.close(done)) }),
    )
  })
}
