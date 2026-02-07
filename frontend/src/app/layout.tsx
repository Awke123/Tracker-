import type { Metadata } from 'next';
import './globals.css';
import { TelegramProvider } from '@/components/TelegramProvider';

export const metadata: Metadata = {
  title: 'Трекер привычек',
  description: 'Отслеживай привычки с геймификацией',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-dark-bg text-white antialiased">
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
