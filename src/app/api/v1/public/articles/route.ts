import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 60; // 1-minute SWR cache

const DOMAIN_FALLBACK_IMAGES: Record<string, string> = {
  dom_1: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
  dom_2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
  dom_3: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
  dom_4: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
  dom_5: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  dom_6: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
  dom_7: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
};

const DEFAULT_GLOBAL_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectCode = searchParams.get('project');
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

  if (!domainCode && !projectCode) {
    return NextResponse.json(
      { error: 'Debes proporcionar el parámetro "domain" (ej: ?domain=perurunning) o "project" (ej: ?project=leondelsur)' },
      { status: 400, headers }
    );
  }

  // 1. PROJECT-WIDE QUERY: Aggregated articles across all subdomains of a project
  if (projectCode) {
    // Find project
    const { data: project } = await supabaseServer
      .from('projects')
      .select('*')
      .or(`code.eq.${projectCode},id.eq.${projectCode}`)
      .maybeSingle();

    // Fetch domains linked to this project or all domains if fallback
    let domainsQuery = supabaseServer.from('domains').select('id, name, code, hostname, defaultImage, projectId');
    if (project) {
      domainsQuery = domainsQuery.eq('projectId', project.id);
    }
    const { data: projectDomains } = await domainsQuery;
    const domainList = projectDomains || [];
    const domainIds = domainList.map((d) => d.id);

    if (domainIds.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        project: project || { code: projectCode, name: projectCode },
        domains: [],
      }, { headers });
    }

    let query = supabaseServer
      .from('articles')
      .select(`
        id, domainId, title, slug, subheading, excerpt, featuredImage, featuredImageAlt, ogImage,
        visualType, publishedAt, tags, seoTitle, metaDescription, canonicalUrl,
        sourceName, sourceUrl, countryRegion, medicalDisclaimer, priceDataSource,
        author:users(name, avatarUrl, slug),
        category:categories(name, slug)
      `, { count: 'exact' })
      .in('domainId', domainIds)
      .eq('status', 'PUBLISHED')
      .order('publishedAt', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: articles, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers });
    }

    // Map domain info to each article
    const domainMap = new Map(domainList.map((d) => [d.id, d]));

    const formattedArticles = (articles || []).map((art) => {
      const parentDomain = domainMap.get(art.domainId);
      const fallbackImg = parentDomain?.defaultImage || DOMAIN_FALLBACK_IMAGES[art.domainId] || DEFAULT_GLOBAL_IMAGE;

      return {
        ...art,
        featuredImage: art.featuredImage && art.featuredImage.trim() !== '' ? art.featuredImage : fallbackImg,
        ogImage: art.ogImage && art.ogImage.trim() !== '' ? art.ogImage : (art.featuredImage || fallbackImg),
        domain: parentDomain ? { id: parentDomain.id, code: parentDomain.code, name: parentDomain.name, hostname: parentDomain.hostname } : null,
      };
    });

    return NextResponse.json({
      data: formattedArticles,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      project: project || { code: projectCode, name: projectCode },
      domains: domainList,
    }, { headers });
  }

  // 2. SINGLE DOMAIN QUERY
  const { data: domain, error: domainError } = await supabaseServer
    .from('domains')
    .select('id, name, code, hostname, defaultImage, projectId')
    .eq('code', domainCode)
    .single();

  if (domainError || !domain) {
    return NextResponse.json({ error: `Dominio no encontrado para código: ${domainCode}` }, { status: 404, headers });
  }

  const defaultImage = domain.defaultImage || DOMAIN_FALLBACK_IMAGES[domain.id] || DEFAULT_GLOBAL_IMAGE;

  // Single Article by Slug
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

    article.featuredImage = article.featuredImage && article.featuredImage.trim() !== '' ? article.featuredImage : defaultImage;
    article.ogImage = article.ogImage && article.ogImage.trim() !== '' ? article.ogImage : article.featuredImage;

    return NextResponse.json({ data: article }, { headers });
  }

  // List of Published Articles
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

  const formattedArticles = (articles || []).map((art) => ({
    ...art,
    featuredImage: art.featuredImage && art.featuredImage.trim() !== '' ? art.featuredImage : defaultImage,
    ogImage: art.ogImage && art.ogImage.trim() !== '' ? art.ogImage : (art.featuredImage || defaultImage),
  }));

  return NextResponse.json({
    data: formattedArticles,
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
