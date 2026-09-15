import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { Globe, Clock, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Newspaper } from 'lucide-react';

export const revalidate = 0; // Always fresh counts

const DOMAINS_LIST = [
  { id: 'dom_1', code: 'perurunning', hostname: 'perurunning.pe', name: 'Perú Running', category: 'Deportes / Atletismo', color: 'from-amber-500 to-orange-600' },
  { id: 'dom_2', code: 'themerinofactory', hostname: 'themerinofactory.com', name: 'The Merino Factory', category: 'Industria Textil / Moda Sostenible', color: 'from-blue-600 to-cyan-600' },
  { id: 'dom_3', code: 'maratondearequipa', hostname: 'maratondearequipa.pe', name: 'Maratón de Arequipa', category: 'Atletismo de Altura / Perú', color: 'from-red-600 to-rose-700' },
  { id: 'dom_4', code: 'kompressox', hostname: 'kompressox.com', name: 'Kompressox Health', category: 'Salud Vascular & Compresión (Médico)', color: 'from-emerald-600 to-teal-600' },
  { id: 'dom_5', code: 'sillaris', hostname: 'sillaris.pe', name: 'Sillaris Inmobiliario', category: 'Real Estate & Propiedades', color: 'from-indigo-600 to-purple-600' },
  { id: 'dom_6', code: 'maratondelima', hostname: 'maratondelima.com.pe', name: 'Maratón de Lima', category: 'Running Urbano / Costa Verde', color: 'from-sky-500 to-blue-600' },
  { id: 'dom_7', code: 'cinefoniashow', hostname: 'cinefoniashow.com', name: 'Cinefonía Show', category: 'Música de Cine & Bandas Sonoras', color: 'from-violet-600 to-fuchsia-600' },
];

export default async function DomainHubPage() {
  // Fetch article status counts from Supabase
  const { data: articles, error } = await supabaseServer
    .from('articles')
    .select('domainId, status');

  const counts: Record<string, { inReview: number; published: number; rejected: number; total: number }> = {};

  DOMAINS_LIST.forEach((d) => {
    counts[d.id] = { inReview: 0, published: 0, rejected: 0, total: 0 };
  });

  if (articles) {
    articles.forEach((art) => {
      if (counts[art.domainId]) {
        counts[art.domainId].total += 1;
        if (art.status === 'IN_REVIEW') counts[art.domainId].inReview += 1;
        if (art.status === 'PUBLISHED') counts[art.domainId].published += 1;
        if (art.status === 'REJECTED') counts[art.domainId].rejected += 1;
      }
    });
  }

  const totalPending = Object.values(counts).reduce((acc, curr) => acc + curr.inReview, 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Panel de Supervisión Multi-Marca</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Gestión Editorial de las 7 Webs
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            Selecciona cualquiera de tus dominios para revisar los borradores redactados por la IA, ajustar títulos e imágenes con Unsplash, y aprobar la publicación final en sus respectivas páginas.
          </p>
        </div>

        {/* Global Pending Notification Pill */}
        {totalPending > 0 ? (
          <div className="mt-6 inline-flex items-center space-x-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-sm font-semibold animate-pulse">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Tienes <strong>{totalPending}</strong> noticia(s) pendientes de revisión editorial en el sistema.</span>
          </div>
        ) : (
          <div className="mt-6 inline-flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Todas las noticias están al día. No hay pendientes.</span>
          </div>
        )}
      </div>

      {/* Domain Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOMAINS_LIST.map((domain) => {
          const stats = counts[domain.id] || { inReview: 0, published: 0, rejected: 0, total: 0 };
          const hasPending = stats.inReview > 0;

          return (
            <div
              key={domain.id}
              className={`bg-slate-900 border ${
                hasPending ? 'border-amber-500/40 shadow-amber-950/20' : 'border-slate-800'
              } rounded-2xl p-6 transition-all hover:border-slate-700 hover:shadow-2xl flex flex-col justify-between group relative overflow-hidden`}
            >
              {/* Header colored bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${domain.color} absolute top-0 left-0 right-0`} />

              <div className="space-y-4 pt-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      {domain.category}
                    </span>
                    <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {domain.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{domain.hostname}</p>
                  </div>

                  {hasPending && (
                    <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow">
                      <Clock className="w-3 h-3" />
                      {stats.inReview} Pendiente{stats.inReview > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Counters Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-400">Por Revisar</p>
                    <p className={`text-base font-bold ${stats.inReview > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {stats.inReview}
                    </p>
                  </div>
                  <div className="space-y-0.5 border-x border-slate-800">
                    <p className="text-xs text-slate-400">Publicadas</p>
                    <p className="text-base font-bold text-emerald-400">{stats.published}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-400">Rechazadas</p>
                    <p className="text-base font-bold text-rose-400">{stats.rejected}</p>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500 uppercase">{domain.id}</span>
                <Link
                  href={`/dashboard/${domain.id}`}
                  className={`inline-flex items-center space-x-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                    hasPending
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <span>Entrar al Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
