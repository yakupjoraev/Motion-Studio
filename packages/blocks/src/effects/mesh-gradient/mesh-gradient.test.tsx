import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { MeshGradient } from './mesh-gradient'
import { meshGradientDefinition } from './mesh-gradient.definition'
import { meshBackground } from './mesh-gradient.styles'

const definition = meshGradientDefinition

describe('MeshGradient', () => {
  it('composes four stops into one background image', () => {
    const image = meshBackground(['accent', 'info', 'success'], 55)

    expect(image.split('radial-gradient')).toHaveLength(5)
    expect(image).toContain('var(--ms-color-info)')
    expect(image).toContain('transparent 55%')
  })

  it('animates one layer rather than four', () => {
    const { container } = renderBlock(definition, MeshGradient)

    expect(container.querySelectorAll('.ms-fx-mesh')).toHaveLength(1)
  })

  it('carries spread through to the gradient and blur through to a variable', () => {
    const { container } = renderBlock(definition, MeshGradient, { spread: 80, blur: 12 })
    const mesh = container.querySelector<HTMLElement>('.ms-fx-mesh')

    expect(mesh?.style.backgroundImage).toContain('transparent 80%')
    expect(screen.getByTestId('mesh-gradient').style.getPropertyValue('--ms-fx-blur')).toBe('12px')
  })

  it('is declared heavy, which is what makes it lazy in the render registry', () => {
    expect(definition.capabilities.costClass).toBe('heavy')
  })

  it('is decorative', () => {
    const layer = renderBlock(definition, MeshGradient).container.firstElementChild as HTMLElement

    expect(layer).toHaveAttribute('aria-hidden', 'true')
    expect(layer.className).toContain('pointer-events-none')
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, MeshGradient).container)
  })
})
