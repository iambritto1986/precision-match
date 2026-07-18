import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#070911',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              margin: '0 16px',
              padding: '48px 32px',
              borderRadius: '16px',
              backgroundColor: '#0d111d',
              border: '1px solid rgba(255,255,255,0.03)',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.05),
                0 10px 15px -3px rgba(0, 0, 0, 0.5),
                0 4px 6px -2px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(0, 0, 0, 0.5)
              `,
              textAlign: 'center' as const,
            }}
          >
            {/* Error icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.1em',
                marginBottom: '8px',
              }}
            >
              SYSTEM ERROR
            </h1>

            <p
              style={{
                color: '#94a3b8',
                fontSize: '14px',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              Something went wrong. The application encountered an unexpected error.
            </p>

            {/* Error message in monospace */}
            {this.state.error && (
              <div
                style={{
                  backgroundColor: '#090b14',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left' as const,
                  boxShadow: `
                    inset 0 2px 4px rgba(0, 0, 0, 0.5),
                    inset 0 0 2px rgba(0, 0, 0, 0.8),
                    0 1px 0 rgba(255, 255, 255, 0.03)
                  `,
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  maxHeight: '160px',
                  overflowY: 'auto' as const,
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    fontSize: '12px',
                    color: '#f87171',
                    margin: 0,
                    lineHeight: '1.6',
                    wordBreak: 'break-word' as const,
                    whiteSpace: 'pre-wrap' as const,
                  }}
                >
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Reload button */}
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                background: 'linear-gradient(to bottom, #6366f1, #4338ca)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  0 4px 6px -1px rgba(0, 0, 0, 0.5),
                  0 2px 4px -1px rgba(0, 0, 0, 0.3)
                `,
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.filter = 'brightness(1.1)';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.filter = 'brightness(1)';
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
