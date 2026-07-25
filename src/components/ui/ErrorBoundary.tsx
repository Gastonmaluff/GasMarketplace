import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no controlado en la aplicación', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-fallback">
          <p className="eyebrow">Algo salió mal</p>
          <h1>No pudimos mostrar esta pantalla</h1>
          <p>Recargá la página. Si el problema continúa, revisá el registro de la aplicación.</p>
          <button className="button button--primary" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
