import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { AssistantWidget } from '@/components/assistant/assistant-widget';

export const metadata = {
  title: 'Student Freelance Match Platform',
  description: 'Diploma project platform for matching students and freelance projects'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}
