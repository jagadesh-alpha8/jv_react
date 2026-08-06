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
          'z-50 min-w-[10rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg',
          'data-[state=open]:animate-[content-in_0.12s_ease-out] data-[state=closed]:animate-[content-out_0.1s_ease-in]',
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
        'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm outline-none',
        'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <DropdownPrimitive.Separator className={cn('my-1 h-px bg-border', className)} {...props} />
}

export function DropdownMenuLabel({ className, ...props }) {
  return (
    <DropdownPrimitive.Label
      className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}
