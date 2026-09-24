import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Search, Eye, ExternalLink, Calendar, Filter } from 'lucide-react';
import { notFound } from 'next/navigation';
import DomainHeaderBanner from '@/components/DomainHeaderBanner';

const DOMAINS_MAP: Record<string, { name: string; code: string; hostname: string }> = {
  dom_1: { name: 'Perú Running', code: 'perurunning', hostname: 'perurunning.pe' },
  dom_2: { name: 'The Merino Factory', code: 'themerinofactory', hostname: 'themerinofactory.com' },
  dom_3: { name: 'Maratón de Arequipa', code: 'maratondearequipa', hostname: 'maratondearequipa.pe' },
  dom_4: { name: 'Kompressox Health', code: 'kompressox', hostname: 'kompressox.com' },
  dom_5: { name: 'Sillaris Inmobiliario', code: 'sillaris', hostname: 'sillaris.pe' },
  dom_6: { name: 'Maratón de Lima', code: 'maratondelima', hostname: 'maratondelima.com.pe' },
  dom_7: { name: 'Cinefonía Show', code: 'cinefoniashow', hostname: 'cinefoniashow.com' },
};

export const revalidate = 0;

export default async function DomainWorkspacePage({
  params,
  searchParams,
}: {
  params: { domainId: string };
  searchParams: { status?: string };
}) {
  const domainInfo = DOMAINS_MAP[params.domainId];

  if (!domainInfo) {
    notFound();
  }

  // Fetch domain DB record to read autoPublishEnabled state
  const { data: dbDomain } = await supabaseServer
    .from('domains')
    .select('autoPublishEnabled')
    .eq('id', params.domainId)
    .single();

  const autoPublishEnabled = dbDomain?.autoPublishEnabled || false;

  const selectedStatus = searchParams.status || 'IN_REVIEW';

  // Fetch articles from Supabase
  let query = supabaseServer
    .from('articles')
    .select('*')
    .eq('domainId', params.domainId)
    .order('createdAt', { ascending: false });

  if (selectedStatus !== 'ALL') {
    query = query.eq('status', selectedStatus);
  }

  const { data: articles, error } = await query;

  // Counts for tabs
  const { data: allArticles } = await supabaseServer
    .from('articles')
    .select('status')
    .eq('domainId', params.domainId);

  const counts = {
    IN_REVIEW: allArticles?.filter((a) => a.status === 'IN_REVIEW').length || 0,
    PUBLISHED: allArticles?.filter((a) => a.status === 'PUBLISHED').length || 0,
    REJECTED: allArticles?.filter((a) => a.status === 'REJECTED').length || 0,
    ALL: allArticles?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center space-x-3 text-sm">
        <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Panel General</span>
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-semibold">{domainInfo.name}</span>
      </div>

      {/* Domain Header Card & Auto-Publish Banner */}
      <DomainHeaderBanner
        domainId={params.domainId}
        domainInfo={domainInfo}
        initialAutoPublish={autoPublishEnabled}
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-4 overflow-x-auto">
        <Link
          href={`/dashboard/${params.domainId}?status=IN_REVIEW`}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            selectedStatus === 'IN_REVIEW'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Por Revisar</span>
          <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${selectedStatus === 'IN_REVIEW' ? 'bg-amber-950/30 text-amber-950 font-bold' : 'bg-slate-800 text-slate-300'}`}>
            {counts.IN_REVIEW}
          </span>
        </Link>

        <Link
          href={`/dashboard/${params.domainId}?status=PUBLISHED`}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            selectedStatus === 'PUBLISHED'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Publicadas</span>
          <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${selectedStatus === 'PUBLISHED' ? 'bg-emerald-950/40 text-emerald-200' : 'bg-slate-800 text-slate-300'}`}>
            {counts.PUBLISHED}
          </span>
        </Link>

        <Link
          href={`/dashboard/${params.domainId}?status=REJECTED`}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            selectedStatus === 'REJECTED'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Rechazadas</span>
          <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${selectedStatus === 'REJECTED' ? 'bg-rose-950/40 text-rose-200' : 'bg-slate-800 text-slate-300'}`}>
            {counts.REJECTED}
          </span>
        </Link>

        <Link
          href={`/dashboard/${params.domainId}?status=ALL`}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            selectedStatus === 'ALL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Todas</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {counts.ALL}
          </span>
        </Link>
      </div>

      {/* Articles List */}
      {!articles || articles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No hay noticias en este estado</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Cuando se generen borradores o utilices el botón &quot;Redactar Noticia&quot;, aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  {article.status === 'IN_REVIEW' && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> En Revisión
                    </span>
                  )}
                  {article.status === 'PUBLISHED' && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Publicada
                    </span>
                  )}
                  {article.status === 'REJECTED' && (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Rechazada
                    </span>
                  )}
                  {article.status === 'DRAFT' && (
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      Borrador
                    </span>
                  )}

                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(article.createdAt).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
                  {article.title}
                </h3>

                {article.subheading && (
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                    {article.subheading}
                  </p>
                )}

                {article.sourceUrl && (
                  <p className="text-xs text-slate-500 truncate">
                    Fuente: <span className="text-slate-400 underline">{article.sourceUrl}</span>
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center space-x-3 shrink-0">
                <Link
                  href={`/dashboard/${params.domainId}/articles/${article.id}`}
                  className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span>Revisar Noticia</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
