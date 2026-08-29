import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Polygon, Vertex } from './parse-polygon'
import { PolygonOverlay } from './polygon-overlay'

const triangle: Polygon = {
  vertices: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 100 },
  ],
  unit: '%',
  fillRule: undefined,
}

const square: Polygon = {
  ...triangle,
  vertices: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
}

const mount = (polygon: Polygon = triangle) => {
  const onVertices = vi.fn<(next: readonly Vertex[]) => void>()
  const onAnnounce = vi.fn<(message: string) => void>()

  render(<PolygonOverlay polygon={polygon} onVertices={onVertices} onAnnounce={onAnnounce} />)

  return { onVertices, onAnnounce }
}

describe('the vertex handles', () => {
  it('gives every vertex a button that says where it is', () => {
    mount()

    expect(
      screen.getByRole('button', { name: /^Vertex 1, 0 percent 0 percent/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Vertex 3, 50 percent 100 percent/ }),
    ).toBeInTheDocument()
  })

  it('moves by one percent on an arrow and by five with shift', async () => {
    const user = userEvent.setup()
    const { onVertices } = mount()

    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onVertices).toHaveBeenLastCalledWith([
      { x: 1, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 100 },
    ])

    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

    expect(onVertices).toHaveBeenLastCalledWith([
      { x: 0, y: 5 },
      { x: 100, y: 0 },
      { x: 50, y: 100 },
    ])
  })

  it('announces the coordinates after a move', async () => {
    const user = userEvent.setup()
    const { onAnnounce } = mount()

    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onAnnounce).toHaveBeenCalledWith('Vertex 1, 1 percent 0 percent')
  })

  it('removes a vertex on Delete and says how many are left', async () => {
    const user = userEvent.setup()
    const { onVertices, onAnnounce } = mount(square)

    await user.tab()
    await user.keyboard('{Delete}')

    expect(onVertices).toHaveBeenLastCalledWith([
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ])
    expect(onAnnounce).toHaveBeenCalledWith('Vertex 1 removed. 3 vertices.')
  })

  it('keeps the last three and says so instead', async () => {
    const user = userEvent.setup()
    const { onVertices, onAnnounce } = mount()

    await user.tab()
    await user.keyboard('{Delete}')

    expect(onVertices).not.toHaveBeenCalled()
    expect(onAnnounce).toHaveBeenCalledWith('A polygon keeps at least 3 vertices.')
  })

  it('splits an edge from its own button', async () => {
    const user = userEvent.setup()
    const { onVertices, onAnnounce } = mount()

    await user.click(screen.getByRole('button', { name: 'Insert a vertex on edge 1' }))

    expect(onVertices).toHaveBeenLastCalledWith([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 100 },
    ])
    expect(onAnnounce).toHaveBeenCalledWith('Vertex added after 1. 4 vertices.')
  })

  it('names the closing edge after the vertex it starts at', () => {
    mount()

    expect(screen.getByRole('button', { name: 'Insert a vertex on edge 3' })).toBeInTheDocument()
  })

  it('opens exact fields on Enter and inserts from there', async () => {
    const user = userEvent.setup()
    const { onVertices, onAnnounce } = mount()

    await user.tab()
    await user.keyboard('{Enter}')

    expect(await screen.findByTestId('vertex-fields')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Insert after' }))

    expect(onVertices).toHaveBeenLastCalledWith([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 100 },
    ])
    expect(onAnnounce).toHaveBeenCalledWith('Vertex added after 1. 4 vertices.')
  })

  it('takes exact numbers from the fields', async () => {
    const user = userEvent.setup()
    const { onVertices } = mount()

    await user.tab()
    await user.keyboard('{Enter}')

    const x = await screen.findByLabelText(/Vertex 1 x/)

    await user.clear(x)
    await user.type(x, '12.5')
    await user.tab()

    await waitFor(() => {
      expect(onVertices).toHaveBeenLastCalledWith([
        { x: 12.5, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ])
    })
  })
})
