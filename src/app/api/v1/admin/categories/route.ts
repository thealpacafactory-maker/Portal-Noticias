import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const revalidate = 0; // Dynamic route

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');

  if (!domainId) {
    return NextResponse.json({ error: 'domainId es obligatorio' }, { status: 400 });
  }

  try {
    // 1. Fetch categories for this domain from Supabase
    let { data: categories } = await supabaseServer
      .from('categories')
      .select('*')
      .eq('domainId', domainId)
      .order('name', { ascending: true });

    // 2. If no category exists for this domain, create default General category
    if (!categories || categories.length === 0) {
      const defaultCatId = `cat_${domainId}_general`;
      const newCategory = {
        id: defaultCatId,
        domainId: domainId,
        name: 'General',
        slug: 'general',
        description: 'Categoría General del Portal',
      };

      const { data: createdCat } = await supabaseServer
        .from('categories')
        .upsert(newCategory, { onConflict: 'id' })
        .select()
        .single();

      categories = createdCat ? [createdCat] : [newCategory];
    }

    return NextResponse.json({ data: categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener categorías' }, { status: 500 });
  }
}
