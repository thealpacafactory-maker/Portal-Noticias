import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 0; // Dynamic route

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');
  const status = searchParams.get('status');
  const articleId = searchParams.get('articleId');

  try {
    // 1. Fetch Single Article Detail
    if (articleId) {
      const { data: article, error } = await supabaseServer
        .from('articles')
        .select(`
          *,
          domain:domains(id, name, code, hostname)
        `)
        .eq('id', articleId)
        .single();

      if (error || !article) {
        return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
      }

      return NextResponse.json({ data: article });
    }

    // 2. Fetch Domain Articles List
    let query = supabaseServer
      .from('articles')
      .select(`
        id, domainId, status, title, slug, subheading, featuredImage, featuredImageAlt, ogImage,
        visualType, sourceName, sourceUrl, createdAt, publishedAt, categoryId, medicalDisclaimer,
        domain:domains(id, name, code)
      `, { count: 'exact' })
      .order('createdAt', { ascending: false });

    if (domainId) {
      query = query.eq('domainId', domainId);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: articles, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: articles || [], total: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, title, subheading, content, featuredImage, featuredImageAlt, ogImage, seoTitle, metaDescription } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de artículo requerido' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    if (status) {
      updateData.status = status;
      if (status === 'PUBLISHED') {
        updateData.publishedAt = new Date().toISOString();
      }
    }

    if (title !== undefined) updateData.title = title;
    if (subheading !== undefined) updateData.subheading = subheading;
    if (content !== undefined) updateData.content = content;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt;
    if (ogImage !== undefined) updateData.ogImage = ogImage;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

    const { data, error } = await supabaseServer
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}
