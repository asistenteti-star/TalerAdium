# Google Sheet del taller

## Cómo se comporta

Cada equipo ocupa **una sola fila**, identificada por el nombre que escribió al
entrar. Cada vez que avanza o escribe algo, la app reenvía el registro completo
y el Apps Script sobreescribe esa fila.

La consecuencia práctica: la hoja siempre muestra el estado actual de cada
equipo, no un histórico. Es lo que sirve para facilitar: se mira la columna
`paso_actual` y se sabe quién va adelantado y quién está trabado, sin filtrar
miles de filas.

Si se necesita el histórico de cómo evolucionó cada equipo, hay que cambiar el
Apps Script para que use `appendRow` siempre. Está anotado en el ROADMAP.

**El nombre del equipo es la llave.** Dos equipos con el mismo nombre escriben
sobre la misma fila y se sobreescriben mutuamente. Conviene entregar los
nombres asignados al inicio del taller ("Grupo México 1", "Grupo México 2") en
lugar de dejarlos libres.

## Cuándo se dispara un envío

| Momento | Disparador |
|---|---|
| Al confirmar el nombre del equipo | inmediato |
| Al elegir país, decisor o meta | inmediato |
| Al cambiar la combinación de herramientas | inmediato |
| Al cambiar de pantalla o de paso | inmediato |
| Al escribir en cualquier campo de texto | 1,2 s después de dejar de escribir |
| Al pulsar "Listo para presentar" | inmediato |

## Columnas

La hoja se llama `Registros` y el Apps Script crea el encabezado la primera vez.
El orden es fijo: si se agrega una columna hay que agregarla en los tres lados
(`COLUMNAS` en el Apps Script, `CAMPOS` en `api/save.js` y `collectData()` en
`assets/js/storage.js`).

| Columna | Origen | Contenido |
|---|---|---|
| `equipo` | pantalla inicial | Nombre escrito por el equipo. Llave de la fila. |
| `recibido_en` | servidor | Marca de tiempo ISO del último envío. |
| `paso_actual` | app | En qué pantalla está el equipo en este momento. |
| `pais` | Módulo 1 · paso 1 | País elegido. |
| `decisor` | Módulo 1 · paso 2 | Perfil de decisor elegido. |
| `meta` | Módulo 1 · paso 3 | Meta de acceso elegida. |
| `apertura` | Módulo 2 · paso 1 | Apertura del decisor ante nuevas tecnologías. |
| `presion` | Módulo 2 · paso 1 | Presión principal que enfrenta el decisor. |
| `relacion` | Módulo 2 · paso 1 | Estado de la relación con Adium. |
| `objecion` | Módulo 2 · paso 1 | Objeción que se anticipa. |
| `descripcion_decisor` | Módulo 2 · paso 1 | Párrafo que la app redacta con las cuatro anteriores. |
| `dato_tipo` | Módulo 2 · paso 2 | Tipo de evidencia adicional que aporta el equipo. |
| `dato_fuente` | Módulo 2 · paso 2 | Fuente de esa evidencia. |
| `dato_valor` | Módulo 2 · paso 2 | Cifra o hallazgo específico, escrito por el equipo. |
| `dato_adicional_texto` | Módulo 2 · paso 2 | Párrafo que la app redacta con los tres anteriores. |
| `herramienta_activa` | Módulo 1 · paso 4 | Herramientas de la combinación, separadas por ` + `. |
| `escenario` | Módulo 2 · paso 3 | Escenario de la historia. Texto libre. |
| `desarrollo` | Módulo 2 · paso 3 | Desarrollo de la historia. Texto libre. |
| `acciones_corto_plazo` | Módulo 2 · paso 3 | Acciones hasta 3 meses. Texto libre. |
| `acciones_largo_plazo` | Módulo 2 · paso 3 | Acciones de más de 3 meses. Texto libre. |
| `metricas` | Módulo 2 · paso 3 | Métricas de validación. Texto libre. |
| `reto` | Módulo 2 · paso 3 | El reto, en una frase. |
| `solucion` | Módulo 2 · paso 3 | La solución, en una frase. |
| `resultados_esperados` | Módulo 2 · paso 3 | Resultados esperados, en una frase. |
| `listo_para_presentar` | app | `SI` cuando el equipo llegó a la propuesta final; `NO` antes. |

Cada valor se recorta a 8.000 caracteres en `api/save.js` antes de reenviarse.

## Tablero de facilitación sugerido

En una segunda hoja del mismo libro, para seguir el avance en vivo:

```
=QUERY(Registros!A:Y; "select A, C, D, E, F, X where A is not null order by B desc"; 1)
```

Columnas: equipo · paso actual · país · decisor · meta · listo para presentar.

## Comprobar que el puente funciona

```bash
# 1. El Apps Script responde (abrir la URL /exec en el navegador también sirve)
curl -sL "$SHEETS_WEBHOOK_URL"
# → {"ok":true,"servicio":"Taller Adium · receptor de registros"}

# 2. La función de Vercel escribe una fila de prueba
curl -s -X POST https://<tu-dominio>/api/save \
  -H 'Content-Type: application/json' \
  -d '{"equipo":"PRUEBA","paso_actual":"prueba de conexión"}'
# → {"ok":true}
```

Si el segundo comando devuelve `501`, faltan las variables de entorno en
Vercel. Si devuelve `502`, las variables están pero el Apps Script rechaza la
llamada: casi siempre es que el token no coincide, o que la implementación
quedó con acceso restringido en lugar de "cualquier persona".

Borrar la fila `PRUEBA` de la hoja antes del taller.
