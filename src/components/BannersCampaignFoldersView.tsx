'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ParsedBannerRow } from '@/lib/banner-utils';
import {
  Folder,
  FolderOpen,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Edit3,
  ExternalLink,
  Megaphone,
  Monitor,
  Smartphone,
  Globe,
  ChevronDown,
  ChevronUp,
  Layers,
  List,
  Trash2,
  Power,
} from 'lucide-react';

const UBICACION_LABELS: Record<string, string> = {
  top: 'Cabecera Superior (Top)',
  bottom: 'Pie de Página (Bottom)',
  'home-middle': 'Portada Central (Home Middle)',
  sidebar: 'Barra Lateral (Sidebar 300×250)',
  'half-page': 'Media Página (Half-Page 300×600)',
  'in-article': 'Interior de Noticia (In-Article)',
  'sidebar-left': 'Lateral Izquierdo (Skyscraper)',
  'sidebar-right': 'Lateral Derecho (Skyscraper)',
  popup: 'Pop-up No Invasivo',
};

interface CampaignGroup {
  groupKey: string;
  campana_grupo_id: string;
  nombre_campana: string;
  anunciante: string;
  banners: ParsedBannerRow[];
  activeCount: number;
  totalImpressions: number;
  totalClicks: number;
  dominios: string[];
  ubicaciones: string[];
  latestCreatedAt: string;
}

interface Props {
  banners: ParsedBannerRow[];
  domainNameMap: Record<string, string>;
  newBannerHref: string;
}

