'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Zap, ShieldAlert, PlusCircle, CheckCircle2 } from 'lucide-react';

interface DomainHeaderBannerProps {
  domainId: string;
  domainInfo: {
    name: string;
    code: string;
    hostname: string;
  };
  initialAutoPublish: boolean;
}

export default function DomainHeaderBanner({ domainId, domainInfo, initialAutoPublish }: DomainHeaderBannerProps) {
  const [autoPublish, setAutoPublish] = useState(initialAutoPublish);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleAutoPublish = async () => {
    const newValue = !autoPublish;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/admin/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId,
          autoPublishEnabled: newValue,
        }),
      });

      if (res.ok) {
        setAutoPublish(newValue);
        setMessage(`Autopublicación ${newValue ? 'activada' : 'desactivada'} correctamente.`);
      } else {
        const data = await res.json();
        alert(`Error al actualizar autopublicación: ${data.error}`);
      }
    } catch (err) {
      alert('Error al comunicar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Domain Title & Domain Info */}
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">{domainInfo.name}</h1>
            <span className="bg-slate-800 border border-slate-700 text-blue-400 text-xs px-2.5 py-0.5 rounded font-mono">
              {domainId}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-mono">{domainInfo.hostname}</p>
        </div>

        {/* Primary Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* New Article Button */}
          <Link
            href={`/dashboard/${domainId}/articles/new`}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Redactar Noticia</span>
          </Link>

          {/* Public REST API Link */}
          <a
            href={`/api/v1/public/articles?domain=${domainInfo.code}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Ver API REST</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Auto-Publish Toggle Switch Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2.5 rounded-xl mt-0.5 ${autoPublish ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
            {autoPublish ? <Zap className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white">Autopublicación Automática</h4>
              {autoPublish ? (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVA
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                  REVISIÓN MANUAL
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {autoPublish
                ? 'Las noticias generadas automáticamente se asignarán la mejor imagen disponible y se publicarán de inmediato sin requerir aprobación humana.'
                : 'Las noticias generadas permanecerán en estado "Por Revisar" hasta que un miembro del equipo valide el contenido e imagen.'}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          disabled={loading}
          onClick={toggleAutoPublish}
          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            autoPublish ? 'bg-emerald-600' : 'bg-slate-700'
          }`}
        >
          <span className="sr-only">Conmutar Autopublicación</span>
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              autoPublish ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {message && (
        <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-lg">
          {message}
        </div>
      )}
    </div>
  );
}
