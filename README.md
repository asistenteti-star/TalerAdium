# Taller de Farmacoeconomía Aplicada · Adium LATAM

Herramienta de trabajo en vivo para el taller de farmacoeconomía de Adium LATAM
(octubre 2026). Cada equipo participante recorre dos módulos desde su propio
dispositivo y termina con una propuesta imprimible.

**Módulo 1 · Segmentación** — el equipo elige su mercado (8 países de LATAM),
el tipo de decisor que va a enfrentar y la meta de acceso que persigue. La app
devuelve el contexto verificado del sistema de salud de ese país y el conjunto
de herramientas de economía de la salud que aplica al caso.

**Módulo 2 · Storytelling** — con esa combinación, el equipo construye el
argumento en tres pasos: comprensión del decisor, datos que lo sustentan y la
narrativa con un plan de trabajo a 12 meses.

El resultado se consolida en una propuesta que se imprime o se guarda en PDF, y
el avance de cada equipo queda registrado en un Google Sheet para que el
facilitador lo siga desde el salón.

---

## Cómo se ejecuta

No hay paso de compilación: es HTML, CSS y JavaScript servidos tal cual. Lo
único que necesita servidor es la función `/api/save`.

```bash
# Solo la interfaz (suficiente para revisar diseño y contenido)
npm run dev            # → http://localhost:8080

# Interfaz + función serverless (para probar el guardado en el Sheet)
npm run dev:vercel     # → http://localhost:3000

# Validación estática antes de subir cambios
npm run check

# Recorrido completo en un navegador real (requiere playwright-core)
npm run smoke
```

Abrir `index.html` con doble clic también funciona para una revisión rápida,
pero el guardado remoto no responderá porque `/api/save` no existe en
`file://`. La app lo detecta y sigue trabajando con su respaldo local.

---

## Estructura

```
.
├── index.html                    Estructura de las 7 pantallas
├── assets/
│   ├── css/styles.css            Todos los estilos, incluida la hoja de impresión
│   ├── favicon.svg
│   └── js/
│       ├── data/                 CONTENIDO — es lo que se edita para el taller
│       │   ├── actors.js         PERFILES de decisor y METAS de acceso
│       │   ├── countries.js      Ficha de sistema de salud por país + fuentes
│       │   ├── tools.js          Herramientas de economía de la salud, evidencia, métricas
│       │   ├── storytelling.js   Visualizaciones y guiones del Módulo 2
│       │   └── builders.js       Opciones de los constructores de texto
│       ├── state.js              Estado de la sesión del equipo
│       ├── storage.js            Respaldo local + envío al Sheet
│       ├── module1.js            Segmentación: país, decisor, meta, herramientas
│       ├── module2.js            Storytelling: contexto, datos, narrativa
│       ├── proposal.js           Propuesta final imprimible
│       └── app.js                Arranque, reanudar sesión, reinicio
├── api/save.js                   Función serverless → Google Sheet
├── scripts/check.mjs             Validación estática (npm run check)
├── docs/
│   ├── AppsScript_TallerAdium.gs  Código para pegar en el Apps Script del Sheet
│   ├── SHEET.md                   Columnas del Sheet y cómo leerlas
│   ├── ROADMAP.md                 Qué falta y en qué orden
│   └── original/                  El HTML monolítico original, como referencia
├── vercel.json
└── .env.example
```

**Dónde editar qué.** El contenido del taller vive completo en
`assets/js/data/`. Cambiar un dato de un país, agregar una fuente o ajustar el
texto de una meta no requiere tocar la lógica. Los archivos de lógica
(`module1.js`, `module2.js`, `proposal.js`) solo se editan para cambiar el
comportamiento de la app.

Los scripts se cargan como scripts clásicos en el orden declarado al final de
`index.html`, no como módulos ES. Es deliberado: la interfaz usa atributos
`onclick` en el HTML, que necesitan funciones en el ámbito global. Si se
agrega un archivo nuevo, hay que declararlo en `index.html`.

---

## Conexión con el Google Sheet

El navegador nunca habla directamente con Google. Envía el registro a
`/api/save`, y esa función serverless lo reenvía al Apps Script del Sheet.
Así la URL del Apps Script y el token no quedan expuestos en el código del
cliente, no hay que pelear con CORS, y la app puede leer la respuesta real
para mostrarle al equipo si su trabajo quedó guardado.

