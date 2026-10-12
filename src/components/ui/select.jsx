import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full cursor-pointer appearance-none rounded-lg border border-foreground/10 bg-background/60 px-3 py-1.5 pr-8 text-sm backdrop-blur',
          'transition-all duration-200 hover:border-foreground/20',
          'focus-visible:outline-none focus-visible:border-violet-400/60 focus-visible:ring-4 focus-visible:ring-violet-500/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
})

export { Select }
