import { cn } from '../../lib/cn'

const variants = {
  gray: 'bg-secondary text-secondary-foreground',
  blue: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  green: 'bg-success/15 text-success',
  yellow: 'bg-warning/15 text-warning',
  red: 'bg-destructive/15 text-destructive',
  brand: 'bg-primary/15 text-primary',
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[c],
        className
      )}
    >
      {l}
    </span>
  )
}
