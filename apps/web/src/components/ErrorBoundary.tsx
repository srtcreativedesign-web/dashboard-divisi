import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary menangkap error:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
          <h1 className="text-xl font-semibold text-danger">
            Terjadi kesalahan tak terduga
          </h1>
          <p className="max-w-md text-sm text-slate-600">
            Muat ulang halaman. Jika berlanjut, laporkan kode berikut ke admin.
          </p>
          <code className="rounded bg-slate-100 px-2 py-1 text-xs">
            {this.state.error.message}
          </code>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="rounded-input bg-primary-700 hover:bg-primary-800 px-4 py-2 text-sm text-white font-medium transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
