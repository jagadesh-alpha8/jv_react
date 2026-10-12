import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  default:
    'btn-shine text-white bg-gradient-to-b from-violet-500 to-indigo-600 ' +
    'shadow-[0_0_0_1px_rgb(255_255_255/0.12)_inset,0_8px_24px_-8px_rgb(124_58_237/0.7)] ' +
    'hover:-translate-y-px hover:shadow-[0_0_0_1px_rgb(255_255_255/0.2)_inset,0_12px_32px_-6px_rgb(124_58_237/0.85)]',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline:
    'border border-foreground/10 bg-card/40 backdrop-blur hover:border-violet-400/40 hover:bg-violet-500/[0.06] hover:text-foreground',
  ghost: 'hover:bg-violet-500/10 hover:text-violet-300',
  destructive:
    'btn-shine text-white bg-gradient-to-b from-rose-500 to-red-600 ' +
    'shadow-[0_0_0_1px_rgb(255_255_255/0.12)_inset,0_8px_24px_-8px_rgb(225_29_72/0.6)] hover:-translate-y-px',
  link: 'text-primary underline-offset-4 hover:underline',
}

const sizes = {
  default: 'h-9 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-6 text-sm',
  icon: 'h-9 w-9 shrink-0',
}

const Button = forwardRef(function Button(
  { className, variant = 'default', size = 'default', disabled, loading, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium',
        'transition-all duration-300 active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
})

export { Button }
