import { cn } from '../../lib/cn'

export function TableWrap({ className, children }) {
  return <div className={cn('overflow-x-auto', className)}>{children}</div>
}

export function Table({ className, ...props }) {
  return <table className={cn('w-full min-w-[720px] text-left text-sm', className)} {...props} />
}

export function THead({ className, ...props }) {
  return (
    <thead
      className={cn(
        'border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export function TBody({ className, ...props }) {
  return <tbody className={cn('divide-y divide-border', className)} {...props} />
}

export function Tr({ className, ...props }) {
  return <tr className={cn('transition-colors hover:bg-muted/40', className)} {...props} />
}

export function Th({ className, ...props }) {
  return <th className={cn('whitespace-nowrap px-4 py-3 font-medium', className)} {...props} />
}

export function Td({ className, ...props }) {
  return <td className={cn('whitespace-nowrap px-4 py-3 align-middle', className)} {...props} />
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  )
}
