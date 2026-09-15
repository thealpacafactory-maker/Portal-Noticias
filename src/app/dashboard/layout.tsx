import Link from 'next/link';
import { LayoutGrid, FileText, CheckCircle2, ShieldCheck, ExternalLink, Globe } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 rounded-xl text-white shadow-md">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <Link href="/dashboard" className="text-xl font-bold tracking-tight text-white hover:text-blue-400 transition-colors">
              Portal Noticias <span className="text-blue-500 font-extrabold text-sm uppercase px-2 py-0.5 rounded bg-blue-950 border border-blue-800 ml-1">CMS Multi-Dominio</span>
            </Link>
            <p className="text-xs text-slate-400">Sistema Editorial y Supervisión de Noticias IA</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Ver 7 Dominios</span>
          </Link>

          <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
              AI
            </div>
            <div className="text-xs">
              <p className="font-medium text-slate-200">Equipo Editorial</p>
              <p className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Conectado
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-4 px-6 text-center text-xs text-slate-500">
        Portal Noticias Multi-Site CMS &copy; {new Date().getFullYear()} — 7 Dominios Independientes (`dom_1` a `dom_7`)
      </footer>
    </div>
  );
}
