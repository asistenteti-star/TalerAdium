# Taller de Farmacoeconomía Aplicada · Adium LATAM

**En producción:** https://taler-adium.vercel.app

Herramienta de trabajo en vivo para el taller de farmacoeconomía de Adium LATAM
(octubre 2026). Cada equipo participante recorre dos módulos desde su propio
dispositivo y termina con una propuesta imprimible.

**Módulo 1 · Segmentación.** El equipo elige su mercado (8 países de LATAM),
el tipo de decisor que va a enfrentar y la meta de acceso que persigue. La app
devuelve el contexto verificado del sistema de salud de ese país y el conjunto
de herramientas de economía de la salud que aplica al caso.

**Módulo 2 · Storytelling.** Con esa combinación, el equipo construye el
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
│       ├── data/                 CONTENIDO: se edita para el taller
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

El Sheet del taller **ya está conectado** en producción. `SHEETS_WEBHOOK_URL`
y `SHEETS_WEBHOOK_TOKEN` están cargadas en Vercel para Production y Preview, y
el registro de punta a punta quedó verificado: dos recorridos completos de
equipo aterrizaron en el Sheet con las 24 columnas de datos llenas y el
indicador del encabezado en "Guardado".

### Volver a montarlo desde cero

Si hay que rehacerlo (otro Sheet, otra cuenta, rotación del token), los pasos
son estos:

1. Crear un Google Sheet nuevo. La hoja `Registros` y su encabezado los crea
   el script solo.
2. Extensiones → Apps Script, pegar `docs/AppsScript_TallerAdium.gs` y
   reemplazar `CAMBIA_ESTE_TOKEN` por un token propio
   (`openssl rand -hex 24`). **El token va solo en el editor de Apps Script,
   nunca en este repositorio, que es público.** `npm run check` falla si
   alguien lo guarda en la plantilla.
3. Implementar → Nueva implementación → Aplicación web, ejecutar **como yo** y
   con acceso para **cualquier persona**. Copiar la URL que termina en `/exec`.
   Si el acceso queda restringido, Google redirige al login y la función
   recibe HTML en vez de JSON.
4. Cargar las variables en Vercel, para Production y Preview:

   | Variable | Valor |
   |---|---|
   | `SHEETS_WEBHOOK_URL` | la URL `/exec` del paso 3 |
   | `SHEETS_WEBHOOK_TOKEN` | el mismo token del paso 2 |

5. Volver a desplegar: las variables solo aplican a despliegues nuevos.

Al editar el código del script hay que **crear una versión nueva de la
implementación** (Implementar → Gestionar implementaciones → ✏️ → Nueva
versión). Guardar el archivo no actualiza la aplicación web, porque cada
implementación queda fijada a una versión. La URL `/exec` no cambia.

Detalle de las columnas y de cómo se actualiza cada fila: `docs/SHEET.md`.

**Si las variables no están configuradas** la app funciona igual: `/api/save`
responde `501`, el indicador del encabezado dice "Guardado en este equipo" y
todo el trabajo se conserva en el navegador del equipo.

### Capacidad

Apps Script serializa las escrituras con un lock: medido con 8 equipos
guardando a la vez, cada escritura toma unos 2,8 s y el último de la cola
espera ~22 s. De ahí salen tres números del proyecto: `maxDuration` de 60 s en
`vercel.json`, `waitLock` de 45 s en el Apps Script, y un debounce de 3 s en
el cliente. Además el cliente descarta los envíos cuyo contenido no cambió y
mantiene una sola petición en vuelo por equipo, así que escribir en un campo
de texto no genera una escritura por pulsación.

### Respaldo local

Cada cambio se guarda también en `localStorage` con el nombre del equipo. Si a
un equipo se le recarga la página o se le cierra el navegador a mitad del
taller, al volver a entrar la app le ofrece continuar donde quedó. El respaldo
caduca a las 12 horas y "Nuevo caso" lo borra, previa confirmación.

---

## Despliegue en Vercel

El repositorio está conectado a Vercel: cada push a `main` despliega a
producción y cada rama abre una vista previa. Para desplegar a mano:

