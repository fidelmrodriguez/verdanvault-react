import { Component, type ReactNode } from 'react';
export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal">
        <h1>O templo precisa de uma pausa.</h1>
        <p>Ocorreu um erro inesperado na interface.</p>
        <button onClick={() => location.reload()}>Reabrir o jogo</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
