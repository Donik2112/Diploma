import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';

export const metadata: Metadata = {
  title: 'UniWork Platform',
  description: 'Student freelance matching platform with ML recommendations'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container-app py-6">{children}</main>
      </body>
    </html>
  );
}
