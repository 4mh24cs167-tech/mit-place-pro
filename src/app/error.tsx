'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
        <p className="text-gray-600 mb-8">
          We apologize for the inconvenience. An unexpected error occurred.
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            Go back home
          </Button>
        </div>
      </div>
    </div>
  );
}

