import { cn } from '../../lib/cn'

export function StatCard({ label, value, sub, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-primary/10 text-primary',
    green: 'bg-success/10 text-success',
    yellow: 'bg-warning/10 text-warning',
    purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  }
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
