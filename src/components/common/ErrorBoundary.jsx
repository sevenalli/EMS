import React from 'react'

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo })
        // Log error to console (could be sent to error tracking service)
        console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render() {
        if (this.state.hasError) {
            const { fallback, title = 'Something went wrong' } = this.props

            // Custom fallback if provided
            if (fallback) {
                return fallback(this.state.error, this.handleRetry)
            }

            // Default fallback UI
            return (
                <div className="min-h-[200px] flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        {/* Error Icon */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            {title}
                        </h3>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>

                        {/* Error details (collapsed by default) */}
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="text-left mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <summary className="text-xs font-medium cursor-pointer text-gray-500 dark:text-gray-400">
                                    Error Details
                                </summary>
                                <pre className="mt-2 text-xs overflow-auto max-h-32 text-red-600 dark:text-red-400">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={this.handleRetry}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
