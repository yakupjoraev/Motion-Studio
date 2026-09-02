'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

import { formatErrorReport } from '../../lib/errors/format-error-report'

export interface ErrorFallbackProps {
  readonly error: unknown
  /** Clears the boundary and re-renders its children — the "try again" every fallback offers. */
  readonly reset: () => void
  /** The clipboard payload for a bug report. Built here so every fallback reports the same fields. */
  readonly report: string
}

export interface ErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallback: (props: ErrorFallbackProps) => ReactNode
  /** Named in the report and in the single production `console.error`, so a log says where. */
  readonly where: string
  readonly blockId?: string
  readonly nodeId?: string
  /** What the report should say about the document, if the boundary can still read it. */
  readonly describeDocument?: () => Parameters<typeof formatErrorReport>[0]['document']
  readonly onReset?: () => void
}

interface ErrorBoundaryState {
  readonly error: unknown
}

const APP_VERSION = '1.0.0'

/**
 * The base every boundary in the app is built from — ARCHITECTURE.md § Error boundaries.
 *
 * A class, because an error boundary is the one thing React still has no hook for. What is shared
 * here rather than repeated five times: catching, building the report, the reset, and the difference
 * between how a developer and a user should experience a crash.
 *
 * **Development re-throws after the fallback renders.** Without that, the React error overlay never
 * appears and a crash in development looks like a designed state — which is exactly how a bug ships.
 * In production the fallback is the whole response, plus one `console.error` carrying the report.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const report = this.report(error)

    // One line, and it is the report: a production console full of framework noise is what makes
    // people stop reading it. The component stack goes with it because that is what a bug needs.
    window.console.error(`[${this.props.where}] ${report}`, info.componentStack)

    if (process.env.NODE_ENV === 'development') {
      /*
       * Re-thrown on the next tick rather than here: throwing inside `componentDidCatch` replaces
       * the fallback with a blank screen, and the point is to have both — the designed state to look
       * at, and the overlay that says where it came from.
       */
      setTimeout(() => {
        throw error
      })
    }
  }

  private report(error: unknown): string {
    return formatErrorReport({
      error,
      appVersion: APP_VERSION,
      ...(this.props.blockId === undefined ? {} : { blockId: this.props.blockId }),
      ...(this.props.nodeId === undefined ? {} : { nodeId: this.props.nodeId }),
      document: this.props.describeDocument?.() ?? null,
      ...(typeof navigator === 'undefined' ? {} : { userAgent: navigator.userAgent }),
    })
  }

  private readonly reset = (): void => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  override render(): ReactNode {
    const { error } = this.state

    if (error === null) {
      return this.props.children
    }

    return this.props.fallback({ error, reset: this.reset, report: this.report(error) })
  }
}
