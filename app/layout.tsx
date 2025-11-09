
// app/layout.tsx
import './globals.css';
import Header from './components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TuEje',
  description: 'Tu habit & finance tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
