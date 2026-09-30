import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 0; // Dynamic route

// GET /api/v1/admin/domains?domainId=dom_1
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');

  try {
    if (domainId) {
      const { data: domain, error } = await supabaseServer
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .single();

      if (error || !domain) {
        return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
      }

      return NextResponse.json({ data: domain });
    }

    const { data: domains, error } = await supabaseServer
      .from('domains')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: domains });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

// PATCH /api/v1/admin/domains
// Body: { domainId: 'dom_1', autoPublishEnabled?: true, projectId?: 'proj_leondelsur' }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId, autoPublishEnabled, projectId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'domainId es obligatorio' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};

    if (typeof autoPublishEnabled === 'boolean') {
      updatePayload.autoPublishEnabled = autoPublishEnabled;
    }

    if (projectId !== undefined) {
      updatePayload.projectId = projectId === '' || projectId === null ? null : projectId;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 });
    }

    // Update domain setting
    const { data, error } = await supabaseServer
      .from('domains')
      .update(updatePayload)
      .eq('id', domainId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If auto-publish was turned ON, auto-publish any currently pending articles (IN_REVIEW) for this domain
    if (autoPublishEnabled === true) {
      await supabaseServer
        .from('articles')
        .update({
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString(),
          approvedBy: 'Sistema (Autopublicación Activada)',
        })
        .eq('domainId', domainId)
        .eq('status', 'IN_REVIEW');
    }

    // Insert audit log
    await supabaseServer.from('audit_logs').insert({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'user_jasmine',
      action: 'DOMAIN_SETTINGS_UPDATE',
      details: `Configuración de dominio ${domainId} actualizada: ${JSON.stringify(updatePayload)}`,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
