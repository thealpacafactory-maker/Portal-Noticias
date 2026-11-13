import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { bannerMatchesDomain, parseBannerRow } from '@/lib/banner-utils';
import {
  PlusCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Edit3,
  ExternalLink,
  Megaphone,
  LayoutTemplate,
  Monitor,
  Smartphone,
  Globe,
  FolderKanban,
} from 'lucide-react';

export const revalidate = 0;

const UBICACION_LABELS: Record<string, string> = {
  top: 'Cabecera Superior (Top Leaderboard)',
  bottom: 'Pie de Página (Bottom Leaderboard)',
  'home-middle': 'Portada Central (Home Middle)',
  sidebar: 'Barra Lateral (Sidebar 300×250)',
  'half-page': 'Media Página (Half-Page 300×600)',
  'in-article': 'Interior de Noticia (In-Article)',
  'sidebar-left': 'Lateral Izquierdo (Skyscraper Desktop)',
  'sidebar-right': 'Lateral Derecho (Skyscraper Desktop)',
  popup: 'Pop-up No Invasivo',
};

interface BannersPageProps {
  searchParams: { status?: string; ubicacion?: string; dominio?: string };
}

export default async function DashboardBannersListPage({ searchParams }: BannersPageProps) {
  const selectedStatus = searchParams?.status || 'ALL';
  const selectedUbicacion = searchParams?.ubicacion || 'ALL';
  const selectedDominio = searchParams?.dominio || 'ALL';

  // 1. Fetch domains from Supabase for multi-domain selector & labels
  const { data: dbDomains } = await supabaseServer
    .from('domains')
    .select('id, code, name, hostname, projectId')
    .order('id', { ascending: true });

  const domainsList = dbDomains || [];
  const domainNameMap: Record<string, string> = {
    all: 'Todos los Portales',
    proj_leondelsur: 'León del Sur',
    leondelsur: 'León del Sur',
  };
  domainsList.forEach((d) => {
    domainNameMap[d.id] = d.name;
    domainNameMap[d.code] = d.name;
  });

  // 2. Fetch all banners from Supabase
  const { data: allRawBanners, error: fetchError } = await supabaseServer
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false });

  const allParsed = (allRawBanners || []).map(parseBannerRow);

  // Filter by selected domain first for KPIs & status counts
  const domainFilteredBanners = allParsed.filter((b) =>
    bannerMatchesDomain(b, selectedDominio)
  );

  const counts = {
    ALL: domainFilteredBanners.length,
    ACTIVE: domainFilteredBanners.filter((b) => b.activo === true).length,
    INACTIVE: domainFilteredBanners.filter((b) => b.activo === false).length,
  };

  // Apply status & ubicacion filters
  const banners = domainFilteredBanners.filter((b) => {
    if (selectedStatus === 'ACTIVE' && !b.activo) return false;
    if (selectedStatus === 'INACTIVE' && b.activo) return false;
    if (selectedUbicacion !== 'ALL' && b.ubicacion !== selectedUbicacion) return false;
    return true;
  });

  const totalImpressions = domainFilteredBanners.reduce(
    (acc, b) => acc + (Number(b.impresiones) || 0),
    0
  );
  const totalClicks = domainFilteredBanners.reduce(
    (acc, b) => acc + (Number(b.clics) || 0),
    0
  );
  const globalCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const buildFilterUrl = (overrides: {
    status?: string;
    ubicacion?: string;
    dominio?: string;
  }) => {
    const st = overrides.status ?? selectedStatus;
    const ub = overrides.ubicacion ?? selectedUbicacion;
    const dm = overrides.dominio ?? selectedDominio;
    const params = new URLSearchParams();
    if (st && st !== 'ALL') params.set('status', st);
    if (ub && ub !== 'ALL') params.set('ubicacion', ub);
    if (dm && dm !== 'ALL') params.set('dominio', dm);
    const qs = params.toString();
    return `/dashboard/banners${qs ? `?${qs}` : ''}`;
  };

  const newBannerHref =
    selectedDominio !== 'ALL'
      ? `/dashboard/banners/new?dominio=${encodeURIComponent(selectedDominio)}`
      : '/dashboard/banners/new';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2 rounded-xl bg-guinda-700/30 border border-guinda-500/40 text-guinda-400">
              <Megaphone className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Panel de Banners Publicitarios Multi-Dominio
            </h1>
            <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded font-mono">
              public.banners
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Gestiona y mide campañas publicitarias para <strong>León del Sur</strong> y todos tus dominios conectados. Flujo integral: Crear campaña → Dominio/Portal → Ubicación → Creatividades → Dispositivos/Páginas → Programar → Activar → Medir (GA4/GTM + CTR).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/api/v1/public/banners"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>API Pública Banners</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <Link
            href={newBannerHref}
            className="flex items-center space-x-2 bg-gradient-to-r from-guinda-700 to-rose-700 hover:from-guinda-600 hover:to-rose-600 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md text-xs sm:text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Campaña</span>
          </Link>
        </div>
      </div>

      {/* Domain / Project Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Filtrar por Proyecto / Dominio:</span>
          </span>
          {selectedDominio !== 'ALL' && (
            <Link
              href={buildFilterUrl({ dominio: 'ALL' })}
              className="text-xs text-blue-400 hover:underline"
            >
              Ver todos los dominios
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            href={buildFilterUrl({ dominio: 'ALL' })}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedDominio === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Todos ({allParsed.length})</span>
          </Link>

          <Link
            href={buildFilterUrl({ dominio: 'proj_leondelsur' })}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedDominio === 'proj_leondelsur'
                ? 'bg-guinda-700 text-white shadow-md border border-guinda-500'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-rose-400" />
            <span>León del Sur (Portal Principal)</span>
          </Link>

          {domainsList
            .filter(
              (d) =>
                ![
                  'dom_8',
                  'dom_9',
                  'dom_10',
                  'dom_11',
                  'dom_13',
                  'dom_papa',
                  'dom_nino',
                ].includes(d.id)
            )
            .map((dom) => (
              <Link
                key={dom.id}
                href={buildFilterUrl({ dominio: dom.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedDominio === dom.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {dom.name}
              </Link>
            ))}
        </div>
      </div>

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Campañas Activas
          </p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{counts.ACTIVE}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Impresiones Totales
          </p>
          <p className="text-2xl font-black text-white mt-1">
            {totalImpressions.toLocaleString('es-PE')}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Clics Totales
          </p>
          <p className="text-2xl font-black text-sky-400 mt-1">
            {totalClicks.toLocaleString('es-PE')}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            CTR Global
          </p>
          <p className="text-2xl font-black text-amber-400 mt-1">{globalCtr}%</p>
        </div>
      </div>

      {fetchError && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-200 p-4 rounded-xl text-xs space-y-1">
          <p className="font-bold">Aviso de conexión con la tabla public.banners:</p>
          <p className="font-mono">{fetchError.message}</p>
        </div>
      )}

      {/* Status & Location Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <Link
            href={buildFilterUrl({ status: 'ALL' })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStatus === 'ALL'
                ? 'bg-guinda-700 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Todos</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
              {counts.ALL}
            </span>
          </Link>

          <Link
            href={buildFilterUrl({ status: 'ACTIVE' })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Activos</span>
            <span
              className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${
                selectedStatus === 'ACTIVE'
                  ? 'bg-emerald-950/40 text-emerald-200'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {counts.ACTIVE}
            </span>
          </Link>

          <Link
            href={buildFilterUrl({ status: 'INACTIVE' })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedStatus === 'INACTIVE'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Inactivos</span>
            <span
              className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${
                selectedStatus === 'INACTIVE'
                  ? 'bg-rose-950/40 text-rose-200'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {counts.INACTIVE}
            </span>
          </Link>
        </div>

        {/* Location Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1">
          <span className="text-slate-500 font-medium mr-1 flex items-center gap-1 shrink-0">
            <LayoutTemplate className="w-3.5 h-3.5" /> Ubicación:
          </span>
          {(
            [
              'ALL',
              'top',
              'bottom',
              'home-middle',
              'sidebar',
              'half-page',
              'in-article',
              'sidebar-left',
              'sidebar-right',
              'popup',
            ] as const
          ).map((loc) => (
            <Link
              key={loc}
              href={buildFilterUrl({ ubicacion: loc })}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors shrink-0 ${
                selectedUbicacion === loc
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {loc === 'ALL' ? 'Todas' : loc}
            </Link>
          ))}
        </div>
      </div>

      {/* Banners List */}
      {!banners || banners.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">
            No hay campañas registradas en este filtro
          </h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Utiliza el botón &quot;Nueva Campaña&quot; para configurar creatividades, dominios, ubicaciones, dispositivos y publicar en tus portales.
          </p>
          <div className="pt-2">
            <Link
              href={newBannerHref}
              className="inline-flex items-center space-x-2 bg-guinda-700 hover:bg-guinda-600 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear primera campaña</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => {
            const now = new Date();
            const start = banner.fecha_inicio ? new Date(banner.fecha_inicio) : null;
            const end = banner.fecha_fin ? new Date(banner.fecha_fin) : null;
            const isExpired = end ? end < now : false;

            const imp = Number(banner.impresiones) || 0;
            const clk = Number(banner.clics) || 0;
            const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : '0.00';

            const devices: string[] = Array.isArray(banner.dispositivos)
              ? banner.dispositivos
              : ['desktop', 'tablet', 'mobile'];
            const pages: string[] = Array.isArray(banner.paginas)
              ? banner.paginas
              : ['all'];
            const targetDomains: string[] = Array.isArray(banner.dominios)
              ? banner.dominios
              : ['proj_leondelsur'];

            return (
              <div
                key={banner.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Thumbnail Preview */}
                <div className="w-full lg:w-48 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imagen_url}
                    alt={banner.nombre_campana}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  {banner.imagen_mobile_url && (
                    <span className="absolute bottom-1.5 right-1.5 bg-slate-950/90 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                      <Smartphone className="w-2.5 h-2.5" /> +Móvil
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {banner.activo && !isExpired ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </span>
                    ) : isExpired ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Vencido
                      </span>
                    ) : (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Inactivo
                      </span>
                    )}

                    <span className="bg-slate-800 text-sky-300 border border-slate-700 text-[11px] px-2.5 py-0.5 rounded-full font-mono">
                      {UBICACION_LABELS[banner.ubicacion] || banner.ubicacion}
                    </span>

                    {/* Target Domain Badges */}
                    {targetDomains.map((domId) => (
                      <span
                        key={domId}
                        className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        {domainNameMap[domId] || domId}
                      </span>
                    ))}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {start
                        ? start.toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Sin inicio'}
                      {' → '}
                      {end
                        ? end.toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Indefinido'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white truncate">
                    {banner.nombre_campana}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span>
                      Anunciante: <strong className="text-white">{banner.anunciante}</strong>
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-500" />
                      Disp:{' '}
                      <span className="font-mono text-slate-200">{devices.join(', ')}</span>
                    </span>
                    <span className="text-slate-400">
                      Págs:{' '}
                      <span className="font-mono text-slate-200">
                        {pages.includes('all') ? 'Todo el portal' : pages.join(', ')}
                      </span>
                    </span>
                  </div>

                  {banner.link_destino && (
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <span>Destino:</span>
                      <a
                        href={banner.link_destino}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline truncate inline-flex items-center gap-1"
                      >
                        <span>{banner.link_destino}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </p>
                  )}
                </div>

                {/* Metrics: Impresiones -> Clics -> CTR */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/90 border border-slate-800 rounded-xl p-3 shrink-0 text-center min-w-[210px]">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                      Impresiones
                    </p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {imp.toLocaleString('es-PE')}
                    </p>
                  </div>
                  <div className="border-x border-slate-800 px-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Clics</p>
                    <p className="text-sm font-bold text-sky-400 mt-0.5">
                      {clk.toLocaleString('es-PE')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">CTR</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{ctr}%</p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center space-x-3 shrink-0">
                  <Link
                    href={`/dashboard/banners/${banner.id}`}
                    className="w-full lg:w-auto inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow"
                  >
                    <Edit3 className="w-4 h-4 text-sky-400" />
                    <span>Medir / Editar</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
