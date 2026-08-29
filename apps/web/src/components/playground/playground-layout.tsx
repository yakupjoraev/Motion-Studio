'use client'

import { useShortcuts } from '@motion-studio/hooks'
import { type ReactElement, useMemo } from 'react'

import { CompareTabs } from './compare-mode/compare-tabs'
import { CompareTarget } from './compare-mode/compare-target'
import { EditorPane } from './editor-pane'
import { type PlaygroundShortcutContext, playgroundShortcuts } from './playground-shortcuts'
import { PresetPanel } from './preset-panel'
import { propertyDescriptor, styleFor } from './properties'
import { PropertyList } from './property-list'
import { SendToSelection, useSendToSelection } from './send-to-selection'
import { CopyActionsBar, useCopyActions } from './sharing/copy-actions'
import { TargetFrame } from './target-frame'
import { PropertyTarget } from './targets/property-target'
import { usePlaygroundState } from './use-playground-state'

/**
 * PLAYGROUND.md § Layout: properties on the left, the target in the middle, presets and the sharing
 * actions on the right, the editor along the bottom.
 */
export function PlaygroundLayout(): ReactElement {
  const state = usePlaygroundState()
  const { property, compare, side, a, b, active } = state
  const descriptor = propertyDescriptor(property)
  const copy = useCopyActions(property, active.applied)
  const send = useSendToSelection(property, active.applied)

  const context = useMemo<PlaygroundShortcutContext>(
    () => ({
      swap: state.swap,
      copyCss: copy.copyCss,
      send: send.send,
      comparing: compare,
      canSend: send.accepted,
    }),
    [compare, copy.copyCss, send.accepted, send.send, state.swap],
  )

  useShortcuts({ registry: playgroundShortcuts, context })

  const initialStyle = styleFor(property, descriptor.initial)
  const targetA = (
    <PropertyTarget
      property={property}
      targetRef={state.targetA}
      applied={a.applied}
      initialStyle={initialStyle}
      value={a.value}
      onValueChange={a.setValue}
    />
  )

  return (
    <div className="grid h-full grid-rows-[1fr_auto] gap-4 p-4">
      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr_16rem]">
        <aside aria-label="Properties" className="min-h-0 overflow-y-auto">
          <PropertyList value={property} onValueChange={state.setProperty} />
        </aside>
        <div className="grid min-h-0 place-items-center overflow-auto">
          <TargetFrame>
            {compare ? (
              <CompareTarget
                a={targetA}
                b={
                  <PropertyTarget
                    property={property}
                    targetRef={state.targetB}
                    applied={b.applied}
                    initialStyle={initialStyle}
                    value={b.value}
                    onValueChange={b.setValue}
                  />
                }
              />
            ) : (
              targetA
            )}
          </TargetFrame>
        </div>
        <aside aria-label="Presets and sharing" className="flex min-h-0 flex-col gap-4">
          <PresetPanel property={property} value={active.value} onValueChange={active.setValue} />
          <CopyActionsBar actions={copy} />
          <SendToSelection action={send} disabled={active.applied === ''} />
        </aside>
      </div>
      <div className="flex flex-col gap-2">
        <CompareTabs
          enabled={compare}
          onEnabledChange={state.setCompare}
          side={side}
          onSideChange={state.setSide}
          onSwap={state.swap}
        />
        <EditorPane
          label={`${descriptor.label} value${compare ? `, ${side === 'a' ? 'A' : 'B'}` : ''}`}
          value={active.value}
          onValueChange={active.setValue}
          onApply={active.applyNow}
          errors={active.errors}
          features={active.features}
        />
        {state.linkError !== '' && (
          <p className="m-0 text-danger text-xs" data-testid="permalink-error">
            {state.linkError}
          </p>
        )}
      </div>
    </div>
  )
}
