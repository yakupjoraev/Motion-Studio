import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it } from 'vitest'

import { motionPlayback } from './motion-playback'
import { MotionSettingsProvider } from './motion-settings'
import { NodeMotion } from './node-motion'

/** Counts mounts, which is what a replay is: an entrance is what happens when an element mounts. */
function Mounted({ onMount }: { readonly onMount: () => void }) {
  onMount()

  return <p data-testid="block">Block</p>
}

describe('replaying motion', () => {
  it('remounts the animated subtree', () => {
    let mounts = 0

    render(
      <MotionSettingsProvider>
        <NodeMotion
          motion={{
            entrance: {
              presetId: 'fade-up',
              channel: 'entrance',
              trigger: { kind: 'mount' },
              params: {},
            },
          }}
        >
          <Mounted
            onMount={() => {
              mounts += 1
            }}
          />
        </NodeMotion>
      </MotionSettingsProvider>,
    )

    const first = mounts

    act(() => {
      motionPlayback.replay()
    })

    expect(mounts).toBeGreaterThan(first)
    expect(screen.getByTestId('block')).toBeInTheDocument()
  })

  it('stops notifying a listener that unsubscribed', () => {
    let calls = 0
    const stop = motionPlayback.subscribe(() => {
      calls += 1
    })

    motionPlayback.replay()
    stop()
    motionPlayback.replay()

    expect(calls).toBe(1)
  })
})
