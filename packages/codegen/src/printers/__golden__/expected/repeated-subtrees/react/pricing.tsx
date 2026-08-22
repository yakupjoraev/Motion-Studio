import { PlanCard } from './plan-card'

export function Pricing() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <PlanCard plan="Starter" price={0} />
      <PlanCard plan="Pro" price={29} />
      <PlanCard plan="Team" price={79} />
      <article className="rounded-xl border bg-surface-1 p-6">
        <section className="relative isolate overflow-hidden px-4 py-8" />
      </article>
    </div>
  )
}
