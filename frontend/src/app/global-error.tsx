'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>500</h1>
                        <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '2rem' }}>Something went wrong</p>
                        <button
                            onClick={() => reset()}
                            style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
