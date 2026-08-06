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
        className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-[overlay-in_0.15s_ease-out] data-[state=closed]:animate-[overlay-out_0.15s_ease-in]"
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col bg-card text-card-foreground shadow-xl',
          'inset-x-0 bottom-0 top-auto max-h-[92vh] rounded-t-2xl',
          'sm:inset-x-auto sm:inset-y-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:rounded-2xl sm:max-h-[85vh]',
          'data-[state=open]:animate-[content-in_0.15s_ease-out] data-[state=closed]:animate-[content-out_0.15s_ease-in]',
          'focus:outline-none',
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('shrink-0 border-b border-border px-6 py-4', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn('text-base font-semibold', className)} {...props} />
}

export function DialogBody({ className, ...props }) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-5', className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4',
        className
      )}
      {...props}
    />
  )
}
