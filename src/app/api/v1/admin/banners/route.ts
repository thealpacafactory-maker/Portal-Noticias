import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { normalizeImageUrl } from '@/lib/image-url-helper';
import {
  bannerMatchesDomain,
  normalizeDestinationUrl,
  parseBannerRow,
  serializeBannerNotes,
} from '@/lib/banner-utils';

export const revalidate = 0;

async function insertSingleBannerRecord(item: {
  campana_grupo_id: string;
  nombre_campana: string;
  anunciante: string;
  ubicacion: string;
  imagen_url: string;
  imagen_mobile_url?: string | null;
  link_destino?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  activo?: boolean;
  notas?: string | null;
  dispositivos?: string[];
  paginas?: string[];
  dominios?: string[];
  popup_delay_sec?: number;
  popup_scroll_pct?: number;
  popup_max_views?: number;
}) {
  const bannerId = `ban_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();

  const safeDispositivos =
    Array.isArray(item.dispositivos) && item.dispositivos.length > 0
      ? item.dispositivos
      : ['desktop', 'tablet', 'mobile'];
  const safePaginas =
    Array.isArray(item.paginas) && item.paginas.length > 0 ? item.paginas : ['all'];
  const safeDominios =
    Array.isArray(item.dominios) && item.dominios.length > 0
      ? item.dominios
      : ['proj_leondelsur'];
  const safeDelay = Number.isFinite(Number(item.popup_delay_sec))
    ? Number(item.popup_delay_sec)
    : 8;
  const safeScroll = Number.isFinite(Number(item.popup_scroll_pct))
    ? Number(item.popup_scroll_pct)
    : 45;
  const safeMaxViews = Number.isFinite(Number(item.popup_max_views))
    ? Number(item.popup_max_views)
    : 1;

  const encodedNotes = serializeBannerNotes(item.notas, {
    campana_grupo_id: item.campana_grupo_id,
    dispositivos: safeDispositivos,
    paginas: safePaginas,
    dominios: safeDominios,
    popup_delay_sec: safeDelay,
    popup_scroll_pct: safeScroll,
    popup_max_views: safeMaxViews,
    impresiones: 0,
    clics: 0,
  });

  const baseRecord = {
    id: bannerId,
    nombre_campana: String(item.nombre_campana).trim(),
    anunciante: String(item.anunciante).trim(),
    ubicacion: String(item.ubicacion).trim(),
    imagen_url: normalizeImageUrl(String(item.imagen_url)),
    imagen_mobile_url: item.imagen_mobile_url
      ? normalizeImageUrl(String(item.imagen_mobile_url))
      : null,
    link_destino: normalizeDestinationUrl(
      item.link_destino ? String(item.link_destino) : null
    ),
    fecha_inicio: item.fecha_inicio
      ? new Date(item.fecha_inicio).toISOString()
      : nowIso,
    fecha_fin: item.fecha_fin ? new Date(item.fecha_fin).toISOString() : null,
    activo: typeof item.activo === 'boolean' ? item.activo : true,
    notas: encodedNotes,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const extendedRecord = {
    ...baseRecord,
    dispositivos: safeDispositivos,
    paginas: safePaginas,
    dominios: safeDominios,
    popup_delay_sec: safeDelay,
    popup_scroll_pct: safeScroll,
    popup_max_views: safeMaxViews,
    impresiones: 0,
    clics: 0,
  };

  let { data: createdBanner, error: insertError } = await supabaseServer
    .from('banners')
    .insert(extendedRecord)
    .select()
    .single();

  if (insertError) {
    const retry = await supabaseServer
      .from('banners')
      .insert(baseRecord)
      .select()
      .single();
    createdBanner = retry.data;
    insertError = retry.error;
  }

  if (insertError || !createdBanner) {
    throw new Error(insertError?.message || 'Error al guardar el banner');
  }

  return parseBannerRow(createdBanner);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bannerId = searchParams.get('bannerId');
  const status = searchParams.get('status');
  const ubicacion = searchParams.get('ubicacion');
  const dominio = searchParams.get('dominio') || 'ALL';

  try {
    // 1. Fetch Single Banner Detail
    if (bannerId) {
      const { data: banner, error } = await supabaseServer
        .from('banners')
        .select('*')
        .eq('id', bannerId)
        .single();

      if (error || !banner) {
        return NextResponse.json({ error: 'Banner no encontrado' }, { status: 404 });
      }

      return NextResponse.json({ data: parseBannerRow(banner) });
    }

    // 2. Fetch Banners List
    let query = supabaseServer
      .from('banners')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status === 'ACTIVE') {
      query = query.eq('activo', true);
    } else if (status === 'INACTIVE') {
      query = query.eq('activo', false);
    }

    if (ubicacion && ubicacion !== 'ALL') {
      query = query.eq('ubicacion', ubicacion);
    }

    const { data: banners, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const parsedList = (banners || [])
      .map(parseBannerRow)
      .filter((b) => bannerMatchesDomain(b, dominio));

    return NextResponse.json({ data: parsedList, total: parsedList.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSession() || {
      id: 'user_leonardo',
      name: 'Leonardo Ramirez',
      email: 'leonardo@andina.com',
      role: 'ADMIN',
    };

    const body = await request.json();
    const {
      campana_grupo_id,
      nombre_campana,
      anunciante,
      ubicacion,
      imagen_url,
      imagen_mobile_url,
      link_destino,
      fecha_inicio,
      fecha_fin,
      activo,
      notas,
      dispositivos,
      paginas,
      dominios,
      popup_delay_sec,
      popup_scroll_pct,
      popup_max_views,
      banners_list,
    } = body;

    const groupId =
      campana_grupo_id ||
      `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Modo 1: Creación de Campaña Completa (Múltiples banners de golpe)
    if (Array.isArray(banners_list) && banners_list.length > 0) {
      if (!nombre_campana || !anunciante) {
        return NextResponse.json(
          { error: 'El nombre de la campaña y el anunciante son obligatorios' },
          { status: 400 }
        );
      }

      const createdItems = [];
      for (const item of banners_list) {
        if (!item.ubicacion || !item.imagen_url) {
          return NextResponse.json(
            { error: 'Cada banner de la campaña debe tener ubicación e imagen principal' },
            { status: 400 }
          );
        }

        const created = await insertSingleBannerRecord({
          campana_grupo_id: groupId,
          nombre_campana,
          anunciante,
          ubicacion: item.ubicacion,
          imagen_url: item.imagen_url,
          imagen_mobile_url: item.imagen_mobile_url || null,
          link_destino:
            item.link_destino && String(item.link_destino).trim()
              ? item.link_destino
              : link_destino,
          fecha_inicio,
          fecha_fin,
          activo,
          notas: item.notas || notas,
          dispositivos: item.dispositivos || dispositivos,
          paginas: item.paginas || paginas,
          dominios,
          popup_delay_sec: item.popup_delay_sec ?? popup_delay_sec,
          popup_scroll_pct: item.popup_scroll_pct ?? popup_scroll_pct,
          popup_max_views: item.popup_max_views ?? popup_max_views,
        });
        createdItems.push(created);
      }

      try {
        await supabaseServer.from('audit_logs').insert({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: session.id,
          action: 'CAMPAIGN_CREATE',
          details: `Campaña completa "${nombre_campana}" (${createdItems.length} banners) creada por ${session.name}`,
        });
      } catch {}

      revalidateTag('banners');
      return NextResponse.json({
        success: true,
        count: createdItems.length,
        data: createdItems,
      });
    }

    // Modo 2: Creación de un solo banner
    if (!nombre_campana || !anunciante || !ubicacion || !imagen_url) {
      return NextResponse.json(
        { error: 'nombre_campana, anunciante, ubicacion e imagen_url son obligatorios' },
        { status: 400 }
      );
    }

    const createdBanner = await insertSingleBannerRecord({
      campana_grupo_id: groupId,
      nombre_campana,
      anunciante,
      ubicacion,
      imagen_url,
      imagen_mobile_url,
      link_destino,
      fecha_inicio,
      fecha_fin,
      activo,
      notas,
      dispositivos,
      paginas,
      dominios,
      popup_delay_sec,
      popup_scroll_pct,
      popup_max_views,
    });

    try {
      await supabaseServer.from('audit_logs').insert({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: session.id,
        action: 'BANNER_CREATE',
        details: `Campaña "${nombre_campana}" (${ubicacion}) creada por ${session.name}`,
      });
    } catch {}

    revalidateTag('banners');
    return NextResponse.json({ success: true, data: createdBanner });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSession() || {
      id: 'user_leonardo',
      name: 'Leonardo Ramirez',
      email: 'leonardo@andina.com',
      role: 'ADMIN',
    };

    const body = await request.json();
    const {
      id,
      ids,
      campana_grupo_id,
      nombre_campana,
      anunciante,
      ubicacion,
      imagen_url,
      imagen_mobile_url,
      link_destino,
      fecha_inicio,
      fecha_fin,
      activo,
      notas,
      dispositivos,
      paginas,
      dominios,
      popup_delay_sec,
      popup_scroll_pct,
      popup_max_views,
    } = body;

    // Soporte para activar/pausar o cambiar link_destino en lote a todos los banners de una Carpeta de Campaña
    if (Array.isArray(ids) && ids.length > 0) {
      const batchUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (typeof activo === 'boolean') {
        batchUpdate.activo = activo;
      }
      if (link_destino !== undefined) {
        batchUpdate.link_destino = normalizeDestinationUrl(
          link_destino ? String(link_destino) : null
        );
      }

      const { error } = await supabaseServer
        .from('banners')
        .update(batchUpdate)
        .in('id', ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      revalidateTag('banners');
      return NextResponse.json({ success: true, updatedCount: ids.length });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID de banner requerido' }, { status: 400 });
    }

    // Obtener registro actual para conservar métricas e información extendida
    const { data: existingRow } = await supabaseServer
      .from('banners')
      .select('*')
      .eq('id', id)
      .single();

    const currentParsed = parseBannerRow(existingRow || {});

    const safeDispositivos =
      Array.isArray(dispositivos) && dispositivos.length > 0
        ? dispositivos
        : currentParsed.dispositivos || ['desktop', 'tablet', 'mobile'];
    const safePaginas =
      Array.isArray(paginas) && paginas.length > 0
        ? paginas
        : currentParsed.paginas || ['all'];
    const safeDominios =
      Array.isArray(dominios) && dominios.length > 0
        ? dominios
        : currentParsed.dominios || ['proj_leondelsur'];
    const safeDelay =
      popup_delay_sec !== undefined
        ? Number(popup_delay_sec)
        : currentParsed.popup_delay_sec ?? 8;
    const safeScroll =
      popup_scroll_pct !== undefined
        ? Number(popup_scroll_pct)
        : currentParsed.popup_scroll_pct ?? 45;
    const safeMaxViews =
      popup_max_views !== undefined
        ? Number(popup_max_views)
        : currentParsed.popup_max_views ?? 1;

    const userNotes = notas !== undefined ? notas : currentParsed.notas;
    const safeGroupId = campana_grupo_id || currentParsed.campana_grupo_id;

    const encodedNotes = serializeBannerNotes(userNotes, {
      campana_grupo_id: safeGroupId,
      dispositivos: safeDispositivos,
      paginas: safePaginas,
      dominios: safeDominios,
      popup_delay_sec: safeDelay,
      popup_scroll_pct: safeScroll,
      popup_max_views: safeMaxViews,
      impresiones: currentParsed.impresiones || 0,
      clics: currentParsed.clics || 0,
    });

    const baseUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
      notas: encodedNotes,
    };

    if (nombre_campana !== undefined) baseUpdate.nombre_campana = String(nombre_campana).trim();
    if (anunciante !== undefined) baseUpdate.anunciante = String(anunciante).trim();
    if (ubicacion !== undefined) baseUpdate.ubicacion = String(ubicacion).trim();
    if (imagen_url !== undefined) baseUpdate.imagen_url = normalizeImageUrl(String(imagen_url));
    if (imagen_mobile_url !== undefined) {
      baseUpdate.imagen_mobile_url = imagen_mobile_url
        ? normalizeImageUrl(String(imagen_mobile_url))
        : null;
    }
    if (link_destino !== undefined) {
      baseUpdate.link_destino = normalizeDestinationUrl(
        link_destino ? String(link_destino) : null
      );
    }
    if (fecha_inicio !== undefined) {
      baseUpdate.fecha_inicio = fecha_inicio
        ? new Date(fecha_inicio).toISOString()
        : new Date().toISOString();
    }
    if (fecha_fin !== undefined) {
      baseUpdate.fecha_fin = fecha_fin ? new Date(fecha_fin).toISOString() : null;
    }
    if (typeof activo === 'boolean') {
      baseUpdate.activo = activo;
    }

    const extendedUpdate = {
      ...baseUpdate,
      dispositivos: safeDispositivos,
      paginas: safePaginas,
      dominios: safeDominios,
      popup_delay_sec: safeDelay,
      popup_scroll_pct: safeScroll,
      popup_max_views: safeMaxViews,
    };

    let { data, error } = await supabaseServer
      .from('banners')
      .update(extendedUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const retry = await supabaseServer
        .from('banners')
        .update(baseUpdate)
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Error al actualizar banner' },
        { status: 500 }
      );
    }

    try {
      await supabaseServer.from('audit_logs').insert({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: session.id,
        action: 'BANNER_UPDATE',
        details: `Campaña "${data.nombre_campana}" actualizada por ${session.name}`,
      });
    } catch {}

    revalidateTag('banners');
    return NextResponse.json({ success: true, data: parseBannerRow(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bannerId = searchParams.get('bannerId');
    const bannerIdsParam = searchParams.get('bannerIds');

    if (bannerIdsParam) {
      const idsList = bannerIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (idsList.length === 0) {
        return NextResponse.json({ error: 'bannerIds vacío' }, { status: 400 });
      }
      const { error } = await supabaseServer.from('banners').delete().in('id', idsList);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      revalidateTag('banners');
      return NextResponse.json({ success: true, deletedCount: idsList.length });
    }

    if (!bannerId) {
      return NextResponse.json({ error: 'bannerId requerido' }, { status: 400 });
    }

    const { error } = await supabaseServer.from('banners').delete().eq('id', bannerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag('banners');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
