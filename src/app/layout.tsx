import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Tối Nay Hát Gì? - Random Karaoke CS:GO',
  description: 'Vòng quay chọn ngẫu nhiên bài hát Karaoke phong cách mở hòm CS:GO',
  applicationName: 'Tối Nay Hát Gì?',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/brand/favicon-cs-v2.png',
    shortcut: '/favicon.ico?v=cs-v2',
    apple: '/brand/apple-touch-icon-cs-v2.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#27323b',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
