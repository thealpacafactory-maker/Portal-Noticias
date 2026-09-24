'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Send,
  Globe,
  Image as ImageIcon,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Tag,
  Clock,
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

const DOMAINS_MAP: Record<string, { name: string; code: string; hostname: string }> = {
  dom_1: { name: 'Perú Running', code: 'perurunning', hostname: 'perurunning.pe' },
  dom_2: { name: 'The Merino Factory', code: 'themerinofactory', hostname: 'themerinofactory.com' },
  dom_3: { name: 'Maratón de Arequipa', code: 'maratondearequipa', hostname: 'maratondearequipa.pe' },
  dom_4: { name: 'Kompressox Health', code: 'kompressox', hostname: 'kompressox.com' },
  dom_5: { name: 'Sillaris Inmobiliario', code: 'sillaris', hostname: 'sillaris.pe' },
  dom_6: { name: 'Maratón de Lima', code: 'maratondelima', hostname: 'maratondelima.com.pe' },
  dom_7: { name: 'Cinefonía Show', code: 'cinefoniashow', hostname: 'cinefoniashow.com' },
};

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
  alt_description: string;
  user: { name: string };
}

export default function NewArticlePage({ params }: { params: { domainId: string } }) {
  const router = useRouter();
  const domainInfo = DOMAINS_MAP[params.domainId] || { name: 'Portal Noticias', code: 'portal', hostname: 'portal.com' };

  // Form State
  const [title, setTitle] = useState('');
  const [subheading, setSubheading] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [countryRegion, setCountryRegion] = useState('Mundo');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Categories list
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // Unsplash modal
  const [showUnsplashModal, setShowUnsplashModal] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);

  // Status & UI State
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fill SEO Title & Meta Description on Title change
  useEffect(() => {
    if (!seoTitle) {
      setSeoTitle(title);
    }
  }, [title, seoTitle]);

  useEffect(() => {
    if (!metaDescription) {
      setMetaDescription(subheading);
    }
  }, [subheading, metaDescription]);

  // Fetch Categories for this domain
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`/api/v1/public/articles?domain=${domainInfo.code}`);
        if (res.ok) {
          const data = await res.json();
          // Fallback categories if none found
          setCategories([
            { id: `cat_${params.domainId}_noticias`, name: 'Noticias General' },
            { id: `cat_${params.domainId}_destacados`, name: 'Destacados' },
            { id: `cat_${params.domainId}_eventos`, name: 'Eventos y Guías' },
          ]);
        }
      } catch (err) {
        // Defaults
        setCategories([
          { id: `cat_${params.domainId}_general`, name: 'General' },
        ]);
      }
    }
    loadCategories();
  }, [params.domainId, domainInfo.code]);

  // Search Unsplash
  const searchUnsplash = async () => {
    if (!unsplashQuery.trim()) return;
    setSearchingUnsplash(true);
    try {
      const res = await fetch(`/api/v1/admin/unsplash?query=${encodeURIComponent(unsplashQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setUnsplashResults(data.results || []);
      }
    } catch (err) {
      console.error('Error searching Unsplash:', err);
    } finally {
      setSearchingUnsplash(false);
    }
  };

  const selectUnsplashPhoto = (photo: UnsplashPhoto) => {
    setFeaturedImage(photo.urls.regular);
    setFeaturedImageAlt(photo.alt_description || title);
    setShowUnsplashModal(false);
  };

  // Submit Handler
  const handleSave = async (targetStatus: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED') => {
    if (!title.trim()) {
      setErrorMsg('El título de la noticia es obligatorio.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('El cuerpo de la noticia no puede estar vacío.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        domainId: params.domainId,
        title,
        subheading,
        content,
        excerpt: subheading || title,
        featuredImage,
        featuredImageAlt,
        categoryId: categoryId || categories[0]?.id || `cat_${params.domainId}_general`,
        countryRegion,
        sourceName,
        sourceUrl,
        status: targetStatus,
        seoTitle: seoTitle || title,
        metaDescription: metaDescription || subheading,
      };

      const res = await fetch('/api/v1/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la noticia');
      }

      // Redirect to domain workspace
      router.push(`/dashboard/${params.domainId}?status=${targetStatus}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  // Word count & read time calculation
  const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Breadcrumbs */}
      <div className="flex items-center space-x-3 text-sm">
        <Link href={`/dashboard/${params.domainId}`} className="text-slate-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a {domainInfo.name}</span>
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-semibold">Redactar Nueva Noticia</span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full font-semibold">
            Portal: {domainInfo.name}
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">Redactar Noticia desde Cero</h1>
          <p className="text-sm text-slate-400 mt-1">
            Escribe el contenido de forma sencilla. El editor formateará automáticamente la estructura web en segundo plano.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800 font-mono">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>~{estimatedReadTime} min lectura ({wordCount} palabras)</span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Title, Subtitle, Content Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Subheading */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Título Principal de la Noticia *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ejemplo: Gran Maratón de Lima 2026: Inscripciones abiertas y nuevo recorrido"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Bajada / Subtítulo (Resumen informativo)
              </label>
              <textarea
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                rows={2}
                placeholder="Un breve resumen que enganche al lector y explique de qué trata el artículo..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Visual WYSIWYG Content Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Cuerpo del Artículo *
              </label>
              <span className="text-xs text-slate-500">Editor Visual (Sin código)</span>
            </div>

            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Empieza a escribir el contenido de la noticia. Utiliza los botones de la barra superior para agregar títulos H2, H3, negritas, listas o enlaces."
            />
          </div>

          {/* SEO Accordion */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Optimización SEO y Redes Sociales</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Título SEO (Google)</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Meta Descripción SEO</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Metadata & Featured Image Picker */}
        <div className="space-y-6">
          {/* Featured Image Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Imagen Destacada</span>
            </h3>

            {featuredImage ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featuredImage} alt={featuredImageAlt || title} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="text-xs text-rose-400 hover:text-rose-300 underline"
                >
                  Cambiar / Quitar imagen
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 border border-dashed border-slate-800 rounded-xl p-6 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Selecciona una foto en alta resolución para la portada de la noticia.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUnsplashQuery(title || domainInfo.name);
                    setShowUnsplashModal(true);
                  }}
                  className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar en Unsplash</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">O ingresa una URL directa de imagen:</label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Article Classification */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Tag className="w-4 h-4 text-sky-400" />
              <span>Clasificación</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoría del Portal</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Región / Cobertura</label>
              <select
                value={countryRegion}
                onChange={(e) => setCountryRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Mundo">Mundo (Global)</option>
                <option value="Perú">Perú (Nacional)</option>
                <option value="Arequipa">Arequipa (Local)</option>
                <option value="Lima">Lima (Local)</option>
                <option value="Internacional">Internacional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre de la Fuente (Opcional)</label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Ejemplo: Nota de prensa oficial"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-4 z-40">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Los redactores no necesitan conocer HTML. Todo se formatea automáticamente.</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Draft */}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('DRAFT')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-sm transition-all border border-slate-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>Guardar Borrador</span>
            </button>

            {/* In Review */}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('IN_REVIEW')}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a Revisión</span>
            </button>

            {/* Publish Immediately */}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('PUBLISHED')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publicar de Inmediato</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unsplash Search Modal */}
      {showUnsplashModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                <span>Buscar Imagen en Unsplash</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUnsplashModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={unsplashQuery}
                onChange={(e) => setUnsplashQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                placeholder="Buscar por palabra clave (ejemplo: marathon, runner, health)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={searchUnsplash}
                disabled={searchingUnsplash}
                className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                {searchingUnsplash ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {/* Results Grid */}
            <div className="max-h-80 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
              {unsplashResults.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => selectUnsplashPhoto(photo)}
                  className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 hover:border-purple-500 transition-all focus:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.urls.small}
                    alt={photo.alt_description || 'Unsplash photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                    Seleccionar Foto
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
