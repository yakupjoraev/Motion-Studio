'use client'

/** Two offset outlines behind the ghost: what "more than one layer is coming" looks like. */
export function GhostStack() {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-xs ring-1 ring-accent/30"
        data-testid="ghost-stack-back"
      />
      <span
        aria-hidden
        className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-xs ring-1 ring-accent/50"
      />
    </>
  )
}
