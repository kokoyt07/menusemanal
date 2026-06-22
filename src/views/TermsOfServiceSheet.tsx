import { X } from '../components/Icon'

interface Props { onClose: () => void }

export default function TermsOfServiceSheet({ onClose }: Props) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-content" style={{ maxHeight: '92dvh' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D9D2CA' }} />
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--cream-border)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--brand)' }}>Términos y Condiciones</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
            style={{ background: 'var(--cream)' }}>
            <X size={16} style={{ color: 'var(--brand)' }} />
          </button>
        </div>

        <div className="sheet-list px-5 py-5 space-y-5 text-sm" style={{ color: 'var(--brand)' }}>
          <p className="text-xs" style={{ color: '#AFA59A' }}>Última actualización: junio 2025</p>

          <Section title="1. Aceptación de los términos">
            <p>Al registrarte y utilizar <strong>TuCocinaApp</strong> ("la app" o "el Servicio"), aceptas quedar vinculado por estos Términos y Condiciones ("Términos"). Si no estás de acuerdo, no utilices la app.</p>
          </Section>

          <Section title="2. Descripción del Servicio">
            <p>TuCocinaApp es una aplicación web progresiva (PWA) gratuita que te permite planificar menús semanales, gestionar un recetario personal y generar listas de la compra. El Servicio se ofrece "tal cual" y puede cambiar en cualquier momento.</p>
          </Section>

          <Section title="3. Requisitos de uso">
            <ul className="mt-2 space-y-1.5 list-disc list-inside" style={{ color: '#AFA59A' }}>
              <li>Debes tener al menos <strong style={{ color: 'var(--brand)' }}>16 años</strong> para usar la app.</li>
              <li>Debes proporcionar información veraz al crear tu cuenta.</li>
              <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
            </ul>
          </Section>

          <Section title="4. Cuenta de usuario">
            <p>Puedes crear una cuenta gratuita con tu email. Eres responsable de toda la actividad que ocurra en tu cuenta. Notifícanos de inmediato ante cualquier uso no autorizado escribiendo a <strong>famfumu4@gmail.com</strong>.</p>
            <p className="mt-2">Nos reservamos el derecho de suspender o eliminar cuentas que infrinjan estos Términos.</p>
          </Section>

          <Section title="5. Contenido del usuario">
            <p>El contenido que introduces (platos, categorías, menús) es tuyo. No reclamamos ninguna propiedad sobre él. Al usar el Servicio nos concedes una licencia limitada para almacenar y mostrarte ese contenido.</p>
            <p className="mt-2">No debes usar la app para introducir contenido ilegal, ofensivo o que infrinja derechos de terceros.</p>
          </Section>

          <Section title="6. Uso aceptable">
            <p>Queda prohibido:</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside" style={{ color: '#AFA59A' }}>
              <li>Usar la app para fines ilegales o no autorizados.</li>
              <li>Intentar acceder a datos de otros usuarios.</li>
              <li>Realizar ingeniería inversa o extraer el código fuente.</li>
              <li>Sobrecargar deliberadamente la infraestructura del Servicio.</li>
            </ul>
          </Section>

          <Section title="7. Disponibilidad del Servicio">
            <p>Hacemos todo lo posible por mantener la app disponible, pero no garantizamos un tiempo de actividad concreto. Podemos interrumpir el Servicio temporalmente por mantenimiento, actualizaciones o causas fuera de nuestro control.</p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>En la medida permitida por la ley aplicable, TuCocinaApp no será responsable de daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del Servicio.</p>
            <p className="mt-2">La app es un planificador personal y no constituye asesoramiento nutricional, dietético ni médico.</p>
          </Section>

          <Section title="9. Propiedad intelectual">
            <p>El diseño, logotipo, código e identidad visual de TuCocinaApp son propiedad de sus autores. No puedes reproducirlos sin autorización expresa.</p>
          </Section>

          <Section title="10. Modificaciones">
            <p>Podemos actualizar estos Términos en cualquier momento. Te notificaremos cambios relevantes por email o mediante aviso en la app. El uso continuado del Servicio tras la publicación de nuevos Términos implica su aceptación.</p>
          </Section>

          <Section title="11. Terminación">
            <p>Puedes dejar de usar la app en cualquier momento y eliminar tu cuenta desde Ajustes. Podemos terminar o suspender tu acceso si incumples estos Términos.</p>
          </Section>

          <Section title="12. Ley aplicable">
            <p>Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de España, sin perjuicio de los derechos que como consumidor te otorga la normativa vigente.</p>
          </Section>

          <Section title="13. Contacto">
            <p>Para cualquier consulta sobre estos Términos:<br />
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
