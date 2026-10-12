import { TiltCard, AnimatedNumber } from '../fx/motion'
import { cn } from '../../lib/cn'

const tones = {
  brand: { tile: 'from-violet-500 to-indigo-600 shadow-violet-500/40', glow: 'bg-violet-500/30' },
  green: { tile: 'from-emerald-400 to-teal-600 shadow-emerald-500/40', glow: 'bg-emerald-500/25' },
  yellow: { tile: 'from-amber-400 to-orange-600 shadow-amber-500/40', glow: 'bg-amber-500/25' },
  purple: { tile: 'from-fuchsia-500 to-purple-600 shadow-fuchsia-500/40', glow: 'bg-fuchsia-500/25' },
  cyan: { tile: 'from-cyan-400 to-sky-600 shadow-cyan-500/40', glow: 'bg-cyan-500/25' },
}

/**
 * Tilting glass KPI card. Pass a number as `value` (with an optional `format`)
 * to get a count-up animation; strings render as-is.
 */
export function StatCard({ label, value, format, sub, icon: Icon, tone = 'brand' }) {
  const t = tones[tone] || tones.brand
  return (
    <TiltCard className="overflow-hidden p-5">
      <div
        aria-hidden
        className={cn('pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100', t.glow)}
      />
      <div className="relative" style={{ transform: 'translateZ(30px)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          {Icon && (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
                'transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110',
                t.tile
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="mt-1 whitespace-nowrap text-2xl font-semibold tabular-nums tracking-tight">
          {typeof value === 'number' ? <AnimatedNumber value={value} format={format} /> : value}
        </div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </TiltCard>
  )
}
