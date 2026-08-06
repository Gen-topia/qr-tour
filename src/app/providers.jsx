'use client';
import { AuthProvider } from '@/lib/authClient';
export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
