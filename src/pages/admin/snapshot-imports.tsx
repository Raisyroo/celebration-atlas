import type { GetServerSideProps } from 'next';
import { requireAdminPageAuth } from '@/lib/adminAuth';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const blocked = requireAdminPageAuth(ctx);
  if (blocked) return blocked as any;
  return { props: {} };
};

export default function Page() {
  return (
    <main>
      <h1>snapshot imports</h1>
      <p>Internal workflow page for snapshot imports management and review.</p>
    </main>
  );
}
