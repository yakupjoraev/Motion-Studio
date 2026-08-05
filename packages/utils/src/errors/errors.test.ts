import { describe, expect, it } from 'vitest'

import { ERROR_CODES, MotionStudioError, NodeNotFoundError } from './errors'

describe('MotionStudioError', () => {
  it('carries the code it was constructed with', () => {
    const error = new MotionStudioError('boom', 'SOME_CODE')

    expect(error.code).toBe('SOME_CODE')
  })

  it('reports its own class name rather than Error', () => {
    const error = new MotionStudioError('boom', 'SOME_CODE')

    expect(error.name).toBe('MotionStudioError')
  })

  it('is an instance of Error, so an outer catch still sees it', () => {
    const error = new MotionStudioError('boom', 'SOME_CODE')

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('boom')
  })

  it('puts a cause on the standard Error.cause property', () => {
    const original = new Error('underlying')

    const error = new MotionStudioError('boom', 'SOME_CODE', original)

    expect(error.cause).toBe(original)
  })

  it('leaves cause absent when none is given', () => {
    const error = new MotionStudioError('boom', 'SOME_CODE')

    expect(error.cause).toBeUndefined()
  })
})

describe('NodeNotFoundError', () => {
  it('names the missing id in its message', () => {
    const error = new NodeNotFoundError('node_abc')

    expect(error.message).toBe('Node not found: node_abc')
  })

  it('reports the subclass name, not the base name', () => {
    const error = new NodeNotFoundError('node_abc')

    expect(error.name).toBe('NodeNotFoundError')
  })

  it('carries the nodeNotFound code and both class identities', () => {
    const error = new NodeNotFoundError('node_abc')

    expect(error.code).toBe(ERROR_CODES.nodeNotFound)
    expect(error).toBeInstanceOf(MotionStudioError)
  })
})
