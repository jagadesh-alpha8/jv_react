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
        'border-b border-foreground/[0.06] bg-foreground/[0.025] text-[11px] uppercase tracking-wider text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export function TBody({ className, ...props }) {
  return <tbody className={cn('divide-y divide-foreground/[0.05]', className)} {...props} />
}

export function Tr({ className, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors duration-200 hover:bg-gradient-to-r hover:from-violet-500/[0.07] hover:via-indigo-500/[0.03] hover:to-transparent',
        className
      )}
      {...props}
    />
  )
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
      <td colSpan={colSpan} className="px-4 py-14 text-center text-sm text-muted-foreground">
        <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-400/20 ring-1 ring-inset ring-violet-400/20" />
        {children}
      </td>
    </tr>
  )
}
