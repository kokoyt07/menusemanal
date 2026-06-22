import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { haptic } from '../utils/haptic'
import PrivacyPolicySheet from './PrivacyPolicySheet'
import TermsOfServiceSheet from './TermsOfServiceSheet'

export default function AuthScreen() {
  const [mode, setMode]             = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [acceptPolicy, setAccept]   = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)
  const [showToS, setShowToS]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null)

  const isLogin = mode === 'login'

  function switchMode(m: 'login' | 'register' | 'forgot') {
    setMode(m)
    setMessage(null)
    setConfirm('')
    setAccept(false)
  }

  async function handleForgotPassword() {
    if (!email.trim()) { setMessage({ text: 'Introduce tu email para continuar.', ok: false }); return }
    haptic()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) {
      setMessage({ text: 'No se pudo enviar el email. Comprueba la dirección.', ok: false })
    } else {
      setMessage({ text: '✓ Email enviado. Revisa tu bandeja de entrada para restablecer la contraseña.', ok: true })
    }
  }

  function validate(): string | null {
    if (!email.trim()) return 'Introduce tu email.'
    if (!password) return 'Introduce tu contraseña.'
    if (!isLogin) {
      if (!firstName.trim()) return 'Introduce tu nombre.'
      if (!lastName.trim()) return 'Introduce tus apellidos.'
      if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
      if (password !== confirm) return 'Las contraseñas no coinciden.'
      if (!acceptPolicy) return 'Debes aceptar la política de privacidad para continuar.'
    }
    return null
  }

  async function handleLogin() {
    const err = validate()
    if (err) { setMessage({ text: err, ok: false }); return }
    haptic()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      const msg = error.message.toLowerCase().includes('email not confirmed')
        ? 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
        : 'Email o contraseña incorrectos.'
      setMessage({ text: msg, ok: false })
      haptic(20)
    }
  }

  async function handleRegister() {
    const err = validate()
    if (err) { setMessage({ text: err, ok: false }); return }
    haptic()
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } },
    })
    setLoading(false)
    if (error) {
      const msg = error.message.includes('already registered')
        ? 'Ya existe una cuenta con ese email.'
        : error.message
      setMessage({ text: msg, ok: false })
      haptic(20)
      return
    }
    if (data.user && !data.session) {
      setMessage({ text: '✓ Cuenta creada. Revisa tu email para confirmar.', ok: true })
      switchMode('login')
    }
  }

  const forgotContent = (
    <>
      <button onClick={() => switchMode('login')}
        className="flex items-center gap-1.5 mb-5 text-sm font-semibold active:opacity-60"
        style={{ color: '#AFA59A' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver al inicio de sesión
      </button>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--brand)' }}>Recuperar contraseña</h2>
      <p className="text-sm mb-5" style={{ color: '#AFA59A' }}>
        Te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Email" autoComplete="email"
        className="w-full px-4 py-3.5 rounded-xl text-sm outline-none mb-4"
        style={fieldStyle}
        onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} />
      {message && (
        <div className="mb-4 p-3 rounded-xl text-sm font-medium anim-scale"
          style={{ background: message.ok ? '#E8F5E9' : '#FEF3EE', color: message.ok ? '#2E7D32' : '#8B4513' }}>
          {message.text}
        </div>
      )}
      <button onClick={handleForgotPassword} disabled={loading}
        className="w-full py-4 rounded-xl text-base font-bold active:opacity-75 disabled:opacity-40"
        style={{ background: 'var(--brand)', color: 'white' }}>
        {loading ? 'Enviando…' : 'Enviar enlace'}
      </button>
    </>
  )

  const formContent = (
    <>
      {/* Tabs */}
      <div className="flex rounded-xl p-1 mb-5" style={{ background: 'var(--cream)' }}>
        {(['login', 'register'] as const).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            className="flex-1 py-2.5 rounded-[10px] text-sm font-bold transition-all"
            style={{
              background: mode === m ? 'var(--brand)' : 'transparent',
              color:      mode === m ? 'white' : '#AFA59A',
              boxShadow:  mode === m ? '0 2px 8px rgba(47,29,27,0.25)' : 'none',
            }}>
            {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-2.5 mb-4">
        {!isLogin && (
          <>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
              placeholder="Nombre" autoComplete="given-name"
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
              style={fieldStyle} />
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
              placeholder="Apellidos" autoComplete="family-name"
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
              style={fieldStyle} />
          </>
        )}

        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email" autoComplete="email"
          className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
          style={fieldStyle} />

        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder={isLogin ? 'Contraseña' : 'Contraseña (mín. 8 caracteres)'}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
          style={fieldStyle}
          onKeyDown={e => e.key === 'Enter' && isLogin && handleLogin()} />
        {isLogin && (
          <button type="button" onClick={() => switchMode('forgot')}
            className="w-full text-right text-xs font-semibold active:opacity-60 pt-0.5"
            style={{ color: '#AFA59A' }}>
            ¿Olvidaste tu contraseña?
          </button>
        )}

        {!isLogin && (
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Confirmar contraseña"
            autoComplete="new-password"
            className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
            style={fieldStyle}
            onKeyDown={e => e.key === 'Enter' && handleRegister()} />
        )}
      </div>

      {/* Privacy checkbox */}
      {!isLogin && (
        <div className="flex items-start gap-3 mb-4">
          <button
            type="button"
            onClick={() => setAccept(v => !v)}
            className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors"
            style={{
              background: acceptPolicy ? 'var(--brand)' : 'transparent',
              border: `2px solid ${acceptPolicy ? 'var(--brand)' : '#D9D2CA'}`,
            }}>
            {acceptPolicy && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.75"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <p className="text-xs leading-relaxed" style={{ color: '#6B5F5A' }}>
            He leído y acepto los{' '}
            <button type="button" onClick={() => setShowToS(true)}
              className="font-semibold underline active:opacity-70"
              style={{ color: 'var(--brand)' }}>
              Términos y Condiciones
            </button>
            {' '}y la{' '}
            <button type="button" onClick={() => setShowPolicy(true)}
              className="font-semibold underline active:opacity-70"
              style={{ color: 'var(--brand)' }}>
              Política de Privacidad
            </button>
            . Soy mayor de 16 años.
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="mb-4 p-3 rounded-xl text-sm font-medium anim-scale"
          style={{
            background: message.ok ? '#E8F5E9' : '#FEF3EE',
            color:      message.ok ? '#2E7D32' : '#8B4513',
          }}>
          {message.text}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={isLogin ? handleLogin : handleRegister}
        disabled={loading}
        className="w-full py-4 rounded-xl text-base font-bold active:opacity-75 disabled:opacity-40"
        style={{ background: 'var(--brand)', color: 'white' }}>
        {loading ? 'Cargando…' : isLogin ? 'Entrar' : 'Crear cuenta'}
      </button>
    </>
  )

  const activeContent = mode === 'forgot' ? forgotContent : formContent

  return (
    <div className="screen-full" style={{ background: 'var(--brand)' }}>

      {/* ── MOBILE layout (< md) ── */}
      <div className="flex flex-col h-full md:hidden">
        {/* Logo area */}
        <div className="flex flex-col items-center justify-center flex-1 px-8 pt-safe">
          <img src="/logo.png" alt="TuCocinaApp"
            className="w-20 h-20 object-contain mb-5"
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.88 }} />
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">TuCocinaApp</h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Menús Semanales</p>
        </div>
        {/* Form — slides up from bottom */}
        <div className="rounded-t-3xl px-6 pt-7 overflow-y-auto"
          style={{ background: 'var(--surface)', paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
          {activeContent}
        </div>
      </div>

      {/* ── TABLET / DESKTOP layout (≥ md = 768px) ── */}
      <div className="hidden md:flex h-full items-center justify-center p-8"
        style={{ paddingTop: 'max(32px, env(safe-area-inset-top))' }}>
        <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--surface)' }}>

          {/* Logo inside card */}
          <div className="flex flex-col items-center py-10 px-8"
            style={{ background: 'var(--brand)' }}>
            <img src="/logo.png" alt="TuCocinaApp"
              className="w-16 h-16 object-contain mb-4"
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.88 }} />
            <h1 className="text-2xl font-black text-white tracking-tight mb-0.5">TuCocinaApp</h1>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Menús Semanales</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7 overflow-y-auto" style={{ maxHeight: 'calc(90dvh - 200px)' }}>
            {activeContent}
          </div>
        </div>
      </div>

      {showPolicy && <PrivacyPolicySheet onClose={() => setShowPolicy(false)} />}
      {showToS    && <TermsOfServiceSheet onClose={() => setShowToS(false)} />}
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  background: 'var(--cream)',
  border: '1.5px solid var(--cream-border)',
  color: 'var(--brand)',
}
