# Ruta de trabajo

Estado al 2 de septiembre de 2026. El taller es en octubre de 2026.

La app funciona de punta a punta: se recorren las siete pantallas, se genera el
argumento y sale la propuesta imprimible. Lo que queda son **huecos de
contenido** y la conexión del Sheet. La lista está en orden de impacto.

---

## Bloque A · Decisiones de contenido (necesitan al gerente)

### 1. Los guiones por perfil × meta están escritos pero no se muestran

**El hallazgo.** El archivo trae un objeto `STORY` con guiones completos por
combinación de decisor y meta: dónde ocurre la conversación, quiénes son los
protagonistas, cuál es el problema, qué acciones proponer a corto y a largo
plazo, y el resumen reto/solución/resultado. Son unos 30 KB de contenido
curado. La función que lo lee, `getStory()`, **no se llama en ninguna parte**:
todo ese material nunca llega a la pantalla. Hoy el Paso 3 muestra solo las
preguntas guía genéricas ("¿Cuándo y dónde tiene lugar la historia?") y las
frases sugeridas que se arman con el país y la meta.

**El segundo hallazgo.** De las 24 combinaciones posibles (4 perfiles × 6
metas), solo 5 tienen guion propio:

| Con guion propio | Sin guion |
|---|---|
| pagador orientado a valor × inclusión | las otras 19 combinaciones |
| decisor financiero × presupuesto | |
| decisor financiero × negociación | |
| clínico prescriptor × prescripción | |
| clínico administrativo × inclusión | |

El fallback devuelve el guion de *decisor financiero × presupuesto*. Si se
enciende `getStory()` tal cual está, un equipo que eligió **clínico prescriptor
× diferenciación** vería un guion que habla de un director financiero y de
techos presupuestales. Sería peor que no mostrar nada.

Hay además una clave `STORY.acc` para un perfil "gestor de acceso" que no
existe en la lista de perfiles: contenido escrito para un perfil que se eliminó.

**Opciones.**

- **A — Mostrarlo solo donde existe.** Encender `getStory()` con la
  comprobación `tieneGuionPropio()` (ya está escrita en `module2.js`), y en las
  5 combinaciones con guion mostrar un bloque "Guion sugerido para esta
  combinación" con botones para insertar el texto en los campos. Las otras 19
  siguen como hoy. Es media jornada de trabajo y no requiere escribir
  contenido nuevo.
- **B — Completar las 24 combinaciones** y encenderlo para todas. Son 19
  guiones nuevos: el trabajo está en la redacción, no en el código.
- **C — Retirar `STORY`** y quedarse con las frases sugeridas actuales. Deja
  el repositorio más limpio, a costa de descartar contenido ya escrito.

**Recomendación: A ahora, y B para las combinaciones que el gerente espere que
sean más frecuentes en el salón.** Cuáles son esas depende de la composición
de los grupos, y esa información la tiene él.

### 2. La meta 6 no tiene datos propios en el Paso 2

`VIZ` no tiene entrada para la meta *"Defender el precio frente a una objeción
de costo"*, así que cae en los datos de la meta de presupuesto (ICER dominante
y ahorro de USD 576 por paciente). Para defender un precio esas cifras son
pertinentes, pero el encuadre no es el mismo: la conversación de negociación
gira alrededor del costo total del tratamiento contra el precio unitario del
genérico.

**Pendiente:** definir las dos tarjetas de datos de esa meta. La evidencia
disponible ya en el repositorio (Castro 2015 y Altman 2015) alcanza; falta
decidir qué cifras se destacan y con qué redacción. No conviene que lo
improvise el código.

### 3. Siete de los ocho países tienen ficha reducida

Colombia tiene la ficha completa: estructura del sistema, financiamiento,
proceso de inclusión de tecnologías, mecanismo de compra y pago, vía alterna de
acceso y contexto reciente, con 10 fuentes primarias. Los otros siete solo
tienen el párrafo introductorio.

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
el taller se dicta con grupos por país, la asimetría se va a notar.

**Pendiente:** completar los seis campos por país siguiendo el modelo de
Colombia en `assets/js/data/countries.js`. Es trabajo de investigación con
fuente primaria, no de programación. Prioridad por número esperado de equipos
por país — el gerente decide el orden.

---

## Bloque B · Conexión del Sheet (bloquea el ensayo general)

### 4. Crear el Sheet y configurar las variables

El puente está construido y probado del lado de la app: la función
`/api/save` valida el registro, lo recorta y lo reenvía. Falta lo que depende
de las credenciales:

1. Crear el Google Sheet.
2. Pegar `docs/AppsScript_TallerAdium.gs`, poner un token propio e implementar
   como aplicación web.
3. Cargar `SHEETS_WEBHOOK_URL` y `SHEETS_WEBHOOK_TOKEN` en Vercel.
4. Volver a desplegar y comprobar con los dos `curl` de `docs/SHEET.md`.

Mientras esto no esté, la app guarda todo en el navegador de cada equipo y el
indicador dice "Guardado en este equipo". Nada se rompe, pero el facilitador no
ve nada desde el salón.

### 5. Decidir si el Sheet guarda estado o histórico

Hoy cada equipo ocupa una fila que se sobreescribe. Sirve para facilitar en
vivo. Si además se quiere ver cómo evolucionó el trabajo de cada equipo durante
la sesión, hay que cambiar el Apps Script para que siempre haga `appendRow`.
Son dos líneas, pero cambia cómo se lee la hoja y por eso es una decisión, no
un ajuste.

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

- Safari en iPhone y iPad — es el navegador más probable en el salón y el que
  más difiere.
- La impresión a PDF desde un teléfono.
- Varios equipos guardando a la vez contra el Sheet real. El Apps Script usa
  un lock, pero conviene verlo con 6–8 equipos simultáneos.
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
