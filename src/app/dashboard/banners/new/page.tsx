'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Calendar,
  LayoutTemplate,
  Megaphone,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Sliders,
  Globe,
  Plus,
  Trash2,
  Copy,
  FolderPlus,
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

const SUGGESTED_POSITIONS = [
  'top',
  'sidebar',
  'in-article',
  'home-middle',
  'bottom',
  'half-page',
  'popup',
  'sidebar-left',
  'sidebar-right',
];

interface DomainOption {
  id: string;
  code: string;
  name: string;
  hostname: string;
}

interface BannerDraftItem {
  uid: string;
  ubicacion: string;
  imagenUrl: string;
  imagenMobileUrl: string;
  linkDestinoPersonalizado: string;
  dispositivos: string[];
  popupDelaySec: number;
  popupScrollPct: number;
  popupMaxViews: number;
  uploadingDesktop?: boolean;
  uploadingMobile?: boolean;
}

function createDraftItem(ubicacion = 'top'): BannerDraftItem {
  return {
    uid: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ubicacion,
    imagenUrl: '',
    imagenMobileUrl: '',
    linkDestinoPersonalizado: '',
    dispositivos:
      ubicacion === 'sidebar-left' || ubicacion === 'sidebar-right'
        ? ['desktop']
        : ['desktop', 'tablet', 'mobile'],
    popupDelaySec: 8,
    popupScrollPct: 45,
    popupMaxViews: 1,
    uploadingDesktop: false,
    uploadingMobile: false,
  };
}

function NewBannerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDomainParam = searchParams.get('dominio');
  const initialDomainsQuery = searchParams.get('dominios');
  const initialCampaignGroupId = searchParams.get('campana_grupo_id') || '';
  const initialCampaignName = searchParams.get('nombre_campana') || '';
  const initialAdvertiser = searchParams.get('anunciante') || '';
  const initialLink = searchParams.get('link_destino') || '';

  // 1. Datos compartidos de la Campaña Completa
  const [nombreCampana, setNombreCampana] = useState(initialCampaignName);
  const [anunciante, setAnunciante] = useState(initialAdvertiser);
  const [linkDestino, setLinkDestino] = useState(initialLink);
  const [notas, setNotas] = useState('');
  const [dominios, setDominios] = useState<string[]>(() => {
    if (initialDomainsQuery) {
      return initialDomainsQuery.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (initialDomainParam) {
      return [initialDomainParam];
    }
    return ['proj_leondelsur'];
  });
  const [availableDomains, setAvailableDomains] = useState<DomainOption[]>([]);

  // 2. Páginas / Secciones objetivo de la campaña
  const [paginas, setPaginas] = useState<string[]>(['all']);

  // 3. Programación de vigencia de la campaña
  const [fechaInicio, setFechaInicio] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(true);

  // 4. Lista dinámica de Banners / Piezas de esta Campaña
  const [bannerItems, setBannerItems] = useState<BannerDraftItem[]>(() => [
    createDraftItem('top'),
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/admin/domains')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) {
          setAvailableDomains(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const toggleDomain = (domId: string) => {
    if (domId === 'all') {
      setDominios((prev) => (prev.includes('all') ? [] : ['all']));
      return;
    }
    setDominios((prev) => {
      const withoutAll = prev.filter((d) => d !== 'all');
      return withoutAll.includes(domId)
        ? withoutAll.filter((d) => d !== domId)
        : [...withoutAll, domId];
    });
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

  // Funciones para manejar las piezas / banners individuales de la campaña
  const addAnotherBannerItem = () => {
    const usedPositions = bannerItems.map((b) => b.ubicacion);
    const nextSuggested =
      SUGGESTED_POSITIONS.find((pos) => !usedPositions.includes(pos)) || 'sidebar';
    setBannerItems((prev) => [...prev, createDraftItem(nextSuggested)]);
  };

  const duplicateBannerItem = (index: number) => {
    const source = bannerItems[index];
    const copy: BannerDraftItem = {
      ...source,
      uid: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      uploadingDesktop: false,
      uploadingMobile: false,
    };
    setBannerItems((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const removeBannerItem = (uid: string) => {
    if (bannerItems.length <= 1) return;
    setBannerItems((prev) => prev.filter((item) => item.uid !== uid));
  };

  const updateBannerItem = (uid: string, patch: Partial<BannerDraftItem>) => {
    setBannerItems((prev) =>
      prev.map((item) => (item.uid === uid ? { ...item, ...patch } : item))
    );
  };

  const toggleItemDevice = (uid: string, dev: string) => {
    setBannerItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item;
        const exists = item.dispositivos.includes(dev);
        const nextDevs = exists
          ? item.dispositivos.filter((d) => d !== dev)
          : [...item.dispositivos, dev];
        return { ...item, dispositivos: nextDevs };
      })
    );
  };

  const handleItemFileUpload = async (
    uid: string,
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'desktop' | 'mobile'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    updateBannerItem(
      uid,
      target === 'desktop' ? { uploadingDesktop: true } : { uploadingMobile: true }
    );
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
        throw new Error(data.error || 'Error al subir la imagen al bucket banners-images');
      }

      if (target === 'desktop') {
        updateBannerItem(uid, { imagenUrl: data.url, uploadingDesktop: false });
      } else {
        updateBannerItem(uid, { imagenMobileUrl: data.url, uploadingMobile: false });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir el archivo');
      updateBannerItem(
        uid,
        target === 'desktop' ? { uploadingDesktop: false } : { uploadingMobile: false }
      );
    }
  };

  const handleSave = async (targetActivo: boolean) => {
    if (!nombreCampana.trim()) {
      setErrorMsg('El nombre de la campaña es obligatorio.');
      return;
    }
    if (!anunciante.trim()) {
      setErrorMsg('El nombre del anunciante es obligatorio.');
      return;
    }
    if (dominios.length === 0) {
      setErrorMsg('Debes seleccionar al menos un portal o dominio donde se mostrará la campaña.');
      return;
    }

    for (let i = 0; i < bannerItems.length; i++) {
      const item = bannerItems[i];
      if (!item.imagenUrl.trim()) {
        setErrorMsg(
          `El Banner #${i + 1} (${item.ubicacion}) necesita una creatividad principal (imagen).`
        );
        return;
      }
      if (item.dispositivos.length === 0) {
        setErrorMsg(
          `El Banner #${i + 1} (${item.ubicacion}) debe tener al menos un dispositivo seleccionado.`
        );
        return;
      }
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        campana_grupo_id: initialCampaignGroupId || undefined,
        nombre_campana: nombreCampana.trim(),
        anunciante: anunciante.trim(),
        link_destino: linkDestino.trim() || null,
        fecha_inicio: fechaInicio
          ? new Date(fechaInicio).toISOString()
          : new Date().toISOString(),
        fecha_fin: fechaFin ? new Date(fechaFin).toISOString() : null,
        activo: targetActivo,
        notas: notas.trim() || null,
        paginas,
        dominios,
        banners_list: bannerItems.map((item) => ({
          ubicacion: item.ubicacion,
          imagen_url: normalizeImageUrl(item.imagenUrl),
          imagen_mobile_url: item.imagenMobileUrl
            ? normalizeImageUrl(item.imagenMobileUrl)
            : null,
          link_destino: item.linkDestinoPersonalizado.trim() || linkDestino.trim() || null,
          dispositivos: item.dispositivos,
          popup_delay_sec: item.popupDelaySec,
          popup_scroll_pct: item.popupScrollPct,
          popup_max_views: item.popupMaxViews,
        })),
      };

      const res = await fetch('/api/v1/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la campaña');
      }

      router.push(`/dashboard/banners?status=${targetActivo ? 'ACTIVE' : 'INACTIVE'}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  const customDomains = availableDomains.filter(
    (d) =>
      !['dom_8', 'dom_9', 'dom_10', 'dom_11', 'dom_13', 'dom_papa', 'dom_nino'].includes(d.id)
  );

  return (
    <div className="space-y-6 pb-28">
      {/* Top Breadcrumbs */}
      <div className="flex items-center space-x-3 text-xs">
        <Link
          href="/dashboard/banners"
          className="text-slate-400 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Carpetas de Campañas</span>
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-semibold">
          {initialCampaignName
            ? `Añadir Banners a "${initialCampaignName}"`
            : 'Nueva Campaña Completa'}
        </span>
      </div>

      {/* Header Workflow Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="bg-guinda-900/50 text-guinda-300 border border-guinda-700/40 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Creador de Campaña Completa Multi-Banner</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            1. Datos de Campaña y Dominios → 2. Añadir 1 o más Banners (+ Posiciones) → 3. Guardar Carpeta
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {initialCampaignName
            ? `Añadir Banners a la Campaña: ${initialCampaignName}`
            : 'Crear Campaña Publicitaria Completa'}
        </h1>
        <p className="text-xs text-slate-400">
          Configura una sola vez los datos de la campaña (nombre, anunciante, dominios y fechas) y usa el botón <strong>&quot;+ Añadir otro banner a la campaña&quot;</strong> para cargar de golpe todas las posiciones (`top`, `sidebar`, `in-article`, `bottom`, `popup`). Quedarán agrupadas en una misma carpeta en el panel general.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Datos Generales + Lista Dinámica de Banners */}
        <div className="lg:col-span-2 space-y-6">
          {/* PASO 1: Datos Generales de la Campaña Completa y Dominios */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Megaphone className="w-4 h-4 text-guinda-500" />
              <span>1. Datos Generales de la Campaña Completa (Carpeta)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Nombre de la Campaña Completa *
                </label>
                <input
                  type="text"
                  value={nombreCampana}
                  onChange={(e) => setNombreCampana(e.target.value)}
                  placeholder="Ej: Campaña Lanzamiento Parque 10 - Noviembre"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-guinda-500 transition-colors"
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
                  placeholder="Ej: Sillaris Desarrollo Urbano"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-guinda-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Enlace de Destino General (Se aplica a todos los banners de la campaña)
              </label>
              <input
                type="url"
                value={linkDestino}
                onChange={(e) => setLinkDestino(e.target.value)}
                placeholder="https://www.ejemplo.com/promocion o https://wa.me/51..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-guinda-500 transition-colors font-mono"
              />
            </div>

            {/* Selector de Dominios / Portales Objetivo */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Portales / Dominios donde se emitirá esta campaña *</span>
                </label>

                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDominios(['proj_leondelsur'])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Solo León del Sur
                  </button>
                  <button
                    type="button"
                    onClick={() => setDominios([])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
                  >
                    Limpiar selección
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDomain('all')}
                    className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                      dominios.includes('all')
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    Todos los Portales (Red Global)
                  </button>
                </div>
              </div>

              {dominios.includes('all') && (
                <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 rounded-xl p-3 text-xs">
                  <strong>Red Global activa:</strong> Todos los banners de esta campaña se mostrarán en <strong>todos</strong> tus dominios conectados. Si solo quieres que aparezcan en ciertos dominios, marca únicamente sus casillas abajo.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'proj_leondelsur', label: 'León del Sur', host: 'leondelsur.pe' },
                  ...customDomains.map((d) => ({
                    id: d.id,
                    label: d.name,
                    host: d.hostname,
                  })),
                ].map((domOpt) => {
                  const checked = dominios.includes('all') || dominios.includes(domOpt.id);
                  return (
                    <label
                      key={domOpt.id}
                      onClick={() => toggleDomain(domOpt.id)}
                      className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        checked
                          ? 'bg-indigo-950/60 border-indigo-500 text-white font-semibold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate">{domOpt.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {domOpt.host}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        className="accent-indigo-500 shrink-0 w-4 h-4"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Notas Comerciales Internas (Opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                placeholder="Acuerdos comerciales, contacto del cliente, orden de compra..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-guinda-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* PASO 2: Lista Dinámica de Banners de la Campaña */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-amber-400" />
                  <span>
                    2. Banners de la Campaña ({bannerItems.length}{' '}
                    {bannerItems.length === 1 ? 'posición configurada' : 'posiciones configuradas'})
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Configura cada banner en su posición y pulsa el botón <strong>&quot;+ Añadir otro banner a la campaña&quot;</strong> para sumar más formatos.
                </p>
              </div>

              <button
                type="button"
                onClick={addAnotherBannerItem}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-guinda-700 to-rose-700 hover:from-guinda-600 hover:to-rose-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir otro banner a la campaña</span>
              </button>
            </div>

            {bannerItems.map((item, idx) => {
              const previewDesktop = normalizeImageUrl(item.imagenUrl);
              const previewMobile = normalizeImageUrl(item.imagenMobileUrl);

              return (
                <div
                  key={item.uid}
                  className="bg-slate-900 border-2 border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-5 shadow-lg relative"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-guinda-700 text-white font-bold text-xs flex items-center justify-center shadow">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Banner #{idx + 1} — Posición:{' '}
                          <span className="text-amber-400 font-mono">{item.ubicacion}</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Pertenece a la carpeta:{' '}
                          <strong className="text-slate-300">
                            {nombreCampana || 'Nueva Campaña'}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => duplicateBannerItem(idx)}
                        title="Duplicar este banner para otra ubicación"
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-sky-400" />
                        <span>Duplicar</span>
                      </button>

                      {bannerItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBannerItem(item.uid)}
                          title="Quitar este banner de la campaña"
                          className="inline-flex items-center gap-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Posición / Ubicación del Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Ubicación / Posición en el Portal *
                      </label>
                      <select
                        value={item.ubicacion}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateBannerItem(item.uid, {
                            ubicacion: val,
                            dispositivos:
                              val === 'sidebar-left' || val === 'sidebar-right'
                                ? ['desktop']
                                : item.dispositivos,
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500"
                      >
                        <option value="top">
                          top — Cintillo Horizontal Superior (Cabecera)
                        </option>
                        <option value="bottom">
                          bottom — Cintillo Horizontal Inferior (Pie de página)
                        </option>
                        <option value="home-middle">
                          home-middle — Horizontal Portada Central
                        </option>
                        <option value="sidebar">
                          sidebar — Barra Lateral Derecha 300×250
                        </option>
                        <option value="half-page">
                          half-page — Media Página 300×600 (En Barra Lateral)
                        </option>
                        <option value="in-article">
                          in-article — Horizontal Interior de Noticia
                        </option>
                        <option value="sidebar-left">
                          sidebar-left — Rascacielos Lateral Izquierdo (Solo Desktop)
                        </option>
                        <option value="sidebar-right">
                          sidebar-right — Rascacielos Lateral Derecho (Solo Desktop)
                        </option>
                        <option value="popup">
                          popup — Pop-up No Intrusivo (Con reglas Google SEO)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Enlace Específico para este Banner (Opcional)
                      </label>
                      <input
                        type="url"
                        value={item.linkDestinoPersonalizado}
                        onChange={(e) =>
                          updateBannerItem(item.uid, {
                            linkDestinoPersonalizado: e.target.value,
                          })
                        }
                        placeholder={
                          linkDestino
                            ? `Usa general: ${linkDestino}`
                            : 'Deja vacío para usar el enlace general de campaña'
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-guinda-500"
                      />
                    </div>
                  </div>

                  {/* Reglas de Pop-up si ubicacion === 'popup' */}
                  {item.ubicacion === 'popup' && (
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <span>Reglas No Intrusivas del Pop-up</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Mostrar tras X segundos
                          </label>
                          <input
                            type="number"
                            min={2}
                            max={120}
                            value={item.popupDelaySec}
                            onChange={(e) =>
                              updateBannerItem(item.uid, {
                                popupDelaySec: Number(e.target.value) || 8,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            O tras X% de scroll
                          </label>
                          <input
                            type="number"
                            min={10}
                            max={95}
                            value={item.popupScrollPct}
                            onChange={(e) =>
                              updateBannerItem(item.uid, {
                                popupScrollPct: Number(e.target.value) || 45,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Máx. aperturas / día
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={item.popupMaxViews}
                            onChange={(e) =>
                              updateBannerItem(item.uid, {
                                popupMaxViews: Number(e.target.value) || 1,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Creatividad Principal (Desktop/Tablet) y Móvil */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                    {/* Desktop Creative */}
                    <div className="space-y-2.5 bg-slate-950/60 border border-slate-800/90 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-sky-400" />
                          <span>Creatividad Principal (Desktop) *</span>
                        </span>

                        <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors">
                          {item.uploadingDesktop ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
                              <span>Subiendo...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 text-sky-400" />
                              <span>Subir archivo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleItemFileUpload(item.uid, e, 'desktop')}
                            disabled={item.uploadingDesktop}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {previewDesktop ? (
                        <div className="space-y-1.5">
                          <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 p-2 h-32 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewDesktop}
                              alt={`Vista previa ${item.ubicacion}`}
                              referrerPolicy="no-referrer"
                              className="max-h-28 w-auto object-contain rounded"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => updateBannerItem(item.uid, { imagenUrl: '' })}
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            Quitar imagen
                          </button>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-800 rounded-lg p-4 text-center text-[11px] text-slate-500">
                          Sube imagen o pega enlace directo / Google Drive abajo
                        </div>
                      )}

                      <input
                        type="text"
                        value={item.imagenUrl}
                        onChange={(e) =>
                          updateBannerItem(item.uid, { imagenUrl: e.target.value })
                        }
                        placeholder="URL de imagen principal (https://...)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* Mobile Creative */}
                    <div className="space-y-2.5 bg-slate-950/60 border border-slate-800/90 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-purple-400" />
                          <span>Versión Móvil (Opcional &lt;768px)</span>
                        </span>

                        <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors">
                          {item.uploadingMobile ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                              <span>Subiendo...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 text-purple-400" />
                              <span>Subir móvil</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleItemFileUpload(item.uid, e, 'mobile')}
                            disabled={item.uploadingMobile}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {previewMobile ? (
                        <div className="space-y-1.5">
                          <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 p-2 h-32 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewMobile}
                              alt="Vista previa móvil"
                              referrerPolicy="no-referrer"
                              className="max-h-28 w-auto object-contain rounded"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateBannerItem(item.uid, { imagenMobileUrl: '' })
                            }
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            Quitar versión móvil
                          </button>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-800 rounded-lg p-4 text-center text-[11px] text-slate-500">
                          Si se deja vacío, se adaptará la imagen principal
                        </div>
                      )}

                      <input
                        type="text"
                        value={item.imagenMobileUrl}
                        onChange={(e) =>
                          updateBannerItem(item.uid, { imagenMobileUrl: e.target.value })
                        }
                        placeholder="URL de imagen móvil opcional (https://...)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Dispositivos para esta pieza */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-400">
                      Dispositivos para este banner ({item.ubicacion}):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: 'desktop', label: 'Desktop', icon: Monitor },
                        { id: 'tablet', label: 'Tablet', icon: Tablet },
                        { id: 'mobile', label: 'Móvil', icon: Smartphone },
                      ].map((devItem) => {
                        const Icon = devItem.icon;
                        const checked = item.dispositivos.includes(devItem.id);
                        const disabledForLateral =
                          (item.ubicacion === 'sidebar-left' ||
                            item.ubicacion === 'sidebar-right') &&
                          devItem.id !== 'desktop';

                        return (
                          <button
                            key={devItem.id}
                            type="button"
                            disabled={disabledForLateral}
                            onClick={() => toggleItemDevice(item.uid, devItem.id)}
                            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                              disabledForLateral
                                ? 'bg-slate-950/30 border-slate-800/50 opacity-40 cursor-not-allowed'
                                : checked
                                ? 'bg-indigo-950/60 border-indigo-500 text-white font-semibold'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{devItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Big "+" Button to Add Another Banner to the Campaign */}
            <button
              type="button"
              onClick={addAnotherBannerItem}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-guinda-500/50 hover:border-guinda-400 bg-guinda-950/20 hover:bg-guinda-950/40 text-rose-200 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-5 h-5 text-rose-400" />
              <span>
                + Añadir otro banner a la campaña (otra posición o rotación en la misma posición)
              </span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Secciones y Vigencia de la Campaña */}
        <div className="space-y-6">
          {/* Vigencia */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>3. Programar Vigencia de la Campaña</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha y Hora de Inicio *
              </label>
              <input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-guinda-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha y Hora de Fin (Opcional)
              </label>
              <input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-guinda-500"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Déjalo en blanco para campaña continua hasta desactivación manual.
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Activar inmediatamente</span>
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Páginas / Secciones */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>4. Páginas / Secciones donde se mostrará</span>
            </h3>

            <div className="space-y-2">
              {AVAILABLE_PAGES.map((pg) => {
                const checked = paginas.includes(pg.id);
                return (
                  <label
                    key={pg.id}
                    onClick={() => togglePage(pg.id)}
                    className={`cursor-pointer px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                      checked
                        ? 'bg-slate-800 border-guinda-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
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

          {/* Resumen de la Carpeta */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 text-xs text-slate-400">
            <p className="font-bold text-slate-200">Resumen de Carpeta a Guardar:</p>
            <p>
              · Campaña: <strong className="text-white">{nombreCampana || '(Sin nombre)'}</strong>
            </p>
            <p>
              · Anunciante: <strong className="text-white">{anunciante || '(Sin anunciante)'}</strong>
            </p>
            <p>
              · Total de banners en lote: <strong className="text-emerald-400">{bannerItems.length}</strong>
            </p>
            <p>
              · Posiciones:{' '}
              <span className="font-mono text-sky-300">
                {bannerItems.map((b) => b.ubicacion).join(', ')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-4 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Se guardarán <strong>{bannerItems.length}</strong> banner(s) dentro de la carpeta{' '}
            <strong className="text-white">{nombreCampana || 'de campaña'}</strong>.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all border border-slate-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>Guardar Campaña Pausada ({bannerItems.length})</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {saving
                  ? 'Guardando campaña...'
                  : `Guardar y Activar Campaña (${bannerItems.length} ${
                      bannerItems.length === 1 ? 'banner' : 'banners'
                    })`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewBannerPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs p-8">Cargando creador de campaña...</div>}>
      <NewBannerForm />
    </Suspense>
  );
}
