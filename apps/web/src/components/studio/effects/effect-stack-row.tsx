'use client'

import { blockRegistry } from '@motion-studio/blocks'
import { commands } from '@motion-studio/editor'
import { BLEND_MODES, type EffectInstance, type NodeId, effectBlockId } from '@motion-studio/schema'
import { Button } from '@motion-studio/ui'
import { ControlRenderer, ControlRow, SelectField, SliderField } from '@motion-studio/ui/controls'
import { useCallback } from 'react'

import { useStudioStore } from '../../../store/editor-store'

export interface EffectStackRowProps {
  readonly instance: EffectInstance
  readonly nodeId: NodeId
  readonly index: number
  readonly canMoveUp: boolean
  readonly canMoveDown: boolean
  readonly onMove: (instanceId: string, index: number) => void
  readonly onRemove: (instanceId: string) => void
}

/** One layer in the stack: what it is, where it sits, how it composites, and its own parameters. */
export function EffectStackRow({
  instance,
  nodeId,
  index,
  canMoveUp,
  canMoveDown,
  onMove,
  onRemove,
}: EffectStackRowProps) {
  const definition = blockRegistry.get(effectBlockId(instance.effectId))

  const tune = useCallback(
    (patch: Partial<Pick<EffectInstance, 'layer' | 'blendMode' | 'opacity'>>) => {
      useStudioStore
        .getState()
        .dispatch(commands.setEffect({ nodeId, instanceId: instance.id, ...patch }))
    },
    [nodeId, instance.id],
  )

  const setParam = useCallback(
    (path: string, value: unknown) => {
      useStudioStore.getState().dispatch(
        commands.setEffect({
          nodeId,
          instanceId: instance.id,
          params: { [path]: value },
        }),
      )
    },
    [nodeId, instance.id],
  )

  const params = { ...(definition?.defaults as Record<string, unknown>), ...instance.params }

  return (
    <section
      className="rounded-sm border border-border p-2"
      data-effect-id={instance.id}
      data-testid="effect-row"
    >
      <header className="flex items-center justify-between gap-2 pb-2">
        <span className="truncate text-foreground text-xs">
          {definition?.name ?? instance.effectId}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Button
            aria-label="Move layer up"
            disabled={!canMoveUp}
            onClick={() => onMove(instance.id, index - 1)}
            size="sm"
            variant="ghost"
          >
            ↑
          </Button>
          <Button
            aria-label="Move layer down"
            disabled={!canMoveDown}
            onClick={() => onMove(instance.id, index + 1)}
            size="sm"
            variant="ghost"
          >
            ↓
          </Button>
          <Button
            aria-label={`Remove ${definition?.name ?? instance.effectId}`}
            onClick={() => onRemove(instance.id)}
            size="sm"
            variant="ghost"
          >
            Remove
          </Button>
        </span>
      </header>

      <ControlRow label="Layer">
        {(slot) => (
          <SelectField
            {...slot}
            label="Layer"
            onChange={(value) => tune({ layer: value === 'front' ? 'front' : 'behind' })}
            onCommit={(value) => tune({ layer: value === 'front' ? 'front' : 'behind' })}
            options={[
              { value: 'behind', label: 'Behind content' },
              { value: 'front', label: 'In front' },
            ]}
            value={instance.layer}
          />
        )}
      </ControlRow>

      <ControlRow label="Blend">
        {(slot) => (
          <SelectField
            {...slot}
            label="Blend mode"
            onChange={(value) => tune({ blendMode: value as EffectInstance['blendMode'] })}
            onCommit={(value) => tune({ blendMode: value as EffectInstance['blendMode'] })}
            options={BLEND_MODES.map((mode) => ({ value: mode, label: mode }))}
            value={instance.blendMode}
          />
        )}
      </ControlRow>

      <ControlRow label="Opacity">
        {(slot) => (
          <SliderField
            {...slot}
            label="Opacity"
            max={1}
            min={0}
            onChange={(value) => tune({ opacity: value })}
            onCommit={(value) => tune({ opacity: value })}
            step={0.01}
            value={instance.opacity}
          />
        )}
      </ControlRow>

      {(definition?.controls ?? []).flatMap((group) =>
        group.controls.map((descriptor) => (
          <ControlRow key={descriptor.path} label={descriptor.label}>
            {(slot) => (
              <ControlRenderer
                descriptor={descriptor}
                onChange={(value) => setParam(descriptor.path, value)}
                onCommit={(value) => setParam(descriptor.path, value)}
                slot={slot}
                value={params[descriptor.path]}
              />
            )}
          </ControlRow>
        )),
      )}
    </section>
  )
}
