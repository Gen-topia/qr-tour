import './globals.css';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import Providers from './providers';
import AppShell from '@/components/AppShell';

// 영문·숫자는 Inter, 한글은 Noto Sans KR로 폴백된다(시안의 기하학적 산세리프 톤)
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--font-inter', display: 'swap' });
const notoKr = Noto_Sans_KR({ subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--font-noto-kr', display: 'swap' });

export const metadata = {
  title: '제주 이야기 미션 투어',
  description: 'QR 미션 모바일 웹 투어 게임',
};
export const viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${inter.variable} ${notoKr.variable}`}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