```
Navegador ──POST /api/save──▶ Función Vercel ──POST /exec──▶ Apps Script ──▶ Google Sheet
```

### Puesta en marcha

1. Crear un Google Sheet nuevo.
2. Extensiones → Apps Script, pegar `docs/AppsScript_TallerAdium.gs` y
   reemplazar `CAMBIA_ESTE_TOKEN` por un token propio
   (`openssl rand -hex 24`).
3. Implementar → Nueva implementación → Aplicación web, ejecutar **como yo** y
   con acceso para **cualquier persona**. Copiar la URL que termina en `/exec`.
4. En Vercel → Settings → Environment Variables, para Production y Preview:

   | Variable | Valor |
   |---|---|
   | `SHEETS_WEBHOOK_URL` | la URL `/exec` del paso 3 |
   | `SHEETS_WEBHOOK_TOKEN` | el mismo token del paso 2 |

5. Volver a desplegar para que el despliegue tome las variables.

Detalle de las columnas y de cómo se actualiza cada fila: `docs/SHEET.md`.

**Mientras el Sheet no esté configurado** la app funciona igual: `/api/save`
responde `501`, el indicador del encabezado dice "Guardado en este equipo" y
todo el trabajo se conserva en el navegador del equipo.

### Respaldo local

Cada cambio se guarda también en `localStorage` con el nombre del equipo. Si a
un equipo se le recarga la página o se le cierra el navegador a mitad del
taller, al volver a entrar la app le ofrece continuar donde quedó. El respaldo
caduca a las 12 horas y "Nuevo caso" lo borra, previa confirmación.

---

## Despliegue en Vercel

```bash
npx vercel@latest link      # una vez, para vincular el proyecto
npx vercel@latest           # despliegue de vista previa
npx vercel@latest --prod    # producción
```

Con el repositorio conectado a Vercel, cada push a `main` despliega a
producción y cada rama abre una vista previa. `vercel.json` fija el runtime
Node 24 para la función y agrega encabezados de seguridad básicos.

El sitio lleva `<meta name="robots" content="noindex, nofollow">`: es material
de trabajo para un cliente, no una página que deba aparecer en buscadores.

---

## Verificado en esta versión

- **Responsive** — recorrido completo en Chromium a 360, 390, 768, 1024 y
  1440 px de ancho, sin errores de consola. El
  documento nunca hace scroll horizontal; las rejillas de países, perfiles,
  visualizaciones y columnas de la propuesta colapsan a una sola columna en
  móvil, y los botones pasan a ancho completo.
- **Táctil** — el catálogo de herramientas del Paso 4 se armaba solo por
  arrastre HTML5, que no dispara en tablet ni en móvil. Ahora un toque mueve
  la tarjeta entre columnas y el arrastre sigue disponible en escritorio.
- **Teclado y lectores de pantalla** — las tarjetas y los chips, que son
  `<div>`, recibieron rol, foco y respuesta a Enter/Espacio, con `aria-pressed`
  y `aria-checked` reflejando la selección. El indicador de guardado es una
  región `aria-live`.
- **Impresión** — la hoja de impresión oculta el encabezado y los controles y
  fuerza el color del bloque de portada, para que el PDF salga presentable.
- **Referencias cruzadas de datos** — cada herramienta apunta a evidencia que
  existe, cada meta tiene herramientas y métricas asociadas, y no hay ids
  duplicados ni clases sin estilo. `npm run check` lo verifica.
- **Contenido: 8 países, 4 perfiles de decisor, 6 metas, 7 herramientas**, 39
  fuentes oficiales de país y 5 publicaciones de evidencia de Suprahyal, todas
  con enlace.

## Lo que quedó pendiente

Hay tres huecos de contenido que la validación dejó a la vista y que necesitan
decisión del equipo antes del taller — el más importante es que los guiones
por perfil×meta están escritos pero no se muestran en pantalla. Están
detallados, con opciones y orden sugerido, en **[docs/ROADMAP.md](docs/ROADMAP.md)**.

---

## Créditos

ALZAK Consulting & Research para Adium LATAM. La evidencia de Suprahyal citada
en la app proviene de las publicaciones enlazadas en cada tarjeta; las fichas
de país citan fuentes oficiales primarias con su URL.
