# Guía de Despliegue en Vercel

Para desplegar BetScribe en Vercel, sigue estos pasos:

## 1. Configuración del Proyecto en Vercel

1.  Importa tu repositorio de GitHub en Vercel.
2.  En la configuración del proyecto, ve a la sección **Environment Variables**.
3.  Agrega las siguientes variables (copia los valores de tu `.env.txt` local):

| Variable | Descripción |
|---|---|
| `BETSCRIBE_DB_URL` | URL de conexión a tu base de datos Turso |
| `BETSCRIBE_DB_TOKEN` | Token de autenticación de Turso |
| `GOOGLE_GEMINI_API_KEY` | Tu API Key de Google Gemini |
| `GOOGLE_OAUTH_CLIENT_ID` | Tu Client ID de Google OAuth |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Tu Client Secret de Google OAuth |

**Opcional (para envío de correos):**
*   `SMTP_HOST`
*   `SMTP_PORT`
*   `SMTP_USER`
*   `SMTP_PASS`
*   `SMTP_FROM`

## 2. Configuración de Google OAuth para Producción

Una vez que tengas tu dominio de Vercel (ej. `https://betscribe.vercel.app`), debes actualizar la consola de Google Cloud:

1.  Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2.  Edita tu cliente OAuth.
3.  **Orígenes autorizados de JavaScript:** Agrega `https://betscribe.vercel.app`
4.  **URIs de redireccionamiento autorizados:** Agrega `https://betscribe.vercel.app/api/auth/google/callback`

## 3. Base de Datos

Asegúrate de que tu base de datos en Turso sea accesible desde Vercel (generalmente lo es por defecto).

## 4. Middleware

El código ya ha sido optimizado para ser compatible con el **Edge Runtime** de Vercel.

---
¡Listo! Tu aplicación debería funcionar correctamente en producción.
