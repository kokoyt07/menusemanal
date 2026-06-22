import { useState } from 'react'
import type { SVGProps } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import { showToast } from '../utils/toast'
import { isDarkMode, applyDarkMode } from '../utils/theme'
import { haptic } from '../utils/haptic'
import {
  Moon, Sun, Download, Upload, BookOpen, Shield, FileText, Code, Smartphone,
  Trash, Share, ChevronRight,
} from '../components/Icon'

type IconFC = React.FC<SVGProps<SVGSVGElement> & { size?: number; sw?: number }>

interface Props {
  onShowTutorial: () => void
  onShowInstall:  () => void
}

const APP_VERSION = '1.0.0'

const PRIVACY_TEXT = `TuCocinaApp no recopila, transmite ni comparte ningún dato personal. Toda tu información (platos, menús, categorías, notas) se almacena exclusivamente en tu dispositivo mediante IndexedDB, la base de datos local del navegador.

• Sin cuentas de usuario
• Sin seguimiento ni analítica
• Sin publicidad de ningún tipo
• Funciona completamente sin conexión

Si desinstalas la app o borras los datos del navegador, toda tu información se eliminará permanentemente. Exporta una copia de seguridad regularmente desde Ajustes → Tus datos.`

const TERMS_TEXT = `TuCocinaApp es una aplicación gratuita para uso personal. Se proporciona "tal cual", sin garantías de ningún tipo. El desarrollador no se hace responsable de la pérdida de datos ni de cualquier daño derivado del uso de la aplicación.

Queda prohibido el uso comercial, la distribución o la modificación del código sin autorización expresa del autor.

Al usar esta aplicación aceptas estas condiciones.`

const LICENSES_TEXT = `React 18 — MIT License
Dexie.js v4 — Apache License 2.0
Tailwind CSS v3 — MIT License
jsPDF v2 — MIT License
Vite v5 — MIT License
vite-plugin-pwa — MIT License
Inter Font — SIL Open Font License`

