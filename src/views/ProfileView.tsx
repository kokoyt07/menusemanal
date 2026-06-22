import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useData } from '../contexts/DataContext'
import { showToast } from '../utils/toast'
import { haptic } from '../utils/haptic'
import { Pencil, Check, X, Key, UserCircle } from '../components/Icon'

interface Props { user: User }

export default function ProfileView({ user }: Props) {
  const { dishes, categories } = useData()

  const firstName = (user.user_metadata?.first_name as string) ?? ''
  const lastName  = (user.user_metadata?.last_name  as string) ?? ''

  const [editingName, setEditingName] = useState(false)
  const [fName, setFName]             = useState(firstName)
  const [lName, setLName]             = useState(lastName)
  const [saving, setSaving]           = useState(false)
  const [menusCount, setMenusCount]   = useState<number | null>(null)

  useEffect(() => {
    supabase.from('weekly_menus')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setMenusCount(count ?? 0))
  }, [user.id])

  // Sync edit fields when user metadata changes externally
  useEffect(() => {
    if (!editingName) { setFName(firstName); setLName(lastName) }
  }, [firstName, lastName, editingName])

  const initials    = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?'
  const fullName    = [firstName, lastName].filter(Boolean).join(' ')
  const memberSince = new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  async function saveName() {
    if (!fName.trim()) { showToast('El nombre no puede estar vacío', 'error'); return }
    haptic()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { first_name: fName.trim(), last_name: lName.trim() },
    })
    setSaving(false)
    if (error) {
      console.error('[ProfileView] updateUser:', error)
      showToast('Error al guardar el nombre', 'error')
    } else {
      showToast('Nombre actualizado')
      setEditingName(false)
    }
  }

  async function sendPasswordReset() {
    if (!user.email) return
    haptic()
    const { error } = await supabase.auth.resetPasswordForEmail(user.email)
    if (error) {
      showToast('Error al enviar el email', 'error')
    } else {
      showToast('Email de cambio de contraseña enviado')
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>
      <div className="content-area">

        {/* ── Avatar + identidad ── */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--cream-border)' }}>
          <div className="relative mb-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white select-none"
              style={{ background: 'var(--brand)', boxShadow: '0 4px 16px rgba(47,29,27,0.22)' }}>
              {initials}
            </div>
          </div>
          <h2 className="text-xl font-bold leading-tight text-center" style={{ color: 'var(--brand)' }}>
            {fullName || 'Sin nombre'}
          </h2>
          <p className="text-sm mt-1" style={{ color: '#AFA59A' }}>{user.email}</p>
          <p className="text-xs mt-2 font-medium px-3 py-1 rounded-full"
            style={{ background: 'var(--cream)', color: '#AFA59A' }}>
            Miembro desde {memberSince}
          </p>
        </div>

        <div className="px-4 py-4 space-y-3">

          {/* ── Estadísticas ── */}
          <div className="card px-4 py-4">
            <p className="section-label mb-3">Mis estadísticas</p>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Platos"     value={dishes?.length    ?? 0} />
              <StatBox label="Categorías" value={categories?.length ?? 0} />
              <StatBox label="Semanas"    value={menusCount ?? '–'} />
            </div>
          </div>

          {/* ── Datos personales ── */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--cream-border)' }}>
              <p className="section-label">Datos personales</p>
              {!editingName && (
                <button
                  onClick={() => { setFName(firstName); setLName(lastName); setEditingName(true) }}
                  className="flex items-center gap-1.5 text-xs font-semibold active:opacity-60"
                  style={{ color: 'var(--brand)' }}>
                  <Pencil size={12} />
                  Editar
                </button>
              )}
            </div>

            {editingName ? (
              <div className="px-4 py-4 space-y-3 anim-scale">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#AFA59A' }}>
                    Nombre
                  </label>
                  <input
                    value={fName} onChange={e => setFName(e.target.value)}
                    placeholder="Nombre" autoComplete="given-name"
                    className="w-full px-3.5 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--cream)', border: '1.5px solid var(--brand)', color: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#AFA59A' }}>
                    Apellidos
                  </label>
                  <input
                    value={lName} onChange={e => setLName(e.target.value)}
                    placeholder="Apellidos" autoComplete="family-name"
                    className="w-full px-3.5 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--cream)', border: '1.5px solid var(--brand)', color: 'var(--brand)' }}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveName} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:opacity-75 disabled:opacity-40"
                    style={{ background: 'var(--brand)', color: 'white' }}>
                    <Check size={15} />
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold active:opacity-70"
                    style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <InfoRow label="Nombre"    value={firstName || '—'} />
                <InfoRow label="Apellidos" value={lastName  || '—'} divider />
                <InfoRow label="Email"     value={user.email ?? '—'} divider />
              </>
            )}
          </div>

          {/* ── Seguridad ── */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
              <p className="section-label">Seguridad</p>
            </div>
            <button
              onClick={sendPasswordReset}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70">
              <Key size={16} style={{ color: '#AFA59A', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Cambiar contraseña</p>
                <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>
                  Recibirás un email con el enlace de cambio
                </p>
              </div>
            </button>
          </div>

          {/* ── Sin datos ── */}
          {dishes === undefined && (
            <div className="flex items-center justify-center py-8">
              <UserCircle size={36} style={{ color: '#D9D2CA' }} />
            </div>
          )}

        </div>
        <div className="h-8" />
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center px-2 py-3 rounded-xl"
      style={{ background: 'var(--cream)', border: '1px solid var(--cream-border)' }}>
      <span className="text-2xl font-bold leading-none" style={{ color: 'var(--brand)' }}>{value}</span>
      <span className="text-[11px] font-medium mt-1 text-center" style={{ color: '#AFA59A' }}>{label}</span>
    </div>
  )
}

function InfoRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5"
      style={{ borderTop: divider ? '1px solid var(--cream-border)' : undefined }}>
      <span className="text-sm w-20 flex-shrink-0" style={{ color: '#AFA59A' }}>{label}</span>
      <span className="flex-1 text-sm font-medium text-right truncate" style={{ color: 'var(--brand)' }}>
        {value}
      </span>
    </div>
  )
}
