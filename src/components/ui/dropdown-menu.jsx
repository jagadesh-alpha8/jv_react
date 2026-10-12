import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '../../lib/cn'

export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger

export function DropdownMenuContent({ className, sideOffset = 8, align = 'end', ...props }) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-[10rem] rounded-xl border border-foreground/10 bg-popover/85 p-1 text-popover-foreground backdrop-blur-xl',
          'shadow-[0_20px_50px_-12px_rgb(0_0_0/0.35)]',
          'data-[state=open]:animate-[pop-in_0.18s_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[overlay-out_0.1s_ease-in]',
          className
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  )
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-violet-500/10 focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <DropdownPrimitive.Separator className={cn('my-1 h-px bg-foreground/10', className)} {...props} />
}

export function DropdownMenuLabel({ className, ...props }) {
  return (
    <DropdownPrimitive.Label
      className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}
