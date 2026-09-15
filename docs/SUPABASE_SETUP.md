# Guía de Configuración Paso a Paso en Supabase

Sigue estas instrucciones exactas para dejar configurado Supabase para las 7 webs.

---

## Paso 1: Crear el Proyecto en Supabase
1. Ingresa a tu panel en [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Asigna un nombre al proyecto (ej. `Portal-Noticias-Ecosystem`).
3. Guarda en un lugar seguro la contraseña de la base de datos (Database Password).
4. Selecciona la región geográfica más cercana a Perú/LATAM (ej. `us-east-1` N. Virginia o `sa-east-1` São Paulo).

---

## Paso 2: Ejecutar el Script de Tablas y Políticas RLS
1. En el menú lateral izquierdo de Supabase, ve a **SQL Editor**.
2. Haz clic en **New query**.
3. Abre el archivo local [`supabase/migrations/20260826_init.sql`](file:///c:/Users/mateo/Documents/GitHub/Portal-Noticias/supabase/migrations/20260826_init.sql), copia todo su contenido y pégalo en el editor SQL de Supabase.
4. Presiona el botón **Run** (o `Ctrl + Enter`).
5. Verifica en el panel **Table Editor** que se hayan creado correctamente las tablas:
   - `domains` (con los 7 registros iniciales)
   - `users`
   - `user_domain_access`
   - `categories`
   - `articles`
   - `article_versions`
   - `redirects`
   - `feed_sources`
   - `audit_logs`
   - `article_analytics`

---

## Paso 3: Crear la Función de Deduplicación en SQL
En el **SQL Editor** de Supabase, ejecuta la siguiente función para que n8n pueda verificar duplicados en un solo llamado:

```sql
CREATE OR REPLACE FUNCTION check_article_duplicate(
  p_domain_id TEXT,
  p_source_url TEXT,
  p_title TEXT
)
RETURNS JSON AS $$
DECLARE
  v_count INT;
  v_result JSON;
BEGIN
  -- Verificar si existe por URL original o título idéntico en los últimos 7 días
  SELECT COUNT(*) INTO v_count
  FROM articles
  WHERE "domainId" = p_domain_id
    AND ("sourceUrl" = p_source_url OR LOWER("title") = LOWER(p_title))
    AND "createdAt" >= NOW() - INTERVAL '7 days';

  IF v_count > 0 THEN
    v_result := json_build_object('is_duplicate', true, 'reason', 'URL o título existente en los últimos 7 días');
  ELSE
    v_result := json_build_object('is_duplicate', false, 'reason', 'Noticia original');
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## Paso 4: Crear el Bucket de Almacenamiento (Supabase Storage)
1. Ve al apartado **Storage** en el menú de Supabase.
2. Haz clic en **Create a new bucket**.
3. Nombra el bucket exactamente: `editorial-images`.
4. Marca la casilla **Public bucket** (para que las imágenes de las noticias puedan ser leídas públicamente por Google y las webs).
5. En **Allowed MIME types**, escribe `image/*` (acepta WebP, AVIF, PNG, JPG).
6. Haz clic en **Save**.

---

## Paso 5: Obtener Claves de Conexión (API Keys)
1. Ve a **Project Settings** -> **API**.
2. Copia las siguientes variables para configurarlas en tu `.env` de Next.js y en n8n:
   - **Project URL**: `https://<tu-ref>.supabase.co`
   - **anon / public key**: Clave pública para el cliente web.
   - **service_role key**: Clave secreta con permisos elevados para n8n y operaciones de administración.
