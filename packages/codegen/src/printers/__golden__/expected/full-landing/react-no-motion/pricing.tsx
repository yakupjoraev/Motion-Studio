import { PlanCard } from './plan-card'

export function Pricing() {
  return (
    <div className="grid grid-cols-3 gap-8">
      <PlanCard plan="Starter" price={0} />
      <PlanCard plan="Pro" price={29} />
      <PlanCard plan="Team" price={79} />
    </div>
  )
}
