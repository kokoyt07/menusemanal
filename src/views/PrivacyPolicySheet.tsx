import { X } from '../components/Icon'

interface Props { onClose: () => void }

export default function PrivacyPolicySheet({ onClose }: Props) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-content" style={{ maxHeight: '92dvh' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D9D2CA' }} />
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--cream-border)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--brand)' }}>Política de Privacidad</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
            style={{ background: 'var(--cream)' }}>
            <X size={16} style={{ color: 'var(--brand)' }} />
          </button>
        </div>

        <div className="sheet-list px-5 py-5 space-y-5 text-sm" style={{ color: 'var(--brand)' }}>
          <p className="text-xs" style={{ color: '#AFA59A' }}>Última actualización: junio 2025</p>

          <Section title="1. Responsable del tratamiento">
            <p>El responsable del tratamiento de los datos personales recogidos a través de <strong>TuCocinaApp – Menús Semanales</strong> es:</p>
            <p className="mt-2 leading-relaxed" style={{ color: '#AFA59A' }}>
              TuCocinaApp<br />
              Contacto: <span style={{ color: 'var(--brand)' }}>famfumu4@gmail.com</span>
            </p>
          </Section>

          <Section title="2. Datos que recogemos">
            <p>Recogemos únicamente los datos necesarios para prestarte el servicio:</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside" style={{ color: '#AFA59A' }}>
              <li><strong style={{ color: 'var(--brand)' }}>Identificación:</strong> nombre, apellidos y dirección de email.</li>
              <li><strong style={{ color: 'var(--brand)' }}>Datos de uso:</strong> platos, categorías y menús semanales que tú mismo introduces.</li>
              <li><strong style={{ color: 'var(--brand)' }}>Datos técnicos:</strong> fecha de registro y última conexión, gestionados por Supabase.</li>
            </ul>
            <p className="mt-2">No recogemos datos de localización, ni información financiera, ni datos sensibles.</p>
          </Section>

          <Section title="3. Finalidad y base legal">
            <p>Tus datos se tratan para:</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside" style={{ color: '#AFA59A' }}>
              <li>Crear y gestionar tu cuenta de usuario.</li>
              <li>Almacenar y mostrarte tus menús y platos.</li>
              <li>Permitirte exportar y eliminar tus datos en cualquier momento.</li>
            </ul>
            <p className="mt-2">La base legal es el <strong>consentimiento explícito</strong> que otorgas al registrarte (art. 6.1.a RGPD).</p>
          </Section>

          <Section title="4. Almacenamiento y seguridad">
            <p>Los datos se almacenan en los servidores de <strong>Supabase</strong> (región EU – Frankfurt, Alemania), dentro del Espacio Económico Europeo.</p>
            <p className="mt-2">Supabase aplica cifrado en tránsito (TLS) y en reposo. Las contraseñas nunca se almacenan en texto plano.</p>
            <p className="mt-2">Puedes consultar la política de privacidad de Supabase en supabase.com/privacy.</p>
          </Section>

          <Section title="5. Cesión de datos a terceros">
            <p><strong>No vendemos ni compartimos tus datos personales con terceros</strong> con fines comerciales o publicitarios.</p>
            <p className="mt-2">Únicamente los tratamos con Supabase en su calidad de encargado del tratamiento, bajo contrato de protección de datos (DPA).</p>
          </Section>

          <Section title="6. Conservación de los datos">
            <p>Conservamos tus datos mientras mantengas una cuenta activa. Si eliminas tu cuenta o todos tus datos desde Ajustes, los borramos de forma permanente e irreversible.</p>
          </Section>

          <Section title="7. Tus derechos (RGPD)">
            <p>Como usuario tienes derecho a:</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside" style={{ color: '#AFA59A' }}>
              <li><strong style={{ color: 'var(--brand)' }}>Acceso:</strong> saber qué datos tenemos sobre ti.</li>
              <li><strong style={{ color: 'var(--brand)' }}>Rectificación:</strong> corregir datos incorrectos.</li>
              <li><strong style={{ color: 'var(--brand)' }}>Supresión:</strong> eliminar tu cuenta y todos tus datos.</li>
              <li><strong style={{ color: 'var(--brand)' }}>Portabilidad:</strong> exportar tus datos en formato JSON desde Ajustes.</li>
              <li><strong style={{ color: 'var(--brand)' }}>Limitación y oposición:</strong> limitar el tratamiento en determinadas circunstancias.</li>
            </ul>
            <p className="mt-2">Para ejercer cualquiera de estos derechos, escríbenos a <strong>famfumu4@gmail.com</strong>. También puedes reclamar ante la <strong>Agencia Española de Protección de Datos</strong> (aepd.es).</p>
          </Section>

          <Section title="8. Cookies y rastreo">
            <p>TuCocinaApp es una PWA que <strong>no utiliza cookies de rastreo ni publicidad</strong>. Solo se usa almacenamiento local del navegador para mantener tu sesión activa.</p>
          </Section>

          <Section title="9. Menores de edad">
            <p>Este servicio está dirigido a mayores de 16 años. No recogemos conscientemente datos de menores. Si crees que un menor ha creado una cuenta, contacta con nosotros para eliminarla.</p>
          </Section>

          <Section title="10. Cambios en esta política">
            <p>Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos por email o mediante un aviso en la app. El uso continuado del servicio implica la aceptación de la política vigente.</p>
          </Section>

          <Section title="11. Contacto">
            <p>Para cualquier duda sobre privacidad o protección de datos:<br />
              <strong>famfumu4@gmail.com</strong>
            </p>
          </Section>

          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm" style={{ color: 'var(--brand)' }}>{title}</h3>
      <div className="text-sm leading-relaxed" style={{ color: '#6B5F5A' }}>{children}</div>
    </div>
  )
}
