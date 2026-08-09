'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface NodeErrorBoundaryProps {
  readonly blockId: string
  readonly nodeName: string
  readonly children: ReactNode
}

interface NodeErrorBoundaryState {
  readonly message: string | null
}

/**
 * One boundary per node. A block that throws takes out its own card and nothing else — the rest of
 * the canvas keeps rendering and the document is still in the store, which is what makes the
 * failure survivable rather than a lost session.
 *
 * A class, because an error boundary is the one thing React still has no hook for.
 */
export class NodeErrorBoundary extends Component<NodeErrorBoundaryProps, NodeErrorBoundaryState> {
  override state: NodeErrorBoundaryState = { message: null }

  static getDerivedStateFromError(error: unknown): NodeErrorBoundaryState {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // The component stack is the only part of this a user could act on, and it is what a bug report
    // needs; the console is where a developer already looks for it.
    window.console.error(`[${this.props.blockId}] ${error.message}`, info.componentStack)
  }

  override render(): ReactNode {
    const { message } = this.state

    if (message === null) {
      return this.props.children
    }

    return (
      <div
        className="flex flex-col gap-1 rounded-sm border border-danger/40 bg-danger-muted/30 p-3 text-xs"
        data-testid="node-error"
        role="alert"
      >
        <span className="font-medium text-danger">
          {this.props.nodeName} ({this.props.blockId}) failed to render
        </span>
        <span className="text-foreground-muted">{message}</span>
      </div>
    )
  }
}
