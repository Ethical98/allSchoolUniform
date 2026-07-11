import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="container text-center py-5">
                    <h2>Something went wrong</h2>
                    <p className="text-muted mt-3">
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <button
                        className="btn btn-dark mt-3"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.href = '/admin/dashboard';
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
