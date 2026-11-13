import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { bannerMatchesDomain, parseBannerRow } from '@/lib/banner-utils';

export const revalidate = 60;

/**
 * GET /api/v1/public/banners?domain=perurunning&ubicacion=top
 * GET /api/v1/public/banners?project=leondelsur&ubicacion=sidebar
 * Endpoint público CORS con caché CDN para que León del Sur y otros dominios
 * consulten sus campañas publicitarias activas.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ubicacion = searchParams.get('ubicacion');
  const domainParam = searchParams.get('domain') || searchParams.get('project') || 'ALL';

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  };

  try {
    // Resolver código de dominio a ID si se pasó un code como "perurunning" o "sillaris"
    let resolvedDomainId = domainParam;
    if (
      domainParam !== 'ALL' &&
      domainParam !== 'proj_leondelsur' &&
      domainParam !== 'leondelsur' &&
      !domainParam.startsWith('dom_')
    ) {
      const { data: dbDom } = await supabaseServer
        .from('domains')
        .select('id, projectId')
        .eq('code', domainParam)
        .maybeSingle();
      if (dbDom?.id) {
        resolvedDomainId = dbDom.id;
      }
    }

    const { data, error } = await supabaseServer
      .from('banners')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, banners: [] }, { status: 200, headers });
    }

    const nowMs = Date.now();
    const startGraceMs = 12 * 60 * 60 * 1000;

    const validBanners = (data || [])
      .map((row) => parseBannerRow(row as Record<string, any>))
      .filter((b) => {
        if (b.fecha_inicio) {
          const startMs = new Date(b.fecha_inicio).getTime();
          if (!Number.isNaN(startMs) && startMs - startGraceMs > nowMs) {
            return false;
          }
        }
        if (b.fecha_fin) {
          const endMs = new Date(b.fecha_fin).getTime();
          if (!Number.isNaN(endMs) && endMs < nowMs) {
            return false;
          }
        }
        if (!bannerMatchesDomain(b, resolvedDomainId)) {
          return false;
        }
        if (ubicacion) {
          return (
            b.ubicacion === ubicacion ||
            (ubicacion === 'sidebar' && b.ubicacion === 'half-page')
          );
        }
        return true;
      });

    return NextResponse.json({ banners: validBanners }, { headers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error inesperado', banners: [] },
      { status: 200, headers }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
