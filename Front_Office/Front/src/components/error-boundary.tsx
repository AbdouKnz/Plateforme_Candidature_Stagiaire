import * as React from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <div className="rounded-2xl bg-destructive/10 p-4">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Please refresh the page and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
