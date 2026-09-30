'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, ArrowRight, FolderKanban, Globe, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';

interface Domain {
  id: string;
  code: string;
  hostname: string;
  name: string;
  description?: string;
  autoPublishEnabled?: boolean;
  defaultImage?: string;
  projectId?: string | null;
}

interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ArticleCounts {
  inReview: number;
  published: number;
  rejected: number;
  total: number;
}

interface Props {
  initialDomains: Domain[];
  initialProjects: Project[];
  counts: Record<string, ArticleCounts>;
}

const CARD_COLORS = [
  'from-amber-500 to-orange-600',
  'from-blue-600 to-cyan-600',
  'from-red-600 to-rose-700',
  'from-emerald-600 to-teal-600',
  'from-indigo-600 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-violet-600 to-fuchsia-600',
  'from-emerald-500 to-green-600',
];

export default function ProjectDomainGroupView({ initialDomains, initialProjects, counts }: Props) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [updatingDomainId, setUpdatingDomainId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  // Hardcode default project "León del Sur" if not present in DB list yet
  const projectsList = initialProjects.length > 0 ? initialProjects : [
    { id: 'proj_leondelsur', code: 'leondelsur', name: 'León del Sur', description: 'Proyecto Portal Noticias León del Sur y subdominios' }
  ];

  const toggleCollapse = (groupId: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleAssignProject = async (domainId: string, targetProjectId: string | null) => {
    setUpdatingDomainId(domainId);
    try {
      const res = await fetch('/api/v1/admin/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId,
          projectId: targetProjectId,
        }),
      });

      if (res.ok) {
        setDomains((prev) =>
          prev.map((d) => (d.id === domainId ? { ...d, projectId: targetProjectId } : d))
        );
      } else {
        alert('Error al actualizar el proyecto del dominio.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al actualizar proyecto.');
    } finally {
      setUpdatingDomainId(null);
    }
  };

  // Group domains by projectId
  const projectGroups: { project: Project | null; domains: Domain[] }[] = [];

  // 1. Projects with domains
  projectsList.forEach((proj) => {
    const projDomains = domains.filter((d) => d.projectId === proj.id);
    projectGroups.push({
      project: proj,
      domains: projDomains,
    });
  });

  // 2. Unassigned domains
  const unassignedDomains = domains.filter(
    (d) => !d.projectId || !projectsList.some((p) => p.id === d.projectId)
  );

  if (unassignedDomains.length > 0) {
    projectGroups.push({
      project: null,
      domains: unassignedDomains,
    });
  }

  // Calculate global pending
  const totalPending = Object.values(counts).reduce((acc, curr) => acc + curr.inReview, 0);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Jerarquía de Proyectos y Subdominios</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Gestión Editorial Multi-Proyecto ({domains.length} Dominios en {projectsList.length} Proyecto/s)
          </h1>
          <p className="text-slate-400 max-w-3xl text-sm leading-relaxed">
            Organiza tus subdominios dentro de proyectos como <strong>León del Sur</strong>. Puedes replegar o expandir las secciones de cada proyecto para mantener tu panel limpio y ordenado.
          </p>
        </div>

        {/* Global Pending Notification Pill */}
        {totalPending > 0 ? (
          <div className="mt-6 inline-flex items-center space-x-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-sm font-semibold animate-pulse">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Tienes <strong>{totalPending}</strong> noticia(s) pendientes de revisión editorial en el sistema.</span>
          </div>
        ) : (
          <div className="mt-6 inline-flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Todas las noticias están al día. No hay pendientes.</span>
          </div>
        )}
      </div>

      {/* Project Filter Toolbar */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-4 overflow-x-auto">
        <button
          onClick={() => setFilterProject('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            filterProject === 'ALL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Todos los Proyectos ({domains.length})
        </button>
        {projectsList.map((proj) => {
          const pDomainCount = domains.filter((d) => d.projectId === proj.id).length;
          return (
            <button
              key={proj.id}
              onClick={() => setFilterProject(proj.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filterProject === proj.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <span>{proj.name}</span>
              <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {pDomainCount}
              </span>
            </button>
          );
        })}
        {unassignedDomains.length > 0 && (
          <button
            onClick={() => setFilterProject('UNASSIGNED')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              filterProject === 'UNASSIGNED'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Dominios Independientes ({unassignedDomains.length})
          </button>
        )}
      </div>

      {/* Project Sections */}
      <div className="space-y-6">
        {projectGroups
          .filter((group) => {
            if (filterProject === 'ALL') return true;
            if (filterProject === 'UNASSIGNED') return group.project === null;
            return group.project?.id === filterProject;
          })
          .map((group, groupIndex) => {
            const isProject = group.project !== null;
            const groupId = isProject ? group.project!.id : 'unassigned_group';
            const isCollapsed = !!collapsedProjects[groupId];

            const projectTitle = isProject ? group.project!.name : 'Dominios Independientes';
            const projectDesc = isProject
              ? group.project!.description || 'Agrupación de subdominios para noticias consolidadas'
              : 'Dominios que no forman parte de una red multi-portal específica';

            // Aggregate metrics for project
            let projPending = 0;
            let projPublished = 0;
            group.domains.forEach((d) => {
              const st = counts[d.id] || { inReview: 0, published: 0, rejected: 0, total: 0 };
              projPending += st.inReview;
              projPublished += st.published;
            });

            return (
              <div
                key={groupId}
                className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 transition-all shadow-lg space-y-6"
              >
                {/* Section Header */}
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isCollapsed ? '' : 'border-b border-slate-800 pb-5'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        isProject
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isProject ? `Proyecto (${group.project!.code})` : 'Sin Proyecto'}
                      </span>
                      {isProject && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                          Multi-API Activa: ?project={group.project!.code}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      {isProject ? <FolderKanban className="w-6 h-6 text-indigo-400" /> : <Globe className="w-6 h-6 text-slate-400" />}
                      {projectTitle}
                    </h2>
                    <p className="text-slate-400 text-xs">{projectDesc}</p>
                  </div>

                  {/* Aggregate project metrics & Collapse button */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
                      <div>
                        <p className="text-slate-500">Subdominios</p>
                        <p className="text-sm font-bold text-white">{group.domains.length}</p>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <p className="text-slate-500">Publicadas</p>
                        <p className="text-sm font-bold text-emerald-400">{projPublished}</p>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <p className="text-slate-500">Pendientes</p>
                        <p className={`text-sm font-bold ${projPending > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {projPending}
                        </p>
                      </div>
                    </div>

                    {/* Collapse / Expand Toggle Button */}
                    <button
                      onClick={() => toggleCollapse(groupId)}
                      title={isCollapsed ? 'Expandir sección de proyecto' : 'Reducir / Plegar sección'}
                      className={`inline-flex items-center space-x-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl border transition-all ${
                        isCollapsed
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {isCollapsed ? (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Expandir</span>
                        </>
                      ) : (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>Reducir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsed Summary Bar */}
                {isCollapsed && (
                  <div
                    onClick={() => toggleCollapse(groupId)}
                    className="cursor-pointer bg-slate-900/60 hover:bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-400 transition-all"
                  >
                    <span>Sección plegada ({group.domains.length} subdominio/s oculto/s). Haz clic aquí o en &quot;Expandir&quot; para mostrar.</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                )}

                {/* Domains Grid inside Project (only rendered when NOT collapsed) */}
                {!isCollapsed && (
                  <>
                    {group.domains.length === 0 ? (
                      <div className="text-center py-8 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl space-y-2">
                        <p className="text-slate-400 text-sm font-medium">No hay subdominios asignados a este proyecto aún.</p>
                        <p className="text-slate-500 text-xs">Usa el selector en las tarjetas de abajo para asignar subdominios a {projectTitle}.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {group.domains.map((domain, index) => {
                          const stats = counts[domain.id] || { inReview: 0, published: 0, rejected: 0, total: 0 };
                          const hasPending = stats.inReview > 0;
                          const colorClass = CARD_COLORS[(groupIndex + index) % CARD_COLORS.length];

                          return (
                            <div
                              key={domain.id}
                              className={`bg-slate-900 border ${
                                hasPending ? 'border-amber-500/40 shadow-amber-950/20' : 'border-slate-800'
                              } rounded-2xl p-6 transition-all hover:border-slate-700 hover:shadow-2xl flex flex-col justify-between group relative overflow-hidden`}
                            >
                              <div className={`h-1.5 w-full bg-gradient-to-r ${colorClass} absolute top-0 left-0 right-0`} />

                              <div className="space-y-4 pt-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                                      {domain.description || domain.code}
                                    </span>
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                      {domain.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{domain.hostname}</p>
                                  </div>

                                  {hasPending && (
                                    <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow">
                                      <Clock className="w-3 h-3" />
                                      {stats.inReview}
                                    </span>
                                  )}
                                </div>

                                {/* Counters Grid */}
                                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
                                  <div className="space-y-0.5">
                                    <p className="text-xs text-slate-400">Por Revisar</p>
                                    <p className={`text-base font-bold ${stats.inReview > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                                      {stats.inReview}
                                    </p>
                                  </div>
                                  <div className="space-y-0.5 border-x border-slate-800">
                                    <p className="text-xs text-slate-400">Publicadas</p>
                                    <p className="text-base font-bold text-emerald-400">{stats.published}</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-xs text-slate-400">Rechazadas</p>
                                    <p className="text-base font-bold text-rose-400">{stats.rejected}</p>
                                  </div>
                                </div>

                                {/* Project Assignment Dropdown */}
                                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                                  <span className="text-slate-400 font-medium">Asignar a Proyecto:</span>
                                  <div className="relative">
                                    <select
                                      disabled={updatingDomainId === domain.id}
                                      value={domain.projectId || ''}
                                      onChange={(e) => handleAssignProject(domain.id, e.target.value || null)}
                                      className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                                    >
                                      <option value="">Independiente (Sin Proyecto)</option>
                                      {projectsList.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Action Link */}
                              <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-xs font-mono text-slate-500 uppercase">{domain.id}</span>
                                <Link
                                  href={`/dashboard/${domain.id}`}
                                  className={`inline-flex items-center space-x-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                                    hasPending
                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                                  }`}
                                >
                                  <span>Entrar al Panel</span>
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
