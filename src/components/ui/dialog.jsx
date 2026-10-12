import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

const sizes = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
}

export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

export function DialogContent({ className, size = 'md', children, showClose = true, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=open]:animate-[overlay-in_0.2s_ease-out] data-[state=closed]:animate-[overlay-out_0.15s_ease-in]"
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col border border-foreground/10 bg-card/90 text-card-foreground backdrop-blur-xl',
          'shadow-[0_30px_80px_-20px_rgb(0_0_0/0.5),0_0_0_1px_rgb(255_255_255/0.04)_inset]',
          'inset-x-0 bottom-0 top-auto max-h-[92vh] rounded-t-3xl',
          'sm:inset-x-auto sm:inset-y-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:rounded-3xl sm:max-h-[85vh]',
          'data-[state=open]:animate-[content-in_0.35s_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[content-out_0.15s_ease-in]',
          'focus:outline-none',
          sizes[size],
          className
        )}
        {...props}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-all hover:rotate-90 hover:bg-violet-500/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('shrink-0 border-b border-foreground/[0.06] px-6 py-4', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn('text-base font-semibold tracking-tight', className)} {...props} />
}

export function DialogBody({ className, ...props }) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-5', className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-end gap-2 border-t border-foreground/[0.06] px-6 py-4',
        className
      )}
      {...props}
    />
  )
}
