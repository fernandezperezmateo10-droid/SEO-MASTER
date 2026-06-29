# SEO Master

Aplicación interactiva y visual impulsada por Inteligencia Artificial (Claude 3.5 Sonnet) para auditoría SEO, investigación de palabras clave y generación de contenido estructurado.

## 🚀 Despliegue en Vercel (Producción Seguro)

Para llevar esta aplicación a producción de manera segura y proteger tu API Key:

1. **Sube el proyecto a GitHub**
   Si no lo has hecho, empuja este repositorio a tu cuenta de GitHub:
   ```bash
   git add .
   git commit -m "Preparando para producción"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/seo-master.git
   git push -u origin main
   ```

2. **Despliega en Vercel**
   - Ve a [Vercel](https://vercel.com/) y haz clic en **Add New Project**.
   - Selecciona el repositorio de GitHub que acabas de subir.
   - En la sección **Environment Variables** (Variables de Entorno) del panel de configuración de Vercel, añade:
     - **Key:** `VITE_ANTHROPIC_API_KEY`
     - **Value:** `sk-ant-api03...` (tu clave secreta de Claude).
   - Haz clic en **Deploy**.

> **Nota de Seguridad**: Gracias a la `api/anthropic.js` Edge Function configurada en el proyecto, tu API Key de Claude se mantiene completamente oculta y segura en el servidor de Vercel. Jamás será expuesta en el código de React.

## 💻 Entorno de Desarrollo Local

Para probar el proyecto en tu propia máquina:

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Configura tu API Key:
   Crea un archivo llamado `.env` en la raíz del proyecto y añade tu clave:
   ```env
   VITE_ANTHROPIC_API_KEY=tu_clave_de_claude_aqui
   ```
   *Nota: El archivo `.env` ya se encuentra ignorado en Git para tu seguridad.*

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

La aplicación interceptará de manera automática las peticiones e inyectará tu API Key de forma segura, permitiendo el funcionamiento completo.

## 🛠 Características
* **Análisis de palabras clave:** Obtén volumen, dificultad, intención de búsqueda y variaciones.
* **Auditoría de contenido:** Gráficos de lectura, densidad de keywords y puntuación SEO general.
* **Generador de contenido:** Streaming en tiempo real para meta descripciones, artículos o introducciones con SEO-first.
* **Sugerencias:** Plan de acción automatizado para cualquier URL o texto con opción a implementar soluciones mediante IA al instante.
* **Panel de Control y Exportación:** Dashboard central con un historial 100% persistente en el dispositivo del usuario, con posibilidad de exportar todo a `.txt`.
