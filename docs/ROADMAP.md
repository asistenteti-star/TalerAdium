# Ruta de trabajo

Estado al 2 de septiembre de 2026. El taller es en octubre de 2026.

La app funciona de punta a punta: se recorren las siete pantallas, se genera el
argumento y sale la propuesta imprimible. Lo que queda son **huecos de
contenido** y la conexión del Sheet. La lista está en orden de impacto.

---

## Bloque A · Contenido

### 1. Guiones por perfil × meta — resuelto a medias

**Lo que se encontró.** El archivo original traía un objeto `STORY` con
guiones completos por combinación de decisor y meta —dónde ocurre la
conversación, quiénes son los protagonistas, cuál es el problema, qué acciones
proponer a corto y a largo plazo, y el resumen reto/solución/resultado— pero la
función que los lee, `getStory()`, **no se invocaba en ninguna parte**. Unos
30 KB de contenido curado que nunca llegaba a la pantalla.

**Lo que se hizo.** El guion ya se muestra en el Paso 3, pero **solo en las
combinaciones que tienen guion propio**. Aparece como bloque "Guion sugerido
para esta combinación" con las cuatro piezas de la narrativa y un botón que las
inserta en el campo de texto para que el equipo las edite; las acciones de
corto y largo plazo y las tres frases del resumen se ofrecen como frases
insertables junto a cada campo.

La restricción es deliberada. El fallback original devolvía el guion de
*decisor financiero × presupuesto*, así que un equipo que eligiera **clínico
prescriptor × diferenciación** habría visto un guion sobre un director
financiero y techos presupuestales. `getStory()` ahora devuelve `null` cuando
no hay guion propio y esas combinaciones siguen viendo solo las preguntas guía.

**Lo que queda pendiente.** 5 de las 24 combinaciones tienen guion:

| Combinación | Estado |
|---|---|
| pagador orientado a valor × inclusión | guion propio |
| decisor financiero × presupuesto | guion propio |
| decisor financiero × negociación | guion propio |
| clínico prescriptor × prescripción | guion propio |
| clínico administrativo × inclusión | guion propio |
| las otras 19 combinaciones | preguntas guía únicamente |

Redactar las 19 faltantes es trabajo de contenido, no de código: la estructura
ya está y cada guion nuevo se agrega a `assets/js/data/storytelling.js`
copiando la forma de los existentes. Conviene priorizar por las combinaciones
que se esperen más frecuentes en el salón, y eso depende de la composición de
los grupos.

**Decisión suelta.** Hay una clave `STORY.acc` con un guion escrito para un
perfil "gestor de acceso" que ya no existe en la lista de perfiles. Es el único
guion de la meta *riesgo compartido*, así que hoy ninguna combinación de esa
meta tiene guion. El contenido está intacto y es candidato a reasignarse a un
perfil existente —el escenario describe una negociación con un pagador, así que
encajaría en *pagador orientado a valor* o en *decisor financiero*—, pero
reasignarlo cambia lo que ve el equipo en el salón y eso lo decide contenido.

### 2. Datos de la meta 6 — resuelto

`VIZ` no tenía entrada para *"Defender el precio frente a una objeción de
costo"* y caía silenciosamente en los datos de presupuesto. Ya tiene sus dos
tarjetas propias, construidas con las cifras que ya estaban verificadas en el
repositorio (Castro 2015 y Vásquez 2024) pero encuadradas para una mesa de
negociación: costo total del tratamiento contra precio unitario, y el ahorro
documentado a 5 años como referencia contra la cual medir el descuento que
pide el comité.

No se inventó ninguna cifra. Si el equipo médico prefiere otro encuadre o
destacar otros números, se cambia en `assets/js/data/storytelling.js`.

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
Colombia en `assets/js/data/countries.js`. Es investigación con fuente
primaria —normativa, resoluciones, cifras oficiales de cobertura y gasto—, no
programación, y no es material que convenga redactar sin verificar cada dato
contra su fuente. Prioridad por número esperado de equipos por país.

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
