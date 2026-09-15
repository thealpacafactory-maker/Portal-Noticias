# Guía de Configuración Paso a Paso en n8n

Esta guía explica cómo importar y activar los flujos automatizados de detección, redacción con IA y publicación distribuida en tu instancia de n8n.

---

## Paso 1: Configurar Variables de Entorno en n8n
En tu servidor n8n (o panel Cloud), agrega las siguientes variables de entorno en la sección **Environment Variables** o mediante `.env`:

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
OPENAI_API_KEY=sk-proj-...
REVALIDATE_SECRET=tu_secreto_de_revalidacion_webhook
```

---

## Paso 2: Importar los Flujos de Trabajo
1. Abre tu panel de **n8n**.
2. En la esquina superior derecha, haz clic en **Workflows** -> **Import from File**.
3. Importa los siguientes 2 archivos JSON que se encuentran en este repositorio:
   - [`n8n/workflows/01_rss_detection_and_ai_generation.json`](file:///c:/Users/mateo/Documents/GitHub/Portal-Noticias/n8n/workflows/01_rss_detection_and_ai_generation.json)
   - [`n8n/workflows/02_publication_dispatcher.json`](file:///c:/Users/mateo/Documents/GitHub/Portal-Noticias/n8n/workflows/02_publication_dispatcher.json)

---

## Paso 3: Explicación y Funcionamiento de los Flujos

### Flujo 1: `01_RSS_Detection_and_AI_News_Generator`
- **Disparador**: Nodo Cron configurado para ejecutarse 4 veces al día (`06:00`, `11:00`, `15:00`, `19:00`).
- **Paso 1**: Consulta a Supabase REST API para obtener las fuentes de noticias activas por dominio (`feed_sources`).
- **Paso 2**: Lee y procesa el feed RSS de cada fuente.
- **Paso 3**: Llama a la función SQL `check_article_duplicate` en Supabase para asegurar que la noticia no exista.
- **Paso 4 (IA)**: Llama a GPT-4o con las reglas de estilo del dominio.
  - Para **Kompressox**: Exige citar fuentes médicas y añade aviso legal.
  - Para **Sillaris**: Exige fuente de precios y período analizado.
- **Paso 5**: Inserta la noticia redactada en Supabase con estado `IN_REVIEW` (En Revisión).

### Flujo 2: `02_Publication_Queue_Dispatcher`
- **Disparador**: Cron cada 5 minutos.
- **Paso 1**: Consulta en Supabase noticias aprobadas (`SCHEDULED`) cuya fecha programada sea menor o igual a la hora actual.
- **Paso 2**: Cambia su estado a `PUBLISHED` en Supabase.
- **Paso 3**: Envía un Webhook al frontend de la marca respectiva para revalidar la caché y mostrar la noticia inmediatamente en `/noticias/`.

---

## Paso 4: Activar los Flujos
Una vez importados y verificadas las credenciales:
1. Abre cada flujo en n8n.
2. Cambia el interruptor superior derecho de **Inactive** a **Active**.
3. ¡Listo! n8n ejecutará las detecciones automáticamente en los horarios configurados.
