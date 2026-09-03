# Ruta de trabajo

> **Aviso de estado (3 de septiembre de 2026).** Lo que está desplegado es la
> versión 3 del archivo del gerente, tal cual la entregó, con dos únicos
> cambios: el registro apunta a `/api/save` para que el Sheet reciba las filas,
> y la tipografía se escaló desde la raíz a 19px de base con la columna a
> 1300px. El rediseño anterior —temas claro y oscuro, iconos, soporte táctil,
> previsualización de impresión, marca ALZAK, pie legal y estructura modular—
> está completo en la rama `rediseno-alzak`. **Todo lo que este documento
> describe más abajo se refiere a esa rama, no a lo desplegado.**
>
> **Limitación conocida y aceptada.** En la versión desplegada el Paso 4 solo
> responde al arrastre HTML5, que no dispara en móvil ni en tablet, y la
> columna «tu combinación» arranca vacía. Un equipo que trabaje desde el
> celular no puede agregar ninguna herramienta y por lo tanto nunca genera el
> argumento. Se decidió dejarlo así para mantener el archivo fiel al original.
> Si se quiere corregir, el arreglo es el que ya está aplicado en la rama:
> un `click` que mueve la tarjeta entre columnas, conviviendo con el arrastre.

Estado al 2 de septiembre de 2026. El taller es en septiembre de 2026.

La app funciona de punta a punta: se recorren las siete pantallas, se genera el
argumento y sale la propuesta imprimible. Lo que queda son **huecos de
contenido** y la conexión del Sheet. La lista está en orden de impacto.

---

## Bloque A · Contenido

### 1. Revisión de evidencia de septiembre de 2026: aplicada

El equipo de contenido entregó una revisión de fondo del archivo. La evidencia
pasó de 5 publicaciones a 17, con correcciones materiales a cifras que ya
estaban desplegadas:

| Dato | Estaba | Corregido |
|---|---|---|
| Vásquez | «USD 45,1M vs 50,2M a 5 años», leído como un ahorro de USD 5M | «USD 45,2M vs USD 27,3M»: más caro y más efectivo. No calcula ICER, así que no es un ahorro |
| Altman | «1.312 días con 5+ ciclos», cohorte de 79M | «484 días con cualquier ciclo (mediana)», cohorte de 182.022 sobre una base de ~79M |
| LATINVISCO | «recomendación 1A GRADE» | Rec. 1 es 1A (clínica); la Rec. 12, que es la de acceso, es 1C. El §3.15 atribuye la costo-efectividad al alto peso molecular en dosis única |
| Castro | ICER dominante | ICER dominante, con precios de 2012 |
| Umbral en 7 países | «Estimación empírica publicada» | «Sin umbral oficial publicado», con el detalle real de cada país |

La corrección de Vásquez era la más seria: la tarjeta de «USD 5M de ahorro a
5 años» que estuvo en producción era incorrecta, y la meta de negociación se
había construido sobre esa cifra.

La revisión también incorpora contraevidencia y conflictos de interés
declarados, que antes no aparecían en ninguna parte: Molloy 2023 encontró más
artroplastia entre usuarios de hialuronato en 7,3M de registros; la guía
MINSAL de Chile sugiere no usar en artrosis moderada; el análisis de
Castañeda 2024 está financiado por el competidor; PANLAR 2016 no respalda la
diferenciación por peso molecular; y Altman 2015 tiene sesgo de selección.

Todo eso se muestra en un campo nuevo, `advertencia`, presente en cuatro
herramientas y en la ficha de Chile. **Va siempre a la vista, nunca dentro de
un acordeón**: es lo que el equipo se va a encontrar enfrente en la reunión, y
si hay que abrirlo, el día del taller nadie lo abre.

### 2. Guiones por perfil × meta: retirados

La revisión de contenido eliminó el objeto `STORY`. Los guiones habían estado
en producción en 5 de las 24 combinaciones; se retiran para seguir la versión
de contenido, y el Paso 3 vuelve a apoyarse en las preguntas guía y las frases
sugeridas. Si en algún momento se quieren recuperar, están en el historial de
git y en `docs/original/`.

