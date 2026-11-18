const META_PREFIX = "<!--AD_META:";
const META_SUFFIX = "-->";

export interface BannerExtraConfig {
  campana_grupo_id?: string;
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
  campana_grupo_id: string;
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

/**
 * Mapa bidireccional de equivalencias entre ID de dominio y código de portal.
 * Nota importante: `proj_leondelsur` / `leondelsur` es independiente de `dom_3` (Maratón de Arequipa)
 * y `dom_5` (Sillaris Inmobiliario) para que los banners de León del Sur NO se filtren a esas webs
 * a menos que se seleccionen explícitamente.
 */
const DOMAIN_EQUIVALENTS: Record<string, string[]> = {
  proj_leondelsur: [
    "proj_leondelsur",
    "leondelsur",
    "leondelsur.pe",
    "dom_8",
    "dom_9",
    "dom_10",
    "dom_11",
    "dom_13",
    "dom_papa",
    "dom_nino",
  ],
  leondelsur: [
    "proj_leondelsur",
    "leondelsur",
    "leondelsur.pe",
    "dom_8",
    "dom_9",
    "dom_10",
    "dom_11",
    "dom_13",
    "dom_papa",
    "dom_nino",
  ],
  dom_1: ["dom_1", "perurunning", "perurunning.pe"],
  perurunning: ["dom_1", "perurunning", "perurunning.pe"],
  dom_2: ["dom_2", "themerinofactory", "themerinofactory.com"],
  themerinofactory: ["dom_2", "themerinofactory", "themerinofactory.com"],
  dom_3: ["dom_3", "maratondearequipa", "maratondearequipa.pe"],
  maratondearequipa: ["dom_3", "maratondearequipa", "maratondearequipa.pe"],
  dom_4: ["dom_4", "kompressox", "kompressox.com"],
  kompressox: ["dom_4", "kompressox", "kompressox.com"],
  dom_5: ["dom_5", "sillaris", "sillaris.pe"],
  sillaris: ["dom_5", "sillaris", "sillaris.pe"],
  dom_6: ["dom_6", "maratondelima", "maratondelima.com.pe"],
  maratondelima: ["dom_6", "maratondelima", "maratondelima.com.pe"],
  dom_7: ["dom_7", "cinefoniashow", "cinefoniashow.com"],
  cinefoniashow: ["dom_7", "cinefoniashow", "cinefoniashow.com"],
  dom_12: ["dom_12", "mediasperu", "medias-peru.vercel.app"],
  mediasperu: ["dom_12", "mediasperu", "medias-peru.vercel.app"],
  dom_14: ["dom_14", "mediasperu_radar"],
  mediasperu_radar: ["dom_14", "mediasperu_radar"],
};

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

  const parsedDominios =
    Array.isArray(row.dominios) && row.dominios.length > 0
      ? row.dominios
      : Array.isArray(meta.dominios) && meta.dominios.length > 0
      ? meta.dominios
      : ["proj_leondelsur"];

  const defaultGroupKey = `${(row.nombre_campana || "campana")
    .toString()
    .trim()
    .toLowerCase()}__${(row.anunciante || "anunciante").toString().trim().toLowerCase()}`;

  return {
    ...row,
    id: row.id,
    campana_grupo_id:
      row.campana_grupo_id || meta.campana_grupo_id || defaultGroupKey,
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
    impresiones: Math.max(
      Number(row.impresiones) || 0,
      Number(meta.impresiones) || 0
    ),
    clics: Math.max(
      Number(row.clics) || 0,
      Number(meta.clics) || 0
    ),
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
 * Verificación estricta de si un banner está asignado a un dominio o proyecto específico.
 */
export function bannerMatchesDomain(
  banner: ParsedBannerRow,
  domainFilter: string
): boolean {
  if (!domainFilter || domainFilter === "ALL") return true;

  const cleanFilter = domainFilter.trim().toLowerCase();
  const rawTargets = Array.isArray(banner.dominios) ? banner.dominios : ["proj_leondelsur"];
  const normalizedTargets = rawTargets.map((t) => String(t).trim().toLowerCase());

  if (normalizedTargets.includes("all")) return true;

  const filterEquivalents = DOMAIN_EQUIVALENTS[cleanFilter] || [cleanFilter];
  return normalizedTargets.some((target) => filterEquivalents.includes(target));
}
