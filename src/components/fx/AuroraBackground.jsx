import { cn } from '../../lib/cn'

/** Slow-drifting blurred colour fields + a faint grid, fixed behind the page. */
export function AuroraBackground({ className }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
      <div className="aurora-a absolute -left-[10%] -top-[20%] h-[55vh] w-[55vw] rounded-full bg-violet-600/25 blur-[110px]" />
      <div className="aurora-b absolute -right-[15%] top-[5%] h-[50vh] w-[45vw] rounded-full bg-cyan-500/15 blur-[120px]" />
      <div className="aurora-c absolute bottom-[-25%] left-[25%] h-[50vh] w-[50vw] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="grid-bg absolute inset-0" />
    </div>
  )
}
