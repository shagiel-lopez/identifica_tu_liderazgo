# Identifica tu liderazgo

Encuesta de 16 preguntas con resultados individuales y un mapa público de los tres estilos principales de cada respuesta compartida.

## Conectar Supabase

1. Abre tu proyecto en https://supabase.com/dashboard.
2. En **SQL Editor → New query**, ejecuta `supabase/schema.sql`. Crea una tabla independiente `leadership_responses` y dos funciones; no migra respuestas de tablas anteriores.
3. Copia **Project URL** desde **Connect** o **Settings → Data API** y una clave **Publishable** o la clave heredada **anon** desde **Settings → API Keys**.
4. Revoca la clave secreta que estaba incrustada en el HTML original. No se necesita ninguna clave secreta para esta aplicación.

Los nombres opcionales y los 16 puntajes se guardan en `leadership_responses`, disponible para la persona administradora desde Table Editor. El navegador solo puede enviar respuestas y consultar totales agregados mediante funciones. No tiene permiso para leer, modificar ni borrar registros directamente. El mapa se actualiza cada 10 segundos mientras está visible y cuenta todas las respuestas, sin el anterior límite de 500.

## Publicar en Vercel

1. Importa `shagiel-lopez/identifica_tu_liderazgo` en https://vercel.com/new.
2. Añade estas variables en Production y Preview:
   - `SUPABASE_URL`: la URL `https://xxxxx.supabase.co` de tu proyecto.
   - `SUPABASE_PUBLISHABLE_KEY`: una clave que empiece con `sb_publishable_` o la clave JWT `anon` del mismo proyecto.
3. Pulsa **Deploy**. `vercel.json` configura el comando `npm run build` y la carpeta `dist`. Si cambias variables, vuelve a desplegar.

La raíz `/` y `/identifica-tu-estilo-de-liderazgo.html` muestran la encuesta. Solo se publica `dist`; el SQL y los archivos de desarrollo quedan fuera. La clave publicable es visible en el navegador por diseño. El build rechaza claves secretas y una URL ausente o incorrecta.

## Validación

Instala las dependencias con `pnpm install` o `npm install`. `npm test` ejecuta pruebas del flujo de encuesta, del build y de la base de datos en PostgreSQL local con PGlite, sin conectarse a producción. Tras desplegar, completa y comparte una respuesta, abre el mapa en otro navegador y comprueba que se actualice en unos 10 segundos. Verifica también en Supabase que la respuesta esté guardada.

Los reintentos de un mismo envío usan el mismo UUID y no duplican registros. Volver a responder crea una nueva respuesta. Es una encuesta abierta: no verifica identidad ni impide que alguien envíe múltiples respuestas deliberadamente. Todos los visitantes de esta instalación comparten un solo mapa. Los empates se resuelven por el orden de las preguntas.

Referencias: [variables de Vercel](https://vercel.com/docs/environment-variables), [funciones de Supabase](https://supabase.com/docs/guides/database/functions), [permisos de datos](https://supabase.com/docs/guides/database/secure-data).
