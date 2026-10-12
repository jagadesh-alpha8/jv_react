import { cn } from '../../lib/cn'

const variants = {
  gray: 'bg-secondary text-secondary-foreground ring-foreground/10',
  blue: 'bg-sky-500/10 ring-sky-500/25 text-sky-300',
  green: 'bg-emerald-500/10 ring-emerald-500/25 text-emerald-300',
  yellow: 'bg-amber-500/10 ring-amber-500/25 text-amber-300',
  red: 'bg-rose-500/10 ring-rose-500/25 text-rose-300',
  brand: 'bg-violet-500/10 ring-violet-500/25 text-violet-300',
}

const dots = {
  gray: 'bg-muted-foreground',
  blue: 'bg-sky-500',
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
  brand: 'bg-violet-500',
}

const statusColor = {
  unpaid: 'blue',
  paid: 'green',
  partially_paid: 'yellow',
  overdue: 'red',
}

const statusLabel = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  partially_paid: 'Partial',
  overdue: 'Overdue',
}

export function Badge({ status, label, color, className }) {
  const c = color || statusColor[status] || 'gray'
  const l = label || statusLabel[status] || status
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variants[c],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]', dots[c])} />
      {l}
    </span>
  )
}
