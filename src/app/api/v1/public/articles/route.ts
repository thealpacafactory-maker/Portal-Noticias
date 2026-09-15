import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60; // 1-minute SWR cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainCode = searchParams.get('domain');
  const slug = searchParams.get('slug');
  const categorySlug = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
  const offset = (page - 1) * limit;

  // Set CORS headers so external brand sites can call this freely
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!domainCode) {
    return NextResponse.json(
      { error: 'Parámetro obligatorio "domain" no especificado. Ejemplo: ?domain=perurunning' },
      { status: 400, headers }
    );
  }

  // 1. Fetch domain ID
  const { data: domain, error: domainError } = await supabaseServer
    .from('domains')
    .select('id, name, code, hostname')
    .eq('code', domainCode)
    .single();

  if (domainError || !domain) {
    return NextResponse.json({ error: `Dominio no encontrado para código: ${domainCode}` }, { status: 404, headers });
  }

  // 2. Fetch Single Article by Slug
  if (slug) {
    const { data: article, error: articleError } = await supabaseServer
      .from('articles')
      .select(`
        *,
        author:users(id, name, avatarUrl, bio, slug),
        category:categories(id, name, slug)
      `)
      .eq('domainId', domain.id)
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Noticia no encontrada o despublicada' }, { status: 404, headers });
    }

    return NextResponse.json({ data: article }, { headers });
  }

  // 3. Fetch Paginated List of Published Articles
  let query = supabaseServer
    .from('articles')
    .select(`
      id, title, slug, subheading, excerpt, featuredImage, featuredImageAlt, ogImage,
      visualType, publishedAt, tags, seoTitle, metaDescription, canonicalUrl,
      sourceName, sourceUrl, countryRegion, medicalDisclaimer, priceDataSource,
      author:users(name, avatarUrl, slug),
      category:categories(name, slug)
    `, { count: 'exact' })
    .eq('domainId', domain.id)
    .eq('status', 'PUBLISHED')
    .order('publishedAt', { ascending: false })
    .range(offset, offset + limit - 1);

  if (categorySlug) {
    const { data: category } = await supabaseServer
      .from('categories')
      .select('id')
      .eq('domainId', domain.id)
      .eq('slug', categorySlug)
      .single();

    if (category) {
      query = query.eq('categoryId', category.id);
    }
  }

  const { data: articles, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }

  return NextResponse.json({
    data: articles || [],
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
    domain,
  }, { headers });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
