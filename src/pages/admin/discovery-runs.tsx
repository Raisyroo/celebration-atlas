import { GetServerSideProps } from 'next';
import { withAdminPageAuth } from '@/lib/adminAuth';

export default function Page() {
  return (
    <main>
      <h1>discovery runs</h1>
      <p>Internal workflow page for discovery runs management and review.</p>
    </main>
  );
}


export const getServerSideProps: GetServerSideProps = withAdminPageAuth(async () => ({ props: {} }));
