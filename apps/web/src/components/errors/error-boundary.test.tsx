import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from './error-boundary'

const Boom = ({ message }: { readonly message: string }): never => {
  throw new TypeError(message)
}

/**
 * A boundary logs what it caught, and React logs the same error again on its own. Both are expected
 * here, so the console is silenced per test rather than left to make the output unreadable.
 */
let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  consoleError.mockRestore()
})

describe('ErrorBoundary', () => {
  it('renders its children while nothing throws', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>} where="test">
        <p>content</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.queryByText('fallback')).toBeNull()
  })

  it('renders the fallback with the error it caught', () => {
    render(
      <ErrorBoundary
        fallback={({ error }) => <p>caught: {(error as Error).message}</p>}
        where="test"
      >
        <Boom message="plans is not an array" />
      </ErrorBoundary>,
    )

    expect(screen.getByText('caught: plans is not an array')).toBeInTheDocument()
  })

  /** The report is built once, here, so all five fallbacks say the same things about a failure. */
  it('hands the fallback a report naming the block and the node', () => {
    render(
      <ErrorBoundary
        blockId="pricing-table"
        fallback={({ report }) => <pre>{report}</pre>}
        nodeId="node_a3f2"
        where="node:pricing-table"
      >
        <Boom message="plans is not an array" />
      </ErrorBoundary>,
    )

    const report = screen.getByText(/Motion Studio/).textContent ?? ''

    expect(report).toContain('Block: pricing-table')
    expect(report).toContain('Node: node_a3f2')
    expect(report).toContain('TypeError: plans is not an array')
  })

  it('logs one line, and it is the report', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>} where="canvas">
        <Boom message="viewport is not finite" />
      </ErrorBoundary>,
    )

    const logged = consoleError.mock.calls.map((call) => String(call[0])).join('\n')

    expect(logged).toContain('[canvas]')
    expect(logged).toContain('viewport is not finite')
  })

  it('shows the children again after a reset', async () => {
    let shouldThrow = true

    const Child = () => {
      if (shouldThrow) {
        throw new TypeError('once')
      }

      return <p>recovered</p>
    }

    render(
      <ErrorBoundary
        fallback={({ reset }) => (
          <button
            onClick={() => {
              shouldThrow = false
              reset()
            }}
            type="button"
          >
            try again
          </button>
        )}
        where="test"
      >
        <Child />
      </ErrorBoundary>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'try again' }))

    expect(screen.getByText('recovered')).toBeInTheDocument()
  })

  it('runs the caller-supplied reset before clearing itself', async () => {
    const onReset = vi.fn()

    render(
      <ErrorBoundary
        fallback={({ reset }) => (
          <button onClick={reset} type="button">
            try again
          </button>
        )}
        onReset={onReset}
        where="test"
      >
        <Boom message="always" />
      </ErrorBoundary>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'try again' }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('describes the document in the report when the boundary can read one', () => {
    render(
      <ErrorBoundary
        describeDocument={() =>
          ({ nodes: { a: {}, b: {}, c: {} }, theme: { id: 'brutal' } }) as never
        }
        fallback={({ report }) => <pre>{report}</pre>}
        where="test"
      >
        <Boom message="anything" />
      </ErrorBoundary>,
    )

    expect(screen.getByText(/Motion Studio/).textContent).toContain(
      'Document: 3 nodes, theme brutal',
    )
  })
})
