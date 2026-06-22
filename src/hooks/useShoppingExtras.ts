import { useState, useEffect } from 'react'
import type { ShoppingExtra } from '../types'
import { supabase } from '../lib/supabase'
import { showToast } from '../utils/toast'

export function useShoppingExtras(weekStart: string, userId: string) {
  const [extras, setExtras] = useState<ShoppingExtra[] | undefined>(undefined)

  useEffect(() => {
    setExtras(undefined)
    supabase.from('shopping_extras')
      .select('*')
      .eq('week_start', weekStart)
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) {
          console.error('[useShoppingExtras] fetch:', error)
          setExtras([])
          return
        }
        setExtras(data?.map(r => ({ id: r.id, weekStart: r.week_start, text: r.text })) ?? [])
      })
  }, [weekStart, userId])

  async function addExtra(text: string): Promise<void> {
    const id = crypto.randomUUID()
    setExtras(prev => [...(prev ?? []), { id, weekStart, text }])
    const { error } = await supabase
      .from('shopping_extras')
      .insert({ id, user_id: userId, week_start: weekStart, text })
    if (error) {
      console.error('[useShoppingExtras] add:', error)
      setExtras(prev => prev?.filter(e => e.id !== id))
      showToast('Error al guardar el elemento', 'error')
    }
  }

  async function removeExtra(id: string): Promise<void> {
    const prev = extras?.find(e => e.id === id)
    setExtras(e => e?.filter(ex => ex.id !== id))
    const { error } = await supabase.from('shopping_extras').delete().eq('id', id)
    if (error) {
      console.error('[useShoppingExtras] remove:', error)
      if (prev) setExtras(e => [...(e ?? []), prev])
      showToast('Error al eliminar el elemento', 'error')
    }
  }

  return { extras, addExtra, removeExtra }
}
