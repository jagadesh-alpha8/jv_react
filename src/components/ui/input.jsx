import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-foreground/[0.11] bg-[#0b0e18]/75 px-3 py-1.5 text-sm shadow-[0_1px_0_rgb(255_255_255/0.035)_inset] backdrop-blur',
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
