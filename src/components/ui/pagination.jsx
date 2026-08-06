import { Button } from './button'

export function Pagination({ page, setPage, rowCount, totalCount, pageSize = 20 }) {
  if (totalCount <= pageSize) return null
  return (
    <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      <span className="text-xs text-muted-foreground">
        Showing {rowCount} of {totalCount}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          ← Prev
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={rowCount < pageSize}>
          Next →
        </Button>
      </div>
    </div>
  )
}