```bash
npx vercel@latest link          # una vez, para vincular el proyecto
npx vercel@latest deploy        # vista previa
npx vercel@latest deploy --prod # producción
```

`vercel.json` solo lleva `maxDuration` y los encabezados de seguridad. La
versión de Node se declara en `engines.node` del `package.json`: la clave
`runtime` dentro de `functions` es para runtimes de comunidad y exige el
formato `nombre@versión`, así que poner ahí `nodejs24.x`, que solo es válido en
Next.js, hace que Vercel rechace el archivo y el despliegue falle en la
validación previa, antes de construir.

El sitio lleva `<meta name="robots" content="noindex, nofollow">`: es material
de trabajo para un cliente, no una página que deba aparecer en buscadores.

---

## Verificado en esta versión

- **Registro en el Sheet, de punta a punta en producción.** Dos recorridos
  completos de equipo, con las 24 columnas de datos llenas, indicador en
  "Guardado". Y los casos de borde de `/api/save`: token correcto `200`, el
  mismo equipo dos veces reusa su fila en lugar de duplicarla, token
  equivocado `502` con el motivo, sin nombre de equipo `400`, `GET` `405`, sin
  variables `501`.
- **Concurrencia.** 8 equipos escribiendo simultáneamente: 8 filas distintas,
  ningún choque, ningún fallo.
- **Responsive.** Recorrido completo en Chromium a 360, 390, 768, 1024 y
  1440 px de ancho, sin errores de consola. El
  documento nunca hace scroll horizontal; las rejillas de países, perfiles,
  visualizaciones y columnas de la propuesta colapsan a una sola columna en
  móvil, y los botones pasan a ancho completo.
- **Táctil.** El catálogo de herramientas del Paso 4 se armaba solo por
  arrastre HTML5, que no dispara en tablet ni en móvil. Ahora un toque mueve
  la tarjeta entre columnas y el arrastre sigue disponible en escritorio.
- **Teclado y lectores de pantalla.** Las tarjetas y los chips, que son
  `<div>`, recibieron rol, foco y respuesta a Enter/Espacio, con `aria-pressed`
  y `aria-checked` reflejando la selección. El indicador de guardado es una
  región `aria-live`.
- **Safari en iOS, por revisión de código.** No se pudo ejecutar (WebKit
  necesita librerías del sistema con `sudo`), pero quedaron corregidos los tres
  problemas conocidos que sí se detectan leyendo: `backdrop-filter` sin
  prefijo `-webkit-`, `min-height:100vh` que en iOS no descuenta la barra del
  navegador, y campos de texto por debajo de 16px, que hacen que Safari amplíe
  la página al enfocarlos y no vuelva al zoom original. Falta la prueba en un
  dispositivo real; está anotada en el ROADMAP.
- **Impresión.** La hoja de impresión oculta el encabezado y los controles y
  fuerza el color del bloque de portada, para que el PDF salga presentable.
- **Referencias cruzadas de datos.** Cada herramienta apunta a evidencia que
  existe, cada meta tiene herramientas y métricas asociadas, y no hay ids
  duplicados ni clases sin estilo. `npm run check` lo verifica.
- **Contenido: 8 países, 4 perfiles de decisor, 6 metas, 7 herramientas**, 39
  fuentes oficiales de país y 5 publicaciones de evidencia de Suprahyal, todas
  con enlace.

## Lo que quedó pendiente

En contenido quedan **19 de las 24 combinaciones de perfil × meta sin guion
propio** (las 5 que sí lo tienen ya se muestran en el Paso 3) y **siete de los
ocho países con ficha reducida**: solo Colombia tiene la ficha ampliada del
sistema de salud. Ambas cosas son redacción e investigación con fuente
primaria, no programación.

El detalle completo, con lo ya resuelto y lo que falta, está en
**[docs/ROADMAP.md](docs/ROADMAP.md)**.

---

## Créditos

ALZAK Consulting & Research para Adium LATAM. La evidencia de Suprahyal citada
en la app proviene de las publicaciones enlazadas en cada tarjeta; las fichas
de país citan fuentes oficiales primarias con su URL.
