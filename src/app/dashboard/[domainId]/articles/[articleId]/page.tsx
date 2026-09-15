'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Image as ImageIcon,
  Search,
  Sparkles,
  ShieldAlert,
  ExternalLink,
  Eye,
  Edit3,
  Check,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface ArticleData {
  id: string;
  domainId: string;
  status: string;
  title: string;
  slug: string;
  subheading: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  ogImage: string;
  seoTitle: string;
  metaDescription: string;
  sourceName: string;
  sourceUrl: string;
  createdAt: string;
  publishedAt?: string;
  domain?: {
    name: string;
    code: string;
    hostname: string;
  };
}

// Helper to convert Google Drive share links into high-res direct image URLs using Google's thumbnail proxy
function getDirectImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Match Google Drive file ID from any link pattern
  const driveIdMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/(?:uc\?.*id=|open\?id=|thumbnail\?.*id=)([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

  if (driveIdMatch && driveIdMatch[1]) {
    // sz=w1600 delivers high resolution 1600px image without Referer/CORS blocks
    return `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w1600`;
  }

  return trimmed;
}

// Helper to extract clean search keywords from article titles
function extractSearchKeywords(titleText: string, domainId: string): string {
  if (!titleText) {
    if (domainId === 'dom_2') return 'textile fabric';
    if (domainId === 'dom_4') return 'health sports';
    if (domainId === 'dom_5') return 'real estate architecture';
    if (domainId === 'dom_7') return 'cinema soundtrack';
    return 'running marathon';
  }

  // Remove common stop words and punctuation
  const clean = titleText
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, ' ')
    .toLowerCase();
  
  const words = clean.split(/\s+/).filter((w) => w.length > 3 && !['para', 'como', 'sobre', 'desde', 'este', 'esta', 'estos', 'estas', 'entre', 'hacer', 'tener', 'para'].includes(w));
  
  return words.slice(0, 3).join(' ') || titleText.slice(0, 20);
}

