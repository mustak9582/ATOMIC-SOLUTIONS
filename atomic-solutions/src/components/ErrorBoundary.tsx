import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl text-center border border-navy/5">
            <div className="w-20 h-20 bg-navy text-teal rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-navy/10">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-3xl font-black text-navy uppercase tracking-tighter mb-4">Something went wrong</h1>
            <p className="text-gray-400 font-medium mb-8 leading-relaxed">
              We encountered an unexpected interface error. Don't worry, your data is safe.
            </p>
            
            {this.state.error && (
              <div className="mb-8 p-4 bg-gray-100 rounded-2xl text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-red-600 font-bold">{this.state.error.toString()}</p>
              </div>
            )}

            <div className="space-y-4">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full h-14 rounded-2xl bg-teal text-navy font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-teal/20"
              >
                <RefreshCw size={18} className="mr-2" /> Reload App
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/'}
                className="w-full h-14 rounded-2xl text-navy font-black uppercase tracking-widest hover:bg-gray-100"
              >
                <Home size={18} className="mr-2" /> Back to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
