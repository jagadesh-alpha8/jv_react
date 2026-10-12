import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-foreground/10 bg-background/60 px-3 py-1.5 text-sm backdrop-blur',
        'transition-all duration-200 placeholder:text-muted-foreground hover:border-foreground/20',
        'focus-visible:outline-none focus-visible:border-violet-400/60 focus-visible:ring-4 focus-visible:ring-violet-500/15',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})

export { Input }
