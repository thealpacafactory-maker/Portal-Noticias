# Guía de Vinculación de los 7 Proyectos Web para Recibir Noticias

Esta guía explica detalladamente cómo conectar cada una de las 7 webs asignadas para que consuman, muestren e indexen las noticias publicadas en Supabase.

---

## Estrategias de Vinculación Disponibles

Puedes elegir una de las 3 opciones de arquitectura según cómo estén construidos los proyectos de tus 7 marcas:

---

### Opción A: Despliegue Unificado Multi-Dominio (Recomendado)

En este modelo, este único repositorio (`Portal-Noticias`) atiende las 7 webs.

1. **Configuración en Vercel / Cloudflare / Nginx**:
   - Apunta los 7 dominios al mismo proyecto desplegado:
     - `perurunning.pe`
     - `themerinofactory.com`
     - `maratondearequipa.pe`
     - `kompressox.com`
     - `sillaris.pe`
     - `maratondelima.com.pe`
     - `cinefoniashow.com`
2. **Middleware Automático**:
   - El archivo `middleware.ts` detecta la cabecera `Host` y sirve la interfaz y noticias correspondientes a ese dominio de forma transparente.

---

### Opción B: Conexión desde Aplicaciones Frontend Independientes (React, Next.js, Astro, WordPress, etc.)

Si cada uno de los 7 proyectos es una aplicación independiente ya existente, pueden consumir las noticias mediante el SDK de Supabase o la API REST.

#### Ejemplo 1: Consulta vía SDK de Supabase (`@supabase/supabase-js`)

En el proyecto de tu marca (ej. `perurunning.pe`):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://<tu-proyecto>.supabase.co',
  'eyJhbGciOi...' // Anon Key
);

export async function getPublishedNews(domainCode: string) {
  // 1. Obtener ID del dominio
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('code', domainCode)
    .single();

  if (!domain) return [];

  // 2. Obtener noticias publicadas de ese dominio
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      id, title, slug, subheading, content, featuredImage, featuredImageAlt, 
      publishedAt, tags, seoTitle, metaDescription,
      author:users(name, avatarUrl, bio),
      category:categories(name, slug)
    `)
    .eq('domainId', domain.id)
    .eq('status', 'PUBLISHED')
    .order('publishedAt', { ascending: false });

  if (error) {
    console.error('Error al obtener noticias:', error);
    return [];
  }

  return articles;
}
```

#### Ejemplo 2: Consulta por Noticia Individual (Slug)

```typescript
export async function getArticleBySlug(domainCode: string, slug: string) {
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('code', domainCode)
    .single();

  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      author:users(name, avatarUrl, bio, slug),
      category:categories(name, slug)
    `)
    .eq('domainId', domain.id)
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single();

  return article;
}
```

---

### Opción C: Revalidación en Tiempo Real por Webhook (ISR / Caché Estática)

Si tu proyecto externo utiliza generación estática (Next.js App Router, Astro, Nuxt):

1. **Crear Ruta de Revalidación en la Web Externa**:
   En `app/api/revalidate/route.ts` de la web receptora:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validar secreto enviado por n8n / CMS
  if (body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  // Revalidar listado de noticias y noticia específica
  revalidatePath('/noticias');
  if (body.slug) {
    revalidatePath(`/noticias/${body.slug}`);
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
```

2. **n8n Ejecuta la Revalidación**:
   Cuando n8n o un editor aprueba/publica una noticia, la automatización hace un POST a `https://<dominio-marca>/api/revalidate` con el secreto y la página se actualiza al instante sin volver a compilar todo el sitio.

---

## Tabla de Mapeo de Dominios y Código Identificador

Utiliza estos códigos al realizar las consultas en Supabase desde cada proyecto:

| Marca | Dominio | Código `domainCode` |
| :--- | :--- | :--- |
| Perú Running | `perurunning.pe` | `perurunning` |
| The Merino Factory | `themerinofactory.com` | `themerinofactory` |
| Maratón de Arequipa | `maratondearequipa.pe` | `maratondearequipa` |
| Kompressox | `kompressox.com` | `kompressox` |
| Sillaris Inmobiliario | `sillaris.pe` | `sillaris` |
| Maratón de Lima | `maratondelima.com.pe` | `maratondelima` |
| Cinefonía Show | `cinefoniashow.com` | `cinefoniashow` |
