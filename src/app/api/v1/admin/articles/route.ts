import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export const revalidate = 0; // Dynamic route

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function getAutoFeaturedImage(title: string, domainId?: string): Promise<{ url: string; alt: string }> {
  try {
    const cleanQuery = title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || 'demokey';
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery || title)}&per_page=1`, {
      headers: { Authorization: `Client-ID ${unsplashKey}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const first = data.results[0];
        return {
          url: first.urls?.regular || first.urls?.small,
          alt: first.alt_description || title,
        };
      }
    }
  } catch (err) {
    console.error('Unsplash auto-fetch error:', err);
  }

  // Domain Fallback images
  let fallback = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
  if (domainId === 'dom_1' || domainId === 'dom_3' || domainId === 'dom_6') {
    fallback = 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80';
  } else if (domainId === 'dom_4') {
    fallback = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80';
  } else if (domainId === 'dom_5') {
    fallback = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
  } else if (domainId === 'dom_7') {
    fallback = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80';
  }

  return { url: fallback, alt: title };
}

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
        reviewerId, approvedBy,
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

export async function POST(request: NextRequest) {
  try {
    const session = getSession() || { id: 'user_jasmine', name: 'Jasmine', email: 'jasmine@portalnoticias.com' };
    const body = await request.json();

    const {
      domainId,
      title,
      subheading,
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      categoryId,
      tags,
      sourceName,
      sourceUrl,
      countryRegion,
      status: requestedStatus,
      seoTitle,
      metaDescription,
    } = body;

    if (!domainId || !title || !content) {
      return NextResponse.json({ error: 'domainId, title y content son obligatorios' }, { status: 400 });
    }

    // 1. Fetch domain to check autoPublishEnabled
    const { data: domain } = await supabaseServer
      .from('domains')
      .select('id, autoPublishEnabled')
      .eq('id', domainId)
      .single();

    const isAutoPublish = domain?.autoPublishEnabled || false;

    // Determine Status
    let finalStatus = requestedStatus || (isAutoPublish ? 'PUBLISHED' : 'IN_REVIEW');
    let publishedAt: string | null = null;
    let reviewerId: string | null = null;
    let approvedBy: string | null = null;

    if (finalStatus === 'PUBLISHED' || (isAutoPublish && requestedStatus !== 'DRAFT')) {
      finalStatus = 'PUBLISHED';
      publishedAt = new Date().toISOString();
      reviewerId = session.id;
      approvedBy = session.name || 'Sistema (Autopublicado)';
    }

    // 2. Featured Image auto-assignment if empty
    let finalFeaturedImage = featuredImage;
    let finalFeaturedImageAlt = featuredImageAlt;

    if (!finalFeaturedImage || finalFeaturedImage.trim() === '') {
      const autoImg = await getAutoFeaturedImage(title, domainId);
      finalFeaturedImage = autoImg.url;
      finalFeaturedImageAlt = finalFeaturedImageAlt || autoImg.alt;
    }

    // 3. Ensure Category ID exists or fetch default category for domain
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const { data: categories } = await supabaseServer
        .from('categories')
        .select('id')
        .eq('domainId', domainId)
        .limit(1);

      if (categories && categories.length > 0) {
        finalCategoryId = categories[0].id;
      } else {
        // Fallback default category
        finalCategoryId = `cat_${domainId}_general`;
      }
    }

    // 4. Generate Slug with timestamp suffix to avoid unique constraint collisions
    const baseSlug = generateSlug(title);
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    const articleId = `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newArticle = {
      id: articleId,
      domainId,
      status: finalStatus,
      title,
      slug: uniqueSlug,
      subheading: subheading || '',
      content,
      excerpt: excerpt || subheading || title,
      featuredImage: finalFeaturedImage,
      featuredImageAlt: finalFeaturedImageAlt || title,
      ogImage: finalFeaturedImage,
      authorId: session.id || 'user_jasmine',
      reviewerId,
      approvedBy,
      categoryId: finalCategoryId,
      tags: tags || [],
      sourceName: sourceName || null,
      sourceUrl: sourceUrl || null,
      countryRegion: countryRegion || 'Mundo',
      seoTitle: seoTitle || title,
      metaDescription: metaDescription || subheading || title,
      publishedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: createdArticle, error: insertError } = await supabaseServer
      .from('articles')
      .insert(newArticle)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Audit log
    await supabaseServer.from('audit_logs').insert({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: session.id,
      action: 'ARTICLE_CREATE',
      details: `Noticia "${title}" creada con estado ${finalStatus} por ${session.name}`,
    });

    return NextResponse.json({ success: true, data: createdArticle });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSession() || { id: 'user_jasmine', name: 'Jasmine', email: 'jasmine@portalnoticias.com' };
    const body = await request.json();
    const { id, status, title, subheading, content, featuredImage, featuredImageAlt, ogImage, seoTitle, metaDescription, approvedBy } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de artículo requerido' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    if (status) {
      updateData.status = status;
      if (status === 'PUBLISHED' || status === 'APPROVED') {
        updateData.publishedAt = new Date().toISOString();
        updateData.reviewerId = session.id;
        updateData.approvedBy = approvedBy || session.name;
      } else if (status === 'REJECTED') {
        updateData.reviewerId = session.id;
        updateData.approvedBy = approvedBy || session.name;
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

    // Record audit log
    if (status) {
      await supabaseServer.from('audit_logs').insert({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: session.id,
        action: `ARTICLE_${status}`,
        details: `Noticia ${data.title} marcada como ${status} por ${session.name}`,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}
