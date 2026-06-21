import { useState, useEffect } from 'react'
import type { ToastItem } from '../utils/toast'
import { _subscribeToast } from '../utils/toast'

const BG: Record<string, string> = {
  success: 'bg-gray-800',
  error:   'bg-red-500',
  info:    'bg-blue-500',
}
const ICON: Record<string, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
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
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`${BG[t.type]} px-5 py-2.5 rounded-full shadow-lg text-sm font-medium text-white`}
        >
          {ICON[t.type]} {t.message}
        </div>
      ))}
    </div>
  )
}
