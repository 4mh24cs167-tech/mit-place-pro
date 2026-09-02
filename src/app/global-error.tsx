'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root Global Error Boundary caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #f0f0ff 60%, #f5f3ff 100%)', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', margin: '0 0 8px 0' }}>Critical Error</h2>
            <p style={{ color: '#6b7280', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              The application encountered a critical error. Please try reloading the page.
            </p>
            <button 
              onClick={() => reset()}
              style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
