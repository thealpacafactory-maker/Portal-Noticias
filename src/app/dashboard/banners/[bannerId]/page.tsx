'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Calendar,
  LayoutTemplate,
  Megaphone,
  RefreshCw,
  Trash2,
  Monitor,
  Smartphone,
  Tablet,
  Sliders,
  BarChart3,
  MousePointerClick,
  Eye,
  Globe,
} from 'lucide-react';
import { normalizeImageUrl } from '@/lib/image-url-helper';

const AVAILABLE_PAGES = [
  { id: 'all', label: 'Todo el portal (Todas las páginas)' },
  { id: 'home', label: 'Portada Principal (/)' },
  { id: 'article', label: 'Artículos de Noticias (/noticias/[slug])' },
  { id: 'noticias', label: 'Archivo de Noticias (/noticias)' },
  { id: 'arequipa', label: 'Sección Arequipa (/arequipa)' },
  { id: 'sur', label: 'Sección Macroregión Sur (/sur)' },
  { id: 'mineria', label: 'Sección Minería (/mineria)' },
  { id: 'inmobiliario', label: 'Sección Inmobiliario (/inmobiliario)' },
  { id: 'empresas', label: 'Sección Empresas (/empresas)' },
  { id: 'el-papa', label: 'Sección El Papa (/el-papa)' },
  { id: 'el-nino', label: 'Sección El Niño (/el-nino)' },
  { id: 'politica', label: 'Sección Política (/politica)' },
  { id: 'deportes', label: 'Sección Deportes (/deportes)' },
  { id: 'peru', label: 'Sección Perú (/peru)' },
];

interface DomainOption {
  id: string;
  code: string;
  name: string;
  hostname: string;
}

