import { FormEvent, useState } from 'react';
import { GetServerSideProps } from 'next';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (isAdminAuthenticated(ctx.req)) {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  return { props: {} };
};

export default function AdminLoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body?.error ?? 'Login failed');
        return;
      }
      window.location.href = '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 500, margin: '80px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Admin Login</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="token">Access token</label>
        <input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} style={{ width: '100%', marginTop: 8, marginBottom: 12 }} />
        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      {error ? <p style={{ color: '#c00' }}>{error}</p> : null}
    </main>
  );
}
