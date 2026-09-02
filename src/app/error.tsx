'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-border">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong!</h2>
        <p className="text-muted-foreground mb-8">
          We apologize for the inconvenience. An unexpected error occurred.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors hover:shadow-lg"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white border border-border text-foreground hover:bg-muted/50 font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            Go back home
          </button>
        </div>
      </div>
    </div>
  );
}