export default function BannersCampaignFoldersView({
  banners,
  domainNameMap,
  newBannerHref,
}: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'folders' | 'list'>('folders');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [busyGroupKey, setBusyGroupKey] = useState<string | null>(null);

  const campaignGroups = useMemo<CampaignGroup[]>(() => {
    const map = new Map<string, CampaignGroup>();

    for (const b of banners) {
      // Agrupar por nombre_campana + anunciante normalizados para que todos los banners de la misma campaña vivan en la misma carpeta
      const normName = (b.nombre_campana || 'Sin nombre').trim().toLowerCase();
      const normAdv = (b.anunciante || 'Sin anunciante').trim().toLowerCase();
      const key = `${normName}__${normAdv}`;

      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          campana_grupo_id: b.campana_grupo_id || key,
          nombre_campana: b.nombre_campana || 'Campaña Sin Nombre',
          anunciante: b.anunciante || 'Anunciante',
          banners: [],
          activeCount: 0,
          totalImpressions: 0,
          totalClicks: 0,
          dominios: [],
          ubicaciones: [],
          latestCreatedAt: b.created_at || '',
        });
      }

      const grp = map.get(key)!;
      grp.banners.push(b);
      if (b.activo) grp.activeCount += 1;
      grp.totalImpressions += Number(b.impresiones) || 0;
      grp.totalClicks += Number(b.clics) || 0;

      const doms = Array.isArray(b.dominios) ? b.dominios : ['proj_leondelsur'];
      for (const d of doms) {
        if (!grp.dominios.includes(d)) grp.dominios.push(d);
      }
      if (b.ubicacion && !grp.ubicaciones.includes(b.ubicacion)) {
        grp.ubicaciones.push(b.ubicacion);
      }
    }

    return Array.from(map.values());
  }, [banners]);

  const isGroupExpanded = (groupKey: string, idx: number) => {
    if (expandedGroups[groupKey] !== undefined) {
      return expandedGroups[groupKey];
    }
    // Expandir por defecto las primeras 3 carpetas
    return idx < 3;
  };

  const toggleGroup = (groupKey: string, idx: number) => {
    const current = isGroupExpanded(groupKey, idx);
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !current,
    }));
  };

  const handleToggleEntireCampaign = async (group: CampaignGroup, targetActive: boolean) => {
    setBusyGroupKey(group.groupKey);
    try {
      const ids = group.banners.map((b) => b.id);
      const res = await fetch('/api/v1/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, activo: targetActive }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json();
        alert(json.error || 'No se pudo actualizar el estado de la campaña');
      }
    } catch {
      alert('Error de red al actualizar la campaña');
    } finally {
      setBusyGroupKey(null);
    }
  };

  const handleDeleteEntireCampaign = async (group: CampaignGroup) => {
    if (
      !confirm(
        `¿Eliminar la campaña completa "${group.nombre_campana}" y sus ${group.banners.length} banner(s) permanentemente?`
      )
    ) {
      return;
    }
    setBusyGroupKey(group.groupKey);
    try {
      const ids = group.banners.map((b) => b.id).join(',');
      const res = await fetch(`/api/v1/admin/banners?bannerIds=${encodeURIComponent(ids)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json();
        alert(json.error || 'No se pudo eliminar la campaña');
      }
    } catch {
      alert('Error al eliminar la campaña');
    } finally {
      setBusyGroupKey(null);
    }
  };

  const buildAddBannerToCampaignUrl = (group: CampaignGroup) => {
    const first = group.banners[0];
    const params = new URLSearchParams();
    params.set('campana_grupo_id', group.campana_grupo_id);
    params.set('nombre_campana', group.nombre_campana);
    params.set('anunciante', group.anunciante);
    if (first?.link_destino) params.set('link_destino', first.link_destino);
    if (group.dominios.length > 0) params.set('dominios', group.dominios.join(','));
    return `/dashboard/banners/new?${params.toString()}`;
  };

  const renderSingleBannerRow = (banner: ParsedBannerRow, insideFolder = false) => {
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
    const pages: string[] = Array.isArray(banner.paginas) ? banner.paginas : ['all'];
    const targetDomains: string[] = Array.isArray(banner.dominios)
      ? banner.dominios
      : ['proj_leondelsur'];

    return (
      <div
        key={banner.id}
        className={`${
          insideFolder
            ? 'bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4'
            : 'bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-md'
        } transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5`}
      >
        {/* Thumbnail Preview */}
        <div className="w-full lg:w-44 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center relative">
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
        <div className="space-y-1.5 flex-1 min-w-0">
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

            <span className="bg-slate-800 text-sky-300 border border-slate-700 text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold">
              {UBICACION_LABELS[banner.ubicacion] || banner.ubicacion}
            </span>

            {!insideFolder &&
              targetDomains.map((domId) => (
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

          {!insideFolder && (
            <h3 className="text-base font-bold text-white truncate">
              {banner.nombre_campana}
            </h3>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
            {!insideFolder && (
              <span>
                Anunciante: <strong className="text-white">{banner.anunciante}</strong>
              </span>
            )}
            <span className="text-slate-400 flex items-center gap-1">
              <Monitor className="w-3 h-3 text-slate-500" />
              Disp: <span className="font-mono text-slate-200">{devices.join(', ')}</span>
            </span>
            <span className="text-slate-400">
              Págs:{' '}
              <span className="font-mono text-slate-200">
                {pages.includes('all') ? 'Todo el portal' : pages.join(', ')}
              </span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">ID: {banner.id}</span>
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

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 shrink-0 text-center min-w-[195px]">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Impresiones</p>
            <p className="text-xs font-bold text-white mt-0.5">
              {imp.toLocaleString('es-PE')}
            </p>
          </div>
          <div className="border-x border-slate-800 px-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Clics</p>
            <p className="text-xs font-bold text-sky-400 mt-0.5">
              {clk.toLocaleString('es-PE')}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">CTR</p>
            <p className="text-xs font-bold text-emerald-400 mt-0.5">{ctr}%</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link
            href={`/dashboard/banners/${banner.id}`}
            className="w-full lg:w-auto inline-flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition-all shadow"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Medir / Editar</span>
          </Link>
        </div>
      </div>
    );
  };

  if (!banners || banners.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Megaphone className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">
          No hay campañas registradas en este filtro
        </h3>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Utiliza el botón &quot;Nueva Campaña Completa&quot; para configurar uno o varios banners (por ejemplo: top, sidebar, in-article y popup) dentro de una misma carpeta de campaña.
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
    );
  }

  return (
    <div className="space-y-4">
      {/* View Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5">
        <div className="text-xs text-slate-400">
          Mostrando <strong>{campaignGroups.length}</strong> carpeta(s) de campaña con un total de{' '}
          <strong>{banners.length}</strong> banner(s) configurados.
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('folders')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'folders'
                ? 'bg-guinda-700 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Carpetas de Campaña ({campaignGroups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-guinda-700 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista Plana ({banners.length})</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {banners.map((banner) => renderSingleBannerRow(banner, false))}
        </div>
      ) : (
        <div className="space-y-5">
          {campaignGroups.map((group, idx) => {
            const expanded = isGroupExpanded(group.groupKey, idx);
            const allActive = group.activeCount === group.banners.length && group.banners.length > 0;
            const someActive = group.activeCount > 0 && group.activeCount < group.banners.length;
            const groupCtr =
              group.totalImpressions > 0
                ? ((group.totalClicks / group.totalImpressions) * 100).toFixed(2)
                : '0.00';
            const isBusy = busyGroupKey === group.groupKey;

            return (
              <div
                key={group.groupKey}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Campaign Folder Header */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
                  <div
                    onClick={() => toggleGroup(group.groupKey, idx)}
                    className="flex items-start gap-3.5 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className={`p-3 rounded-xl border shrink-0 mt-0.5 ${
                        allActive
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : someActive
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {expanded ? (
                        <FolderOpen className="w-6 h-6" />
                      ) : (
                        <Folder className="w-6 h-6" />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-white truncate">
                          {group.nombre_campana}
                        </h3>

                        <span className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          {group.banners.length}{' '}
                          {group.banners.length === 1 ? 'banner' : 'banners'}
                        </span>

                        {allActive ? (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Campaña Activa (
                            {group.activeCount}/{group.banners.length})
                          </span>
                        ) : someActive ? (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            Parcial ({group.activeCount}/{group.banners.length} activos)
                          </span>
                        ) : (
                          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Pausada
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>
                          Anunciante: <strong className="text-slate-200">{group.anunciante}</strong>
                        </span>
                        <span>·</span>
                        <span className="flex flex-wrap items-center gap-1">
                          Posiciones:
                          {group.ubicaciones.map((loc) => (
                            <span
                              key={loc}
                              className="bg-slate-950 border border-slate-800 text-sky-300 px-2 py-0.5 rounded font-mono text-[10px]"
                            >
                              {loc}
                            </span>
                          ))}
                        </span>
                      </div>

                      {/* Target Domains Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {group.dominios.map((domId) => (
                          <span
                            key={domId}
                            className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            {domainNameMap[domId] || domId}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Consolidated Folder KPIs & Quick Folder Actions */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center min-w-[195px]">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400">
                          Impresiones
                        </p>
                        <p className="text-xs font-bold text-white mt-0.5">
                          {group.totalImpressions.toLocaleString('es-PE')}
                        </p>
                      </div>
                      <div className="border-x border-slate-800 px-2">
                        <p className="text-[9px] uppercase tracking-wider text-slate-400">
                          Clics
                        </p>
                        <p className="text-xs font-bold text-sky-400 mt-0.5">
                          {group.totalClicks.toLocaleString('es-PE')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400">
                          CTR
                        </p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                          {groupCtr}%
                        </p>
                      </div>
                    </div>

                    {/* Add another banner to this campaign */}
                    <Link
                      href={buildAddBannerToCampaignUrl(group)}
                      title="Añadir otro banner en otra posición a esta campaña"
                      className="inline-flex items-center gap-1.5 bg-guinda-700/80 hover:bg-guinda-600 text-white border border-guinda-500/40 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Banner</span>
                    </Link>

                    {/* Toggle all banners in folder */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleEntireCampaign(group, !allActive)}
                      title={
                        allActive
                          ? 'Pausar todos los banners de esta campaña'
                          : 'Activar todos los banners de esta campaña'
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 ${
                        allActive
                          ? 'bg-slate-800 hover:bg-amber-950/50 text-slate-300 hover:text-amber-300 border-slate-700'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{allActive ? 'Pausar' : 'Activar'}</span>
                    </button>

                    {/* Delete entire campaign folder */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDeleteEntireCampaign(group)}
                      title="Eliminar campaña completa"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand / Collapse button */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.groupKey, idx)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title={expanded ? 'Plegar carpeta' : 'Desplegar carpeta'}
                    >
                      {expanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Folder Contents (Banners inside Campaign) */}
                {expanded && (
                  <div className="border-t border-slate-800 bg-slate-950/40 p-4 space-y-3">
                    {group.banners.map((banner) => renderSingleBannerRow(banner, true))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
