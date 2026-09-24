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
// Body: { domainId: 'dom_1', autoPublishEnabled: true }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId, autoPublishEnabled } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'domainId es obligatorio' }, { status: 400 });
    }

    if (typeof autoPublishEnabled !== 'boolean') {
      return NextResponse.json({ error: 'autoPublishEnabled debe ser un valor booleano' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('domains')
      .update({ autoPublishEnabled })
      .eq('id', domainId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert audit log
    await supabaseServer.from('audit_logs').insert({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'user_jasmine',
      action: 'DOMAIN_SETTINGS_UPDATE',
      details: `Autopublicación ${autoPublishEnabled ? 'ACTIVADA' : 'DESACTIVADA'} para el dominio ${domainId}`,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
