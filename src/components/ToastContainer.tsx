import { useState, useEffect } from 'react'
import type { ToastItem } from '../utils/toast'
import { _subscribeToast } from '../utils/toast'
import { Check, X, AlertTriangle } from './Icon'

const STYLE: Record<string, { bg: string; border: string; color: string }> = {
  success: { bg: '#2F1D1B',  border: 'rgba(255,255,255,0.12)', color: '#fff' },
  error:   { bg: '#C0392B',  border: 'rgba(255,255,255,0.12)', color: '#fff' },
  info:    { bg: '#4E302D',  border: 'rgba(255,255,255,0.12)', color: '#fff' },
}

const ICON = {
  success: Check,
  error:   X,
  info:    AlertTriangle,
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    return _subscribeToast(item => {
      setToasts(prev => [...prev, item])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== item.id)), 2800)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed left-0 right-0 flex flex-col items-center gap-2 z-[100] pointer-events-none px-4"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
      {toasts.map(t => {
        const s = STYLE[t.type] ?? STYLE.info
        const IcoComp = ICON[t.type as keyof typeof ICON] ?? Check
        return (
          <div key={t.id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-semibold anim-scale"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
            <IcoComp size={14} sw={2.5} />
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
