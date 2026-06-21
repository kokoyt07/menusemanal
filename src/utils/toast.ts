export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

type Listener = (t: ToastItem) => void
const listeners = new Set<Listener>()

export function showToast(message: string, type: ToastType = 'success') {
  const item: ToastItem = { id: crypto.randomUUID(), message, type }
  listeners.forEach(fn => fn(item))
}

export function _subscribeToast(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
