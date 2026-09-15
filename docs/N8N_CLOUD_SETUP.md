# Guía Paso a Paso para n8n Cloud (Prueba / Hosted)

Si estás usando **n8n Cloud** (en la web de n8n.io), no necesitas acceso a variables de entorno del servidor. n8n Cloud tiene una sección gráfica llamada **Credentials** donde ingresas tus claves de forma segura en 2 minutos.

---

## Método 1: Configuración en n8n Cloud usando Credenciales (Recomendado)

### 1. Agregar Credencial de Supabase en n8n Cloud
1. En tu panel de n8n Cloud, ve al menú lateral izquierdo y haz clic en **Credentials**.
2. Haz clic en el botón **+ Create Credential**.
3. En el buscador escribe **Header Auth** y selecciónalo.
4. Completa los campos:
   - **Name**: `Header Name` -> escribe: `apikey`
   - **Value**: pega tu clave `anon` de Supabase (`eyJhbGci...`).
   - Guarda con el nombre **Supabase Anon Credential**.
5. Crea una segunda credencial **Header Auth**:
   - **Name**: `Header Name` -> escribe: `Authorization`
   - **Value**: escribe: `Bearer <tu-service-role-key-de-supabase>`
   - Guarda con el nombre **Supabase Bearer Credential**.

---

### 2. Agregar Credencial de OpenAI en n8n Cloud
1. En **Credentials**, haz clic en **+ Create Credential**.
2. En el buscador escribe **OpenAI**.
3. Pega tu API Key de OpenAI (`sk-proj-...`).
4. Haz clic en **Save**.

---

## Método 2: Colocar las URLs y Claves Directamente en los Nodos de n8n

Si prefieres no usar el gestor de credenciales, puedes pegar tu URL de Supabase directamente en cada nodo:

1. Importa el archivo JSON en n8n Cloud: [`n8n/workflows/01_rss_detection_n8n_cloud.json`](file:///c:/Users/mateo/Documents/GitHub/Portal-Noticias/n8n/workflows/01_rss_detection_n8n_cloud.json).
2. Haz doble clic en el nodo **Fetch Feed Sources from Supabase**.
3. En la casilla **URL**, reemplaza la dirección por la tuya de Supabase, por ejemplo:
   `https://xyz.supabase.co/rest/v1/feed_sources?select=*,domains(*)&active=eq.true`
4. En **Headers**, pega tus claves directamente en las casillas `apikey` y `Authorization`.
5. Repite lo mismo para los nodos **Check Article Duplicate** e **Insert Article Draft**.

---

## Verificación en n8n Cloud
1. Presiona el botón **Test workflow** en la esquina inferior de n8n.
2. Verás cómo los nodos cambian a color **Verde** uno a uno.
3. Al finalizar, ve al **Table Editor** en tu panel de Supabase y verás la noticia ingresada en la tabla `articles` con estado `IN_REVIEW`.