export default function SettingsView({ onShowTutorial, onShowInstall }: Props) {
  const [dark, setDark]           = useState(isDarkMode())
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [importing, setImporting] = useState(false)

  const dishCount = useLiveQuery(() => db.dishes.count())    ?? 0
  const catCount  = useLiveQuery(() => db.categories.count()) ?? 0
  const weekCount = useLiveQuery(() => db.menus.count())      ?? 0

  function toggleDark() {
    haptic(6)
    const next = !dark
    setDark(next)
    applyDarkMode(next)
  }

  async function exportData() {
    haptic(8)
    try {
      const [categories, dishes, menus, days, shoppingExtras] = await Promise.all([
        db.categories.toArray(),
        db.dishes.toArray(),
        db.menus.toArray(),
        db.days.toArray(),
        db.shoppingExtras.toArray(),
      ])
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        categories, dishes, menus, days, shoppingExtras,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `tucocinapp_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      showToast(`Exportados ${dishes.length} platos y ${menus.length} semanas`)
    } catch {
      showToast('Error al exportar', 'error')
    }
  }

  async function importFile(file: File) {
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.version || !Array.isArray(data.dishes)) {
        showToast('Archivo no válido', 'error')
        return
      }
      await db.transaction('rw', [db.categories, db.dishes, db.menus, db.days, db.shoppingExtras], async () => {
        await Promise.all([
          db.categories.clear(), db.dishes.clear(),
          db.menus.clear(),      db.days.clear(),
          db.shoppingExtras.clear(),
        ])
        if (data.categories?.length)     await db.categories.bulkAdd(data.categories)
        if (data.dishes?.length)         await db.dishes.bulkAdd(data.dishes)
        if (data.menus?.length)          await db.menus.bulkAdd(data.menus)
        if (data.days?.length)           await db.days.bulkAdd(data.days)
        if (data.shoppingExtras?.length) await db.shoppingExtras.bulkAdd(data.shoppingExtras)
      })
      showToast(`Importados ${data.dishes?.length ?? 0} platos`)
    } catch {
      showToast('Error al importar', 'error')
    } finally {
      setImporting(false)
    }
  }

  function openFilePicker() {
    haptic(6)
    const input = document.createElement('input')
    input.type   = 'file'
    input.accept = 'application/json,.json'
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) importFile(file)
    }
    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  }

  async function deleteAll() {
    haptic(25)
    try {
      await db.transaction('rw', [db.categories, db.dishes, db.menus, db.days, db.shoppingExtras], async () => {
        await Promise.all([
          db.categories.clear(), db.dishes.clear(),
          db.menus.clear(),      db.days.clear(),
          db.shoppingExtras.clear(),
        ])
      })
      setConfirmDel(false)
      showToast('Todos los datos eliminados')
    } catch {
      showToast('Error al eliminar datos', 'error')
    }
  }

  async function shareApp() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'TuCocinaApp – Menús Semanales',
          text: 'Planifica las comidas y cenas de toda la semana y genera la lista de la compra automáticamente.',
          url: window.location.origin,
        })
      } else {
        await navigator.clipboard.writeText(window.location.origin)
        showToast('Enlace copiado')
      }
    } catch { /* cancelled */ }
  }

  return (
    <div className="content-area pb-8" style={{ background: 'var(--cream)' }}>

      {/* ── DATOS ─────────────────────────────────────────────────────────── */}
      <Header>Tus datos</Header>
      <Card>
        <Row icon={Download} label="Exportar datos"
          sub="Descarga una copia de seguridad en JSON" onTap={exportData} />
        <Divider />
        <Row icon={Upload} label="Importar datos"
          sub="Restaura desde un archivo de copia de seguridad"
          onTap={openFilePicker}
          right={importing ? <Spinner /> : undefined} />
      </Card>

      {/* Stats */}
      <div className="mx-4 mt-2 mb-1 rounded-2xl flex items-center anim-up"
        style={{ background: 'var(--brand-soft)', border: '1px solid var(--cream-border)' }}>
        <Stat value={dishCount} label="Platos" />
        <div style={{ width: 1, height: 36, background: 'var(--cream-border)' }} />
        <Stat value={catCount} label="Categorías" />
        <div style={{ width: 1, height: 36, background: 'var(--cream-border)' }} />
        <Stat value={weekCount} label="Semanas" />
      </div>

      {/* ── APARIENCIA ────────────────────────────────────────────────────── */}
      <Header>Apariencia</Header>
      <Card>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Badge icon={dark ? Moon : Sun} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>Modo oscuro</p>
            <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>Cambia el tema a tonos oscuros</p>
          </div>
          <Toggle on={dark} onTap={toggleDark} />
        </div>
      </Card>

      {/* ── APRENDE ───────────────────────────────────────────────────────── */}
      <Header>Aprende a usarla</Header>
      <Card>
        <Row icon={BookOpen} label="Tutorial de uso"
          sub="Vuelve a ver los pasos de inicio"
          onTap={() => { haptic(6); onShowTutorial() }} />
        <Divider />
        <Row icon={Smartphone} label="Instalar en el móvil"
          sub="Añade la app a la pantalla de inicio"
          onTap={() => { haptic(6); onShowInstall() }} />
        <Divider />
        <Row icon={Share} label="Compartir TuCocinaApp"
          sub="Recomiéndala a familia y amigos"
          onTap={() => { haptic(6); shareApp() }} />
      </Card>

      {/* ── LEGAL ─────────────────────────────────────────────────────────── */}
      <Header>Legal</Header>
      <Card>
        <Accordion icon={Shield} label="Política de privacidad"
          open={expanded === 'privacy'} onTap={() => setExpanded(p => p === 'privacy' ? null : 'privacy')}>
          <Legal text={PRIVACY_TEXT} />
        </Accordion>
        <Divider />
        <Accordion icon={FileText} label="Términos de uso"
          open={expanded === 'terms'} onTap={() => setExpanded(p => p === 'terms' ? null : 'terms')}>
          <Legal text={TERMS_TEXT} />
        </Accordion>
        <Divider />
        <Accordion icon={Code} label="Licencias open source"
          open={expanded === 'licenses'} onTap={() => setExpanded(p => p === 'licenses' ? null : 'licenses')}>
          <Legal text={LICENSES_TEXT} />
        </Accordion>
      </Card>

      {/* ── ZONA DE PELIGRO ───────────────────────────────────────────────── */}
      <Header>Zona de peligro</Header>
      <Card>
        {confirmDel ? (
          <div className="px-4 py-4 anim-scale">
            <p className="text-sm font-bold mb-1" style={{ color: '#C0392B' }}>
              ¿Seguro? Esta acción no se puede deshacer
            </p>
            <p className="text-xs mb-4" style={{ color: '#AFA59A' }}>
              Se eliminarán todos los platos, categorías y menús guardados.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:opacity-70"
                style={{ background: 'var(--cream)', color: 'var(--brand)', border: '1px solid var(--cream-border)' }}>
                Cancelar
              </button>
              <button onClick={deleteAll}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold active:opacity-70"
                style={{ background: '#C0392B', color: 'white' }}>
                Eliminar todo
              </button>
            </div>
          </div>
        ) : (
          <Row icon={Trash} label="Eliminar todos los datos"
            sub="Borra platos, menús y categorías permanentemente"
            danger onTap={() => { haptic(12); setConfirmDel(true) }} right={null} />
        )}
      </Card>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 px-8 pt-8 pb-4 text-center">
        <img src="/logo.png" alt="TuCocinaApp"
          className="h-12 w-auto"
          style={{ opacity: 0.45, filter: dark ? 'brightness(3) saturate(0)' : 'none' }} />
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--brand)', opacity: 0.55 }}>TuCocinaApp</p>
          <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>Versión {APP_VERSION}</p>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: '#C8C0B5' }}>
          Tus datos se guardan en este dispositivo.
          <br />Nada se envía a ningún servidor.
        </p>
      </div>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function Header({ children }: { children: React.ReactNode }) {
  return <p className="section-label px-5 pt-5 pb-2">{children}</p>
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--cream-border)',
               boxShadow: '0 1px 6px rgba(47,29,27,0.06)' }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="mx-4" style={{ height: 1, background: 'var(--cream-border)' }} />
}

function Badge({ icon: Icon, danger = false }: { icon: IconFC; danger?: boolean }) {
  return (
    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: danger ? '#FEF3EE' : 'var(--brand-soft)' }}>
      <Icon size={17} style={{ color: danger ? '#C0392B' : 'var(--brand)' }} />
    </div>
  )
}

function Row({ icon, label, sub, onTap, danger = false, right }: {
  icon: IconFC; label: string; sub?: string; onTap?: () => void
  danger?: boolean; right?: React.ReactNode
}) {
  return (
    <button onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70">
      <Badge icon={icon} danger={danger} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: danger ? '#C0392B' : 'var(--brand)' }}>
          {label}
        </p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#AFA59A' }}>{sub}</p>}
      </div>
      {right !== undefined ? right : <ChevronRight size={16} style={{ color: '#D9D2CA' }} />}
    </button>
  )
}

function Toggle({ on, onTap }: { on: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} className="relative flex-shrink-0"
      style={{ width: 44, height: 26 }}>
      <div className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ background: on ? 'var(--brand)' : '#D9D2CA' }} />
      <div className="absolute top-[3px] rounded-full transition-all duration-200"
        style={{ width: 20, height: 20, left: on ? 21 : 3,
                 background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.20)' }} />
    </button>
  )
}

function Accordion({ icon, label, open, onTap, children }: {
  icon: IconFC; label: string; open: boolean; onTap: () => void; children: React.ReactNode
}) {
  return (
    <>
      <button onClick={onTap}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70">
        <Badge icon={icon} />
        <p className="flex-1 text-sm font-semibold" style={{ color: 'var(--brand)' }}>{label}</p>
        <div style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.20s' }}>
          <ChevronRight size={16} style={{ color: '#D9D2CA' }} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 anim-up">
          {children}
        </div>
      )}
    </>
  )
}

function Legal({ text }: { text: string }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: 'var(--cream)' }}>
      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#AFA59A' }}>{text}</p>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 py-3 text-center">
      <p className="text-2xl font-black" style={{ color: 'var(--brand)' }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#AFA59A' }}>{label}</p>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round"
      style={{ color: '#AFA59A' }}>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/>
      <path d="M21 12a9 9 0 00-9-9"/>
    </svg>
  )
}
