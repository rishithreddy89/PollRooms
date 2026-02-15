import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PollRooms - Real-Time Polling',
  description: 'Create and participate in real-time polls with live analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50 min-h-screen">{children}</body>
    </html>
  );
}
