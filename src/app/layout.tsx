import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMS Editorial Multi-Dominio | Panel de Control',
  description: 'Sistema de supervisión, edición y publicación de noticias automatizadas con IA para el ecosistema de 7 dominios.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}
