import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useData } from '../contexts/DataContext'
import { showToast } from '../utils/toast'
import { LogOut, Download, Upload, Trash, ChevronRight } from '../components/Icon'
import PrivacyPolicySheet from './PrivacyPolicySheet'

interface Props { userId: string; onLogout: () => void }

export default function SettingsView({ userId, onLogout }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [importing, setImporting]         = useState(false)
  const [showPolicy, setShowPolicy]       = useState(false)

  const { dishes, categories } = useData()

  async function exportData() {
    const { data: menus }    = await supabase.from('weekly_menus').select('*, menu_days(*)').eq('user_id', userId)
    const { data: extraRows } = await supabase.from('shopping_extras').select('*').eq('user_id', userId)

    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      dishes:     dishes ?? [],
      categories: categories ?? [],
      menus:      menus ?? [],
      extras:     extraRows ?? [],
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `menus-semanales-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Exportacion descargada')
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text    = await file.text()
      const payload = JSON.parse(text)

      if (!payload.dishes || !payload.categories) throw new Error('Formato invalido')

      // Upsert categories + dishes (overwrite by id if they exist)
      if (payload.categories?.length > 0) {
        await supabase.from('dish_categories').upsert(
          payload.categories.map((c: Record<string, unknown>) => ({ ...c, user_id: userId })),
          { onConflict: 'id' }
        )
      }
      if (payload.dishes?.length > 0) {
        await supabase.from('dishes').upsert(
          payload.dishes.map((d: Record<string, unknown>) => ({ ...d, user_id: userId })),
          { onConflict: 'id' }
        )
      }

      showToast('Datos importados correctamente')
      window.location.reload()
    } catch (err) {
      showToast('Error al importar — archivo invalido')
      console.error(err)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  async function deleteAllData() {
    await supabase.from('dishes').delete().eq('user_id', userId)
    await supabase.from('dish_categories').delete().eq('user_id', userId)
    await supabase.from('weekly_menus').delete().eq('user_id', userId)
    await supabase.from('shopping_extras').delete().eq('user_id', userId)
    setConfirmDelete(false)
    showToast('Todos los datos eliminados')
    window.location.reload()
  }

  const dishCount = dishes?.length ?? 0
  const catCount  = categories?.length ?? 0

  return (
    <>
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--cream)' }}>
      <div className="content-area px-4 py-4 space-y-3">

        {/* Stats */}
        <div className="card px-4 py-4">
          <p className="section-label mb-3">Mis datos</p>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Platos" value={dishCount} />
            <StatBox label="Categorias" value={catCount} />
          </div>
        </div>

        {/* Data management */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
            <p className="section-label">Datos</p>
          </div>

          <button onClick={exportData}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70 border-b"
            style={{ borderColor: 'var(--cream-border)' }}>
            <Download size={16} style={{ color: '#AFA59A' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Exportar datos</p>
              <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>Descarga todos tus platos y menus en JSON</p>
            </div>
          </button>

          <label className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer active:opacity-70">
            <Upload size={16} style={{ color: '#AFA59A' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
                {importing ? 'Importando…' : 'Importar datos'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>Carga un archivo JSON exportado anteriormente</p>
            </div>
            <input type="file" accept=".json" className="hidden" onChange={importData} disabled={importing} />
          </label>
        </div>

        {/* Account */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
            <p className="section-label">Cuenta</p>
          </div>

          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70">
            <LogOut size={16} style={{ color: '#AFA59A' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Cerrar sesion</p>
          </button>
        </div>

        {/* Danger zone */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
            <p className="section-label" style={{ color: '#C0392B' }}>Zona de peligro</p>
          </div>

          {confirmDelete ? (
            <div className="px-4 py-4 anim-scale"
              style={{ background: '#FEF3EE', borderBottom: '1px solid #F5C0A4' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#8B4513' }}>
                Esto eliminara todos tus platos, categorias y menus permanentemente.
              </p>
              <div className="flex gap-2">
                <button onClick={deleteAllData}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#C0392B' }}>
                  Si, eliminar todo
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--cream)', color: 'var(--brand)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70">
              <Trash size={16} style={{ color: '#C0392B' }} />
              <p className="text-sm font-semibold" style={{ color: '#C0392B' }}>Eliminar todos mis datos</p>
            </button>
          )}
        </div>

        {/* Legal */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
            <p className="section-label">Legal</p>
          </div>

          <button onClick={() => setShowPolicy(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 active:opacity-70 border-b"
            style={{ borderColor: 'var(--cream-border)' }}>
            <div>
              <p className="text-sm font-semibold text-left" style={{ color: 'var(--brand)' }}>Política de Privacidad</p>
              <p className="text-xs mt-0.5 text-left" style={{ color: '#AFA59A' }}>Cómo tratamos tus datos (RGPD)</p>
            </div>
            <ChevronRight size={16} style={{ color: '#AFA59A', flexShrink: 0 }} />
          </button>

          <div className="px-4 py-4 space-y-2">
            <InfoRow label="Almacenamiento" value="Supabase – Frankfurt (UE)" />
            <InfoRow label="Datos compartidos con terceros" value="Ninguno" />
            <InfoRow label="Cookies de rastreo" value="Ninguna" />
            <InfoRow label="Contacto" value="famfumu4@gmail.com" />
          </div>
        </div>

        <p className="text-center text-[11px]" style={{ color: '#C8C0B5' }}>
          TuCocinaApp · Menús Semanales v2.0
        </p>
        <div className="h-8" />
      </div>
    </div>

    {showPolicy && <PrivacyPolicySheet onClose={() => setShowPolicy(false)} />}
    </>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3 rounded-xl text-center" style={{ background: 'var(--cream)', border: '1px solid var(--cream-border)' }}>
      <p className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>{label}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <p className="text-xs" style={{ color: '#AFA59A' }}>{label}</p>
      <p className="text-xs font-medium text-right" style={{ color: 'var(--brand)' }}>{value}</p>
    </div>
  )
}
