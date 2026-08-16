import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * The stress documents `e2e/` measures against, served to the studio so a performance run can name
 * one in a URL — `/studio?fixture=stress-motion-heavy`.
 *
 * They are read from `e2e/fixtures/documents` rather than copied into `public/`: one copy of a
 * fixture is one thing to regenerate when a block's defaults change, and two copies drift.
 */
const FIXTURE_DIR = join(process.cwd(), '..', '..', 'e2e', 'fixtures', 'documents')

/** A name, not a path. This is the whole of the traversal defence, and it is why it is a whitelist. */
const NAME_RE = /^[a-z0-9-]{1,64}$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
): Promise<Response> {
  const { name } = await params

  if (!NAME_RE.test(name)) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const body = await readFile(join(FIXTURE_DIR, `${name}.motion.json`), 'utf8')

    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
