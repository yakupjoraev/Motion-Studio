import type { IRWarning } from '@motion-studio/codegen'
import { nodeId } from '@motion-studio/schema'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WarningsList } from './warnings-list'

const warning = (code: IRWarning['code'], message: string, node?: string): IRWarning =>
  node === undefined
    ? { code, message, docsLink: 'docs/EXPORT_ENGINE.md#html' }
    : { code, message, nodeId: nodeId(node), docsLink: 'docs/ACCESSIBILITY.md' }

describe('WarningsList', () => {
  it('says there are none rather than showing an empty space', () => {
    render(<WarningsList onSelectNode={vi.fn()} warnings={[]} />)

    expect(screen.getByTestId('export-warnings-empty')).toBeInTheDocument()
  })

  it('groups by category and counts each group', () => {
    render(
      <WarningsList
        onSelectNode={vi.fn()}
        warnings={[
          warning('missing-alt', 'One image has no alt text', 'node_a'),
          warning('missing-alt', 'Another image has no alt text', 'node_b'),
          warning('approximation', 'The magnetic hover is a transition'),
        ]}
      />,
    )

    const alt = screen.getByRole('button', { name: /Missing alt text/ })

    expect(within(alt).getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Approximated/ })).toBeInTheDocument()
  })

  it('offers to select the node a warning is about, and only then', async () => {
    const user = userEvent.setup()
    const onSelectNode = vi.fn()

    render(
      <WarningsList
        onSelectNode={onSelectNode}
        warnings={[
          warning('missing-alt', 'One image has no alt text', 'node_a'),
          warning('approximation', 'The magnetic hover is a transition'),
        ]}
      />,
    )

    const buttons = screen.getAllByRole('button', { name: 'Select it' })

    expect(buttons).toHaveLength(1)

    await user.click(buttons[0] as HTMLElement)

    expect(onSelectNode).toHaveBeenCalledWith('node_a')
  })

  it('links every warning to the section that explains it', () => {
    render(
      <WarningsList
        onSelectNode={vi.fn()}
        warnings={[warning('missing-alt', 'One image has no alt text', 'node_a')]}
      />,
    )

    expect(screen.getByRole('link', { name: /Docs/ })).toHaveAttribute(
      'href',
      '/docs/ACCESSIBILITY.md',
    )
  })
})
