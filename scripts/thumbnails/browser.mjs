import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * A minimal CDP client. ADR-125 records why this is here rather than Playwright: the only thing
 * Playwright would add over `chrome --headless` is video recording, and a recorded video is the one
 * artefact that cannot be made byte-identical between runs — which is the property this generator is
 * required to have.
 */
const CHROME_CANDIDATES = [
  process.env['CHROME_PATH'],
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((path) => typeof path === 'string')

export function findChrome() {
  const found = CHROME_CANDIDATES.find((path) => existsSync(path))

  if (found === undefined) {
    throw new Error(
      'No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary and run this again.',
    )
  }

  return found
}

const waitFor = async (check, timeoutMs, what) => {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const value = await check()

    if (value !== undefined && value !== null && value !== false) {
      return value
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error(`Timed out waiting for ${what}`)
}

export async function launchChrome({ port }) {
  const profile = await mkdtemp(join(tmpdir(), 'ms-thumbnails-'))

  const child = spawn(
    findChrome(),
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      // Determinism: no first-run interstitials, no background work, no GPU driver differences.
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-lcd-text',
      '--font-render-hinting=none',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  const version = await waitFor(
    async () => {
      try {
        return await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
      } catch {
        return null
      }
    },
    20_000,
    'Chrome to accept a debugging connection',
  )

  return {
    webSocketDebuggerUrl: version.webSocketDebuggerUrl,
    async close() {
      child.kill()
      await rm(profile, { recursive: true, force: true }).catch(() => undefined)
    },
  }
}

export async function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl)

  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = () => reject(new Error('Could not open a CDP socket'))
  })

  let nextId = 0
  const pending = new Map()

  socket.onmessage = (message) => {
    const payload = JSON.parse(message.data)

    if (payload.id === undefined) {
      return
    }

    const promise = pending.get(payload.id)

    pending.delete(payload.id)

    if (payload.error) {
      promise.reject(new Error(`${payload.error.message} (${JSON.stringify(payload.error.data)})`))
    } else {
      promise.resolve(payload.result)
    }
  }

  const send = (method, params, sessionId) =>
    new Promise((resolve, reject) => {
      nextId += 1

      pending.set(nextId, { resolve, reject })
      socket.send(JSON.stringify({ id: nextId, method, params: params ?? {}, sessionId }))
    })

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

  const call = (method, params) => send(method, params, sessionId)

  await call('Page.enable')
  await call('Runtime.enable')

  return {
    call,
    async evaluate(expression) {
      const result = await call('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      })

      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description ?? 'Evaluation failed')
      }

      return result.result.value
    },
    waitFor,
    close: () => socket.close(),
  }
}