export default function ArticleReviewPage({
  params,
}: {
  params: { domainId: string; articleId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState<ArticleData | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subheading, setSubheading] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Unsplash Gallery State
  const [showUnsplashModal, setShowUnsplashModal] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashPhotos, setUnsplashPhotos] = useState<any[]>([]);

  // UI Active Tab: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    fetchArticle();
  }, [params.articleId]);

  async function fetchArticle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/articles?articleId=${params.articleId}`);
      const json = await res.json();
      if (json.data) {
        const art = json.data;
        setArticle(art);
        setTitle(art.title || '');
        setSubheading(art.subheading || '');
        setSlug(art.slug || '');
        setContent(art.content || '');
        setFeaturedImage(getDirectImageUrl(art.featuredImage || ''));
        setFeaturedImageAlt(art.featuredImageAlt || '');
        setSeoTitle(art.seoTitle || '');
        setMetaDescription(art.metaDescription || '');
        
        const initialKeywords = extractSearchKeywords(art.title || '', params.domainId);
        setUnsplashQuery(initialKeywords);
      }
    } catch (err) {
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  }

  async function searchUnsplash(queryToSearch?: string) {
    const q = (queryToSearch !== undefined ? queryToSearch : unsplashQuery) || extractSearchKeywords(title, params.domainId);
    setUnsplashLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/unsplash?query=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.results && Array.isArray(json.results)) {
        setUnsplashPhotos(json.results);
      }
    } catch (err) {
      console.error('Error searching Unsplash:', err);
    } finally {
      setUnsplashLoading(false);
    }
  }

  function handleOpenUnsplashModal() {
    setShowUnsplashModal(true);
    const initialQuery = unsplashQuery || extractSearchKeywords(title, params.domainId);
    searchUnsplash(initialQuery);
  }

  function handleSelectPhoto(photo: any) {
    const photoUrl = getDirectImageUrl(photo.url || photo.thumb);
    setFeaturedImage(photoUrl);
    setFeaturedImageAlt(photo.alt || title);
    setShowUnsplashModal(false);
  }

  async function updateArticle(newStatus?: string) {
    setSaving(true);
    try {
      const cleanImageUrl = getDirectImageUrl(featuredImage);
      const payload: any = {
        id: params.articleId,
        title,
        subheading,
        slug,
        content,
        featuredImage: cleanImageUrl,
        featuredImageAlt,
        ogImage: cleanImageUrl, // Automatically format Open Graph image
        seoTitle,
        metaDescription,
      };

      if (newStatus) {
        payload.status = newStatus;
      }

      const res = await fetch('/api/v1/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        if (newStatus === 'PUBLISHED') {
          alert('¡Noticia aprobada y publicada exitosamente!');
          router.push(`/dashboard/${params.domainId}?status=PUBLISHED`);
        } else if (newStatus === 'REJECTED') {
          alert('Noticia rechazada.');
          router.push(`/dashboard/${params.domainId}?status=REJECTED`);
        } else {
          alert('Borrador guardado correctamente.');
          fetchArticle();
        }
      } else {
        alert(`Error al actualizar: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm">Cargando borrador de noticia...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Noticia no encontrada</h2>
        <Link href={`/dashboard/${params.domainId}`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          Volver al Workspace
        </Link>
      </div>
    );
  }

  // Compliance Checks
  const isKompressox = params.domainId === 'dom_4';
  const hasMedicalDisclaimer = isKompressox && content.toLowerCase().includes('aviso educativo');

  const isSillaris = params.domainId === 'dom_5';
  const hasPriceDisclaimer = isSillaris && (content.toLowerCase().includes('estimación') || content.toLowerCase().includes('referencial'));

  const displayImageUrl = getDirectImageUrl(featuredImage);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 text-xs">
            <Link href={`/dashboard/${params.domainId}`} className="text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a {article.domain?.name || params.domainId}</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 font-mono">{params.articleId}</span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Revisión Editorial</h1>

            {article.status === 'IN_REVIEW' && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" /> En Revisión Editorial
              </span>
            )}
            {article.status === 'PUBLISHED' && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Publicada en Web
              </span>
            )}
            {article.status === 'REJECTED' && (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Rechazada
              </span>
            )}
          </div>
        </div>

        {/* Top Floating Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => updateArticle()}
            disabled={saving}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-blue-400" />
            <span>Guardar Cambios</span>
          </button>

          <button
            onClick={() => updateArticle('REJECTED')}
            disabled={saving}
            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Rechazar</span>
          </button>

          <button
            onClick={() => updateArticle('PUBLISHED')}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publicar Noticia</span>
          </button>
        </div>
      </div>

      {/* Compliance Warnings (if domain has specific rules) */}
      {isKompressox && !hasMedicalDisclaimer && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Aviso de Cumplimiento Médico (Kompressox):</p>
            <p>Se recomienda incluir un aviso educativo al final del artículo recomendando consultar a un especialista en salud vascular.</p>
          </div>
        </div>
      )}

      {/* View Tabs: Edit Form vs Live Preview */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'edit'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Editor de Noticia</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Vista Previa en Vivo</span>
        </button>
      </div>

      {/* TAB 1: EDIT FORM */}
      {activeTab === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Título del Artículo
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                placeholder="Título periodístico..."
              />
            </div>

            {/* Subheading */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Subtítulo / Copete
              </label>
              <textarea
                value={subheading}
                rows={2}
                onChange={(e) => setSubheading(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm focus:outline-none focus:border-blue-500 leading-relaxed"
                placeholder="Resumen o copete explicativo..."
              />
            </div>

            {/* Featured Image & Unsplash Gallery Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Imagen Destacada & OpenGraph (16:9)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selecciona una foto real de alta resolución en Unsplash o pega un enlace (soporta enlaces directos y de Google Drive).
                  </p>
                </div>

                <button
                  onClick={handleOpenUnsplashModal}
                  type="button"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Elegir Foto en Unsplash</span>
                </button>
              </div>

              {displayImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group aspect-video">
                  <img
                    src={displayImageUrl}
                    alt={featuredImageAlt || title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                    <button
                      onClick={handleOpenUnsplashModal}
                      type="button"
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      Cambiar Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs">No hay imagen asociada a esta noticia.</p>
                  <button
                    onClick={handleOpenUnsplashModal}
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-block"
                  >
                    Buscar en Unsplash
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">URL de Imagen (Soporta Google Drive)</label>
                  <input
                    type="text"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(getDirectImageUrl(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
                    placeholder="https://images.unsplash.com/... o https://drive.google.com/..."
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Texto ALT (SEO & Accesibilidad)</label>
                  <input
                    type="text"
                    value={featuredImageAlt}
                    onChange={(e) => setFeaturedImageAlt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300"
                    placeholder="Descripción de la imagen..."
                  />
                </div>
              </div>
            </div>

            {/* HTML Article Content */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Contenido HTML de la Noticia (+400 palabras)
                </label>
                <span className="text-xs text-slate-500 font-mono">Formato: HTML (h2, h3, p, ul, blockquote)</span>
              </div>
              <textarea
                value={content}
                rows={16}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Sidebar Metadata (Right 1 col) */}
          <div className="space-y-6">
            {/* SEO Metadata Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                Configuración SEO para Google
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Slug de la URL</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Título SEO (Máx 60 caracteres)</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Meta Descripción (Máx 155 caracteres)</label>
                <textarea
                  value={metaDescription}
                  rows={3}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300"
                />
              </div>
            </div>

            {/* Source Reference Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                Información de la Fuente Original
              </h3>
              <p className="text-xs text-slate-400">
                <strong>Fuente:</strong> {article.sourceName || 'RSS Externe'}
              </p>
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 truncate block"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{article.sourceUrl}</span>
                </a>
              )}
            </div>

            {/* Action Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-white">Decisión Editorial</h3>
              <button
                onClick={() => updateArticle('PUBLISHED')}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Publicar Noticia</span>
              </button>
              <button
                onClick={() => updateArticle('REJECTED')}
                disabled={saving}
                className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Rechazar Noticia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-2">
              Vista Previa en Vivo — {article.domain?.name || 'Sitio Web'}
            </span>
            <h1 className="text-3xl font-extrabold text-white leading-tight">{title}</h1>
            {subheading && (
              <p className="text-lg text-slate-300 mt-3 font-normal leading-relaxed">{subheading}</p>
            )}
          </div>

          {displayImageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-800 aspect-video">
              <img
                src={displayImageUrl}
                alt={featuredImageAlt || title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* HTML Render */}
          <div
            className="prose-preview text-slate-200 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}

      {/* UNSPLASH GALLERY MODAL */}
      {showUnsplashModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Galería de Imágenes (Unsplash)</h3>
                <p className="text-xs text-slate-400">Selecciona la mejor foto para el artículo</p>
              </div>
              <button
                onClick={() => setShowUnsplashModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUnsplash(unsplashQuery)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Buscar palabras clave en Unsplash..."
                />
              </div>
              <button
                onClick={() => searchUnsplash(unsplashQuery)}
                disabled={unsplashLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                Buscar
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="p-6 overflow-y-auto flex-1">
              {unsplashLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-400">Buscando fotografías en alta resolución...</p>
                </div>
              ) : unsplashPhotos.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Haz clic en buscar para cargar fotos de Unsplash.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {unsplashPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => handleSelectPhoto(photo)}
                      className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video cursor-pointer hover:border-blue-500 transition-all hover:scale-[1.02] shadow-md"
                    >
                      <img
                        src={getDirectImageUrl(photo.thumb || photo.url)}
                        alt={photo.alt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        <p className="text-xs text-white font-semibold truncate">{photo.alt || 'Seleccionar foto'}</p>
                        <p className="text-[10px] text-slate-300">Foto por: {photo.photographer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
