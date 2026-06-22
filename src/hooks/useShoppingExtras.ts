import { useState, useEffect } from 'react'
import type { ShoppingExtra } from '../types'
import { supabase } from '../lib/supabase'

export function useShoppingExtras(weekStart: string, userId: string) {
  const [extras, setExtras] = useState<ShoppingExtra[] | undefined>(undefined)

  useEffect(() => {
    setExtras(undefined)
    supabase.from('shopping_extras')
      .select('*')
      .eq('week_start', weekStart)
      .eq('user_id', userId)
      .then(({ data }) => {
        setExtras(data?.map(r => ({ id: r.id, weekStart: r.week_start, text: r.text })) ?? [])
      })
  }, [weekStart, userId])

  async function addExtra(text: string): Promise<void> {
    const id = crypto.randomUUID()
    setExtras(prev => [...(prev ?? []), { id, weekStart, text }])
    await supabase.from('shopping_extras').insert({ id, user_id: userId, week_start: weekStart, text })
  }

  async function removeExtra(id: string): Promise<void> {
    setExtras(prev => prev?.filter(e => e.id !== id))
    await supabase.from('shopping_extras').delete().eq('id', id)
  }

  return { extras, addExtra, removeExtra }
}
