export function Pricing() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <article className="rounded-xl border bg-surface-1 p-6">
        <h3 className="font-semibold">Starter</h3>
        <p className="tabular-nums">0</p>
      </article>
      <article className="rounded-xl border bg-surface-1 p-6">
        <h3 className="font-semibold">Pro</h3>
        <p className="tabular-nums">29</p>
      </article>
      <article className="rounded-xl border bg-surface-1 p-6">
        <h3 className="font-semibold">Team</h3>
        <p className="tabular-nums">79</p>
      </article>
      <article className="rounded-xl border bg-surface-1 p-6">
        <h3 className="font-semibold">Custom</h3>
        <p className="tabular-nums">0</p>
        <section className="relative isolate overflow-hidden px-4 py-8" />
      </article>
    </div>
  )
}
