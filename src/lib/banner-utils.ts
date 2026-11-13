const META_PREFIX = "<!--AD_META:";
const META_SUFFIX = "-->";

export interface BannerExtraConfig {
  dispositivos?: string[];
  paginas?: string[];
  dominios?: string[];
  popup_delay_sec?: number;
  popup_scroll_pct?: number;
  popup_max_views?: number;
  impresiones?: number;
  clics?: number;
}

export interface ParsedBannerRow {
  id: string;
  nombre_campana: string;
  anunciante: string;
  ubicacion: string;
  imagen_url: string;
  imagen_mobile_url: string | null;
  link_destino: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
  notas: string;
  dispositivos: string[];
  paginas: string[];
  dominios: string[];
  popup_delay_sec: number;
  popup_scroll_pct: number;
  popup_max_views: number;
  impresiones: number;
  clics: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export function normalizeDestinationUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  let trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Corregir duplicados comunes como "https://https://..." o "https:://..."
  trimmed = trimmed.replace(/^(https?:\/{1,2})+(https?:\/{1,2})/i, "$2");
  trimmed = trimmed.replace(/^https?:\/\/+/i, (match) =>
    match.toLowerCase().startsWith("https") ? "https://" : "http://"
  );

  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    /^(mailto:|tel:)/i.test(trimmed)
  ) {
    return trimmed;
  }

  return `https://${trimmed.replace(/^\/+/, "")}`;
}

/**
 * Extracts extended config from `notas` if the database doesn't have the new columns yet,
 * and merges with native columns when present.
 */
export function parseBannerRow(row: Record<string, any>): ParsedBannerRow {
  let cleanNotas = row.notas || "";
  let meta: BannerExtraConfig = {};

  if (typeof cleanNotas === "string" && cleanNotas.startsWith(META_PREFIX)) {
    const endIdx = cleanNotas.indexOf(META_SUFFIX);
    if (endIdx !== -1) {
      const jsonStr = cleanNotas.slice(META_PREFIX.length, endIdx);
      cleanNotas = cleanNotas.slice(endIdx + META_SUFFIX.length).trim();
      try {
        meta = JSON.parse(jsonStr);
      } catch {
        // ignore invalid json
      }
    }
  }

  const parsedDominios = Array.isArray(row.dominios)
    ? row.dominios
    : Array.isArray(meta.dominios) && meta.dominios.length > 0
    ? meta.dominios
    : ["proj_leondelsur"];

  return {
    ...row,
    id: row.id,
    nombre_campana: row.nombre_campana || "",
    anunciante: row.anunciante || "",
    ubicacion: row.ubicacion || "top",
    imagen_url: row.imagen_url || "",
    imagen_mobile_url: row.imagen_mobile_url || null,
    link_destino: normalizeDestinationUrl(row.link_destino),
    fecha_inicio: row.fecha_inicio || null,
    fecha_fin: row.fecha_fin || null,
    activo: Boolean(row.activo),
    notas: cleanNotas,
    dispositivos: Array.isArray(row.dispositivos)
      ? row.dispositivos
      : meta.dispositivos || ["desktop", "tablet", "mobile"],
    paginas: Array.isArray(row.paginas)
      ? row.paginas
      : meta.paginas || ["all"],
    dominios: parsedDominios,
    popup_delay_sec:
      typeof row.popup_delay_sec === "number"
        ? row.popup_delay_sec
        : meta.popup_delay_sec ?? 8,
    popup_scroll_pct:
      typeof row.popup_scroll_pct === "number"
        ? row.popup_scroll_pct
        : meta.popup_scroll_pct ?? 45,
    popup_max_views:
      typeof row.popup_max_views === "number"
        ? row.popup_max_views
        : meta.popup_max_views ?? 1,
    impresiones:
      typeof row.impresiones === "number"
        ? row.impresiones
        : meta.impresiones ?? 0,
    clics:
      typeof row.clics === "number"
        ? row.clics
        : meta.clics ?? 0,
  };
}

export function serializeBannerNotes(
  userNotes: string | null | undefined,
  meta: BannerExtraConfig
): string {
  const clean = (userNotes || "").replace(/<!--AD_META:[\s\S]*?-->/g, "").trim();
  return `${META_PREFIX}${JSON.stringify(meta)}${META_SUFFIX}${clean ? `\n${clean}` : ""}`;
}

/**
 * Checks if a banner matches a given domain/project filter.
 */
export function bannerMatchesDomain(
  banner: ParsedBannerRow,
  domainFilter: string,
  leonDelSurDomainIds: string[] = [
    "dom_3",
    "dom_5",
    "dom_8",
    "dom_9",
    "dom_10",
    "dom_11",
    "dom_13",
    "dom_papa",
    "dom_nino",
  ]
): boolean {
  if (!domainFilter || domainFilter === "ALL") return true;
  const targets = Array.isArray(banner.dominios) ? banner.dominios : ["proj_leondelsur"];
  if (targets.includes("all")) return true;

  if (domainFilter === "proj_leondelsur" || domainFilter === "leondelsur") {
    return (
      targets.includes("proj_leondelsur") ||
      targets.includes("leondelsur") ||
      targets.some((t) => leonDelSurDomainIds.includes(t))
    );
  }

  // If filtering by a specific domain ID that belongs to León del Sur, match if banner targets proj_leondelsur or that specific domain
  if (leonDelSurDomainIds.includes(domainFilter) && targets.includes("proj_leondelsur")) {
    return true;
  }

  return targets.includes(domainFilter);
}
