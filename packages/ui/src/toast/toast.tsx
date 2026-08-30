import { XIcon } from '@motion-studio/icons'
import { Z_INDEX } from '@motion-studio/tokens'
import * as RadixToast from '@radix-ui/react-toast'
import { type ReactElement, createContext, useCallback, useContext, useRef, useState } from 'react'

import { Button } from '../button/index'

import {
  toastDescriptionStyles,
  toastStyles,
  toastTitleStyles,
  toastViewportStyles,
} from './toast.styles'

import type { ToastOptions, ToastProviderProps, ToastRecord } from './toast.types'

type Publish = (options: ToastOptions) => void

const ToastContext = createContext<Publish | null>(null)

/** Throws rather than no-oping: a toast that never appears takes the user's undo with it, silently. */
export function useToast(): Publish {
  const publish = useContext(ToastContext)

  if (publish === null) {
    throw new Error('useToast must be called inside a ToastProvider')
  }

  return publish
}

function ToastItem({
  record,
  onDismiss,
}: {
  record: ToastRecord
  onDismiss: () => void
}): ReactElement {
  return (
    <RadixToast.Root
      data-ms-toast=""
      className={toastStyles({ tone: record.tone ?? 'neutral' })}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss()
        }
      }}
      {...(record.duration === undefined ? {} : { duration: record.duration })}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <RadixToast.Title className={toastTitleStyles()}>{record.title}</RadixToast.Title>
        {record.description === undefined ? null : (
          <RadixToast.Description className={toastDescriptionStyles()}>
            {record.description}
          </RadixToast.Description>
        )}
      </div>

      {record.action === undefined ? null : (
        // `altText` is what a screen reader hears instead of a button that is about to vanish.
        <RadixToast.Action asChild altText={record.action.label}>
          <Button variant="ghost" size="sm" onClick={record.action.onClick}>
            {record.action.label}
          </Button>
        </RadixToast.Action>
      )}

      <RadixToast.Close asChild>
        <Button variant="ghost" size="icon" aria-label="Dismiss">
          <XIcon />
        </Button>
      </RadixToast.Close>
    </RadixToast.Root>
  )
}

/**
 * Holds the queue, because Radix's API is one component per toast and the caller wants a function call.
 * Ids are a counter: they never leave this component, and `createId` would put `crypto` on a tested path.
 */
export function ToastProvider({ children, duration = 5000 }: ToastProviderProps): ReactElement {
  const [records, setRecords] = useState<readonly ToastRecord[]>([])
  const nextId = useRef(0)

  const publish = useCallback<Publish>((options) => {
    nextId.current += 1
    const id = nextId.current

    setRecords((current) => [...current, { ...options, id }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setRecords((current) => current.filter((record) => record.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={publish}>
      <RadixToast.Provider duration={duration} swipeDirection="right">
        {children}

        {records.map((record) => (
          <ToastItem key={record.id} record={record} onDismiss={() => dismiss(record.id)} />
        ))}

        {/*
         * `aria-live="off"` is not a mistake and it is not decoration. A modal `Dialog` hides every
         * sibling of its content with `aria-hidden`, and the viewport is one — so a toast raised
         * while a dialog is open, with the undo the user needs, disappears from the accessibility
         * tree. `aria-hidden`'s `hideOthers` exempts `[aria-live]` from that sweep, and `off` is the
         * honest value: Radix announces a toast through its own announcer element, so this region
         * must be *reachable* without announcing anything a second time. ADR-289.
         */}
        <RadixToast.Viewport
          aria-live="off"
          className={toastViewportStyles()}
          style={{ zIndex: Z_INDEX.toast }}
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
