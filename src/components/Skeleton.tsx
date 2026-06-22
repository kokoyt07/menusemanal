import type { CSSProperties } from 'react'

/* ── Base ──────────────────────────────────────────────────────────────── */
function S({ w, h, r = 8, style }: { w?: number | string; h: number; r?: number; style?: CSSProperties }) {
  return (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />
  )
}

/* ── WeeklyMenuView skeleton ───────────────────────────────────────────── */
export function WeekMenuSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>
      {/* Navigator bar placeholder */}
      <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--cream-border)' }}>
        <S w={32} h={32} r={10} />
        <S w={140} h={16} style={{ margin: '0 auto' }} />
        <S w={32} h={32} r={10} />
      </div>
      <div className="content-area px-4 py-3 space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="card px-4 py-3.5 space-y-2.5">
            <div className="flex items-center gap-3">
              <S w={36} h={36} r={10} />
              <div className="flex-1 space-y-1.5">
                <S w={`${55 + (i % 3) * 15}%`} h={13} />
                <S w={`${35 + (i % 4) * 10}%`} h={11} />
              </div>
            </div>
          </div>
        ))}
        <div className="h-8" />
      </div>
    </div>
  )
}

/* ── DishesView skeleton ───────────────────────────────────────────────── */
export function DishListSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>
      {/* Filter bar placeholder */}
      <div className="flex gap-2 px-4 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--cream-border)' }}>
        <S w="100%" h={36} r={12} />
      </div>
      <div className="content-area px-4 py-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-3.5 px-4 py-3.5">
            <S w={44} h={44} r={12} />
            <div className="flex-1 space-y-2">
              <S w={`${50 + (i % 5) * 10}%`} h={14} />
              <S w={`${30 + (i % 4) * 8}%`} h={11} />
            </div>
            <S w={24} h={24} r={8} />
          </div>
        ))}
        <div className="h-20" />
      </div>
    </div>
  )
}

/* ── HistoryView skeleton ──────────────────────────────────────────────── */
export function HistorySkeleton() {
  return (
    <div className="content-area px-4 pt-4 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <S w={130} h={14} />
              <S w={90} h={11} />
            </div>
            <S w={32} h={32} r={10} />
          </div>
          <div className="flex gap-2">
            <S w={70} h={24} r={8} />
            <S w={56} h={24} r={8} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── ShoppingListView skeleton ─────────────────────────────────────────── */
export function ShoppingListSkeleton() {
  return (
    <div className="content-area px-4 py-3 space-y-4">
      {[3, 4, 2].map((count, g) => (
        <div key={g}>
          <S w={80} h={10} style={{ marginBottom: 10 }} />
          <div className="card overflow-hidden">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0"
                style={{ borderColor: 'var(--cream-border)' }}>
                <S w={20} h={20} r={6} />
                <S w={`${45 + (i * 17) % 40}%`} h={13} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
