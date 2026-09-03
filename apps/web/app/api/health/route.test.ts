import { describe, expect, it } from 'vitest'

import { APP_VERSION } from '../../../src/lib/errors/format-error-report'
import { GET } from './route'

describe('the health route', () => {
  it('answers ok with the version the app reports everywhere else', async () => {
    const response = GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok', version: APP_VERSION })
  })

  /**
   * The container restarts on a failed healthcheck, so this handler may not have a reason to fail
   * other than the server being down — no database, no filesystem, no clock. The test is the guard:
   * it constructs nothing and stubs nothing, and it should stay that way.
   */
  it('needs no request, no environment and no I/O', () => {
    expect(GET.length).toBe(0)
  })
})
