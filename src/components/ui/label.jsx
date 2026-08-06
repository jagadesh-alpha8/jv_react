import { cn } from '../../lib/cn'

export function Label({ className, ...props }) {
  return <label className={cn('mb-1.5 block text-sm font-medium', className)} {...props} />
}
