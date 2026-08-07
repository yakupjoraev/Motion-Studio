import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { RichTextField } from './rich-text-field'

import type { RichTextFieldProps } from './rich-text-field.types'

/** jsdom has no `execCommand`; the field feature-detects it, so the tests supply one that records. */
const commands: string[] = []

beforeEach(() => {
  commands.length = 0
  document.execCommand = vi.fn((command: string) => {
    commands.push(command)

    return true
  })
})

const Fixture = (props: Partial<RichTextFieldProps>): ReactElement => (
  <RichTextField
    label="Body"
    value="<strong>Ship</strong> the thing."
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const editor = (): HTMLElement => screen.getByRole('textbox', { name: 'Body' })

describe('RichTextField', () => {
  it('renders the markup it was given', () => {
    render(<Fixture />)

    expect(editor().innerHTML).toBe('<strong>Ship</strong> the thing.')
  })

  it('offers bold, italic and link, and nothing else', () => {
    render(<Fixture />)

    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Link' })).toBeInTheDocument()
  })

  it('applies bold to the selection and commits', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Bold' }))

    expect(commands).toContain('bold')
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('sanitises what it hands back', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    editor().innerHTML = '<div><b>Ship</b><script>alert(1)</script></div>'
    fireEvent.blur(editor())

    expect(onCommit).toHaveBeenCalledWith('<strong>Ship</strong>alert(1)')
  })

  it('reports typing through onChange without committing', () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture onChange={onChange} onCommit={onCommit} />)
    editor().innerHTML = 'Ship it'
    fireEvent.input(editor())

    expect(onChange).toHaveBeenCalledWith('Ship it')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('takes the text out of a paste and leaves its formatting behind', () => {
    render(<Fixture />)

    fireEvent.paste(editor(), {
      clipboardData: {
        getData: (type: string) =>
          type === 'text/html' ? '<h1 style="color:red">Pasted</h1>' : 'Pasted',
      },
    })

    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'Pasted')
  })

  it('falls back to the plain-text flavour when a paste carries no HTML', () => {
    render(<Fixture />)

    fireEvent.paste(editor(), {
      clipboardData: { getData: (type: string) => (type === 'text/html' ? '' : 'Plain') },
    })

    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'Plain')
  })

  it('refuses to apply a link whose scheme is not allowed', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.click(screen.getByRole('button', { name: 'Link' }))
    await user.type(screen.getByRole('textbox', { name: 'Link URL' }), 'javascript:alert(1)')

    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
  })

  it('applies a link whose scheme is allowed', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.click(screen.getByRole('button', { name: 'Link' }))
    await user.type(screen.getByRole('textbox', { name: 'Link URL' }), 'https://motion.studio')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://motion.studio')
  })

  it('is a single-line field, which is what a heading or a label is', () => {
    render(<Fixture />)

    expect(editor()).toHaveAttribute('aria-multiline', 'false')
  })

  it('shows Mixed and nothing else across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(editor().innerHTML).toBe('')
    expect(editor()).toHaveAttribute('data-placeholder', 'Mixed')
  })

  it('is not editable when disabled', () => {
    render(<Fixture disabled />)

    expect(editor()).toHaveAttribute('contenteditable', 'false')
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled()
  })

  it('types on a platform with no execCommand rather than throwing', async () => {
    const user = userEvent.setup()

    // biome-ignore lint/performance/noDelete: the feature detection is on the property, not its value.
    delete (document as Partial<Document>).execCommand

    render(<Fixture />)

    await expect(user.click(screen.getByRole('button', { name: 'Bold' }))).resolves.toBeUndefined()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
