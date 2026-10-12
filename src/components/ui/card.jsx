import { cn } from '../../lib/cn'
import { trackPointer } from '../fx/motion'

export function Card({ className, onMouseMove, ...props }) {
  return (
    <div
      onMouseMove={(e) => { trackPointer(e); onMouseMove?.(e) }}
      className={cn(
        'ring-glow glass overflow-hidden rounded-2xl text-card-foreground',
        'shadow-[0_1px_0_0_rgb(255_255_255/0.05)_inset,0_12px_40px_-20px_rgb(76_29_149/0.35)]',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 border-b border-foreground/[0.06] px-5 py-4', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('flex items-center gap-2 text-sm font-semibold tracking-tight', className)} {...props}>
      <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
      {children}
    </h3>
  )
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />
}
