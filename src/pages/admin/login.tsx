import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminLoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

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
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? 'Login failed');
        return;
      }
      await router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '48px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Admin Login</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="token">Admin access token</label>
        <input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8 }} required />
        <button type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
    </main>
  );
}
