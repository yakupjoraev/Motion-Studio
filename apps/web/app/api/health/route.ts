import { APP_VERSION } from '../../../src/lib/errors/format-error-report'

/**
 * The container's healthcheck, and **nothing else** — `prompts/60` § `/api/health`.
 *
 * It is the only route handler in the application, and it stays that way: no database, no
 * filesystem, no dependency that can be slow or absent. A healthcheck that can fail for a reason
 * other than "the server is not up" reports the wrong thing, and one that grew a query would make
 * the container restart whenever that query was slow.
 *
 * If a feature ever needs a server route, it gets its own — this one is not the place to start.
 */
export const dynamic = 'force-static'

export function GET(): Response {
  return Response.json({ status: 'ok', version: APP_VERSION })
}