### 3. Paso 2 del Módulo 2: publicaciones en lugar de tarjetas de datos

Las tarjetas con cifras (`VIZ`) se reemplazaron por enlaces a las cinco
publicaciones principales, sin cifras, para que el equipo vaya a la fuente y
no a un número ya resumido. `VIZ` se eliminó del proyecto: en el archivo de
contenido había quedado actualizado pero huérfano (`getViz()` no se invocaba
en ninguna parte), el mismo caso que `STORY` en la versión anterior.

### 4. Siete de los ocho países siguen con ficha reducida

La revisión actualizó el umbral de costo-efectividad de los ocho países y
agregó la advertencia de Chile, pero no la ficha ampliada. Solo Colombia
tiene estructura del sistema, financiamiento, proceso de inclusión, mecanismo
de compra, vía alterna y contexto reciente.

| País | Fuentes | Ficha ampliada |
|---|---|---|
| Colombia | 10 | sí |
| México | 6 | no |
| Chile | 5 | no |
| Costa Rica | 5 | no |
| Perú | 4 | no |
| Ecuador | 3 | no |
| Paraguay | 3 | no |
| Argentina | 3 | no |

Un equipo que elige México ve bastante menos que uno que elige Colombia. Si
los grupos se arman por país, se va a notar.

### 5. Pendientes menores de contenido

**El umbral de Colombia.**

Los siete países pasaron a decir «sin umbral oficial publicado», pero el de
Colombia quedó en «Estimación empírica publicada», sin número, mientras que la
publicación de Espinosa 2022, que ahora sí está citada en la herramienta de
costo-efectividad, trae la cifra: USD 5.180,80 por AVAC, 0,86 del PIB per
cápita. Vale confirmar con contenido si la ficha de Colombia debería mostrar
ese valor.

**La guía IMSS de México.** De las 17 publicaciones, 16 son alcanzables desde
la pantalla: se abren desde la herramienta que las cita, desde el Paso 2 o
desde el enlace de una advertencia. La única que quedó sin enlace es
`IMSS-079-08`, la guía mexicana que recomienda la viscosuplementación cuando
el tratamiento no farmacológico falla. No la cita ninguna herramienta ni la
ficha de ningún país, así que está en los datos pero no llega al equipo.
Encaja como fuente de México o como respaldo de la herramienta de consenso;
la decisión de dónde ponerla es de contenido.

---

## Bloque B · Conexión del Sheet: resuelto

### 4. Sheet conectado y verificado

El Google Sheet está creado, el Apps Script implementado como aplicación web
(versión 2) y las variables `SHEETS_WEBHOOK_URL` y `SHEETS_WEBHOOK_TOKEN`
cargadas en Vercel para Production y Preview. Verificado en producción con dos
recorridos completos de equipo: las 24 columnas de datos llegaron llenas y el
indicador del encabezado quedó en "Guardado".

Dos fallos aparecieron en `/api/save` al probar contra el Apps Script real y
quedaron corregidos, porque ninguno era visible sin el Sheet conectado:

- Apps Script responde `302` hacia `script.googleusercontent.com`, y al seguir
  el salto se arrastraba la cabecera `Content-Type: application/json` de la
  primera petición. Google la rechaza con `405` **aunque la escritura ya se
  hizo**, así que la app habría mostrado "Sin conexión" sobre un guardado
  exitoso. Ahora el salto se sigue a mano con un GET limpio.
- Apps Script devuelve `200` incluso cuando rechaza el registro: el veredicto
  viene en el cuerpo. Un token mal copiado se habría visto como guardado
  correcto, y el problema aparecería el día del taller al abrir el Sheet
  vacío. Ahora se lee el cuerpo y un `ok:false` devuelve `502` con el motivo.

### 5. Decidir si el Sheet guarda estado o histórico

