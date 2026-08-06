import './globals.css';
import Providers from './providers';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: '이야기 미션 투어',
  description: 'QR 미션 모바일 웹 투어 게임',
};
export const viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
