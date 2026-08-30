import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { nodeIds } from '@motion-studio/schema'
import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { TemplatePicker } from './template-picker'
import { openDialog, renderWithDocuments, resetStorage } from './test-utils'

const TEMPLATES = join(process.cwd(), 'public', 'templates')

const read = (name: string): string => readFileSync(join(TEMPLATES, name), 'utf8')

/** The picker fetches from `public/`; in jsdom that directory is on disk, so `fetch` reads it. */
const serve = (): void => {
  vi.stubGlobal('fetch', (input: string) => {
    const name = input.replace('/templates/', '')

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(JSON.parse(read(name))),
      text: () => Promise.resolve(read(name)),
    })
  })
}

const manifest = (): readonly { slug: string; nodeCount: number }[] =>
  JSON.parse(read('templates.json'))

beforeEach(() => {
  resetStorage()
  serve()
  openDialog('templates')
})

afterEach(() => {
  vi.unstubAllGlobals()
  useStudioStore.getState().setActiveDialog(null)
})

describe('the shipped templates', () => {
  it('are the eight FILE_FORMAT.md names', () => {
    expect(manifest().map((entry) => entry.slug)).toEqual([
      'saas-landing',
      'portfolio',
      'product-launch',
      'docs-home',
      'pricing-page',
      'blog-index',
      'waitlist',
      'changelog',
    ])
  })

  it('all parse, and each is marked as a template', () => {
    const files = readdirSync(TEMPLATES).filter((name) => name.endsWith('.motion.json'))

    expect(files).toHaveLength(8)

    for (const file of files) {
      const parsed = JSON.parse(read(file))

      expect(parsed.meta.template).toBe(true)
      expect(Object.keys(parsed.nodes).length).toBeGreaterThan(0)
    }
  })
})

describe('the template picker', () => {
  it('offers a blank document alongside the eight', async () => {
    renderWithDocuments(<TemplatePicker />)

    expect(screen.getByText('Blank')).toBeInTheDocument()
    expect(await screen.findByTestId('template-saas-landing')).toBeInTheDocument()
  })

  it('shows the node count of each', async () => {
    renderWithDocuments(<TemplatePicker />)

    const card = await screen.findByTestId('template-saas-landing')
    const expected = manifest().find((entry) => entry.slug === 'saas-landing')?.nodeCount

    expect(card).toHaveTextContent(`${String(expected)} blocks`)
  })

  it('starts a blank document from the store’s empty shape', async () => {
    const before = useStudioStore.getState().document.meta.id

    renderWithDocuments(<TemplatePicker />)

    await act(async () => {
      screen.getByText('Blank').click()
    })

    await waitFor(() => {
      expect(useStudioStore.getState().document.meta.id).not.toBe(before)
    })
    expect(nodeIds(useStudioStore.getState().document)).toHaveLength(1)
  })

  it('loads a template with fresh ids, so the template cannot be overwritten', async () => {
    const source = JSON.parse(read('waitlist.motion.json'))

    renderWithDocuments(<TemplatePicker />)

    // Queried outside `act`: an async `findBy*` inside one waits for a render the act scope is
    // holding back, and the two deadlock until the query times out.
    const card = await screen.findByTestId('template-waitlist')

    await act(async () => {
      card.click()
    })

    await waitFor(() => {
      expect(nodeIds(useStudioStore.getState().document)).toHaveLength(
        source.nodes ? Object.keys(source.nodes).length : 0,
      )
    })

    const loaded = useStudioStore.getState().document

    expect(loaded.meta.id).not.toBe(source.meta.id)
    expect(loaded.meta.template).toBeUndefined()

    for (const id of nodeIds(loaded)) {
      expect(Object.keys(source.nodes)).not.toContain(id)
    }
  })
})
