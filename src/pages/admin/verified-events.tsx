import { GetServerSideProps } from 'next';
import { withAdminPageAuth } from '@/lib/adminAuth';

export default function Page() {
  return (
    <main>
      <h1>verified events</h1>
      <p>Internal workflow page for verified events management and review.</p>
    </main>
  );
}


export const getServerSideProps: GetServerSideProps = withAdminPageAuth(async () => ({ props: {} }));