interface BannerData {
  id: string;
  nombre_campana: string;
  anunciante: string;
  ubicacion: string;
  imagen_url: string;
  imagen_mobile_url?: string | null;
  link_destino?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
  activo: boolean;
  notas?: string | null;
  dispositivos?: string[];
  paginas?: string[];
  dominios?: string[];
  popup_delay_sec?: number;
  popup_scroll_pct?: number;
  popup_max_views?: number;
  impresiones?: number;
  clics?: number;
  created_at: string;
  updated_at: string;
}

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export default function EditBannerPage({
  params,
}: {
  params: { bannerId: string };
}) {
  const { bannerId } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [availableDomains, setAvailableDomains] = useState<DomainOption[]>([]);

  // Form State
  const [nombreCampana, setNombreCampana] = useState('');
  const [anunciante, setAnunciante] = useState('');
  const [ubicacion, setUbicacion] = useState('top');
  const [imagenUrl, setImagenUrl] = useState('');
  const [imagenMobileUrl, setImagenMobileUrl] = useState('');
  const [linkDestino, setLinkDestino] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(true);
  const [notas, setNotas] = useState('');

  // Extended State
  const [dispositivos, setDispositivos] = useState<string[]>(['desktop', 'tablet', 'mobile']);
  const [paginas, setPaginas] = useState<string[]>(['all']);
  const [dominios, setDominios] = useState<string[]>(['proj_leondelsur']);
  const [popupDelaySec, setPopupDelaySec] = useState(8);
  const [popupScrollPct, setPopupScrollPct] = useState(45);
  const [popupMaxViews, setPopupMaxViews] = useState(1);

  // Upload State
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  useEffect(() => {
    fetchBanner();
    fetch('/api/v1/admin/domains')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) {
          setAvailableDomains(json.data);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerId]);

  async function fetchBanner() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/banners?bannerId=${encodeURIComponent(bannerId)}`);
      const json = await res.json();
      if (json.data) {
        const b: BannerData = json.data;
        setBanner(b);
        setNombreCampana(b.nombre_campana || '');
        setAnunciante(b.anunciante || '');
        setUbicacion(b.ubicacion || 'top');
        setImagenUrl(b.imagen_url || '');
        setImagenMobileUrl(b.imagen_mobile_url || '');
        setLinkDestino(b.link_destino || '');
        setFechaInicio(toDatetimeLocalValue(b.fecha_inicio));
        setFechaFin(toDatetimeLocalValue(b.fecha_fin));
        setActivo(Boolean(b.activo));
        setNotas(b.notas || '');
        setDispositivos(
          Array.isArray(b.dispositivos) && b.dispositivos.length > 0
            ? b.dispositivos
            : ['desktop', 'tablet', 'mobile']
        );
        setPaginas(
          Array.isArray(b.paginas) && b.paginas.length > 0 ? b.paginas : ['all']
        );
        setDominios(
          Array.isArray(b.dominios) && b.dominios.length > 0
            ? b.dominios
            : ['proj_leondelsur']
        );
        setPopupDelaySec(b.popup_delay_sec ?? 8);
        setPopupScrollPct(b.popup_scroll_pct ?? 45);
        setPopupMaxViews(b.popup_max_views ?? 1);
      }
    } catch (err) {
      console.error('Error fetching banner:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleDomain = (domId: string) => {
    if (domId === 'all') {
      setDominios(['all']);
      return;
    }
    setDominios((prev) => {
      const withoutAll = prev.filter((d) => d !== 'all');
      const next = withoutAll.includes(domId)
        ? withoutAll.filter((d) => d !== domId)
        : [...withoutAll, domId];
      return next.length === 0 ? ['proj_leondelsur'] : next;
    });
  };

  const toggleDevice = (dev: string) => {
    setDispositivos((prev) =>
      prev.includes(dev) ? prev.filter((d) => d !== dev) : [...prev, dev]
    );
  };

  const togglePage = (pageId: string) => {
    if (pageId === 'all') {
      setPaginas(['all']);
      return;
    }
    setPaginas((prev) => {
      const withoutAll = prev.filter((p) => p !== 'all');
      const next = withoutAll.includes(pageId)
        ? withoutAll.filter((p) => p !== pageId)
        : [...withoutAll, pageId];
      return next.length === 0 ? ['all'] : next;
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'desktop' | 'mobile'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'desktop') setUploadingDesktop(true);
    else setUploadingMobile(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/admin/banners/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      if (target === 'desktop') {
        setImagenUrl(data.url);
      } else {
        setImagenMobileUrl(data.url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir el archivo');
    } finally {
      if (target === 'desktop') setUploadingDesktop(false);
      else setUploadingMobile(false);
    }
  };

  async function updateBanner(overrideActivo?: boolean) {
    if (!nombreCampana.trim() || !anunciante.trim() || !imagenUrl.trim()) {
      setErrorMsg('El nombre de campaña, anunciante e imagen principal son obligatorios.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const targetActivo = typeof overrideActivo === 'boolean' ? overrideActivo : activo;
      const payload = {
        id: bannerId,
        nombre_campana: nombreCampana.trim(),
        anunciante: anunciante.trim(),
        ubicacion,
        imagen_url: normalizeImageUrl(imagenUrl),
        imagen_mobile_url: imagenMobileUrl ? normalizeImageUrl(imagenMobileUrl) : null,
        link_destino: linkDestino.trim() || null,
        fecha_inicio: fechaInicio ? new Date(fechaInicio).toISOString() : new Date().toISOString(),
        fecha_fin: fechaFin ? new Date(fechaFin).toISOString() : null,
        activo: targetActivo,
        notas: notas.trim() || null,
        dispositivos,
        paginas,
        dominios,
        popup_delay_sec: popupDelaySec,
        popup_scroll_pct: popupScrollPct,
        popup_max_views: popupMaxViews,
      };

      const res = await fetch('/api/v1/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        if (overrideActivo !== undefined) {
          alert(
            targetActivo
              ? '¡Campaña activada y publicada correctamente!'
              : 'Campaña desactivada.'
          );
          router.push(`/dashboard/banners?status=${targetActivo ? 'ACTIVE' : 'INACTIVE'}`);
        } else {
          alert('Cambios guardados correctamente.');
          fetchBanner();
        }
        router.refresh();
      } else {
        setErrorMsg(json.error || 'Error al actualizar el banner');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar este banner permanentemente?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/banners?bannerId=${encodeURIComponent(bannerId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        router.push('/dashboard/banners');
        router.refresh();
      } else {
        setErrorMsg(json.error || 'No se pudo eliminar el banner');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-guinda-500 animate-spin" />
        <p className="text-slate-400 text-xs">Cargando datos de la campaña...</p>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Banner no encontrado</h2>
          <Link
            href="/dashboard/banners"
            className="inline-block bg-guinda-700 text-white px-4 py-2 rounded-xl text-xs font-semibold"
          >
            Volver al listado de banners
          </Link>
        </div>
      </div>
    );
  }

  const previewDesktopUrl = normalizeImageUrl(imagenUrl);
  const previewMobileUrl = normalizeImageUrl(imagenMobileUrl);
  const imp = banner.impresiones || 0;
  const clk = banner.clics || 0;
  const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : '0.00';

  const customDomains = availableDomains.filter(
    (d) =>
      !['dom_8', 'dom_9', 'dom_10', 'dom_11', 'dom_13', 'dom_papa', 'dom_nino'].includes(d.id)
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 text-xs">
            <Link
              href="/dashboard/banners"
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Banners Publicitarios</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 font-mono">{bannerId}</span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <h1 className="text-2xl font-bold text-white">
              Editar y Medir Campaña
            </h1>

            {banner.activo ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Activo en Web
              </span>
            ) : (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Inactivo
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 font-semibold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>

          <button
            type="button"
            onClick={() => updateBanner()}
            disabled={saving}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-sky-400" />
            <span>Guardar Cambios</span>
          </button>

          {banner.activo ? (
            <button
              type="button"
              onClick={() => updateBanner(false)}
              disabled={saving}
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-semibold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Desactivar Campaña</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updateBanner(true)}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Activar Campaña</span>
            </button>
          )}
        </div>
      </div>

      {/* Métricas en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-mono text-slate-400 block">
              Impresiones (`ad_impression`)
            </span>
            <span className="text-2xl font-bold text-white font-mono">
              {imp.toLocaleString('es-PE')}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-mono text-slate-400 block">
              Clics (`ad_click`)
            </span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {clk.toLocaleString('es-PE')}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-mono text-slate-400 block">
              CTR (Tasa de Clics)
            </span>
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {ctr}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Megaphone className="w-4 h-4 text-guinda-500" />
              <span>1. Datos de la Campaña y Dominio(s)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Nombre de la Campaña *
                </label>
                <input
                  type="text"
                  value={nombreCampana}
                  onChange={(e) => setNombreCampana(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-guinda-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Anunciante / Marca *
                </label>
                <input
                  type="text"
                  value={anunciante}
                  onChange={(e) => setAnunciante(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-guinda-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Enlace de Destino (`rel=&quot;sponsored&quot;`)
              </label>
              <input
                type="url"
                value={linkDestino}
                onChange={(e) => setLinkDestino(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-guinda-500"
              />
            </div>

            {/* Selector de Dominios / Portales Objetivo */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Portales / Dominios donde se muestra la campaña</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'proj_leondelsur', label: 'León del Sur (leondelsur.pe)' },
                  { id: 'all', label: 'Todos los Portales (Red Global)' },
                  ...customDomains.map((d) => ({
                    id: d.id,
                    label: `${d.name} (${d.hostname})`,
                  })),
                ].map((domOpt) => {
                  const checked = dominios.includes(domOpt.id);
                  return (
                    <label
                      key={domOpt.id}
                      onClick={() => toggleDomain(domOpt.id)}
                      className={`cursor-pointer px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        checked
                          ? 'bg-indigo-950/60 border-indigo-500 text-white font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate pr-2">{domOpt.label}</span>
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        className="accent-indigo-500 shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Notas Internas
              </label>
              <textarea
                value={notas}
                rows={2}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-guinda-500"
              />
            </div>
          </div>

          {/* Creatividades */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>3. Creatividad Principal (Desktop / Tablet) *</span>
              </h3>

              <label className="cursor-pointer inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                {uploadingDesktop ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Reemplazar en Storage</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'desktop')}
                  disabled={uploadingDesktop}
                  className="hidden"
                />
              </label>
            </div>

            {previewDesktopUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-60 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewDesktopUrl}
                  alt={nombreCampana}
                  referrerPolicy="no-referrer"
                  className="max-h-52 w-auto object-contain rounded"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                URL de Imagen Principal
              </label>
              <input
                type="text"
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
              />
            </div>

            {/* Mobile Image */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>Creatividad Móvil (Opcional — &lt;768px)</span>
                </h4>

                <label className="cursor-pointer inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                  {uploadingMobile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      <span>Subir imagen móvil</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'mobile')}
                    disabled={uploadingMobile}
                    className="hidden"
                  />
                </label>
              </div>

              {previewMobileUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-48 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewMobileUrl}
                    alt="Vista previa móvil"
                    referrerPolicy="no-referrer"
                    className="max-h-40 w-auto object-contain rounded"
                  />
                </div>
              )}

              <input
                type="text"
                value={imagenMobileUrl}
                onChange={(e) => setImagenMobileUrl(e.target.value)}
                placeholder="URL de Imagen Móvil (Opcional)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Dispositivos y Páginas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>4. Dispositivos y Páginas Objetivo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'desktop', label: 'Desktop (PC)', icon: Monitor },
                { id: 'tablet', label: 'Tablet', icon: Tablet },
                { id: 'mobile', label: 'Móvil', icon: Smartphone },
              ].map((item) => {
                const Icon = item.icon;
                const checked = dispositivos.includes(item.id);
                const disabledForLateral =
                  (ubicacion === 'sidebar-left' || ubicacion === 'sidebar-right') &&
                  item.id !== 'desktop';

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabledForLateral}
                    onClick={() => toggleDevice(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      disabledForLateral
                        ? 'bg-slate-950/30 border-slate-800/60 opacity-40 cursor-not-allowed'
                        : checked
                        ? 'bg-indigo-950/50 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="flex items-center space-x-2 text-xs font-bold">
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span>{item.label}</span>
                    </span>
                    <input
                      type="checkbox"
                      readOnly
                      checked={disabledForLateral ? false : checked}
                      className="accent-indigo-500"
                    />
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              {AVAILABLE_PAGES.map((pg) => {
                const checked = paginas.includes(pg.id);
                return (
                  <label
                    key={pg.id}
                    onClick={() => togglePage(pg.id)}
                    className={`cursor-pointer px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                      checked
                        ? 'bg-slate-800 border-guinda-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{pg.label}</span>
                    <input
                      type="checkbox"
                      readOnly
                      checked={checked}
                      className="accent-guinda-600"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <LayoutTemplate className="w-4 h-4 text-amber-400" />
              <span>2. Ubicación en el Portal</span>
            </h3>

            <select
              value={ubicacion}
              onChange={(e) => {
                const val = e.target.value;
                setUbicacion(val);
                if (val === 'sidebar-left' || val === 'sidebar-right') {
                  setDispositivos(['desktop']);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-guinda-500"
            >
              <option value="top">top — Cintillo Horizontal Superior (Todas las páginas)</option>
              <option value="bottom">bottom — Cintillo Horizontal Inferior (Antes del pie de página)</option>
              <option value="home-middle">home-middle — Horizontal Portada Central</option>
              <option value="sidebar">sidebar — Barra Lateral Derecha (Inline en Tablet/Móvil)</option>
              <option value="half-page">half-page — Media Página 300×600 (En Barra Lateral)</option>
              <option value="in-article">in-article — Horizontal Interior de Noticia</option>
              <option value="sidebar-left">sidebar-left — Rascacielos Lateral Izquierdo (Solo Desktop)</option>
              <option value="sidebar-right">sidebar-right — Rascacielos Lateral Derecho (Solo Desktop)</option>
              <option value="popup">popup — Pop-up No Intrusivo (Con reglas Google SEO)</option>
            </select>
          </div>

          {ubicacion === 'popup' && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Reglas del Pop-up</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mostrar después de X segundos
                </label>
                <input
                  type="number"
                  min={2}
                  max={120}
                  value={popupDelaySec}
                  onChange={(e) => setPopupDelaySec(Number(e.target.value) || 8)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  O después de X% de scroll
                </label>
                <input
                  type="number"
                  min={10}
                  max={95}
                  value={popupScrollPct}
                  onChange={(e) => setPopupScrollPct(Number(e.target.value) || 45)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Máximo de veces por usuario/día
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={popupMaxViews}
                  onChange={(e) => setPopupMaxViews(Number(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>5. Vigencia</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha de Fin (Opcional)
              </label>
              <input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Campaña Activa</span>
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
