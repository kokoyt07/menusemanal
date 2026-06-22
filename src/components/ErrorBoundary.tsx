import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props  { children: ReactNode }
interface State  { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center"
        style={{ background: 'var(--cream)' }}>
        <div className="mb-6">
          <img src="/logo.png" alt="TuCocinaApp" className="w-16 h-16 mx-auto mb-6 opacity-30"
            style={{ filter: 'grayscale(1)' }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--brand)' }}>
            Algo ha salido mal
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#AFA59A' }}>
            La app ha encontrado un error inesperado. Puedes intentar recargar o volver al menú.
          </p>
        </div>

        {/* Error detail (dev-friendly, discreet) */}
        <details className="w-full mb-6 text-left">
          <summary className="text-xs cursor-pointer select-none" style={{ color: '#C8C0B5' }}>
            Detalles del error
          </summary>
          <pre className="mt-2 p-3 rounded-xl text-xs overflow-auto"
            style={{ background: 'var(--cream-border)', color: '#8B4513', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error.message}
          </pre>
        </details>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-2xl font-bold text-base active:opacity-80 mb-3"
          style={{ background: 'var(--brand)', color: 'white' }}>
          Recargar app
        </button>
        <button
          onClick={this.handleRetry}
          className="w-full py-3 rounded-2xl text-sm font-semibold active:opacity-60"
          style={{ color: '#AFA59A' }}>
          Intentar de nuevo
        </button>
      </div>
    )
  }
}
