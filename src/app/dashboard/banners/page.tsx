import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { bannerMatchesDomain, parseBannerRow } from '@/lib/banner-utils';
import BannersCampaignFoldersView from '@/components/BannersCampaignFoldersView';
import {
  PlusCircle,
  CheckCircle2,
  XCircle,
  Filter,
  ExternalLink,
  Megaphone,
  LayoutTemplate,
  Globe,
  FolderKanban,
} from 'lucide-react';

export const revalidate = 0;

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
              Panel de Campañas y Banners Publicitarios
            </h1>
            <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded font-mono">
              public.banners
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Organiza campañas completas por carpetas con múltiples posiciones (`top`, `sidebar`, `in-article`, `bottom`, `popup`) y asígnalas con precisión a <strong>León del Sur</strong> o a cualquiera de tus dominios.
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
            <span>Nueva Campaña Completa</span>
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
            <span>
              León del Sur (
              {allParsed.filter((b) => bannerMatchesDomain(b, 'proj_leondelsur')).length})
            </span>
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
            .map((dom) => {
              const domCount = allParsed.filter((b) =>
                bannerMatchesDomain(b, dom.id)
              ).length;
              return (
                <Link
                  key={dom.id}
                  href={buildFilterUrl({ dominio: dom.id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedDominio === dom.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{dom.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {domCount}
                  </span>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Banners Activos
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

      {/* Campaign Folders / Flat List View */}
      <BannersCampaignFoldersView
        banners={banners}
        domainNameMap={domainNameMap}
        newBannerHref={newBannerHref}
      />
    </div>
  );
}