Hoy cada equipo ocupa una fila que se sobreescribe, y eso es lo que sirve para
facilitar en vivo: se mira `paso_actual` y se sabe quién va adelantado. Si
además se quiere ver cómo evolucionó el trabajo de cada equipo durante la
sesión, hay que cambiar el Apps Script para que siempre haga `appendRow`. Son
dos líneas, pero cambia cómo se lee la hoja, así que es una decisión y no un
ajuste.

---

## Bloque C · Antes del taller

### 6. Nombres de equipo asignados

El nombre del equipo es la llave de la fila del Sheet. Dos equipos que
escriban el mismo nombre se sobreescriben mutuamente. Conviene repartir
nombres asignados al inicio ("Grupo México 1", "Grupo México 2"…) en lugar de
dejarlos libres. Si se prefiere blindarlo por código, la alternativa es una
lista cerrada de equipos en un desplegable.

### 7. Ensayo general con dispositivos reales

Lo verificado hasta ahora: recorrido completo en Chromium a 360, 390, 768,
1024 y 1440 px, sin scroll horizontal en ninguna de las siete pantallas, sin
errores de consola, el catálogo de herramientas operable por toque y por
arrastre, y el respaldo local reanudando correctamente tras recargar.

Lo que falta probar y no se puede simular:

- **Safari en iPhone y iPad.** Es el navegador más probable en el salón y el que
  más difiere.
- La impresión a PDF desde un teléfono.
- **Safari en iPhone y iPad.** Es el navegador más probable en el salón y el
  único que no se pudo verificar: WebKit necesita librerías del sistema que
  requieren `sudo` para instalarse, y un iOS real no se emula.

  Tres problemas conocidos de iOS ya se corrigieron revisando el código:

  | Problema | Efecto en el taller | Corrección |
  |---|---|---|
  | `backdrop-filter` sin prefijo `-webkit-` | Safari lo ignoró hasta la versión 18: el encabezado sticky quedaría sin difuminado y el contenido pasando por detrás sería ilegible | prefijo agregado |
  | `min-height:100vh` | En iOS, `vh` no descuenta la barra del navegador: el final de cada pantalla quedaría escondido debajo | `100dvh` declarado después |
  | Campos de texto bajo 16px | Safari amplía la página al enfocarlos y no vuelve al zoom original. El Paso 3 son cinco textareas, así que el equipo trabajaría ampliado todo el paso | 16px hasta 820px de ancho |

  Lo que sigue sin verificar y solo se ve en un dispositivo real: el
  desplazamiento con la barra de Safari colapsando y expandiéndose, el
  comportamiento del teclado virtual sobre los campos del Paso 3, y la
  impresión a PDF, que en iOS pasa por la hoja de compartir y no por un
  diálogo de impresión.

  Con un iPhone o iPad a mano son diez minutos: recorrido completo en
  https://taler-adium.vercel.app y confirmar que la fila llega al Sheet.
- La red del lugar del taller. Si es inestable, el respaldo local cubre al
  equipo, pero el facilitador vería el Sheet incompleto.

### 8. Revisión de contenido por el equipo médico

La app cita 39 fuentes oficiales de país y 5 publicaciones de evidencia, todas con URL. La validación técnica confirmó que
los enlaces están bien formados y que cada herramienta apunta a evidencia que
existe en el archivo, pero **no** que cada cifra corresponda a lo que dice el
paper. Esa revisión la tiene que hacer quien conoce la evidencia de Suprahyal.

---

## Bloque D · Mejoras opcionales

Ninguna bloquea el taller.

- **Exportar la propuesta a un documento editable.** Hoy se imprime o se
  guarda como PDF. Si los equipos deben entregar algo que se siga editando,
  habría que generar un `.docx`.
- **Vista de facilitador dentro de la app.** Una pantalla que lea el Sheet y
  muestre el avance de todos los equipos, para proyectar en el salón sin abrir
  Google Sheets.
- **Modo claro.** La interfaz es oscura. En un salón con proyector y luz
  ambiente alta, un modo claro se lee mejor.
- **Ampliar el ensayo automatizado.** `scripts/check.mjs` valida la
  estructura; la prueba de recorrido completo en navegador se hizo a mano.
  Dejarla como script del repositorio permitiría correrla en cada cambio.
