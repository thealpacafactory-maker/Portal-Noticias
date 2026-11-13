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

function NewBannerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDomainParam = searchParams.get('dominio') || 'proj_leondelsur';

  // 1. Crear campaña y dominios objetivo
  const [nombreCampana, setNombreCampana] = useState('');
  const [anunciante, setAnunciante] = useState('');
  const [linkDestino, setLinkDestino] = useState('');
  const [notas, setNotas] = useState('');
  const [dominios, setDominios] = useState<string[]>([initialDomainParam]);
  const [availableDomains, setAvailableDomains] = useState<DomainOption[]>([]);

  // 2. Seleccionar ubicación
  const [ubicacion, setUbicacion] = useState('top');

  // 3. Cargar creatividades
  const [imagenUrl, setImagenUrl] = useState('');
  const [imagenMobileUrl, setImagenMobileUrl] = useState('');

  // 4. Elegir dispositivos y páginas
  const [dispositivos, setDispositivos] = useState<string[]>(['desktop', 'tablet', 'mobile']);
  const [paginas, setPaginas] = useState<string[]>(['all']);

  // Reglas de Pop-up (solo cuando ubicacion === 'popup')
  const [popupDelaySec, setPopupDelaySec] = useState(8);
  const [popupScrollPct, setPopupScrollPct] = useState(45);
  const [popupMaxViews, setPopupMaxViews] = useState(1);

  // 5. Programar y Activar
  const [fechaInicio, setFechaInicio] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(true);

  // Upload & Save UI State
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
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
        throw new Error(data.error || 'Error al subir la imagen al bucket banners-images');
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

  const handleSave = async (targetActivo: boolean) => {
    if (!nombreCampana.trim()) {
      setErrorMsg('El nombre de la campaña es obligatorio.');
      return;
    }
    if (!anunciante.trim()) {
      setErrorMsg('El nombre del anunciante es obligatorio.');
      return;
    }
    if (!imagenUrl.trim()) {
      setErrorMsg('La creatividad principal (imagen) del banner es obligatoria.');
      return;
    }
    if (dispositivos.length === 0) {
      setErrorMsg('Debes seleccionar al menos un dispositivo objetivo.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el banner');
      }

      router.push(`/dashboard/banners?status=${targetActivo ? 'ACTIVE' : 'INACTIVE'}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  const previewDesktopUrl = normalizeImageUrl(imagenUrl);
  const previewMobileUrl = normalizeImageUrl(imagenMobileUrl);

  const customDomains = availableDomains.filter(
    (d) =>
      !['dom_8', 'dom_9', 'dom_10', 'dom_11', 'dom_13', 'dom_papa', 'dom_nino'].includes(d.id)
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Top Breadcrumbs */}
      <div className="flex items-center space-x-3 text-xs">
        <Link
          href="/dashboard/banners"
          className="text-slate-400 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Banners Publicitarios</span>
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-semibold">Nueva Campaña</span>
      </div>

      {/* Header Workflow Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="bg-guinda-900/50 text-guinda-300 border border-guinda-700/40 text-xs px-3 py-1 rounded-full font-semibold">
            Flujo Comercial Multi-Dominio · Portal Noticias CMS
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            1. Campaña y Dominio → 2. Ubicación → 3. Creatividades → 4. Dispositivos/Páginas → 5. Programar → 6. Activar
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Crear Nueva Campaña Publicitaria
        </h1>
        <p className="text-xs text-slate-400">
          Configura la campaña para León del Sur o cualquiera de tus dominios, elige el formato responsive, segmenta por dispositivo/sección y actívala con medición GA4/GTM integrada.
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
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* PASO 1: Datos de la Campaña y Dominios */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Megaphone className="w-4 h-4 text-guinda-500" />
              <span>1. Datos de la Campaña, Anunciante y Dominio(s)</span>
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
                  placeholder="Ej: Lanzamiento Residencial Cayma 2026"
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
                  placeholder="Ej: Constructora Sillaris S.A.C."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-guinda-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Enlace de Destino (Se publica con rel=&quot;sponsored&quot;)
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
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Portales / Dominios donde se mostrará la campaña *</span>
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

          {/* PASO 3: Cargar Creatividades */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span>3. Creatividad Principal (Desktop / Tablet) *</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Formatos recomendados: WebP, AVIF, PNG o JPG comprimido.
                </p>
              </div>

              <label className="cursor-pointer inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                {uploadingDesktop ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Subir imagen a Storage</span>
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

            {previewDesktopUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-60 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDesktopUrl}
                    alt={nombreCampana || 'Vista previa banner'}
                    referrerPolicy="no-referrer"
                    className="max-h-52 w-auto object-contain rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setImagenUrl('')}
                  className="text-xs text-rose-400 hover:text-rose-300 underline"
                >
                  Quitar / Cambiar imagen
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-6 text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Sube un archivo al bucket <code className="text-slate-300">banners-images</code> o pega una URL directa / enlace de Google Drive.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                URL de Creatividad Principal (Soporta URL directa o Google Drive):
              </label>
              <input
                type="text"
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Creatividad Móvil */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                    <span>Creatividad Adaptada para Móvil (Opcional — &lt;768px)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Para evitar banners estrechos en móvil, sube una versión horizontal/inline (ej. 320×100px o 300×250px).
                  </p>
                </div>

                <label className="cursor-pointer inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0">
                  {uploadingMobile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      <span>Subir versión móvil</span>
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
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-44 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewMobileUrl}
                      alt="Vista previa móvil"
                      referrerPolicy="no-referrer"
                      className="max-h-36 w-auto object-contain rounded"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagenMobileUrl('')}
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Quitar versión móvil
                  </button>
                </div>
              )}

              <input
                type="text"
                value={imagenMobileUrl}
                onChange={(e) => setImagenMobileUrl(e.target.value)}
                placeholder="URL de imagen móvil opcional (https://...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* PASO 4: Elegir Dispositivos y Páginas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>4. Segmentación por Dispositivos y Páginas</span>
            </h3>

            {/* Dispositivos */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Dispositivos Permitidos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'desktop', label: 'Desktop (PC)', icon: Monitor, desc: '≥ 1024px' },
                  { id: 'tablet', label: 'Tablet', icon: Tablet, desc: '768px – 1023px' },
                  { id: 'mobile', label: 'Móvil', icon: Smartphone, desc: '< 768px' },
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
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400">{item.desc}</div>
                        </div>
                      </div>
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
              {(ubicacion === 'sidebar-left' || ubicacion === 'sidebar-right') && (
                <p className="text-[11px] text-amber-300">
                  Nota responsive: Los rascacielos laterales se muestran exclusivamente en Desktop para no afectar la lectura en móvil/tablet.
                </p>
              )}
            </div>

            {/* Páginas / Secciones */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Páginas / Secciones donde se mostrará
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          </div>
        </div>

        {/* Right 1 Col: Paso 2 (Ubicación + Pop-up Rules) + Paso 5 (Programar) */}
        <div className="space-y-6">
          {/* PASO 2: Ubicación */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <LayoutTemplate className="w-4 h-4 text-amber-400" />
              <span>2. Ubicación en el Portal *</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Formato / Espacio (`ubicacion`)
              </label>
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

            <div className="text-[11px] text-slate-400 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <p className="font-semibold text-slate-300">Comportamiento Responsive & CLS:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><strong>top / bottom / home-middle / in-article:</strong> 970×90 o 728×90 (Móvil: 320×100 inline).</li>
                <li><strong>sidebar / half-page:</strong> 300×250 o 300×600 en Desktop; se adapta inline en Tablet/Móvil.</li>
                <li><strong>sidebar-left / right:</strong> 160×600 fijo en bordes de pantalla ancha.</li>
                <li><strong>popup:</strong> Tarjeta flotante cerrable tras scroll o tiempo.</li>
              </ul>
            </div>
          </div>

          {/* Reglas del Pop-up (Solo si ubicacion === 'popup') */}
          {ubicacion === 'popup' && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-md">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Reglas No Intrusivas del Pop-up</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cumple las directrices de Google evitando intersticiales al entrar: se abre tras cumplir los segundos o el porcentaje de scroll.
              </p>

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
                  O después de X% de scroll (Recomendado: 40–50%)
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
                  Máximo de aperturas por usuario/día
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

          {/* PASO 5: Programación */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>5. Programar Vigencia</span>
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
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-4 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            6. Activar y Medir: Eventos <code className="text-slate-300">ad_impression</code> y <code className="text-slate-300">ad_click</code> activos hacia GTM/GA4.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all border border-slate-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>Guardar Pausado</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar y Activar Campaña'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewBannerPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs p-8">Cargando formulario de campaña...</div>}>
      <NewBannerForm />
    </Suspense>
  );
}
