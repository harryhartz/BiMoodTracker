import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Here you could send error reports to a logging service
    // if you implement one in the future
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI when an error occurs
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-slate-800 border border-slate-700 text-white mt-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-slate-400 mb-4 text-center">
            We're having trouble displaying this content. Please try refreshing the page.
          </p>
          <div className="max-w-md overflow-x-auto bg-slate-900 p-4 rounded mb-4 text-sm">
            <code className="text-red-400 whitespace-pre-wrap">
              {this.state.error?.message || 'Unknown error'}
            </code>
          </div>
          <Button onClick={this.resetErrorBoundary}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;