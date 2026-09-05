'use client'

import { SearchIcon } from '@motion-studio/icons'
import { type MotionPreset, PRESETS } from '@motion-studio/motion'
import { Button, EmptyState, Input, ScrollArea } from '@motion-studio/ui'
import { useCallback, useMemo, useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import { applyPreset, targetsFor } from '../motion/apply-preset'

import { FilterChips } from './filter-chips'
import { CHANNELS, PresetGroups } from './preset-groups'
import {
  channelCounts,
  clearChannels,
  toggleChannel,
  usePresetSearch,
  useSelectedChannels,
} from './use-preset-search'

const COUNTS = channelCounts()

const CHIPS = CHANNELS.map(({ channel, label }) => ({
  id: channel,
  label,
  count: COUNTS.get(channel) ?? 0,
}))

/**
 * PRODUCT.md § 2, Motion: the catalogue grouped by channel, each card previewing on hover, clicking
 * applies to the selection as a command. A preset whose channel the selected block does not support
 * is disabled with the reason, rather than hidden — the catalogue is the same on every selection, so
 * a user learns where things are.
 *
 * The header is ADR-355: fifty-one presets in six channels, and reaching Exit meant scrolling past
 * every other channel. Search and channel chips, in the shape the Blocks tab already established, so
 * the two tabs are learned once.
 */
export function MotionTab() {
  const [query, setQuery] = useState('')
  const { presets, query: applied } = usePresetSearch(query)
  const channels = useSelectedChannels()

  const selectionCount = useStudioStore((state) => state.selection.ids.length)
  const appliedIds = useStudioStore((state) => {
    const [first] = state.selection.ids
    const node = first === undefined ? undefined : state.document.nodes[first]

    return Object.values(node?.motion ?? {})
      .map((spec) => spec.presetId)
      .join(' ')
  })

  const appliedSet = useMemo(() => new Set(appliedIds.split(' ')), [appliedIds])

  const onApply = useCallback((preset: MotionPreset) => {
    applyPreset(useStudioStore, preset)
  }, [])

  const reset = useCallback(() => {
    setQuery('')
    clearChannels()
  }, [])

  const reasonFor = useCallback(
    (preset: MotionPreset): string | undefined => {
      if (selectionCount === 0) {
        return 'Select a block first'
      }

      return targetsFor(useStudioStore, preset.channel).length === 0
        ? `This block does not support the ${preset.channel} channel`
        : undefined
    },
    [selectionCount],
  )

  if (PRESETS.length === 0) {
    return <EmptyState className="h-full" message="No motion presets are registered." />
  }

  const filtering = applied !== '' || channels.size > 0

  return (
    <div className="flex h-full flex-col" data-testid="motion-tab">
      <div className="flex flex-col gap-2 border-border border-b p-2">
        <Input
          aria-label="Search presets"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search presets"
          prefix={<SearchIcon size={12} />}
          role="searchbox"
          type="search"
          value={query}
        />
        <FilterChips
          chips={CHIPS}
          label="Motion channels"
          onToggle={toggleChannel}
          selected={channels}
          testId="channel-filter"
        />
        <output
          aria-live="polite"
          className="px-1 text-[11px] text-foreground-muted"
          data-testid="preset-count"
        >
          {filtering
            ? `${presets.length} ${presets.length === 1 ? 'preset' : 'presets'} match`
            : ''}
        </output>
      </div>

      <div className="min-h-0 flex-1">
        {presets.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={reset} size="sm" variant="secondary">
                Clear search
              </Button>
            }
            className="h-full"
            message={
              applied === '' ? 'No presets in these channels.' : `No presets match “${applied}”.`
            }
          />
        ) : (
          <ScrollArea className="h-full">
            <div className="p-2">
              <PresetGroups
                applied={appliedSet}
                grouped={applied === ''}
                onApply={onApply}
                presets={presets}
                reasonFor={reasonFor}
              />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
