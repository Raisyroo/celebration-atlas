import { PropsWithChildren } from 'react';

export function AdminSection({ children }: PropsWithChildren) {
  return <section style={{ marginBottom: 16 }}>{children}</section>;
}
