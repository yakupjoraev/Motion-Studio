export interface PlanCardProps {
  plan?: string
  price?: number
}

export function PlanCard({ plan = 'Starter', price = 0 }: PlanCardProps) {
  return (
    <article className="rounded-xl border bg-surface-1 p-6">
      <h3 className="font-semibold">{plan}</h3>
      <p className="tabular-nums">{price}</p>
    </article>
  )
}
