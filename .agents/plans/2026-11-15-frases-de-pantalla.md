# Plan — Frases de pantalla ("screen") en la biblioteca (issue #1)

> Issue: https://github.com/JuanVilla7/dictado-ingles/issues/1 · Fecha: 2026-11-15
> Todas las decisiones de este plan están confirmadas por el dueño. No hace falta leer la conversación que lo generó.

## Objetivo
Algunas frases de `videos.json` son texto que aparece en pantalla (títulos, carteles, créditos) pero **nadie lo dice**.
Hoy la app pide escribirlas, tanto en el dictado como en los juegos. Después de este cambio:

- Esas frases se marcan con `"screen"` en `videos.json`. **No se borran.**
- En el dictado **nunca se piden**: el video pasa de largo sin pausar y el índice salta a la próxima frase hablada.
- Mientras el video pasa por una de esas frases, se muestra en **gris**, arriba de la frase, como información. No se puede escribir ni traducir.
- "Frase X/Y", el % de las tarjetas y "vas por la N" cuentan **solo las frases habladas**.
- El progreso guardado (`prog-<videoId>`) **sigue siendo el índice crudo** del array, igual que hoy, así que no hay migración.
- Los juegos nunca usan frases de pantalla.

### Criterio de "terminado"
- [x] Las 20 frases de abajo están marcadas en `videos.json` y la verificación de cuentas da exactamente la tabla.
- [x] `npm run validate` pasa (lint + tests + build).
- [ ] **(pendiente, la hace el dueño)** La prueba manual en el navegador (sección Validación) sale bien.
- [x] `IS_FILLER` desaparece de `games.js`.
- [x] `.agents/reference/content.md` documenta el 4º elemento, y `docs/APRENDIZAJES.md` tiene la entrada nueva.

## Contexto

### Decisiones confirmadas que hay que respetar
1. **Formato**: 4º elemento opcional en la tupla: `[inicio, fin, texto, "screen"]`. Sin 4º elemento = frase hablada.
2. **Saltear, no sacar**: el array no cambia de largo ni de orden. Así los índices guardados en `prog-<videoId>` siguen apuntando a la misma frase (regla 3 de AGENT.md).
3. **Progreso guardado = índice crudo**. Al terminar la última frase hablada se guarda `cues.length`, aunque después vengan créditos. Así el video cuenta como terminado.
4. **Inicio del video**: si arrancás desde la primera frase hablada y antes solo hay frases de pantalla (video nuevo, o el botón ⏮), el video carga en **0 s**. Así pasan el título y el cartel en gris, y después pausa en la primera frase hablada. Si retomás a la mitad, carga en tu frase menos 0,2 s, como hoy.
5. **Texto gris**: una línea chica con `📺 En pantalla: <texto>`, **en el lugar de la frase anterior** (`PreviousLine`), solo mientras el tiempo del video está dentro de esa frase.
6. **Solo la biblioteca**: los videos propios (transcripción pegada / .srt) quedan fuera de alcance. El parser no cambia: `createCue` sigue marcando todo como hablado por defecto.
7. Lo único que se modifica a mano en los datos es `videos.json`; el resto sale de la lógica.

### Frases a marcar (confirmadas por el dueño mirando los videos)
Índices base 0 dentro de `cues`. En **Charade no se marca ninguna**.

| Video (id) | Índices a marcar | Total | Habladas |
|---|---|---|---|
| NASA · What is a Black Hole? (`EJXTZ5jpSmk`) | 0, 1, 25, 26 | 27 | **23** |
| NASA · Where Does Space Begin? (`2aVWZOFrjdc`) | 0, 1, 33, 34 | 35 | **31** |
| NASA · What Are the Dangers of Going to Space? (`ryHNj_SLwlE`) | 0, 1, 38, 39 | 40 | **36** |
| NASA · Are There Earthquakes on Other Planets? (`s3bffub-9UM`) | 0, 1, 30, 31 | 32 | **28** |
| NASA · How Big is Space? (`r0bbq-soSfI`) | 0, 1, 28, 29 | 30 | **26** |
| Charade (5 videos) | — | 34 / 20 / 30 / 34 / 35 | iguales |

En todos los videos de NASA, el 0 es el título con la pregunta, el 1 es "We Asked a NASA Scientist.", el anteúltimo es "We Asked a NASA Scientist." y el último es "NASA. A NASA 360 Production.".

### Archivos relevantes
- `frontend/public/videos.json`: **una sola línea minificada**. Se probó que `JSON.stringify(JSON.parse(s)) === s`, así que reescribirlo con `JSON.stringify` (sin indentar) deja un diff mínimo.
- `src/domain/entities/Cue.js`: `createCue` y `cueFromTuple`.
- `src/domain/services/timing.js`: `shouldAutoPause`, `replayWindow`, `manualPlayLimit`, `cueIndexAt`.
- `src/domain/services/games.js`: `eligibleRounds`, con el parche `IS_FILLER = /NASA 360|We Asked a NASA/i` que hay que sacar.
- `src/application/usecases/PracticeSession.js`: `start`, `previousCue`, `#finishLine`, `tick`, `#manualResume`, `goTo`, `#saveProgress`.
- `src/application/usecases/ProgressService.js`: `get` y `set` por video.
- `src/presentation/App.jsx`: `openVideo`, que hoy calcula `start` y el tiempo de carga a mano.
- `src/presentation/pages/PracticePage.jsx`: "Frase X/Y", los botones ⏮ ‹ ›, `PreviousLine` y `clock` (se actualiza cada 200 ms).
- `src/presentation/components/VideoCard.jsx`: `total`, la barrita de %, "N frases", "vas por la N" y "✔ terminado".
- `src/presentation/pages/HomePage.jsx` (línea 17, filtro `inProgress`) y `GamesPage.jsx` (línea 34): pasan `done` a `VideoCard`.
- Tests: `tests/domain/games.test.js`, `tests/domain/timing.test.js`, `tests/app/app.test.jsx` (fixture `LIBRARY`).

### Reglas de arquitectura que aplican
- La lógica nueva va primero en `domain/` con su test (regla 1).
- No hay puerto nuevo ni servicio externo, así que `main.jsx` y `fakes.js` **no cambian**.
- La presentación no hace cuentas de negocio: las pide a la capa de aplicación (`practice.*`, `progress.summary(...)`).

## Diseño por capa

### domain
**`src/domain/entities/Cue.js`**
- `createCue({ start, end, text, bStart, bEnd, spoken = true })`: agrega `spoken` al objeto congelado.
- `cueFromTuple([start, end, text, kind])`:
  - `kind === undefined` → `spoken: true`
  - `kind === 'screen'` → `spoken: false`
  - cualquier otro valor → `throw new Error('Tipo de frase desconocido: ...')`. Así un error de tipeo en `videos.json` salta en los tests y no pasa en silencio.

**Nuevo `src/domain/services/spoken.js`** (todas puras):
```
isSpoken(cue)                    → cue.spoken !== false   (los objetos sin el campo cuentan como hablados)
nextSpokenIndex(cues, from)      → primer i >= from con isSpoken; si no hay, cues.length
prevSpokenIndex(cues, from)      → último i <= from con isSpoken; si no hay, -1
spokenCount(cues, upTo = cues.length) → cantidad de habladas con i < upTo
screenCueAt(cues, time)          → la frase NO hablada con start <= time < end, o null
startTimeFor(cues, index)        → 0 si index > 0 y todas las anteriores son de pantalla;
                                   si no, Math.max(0, cues[index].start - 0.2)
videoProgress(cues, savedIndex)  → { done: spokenCount(cues, savedIndex), total: spokenCount(cues),
                                     finished: total > 0 && done >= total }
```
Sobre `startTimeFor`: la condición `index > 0` hace que los videos propios (sin frases de pantalla) sigan cargando en `start - 0.2` como hoy, aunque su primera frase esté en el segundo 30.

**`src/domain/services/timing.js`**
- `manualPlayLimit(cues, time)`: buscar solo entre frases habladas (`cues.find((c) => isSpoken(c) && c.bEnd > time + 0.5)`). Así un play manual no frena al final de un crédito.
- `cueIndexAt(cues, time, fromIndex)` (modo sin pausa automática): avanzar igual que hoy, pero devolver la **última frase hablada** con `start <= time`. Nunca devuelve una de pantalla, y si no hay una hablada nueva devuelve `fromIndex`.
- `shouldAutoPause` y `replayWindow` no cambian: siempre reciben la frase actual, que ahora siempre es hablada.

**`src/domain/services/games.js`**
- Sacar `IS_FILLER`. En `eligibleRounds`, la condición pasa a ser `n >= min && n <= max && isSpoken(cue)`.

### application
**`PracticeSession.js`**
- `start({ cues, startIndex })`:
  `let i = nextSpokenIndex(cues, startIndex); if (i >= cues.length) i = nextSpokenIndex(cues, 0);`
  Esto reemplaza al `Math.min(startIndex, cues.length - 1)`. Si el progreso viejo apuntaba a una frase de pantalla, salta a la próxima hablada. Si el video estaba terminado, vuelve a empezar.
- El mensaje `Seguís desde la frase N` usa `this.position`, no `this.index + 1`. Se muestra solo si `this.position > 1`.
- Getters nuevos:
  - `spokenTotal` → `spokenCount(this.cues)`
  - `position` → `Math.min(spokenCount(this.cues, this.index) + 1, this.spokenTotal)`
  - `startTime` → `startTimeFor(this.cues, this.index)`
  - `screenCueAt(time)` → `screenCueAt(this.cues, time)` (método, porque depende del reloj de la interfaz)
- `previousCue`: `const j = prevSpokenIndex(this.cues, this.index - 1); return j >= 0 ? this.cues[j] : null;`
- `#finishLine`: en el `setTimeout`, reemplazar `this.index++` por `this.index = nextSpokenIndex(this.cues, this.index + 1)`. El resto no cambia: si `index >= cues.length` termina, y `#saveProgress` ya guarda `Math.min(index, length)`, o sea `cues.length`.
- `goTo(i)`: decide la dirección comparando con el índice actual:
  - `i < this.index` → `prevSpokenIndex(cues, i)`; si da -1, `nextSpokenIndex(cues, 0)`
  - `i >= this.index` → `nextSpokenIndex(cues, i)`; si da `cues.length`, se queda en la última hablada (`prevSpokenIndex(cues, cues.length - 1)`)
  - seek: `this.player.seek(startTimeFor(this.cues, this.index))`, en lugar de `cue.start - 0.2`. Con esto ⏮ va a 0 s en los videos de NASA.
  - `goTo(0)` desde ⏮ cae en la rama `i < index` (o `i === index` si ya estás en la primera); las dos llevan a la primera hablada.
- `tick()`: no cambia. `cueIndexAt` y `manualPlayLimit` ya ignoran las frases de pantalla.

**`ProgressService.js`**
- `summary(video)` → `videoProgress(video.cues, this.get(video.id))`. Es la única puerta que usa la interfaz para mostrar progreso de un video.

**`LibraryService.js`**: no cambia. `cueFromTuple` ya lee el 4º elemento.

### infrastructure
- **No cambia código.** `StaticLibraryRepository` lee el JSON tal cual y el parser de transcripciones sigue creando todo hablado.
- **Datos**: `frontend/public/videos.json` lleva el `"screen"` en las 20 frases (paso 1).
- `src/application/ports/index.js`: actualizar el JSDoc de `getAll` a `cues:[number,number,string,("screen")?][]`. Es solo documentación.

### presentation
**`App.jsx` → `openVideo`**
```
practice.start({ cues: video.cues, startIndex: progress.get(video.id), videoId: ..., title: ... });
setView('practice');
try { await player.loadYouTube(video.id, practice.startTime); ... }
```
Se borran `if (start >= video.cues.length) start = 0;` y el cálculo `video.cues[start].start - 0.2`, porque ahora lo resuelve `PracticeSession`.
`openOwn` no cambia (videos propios fuera de alcance).

**`PracticePage.jsx`**
- Frase: `{practice.position}/{practice.spokenTotal}`.
- `const screenCue = practice.screenCueAt(clock.t);`
- En el lugar de `PreviousLine`:
  `{screenCue ? <div className="screen-cue">📺 En pantalla: {screenCue.text}</div> : prev && <PreviousLine ... />}`
- Los botones ⏮ ‹ › siguen llamando a `goTo(0)`, `goTo(index - 1)` y `goTo(index + 1)`; el salteo lo hace `goTo`.

**`VideoCard.jsx`**: cambia la prop `done` (número) por `summary` (`{done, total, finished}`).
- `% = Math.round((Math.min(done, total) / total) * 100)`, y la barrita se muestra si `done > 0`.
- `{total} frases`, `✔ terminado` si `finished`, `vas por la {done + 1}` si `done > 0`.

**`HomePage.jsx`**: `inProgress = library.filter((v) => { const p = progress.summary(v); return p.done > 0 && !p.finished; })`, y a cada tarjeta se le pasa `summary={progress.summary(v)}`.
**`GamesPage.jsx`**: `<VideoCard ... summary={progress.summary(v)} />`.

**`styles/app.css`**: clase `.screen-cue`, con estilo similar a `.prev` pero `color: var(--soft)`, `font-style: italic`, sin cursor ni hover, y `text-align: center`. Revisar que se lea bien en modo oscuro.

### main.jsx
Sin cambios: no hay infraestructura ni servicios nuevos.

## Pasos

1. **Datos.** Marcar las frases en `frontend/public/videos.json`.
   - Escribir un script de un solo uso en el **scratchpad** (no se commitea). Lee el JSON, le hace `push('screen')` a las tuplas de la tabla (buscando por `id`), verifica que el texto de cada una sea el esperado (pregunta del título / "We Asked a NASA Scientist." / "NASA. A NASA 360 Production.") y lo vuelve a escribir con `JSON.stringify(data)`, sin indentar y sin salto de línea final.
   - Verificar con `git diff --stat`: una sola línea cambiada. Imprimir total y habladas por video y compararlos con la tabla.
2. **Dominio: Cue.** Agregar `spoken` en `createCue` y el 4º elemento en `cueFromTuple`, más los tests nuevos en `tests/domain/Cue.test.js`.
3. **Dominio: spoken.js.** Crear `src/domain/services/spoken.js` con las 7 funciones y `tests/domain/spoken.test.js`.
4. **Dominio: timing.** Hacer que `manualPlayLimit` y `cueIndexAt` ignoren las frases de pantalla, y agregar casos a `tests/domain/timing.test.js`.
5. **Dominio: games.** Sacar `IS_FILLER`, usar `isSpoken` y actualizar `tests/domain/games.test.js`.
6. **Test de datos.** Crear `tests/domain/library-data.test.js`. Lee `public/videos.json` con `fs` (los tests corren en Node), lo pasa por `cueFromTuple` y comprueba la tabla de habladas. También comprueba que ninguna frase marcada como `screen` entre en `eligibleRounds`, que es el pedido del issue.
7. **Aplicación.** Cambiar `PracticeSession` (`start`, getters, `previousCue`, `#finishLine`, `goTo`) y `ProgressService.summary`, y actualizar el JSDoc de `ports/index.js`.
8. **Presentación.** Cambiar `App.jsx` (`openVideo`), `PracticePage.jsx`, `VideoCard.jsx`, `HomePage.jsx`, `GamesPage.jsx` y `app.css`.
9. **Integración.** Agregar en el fixture `LIBRARY` de `tests/app/app.test.jsx` un video con frases de pantalla y sumar los tests de integración.
10. **Docs.** En `.agents/reference/content.md`, documentar el 4º elemento `"screen"` y cuándo usarlo (texto que se ve pero nadie dice, confirmado mirando el video). Sumar en "Calidad de subtítulos" el chequeo de títulos, carteles y créditos. En `docs/APRENDIZAJES.md`, agregar una entrada (ver abajo).
11. Correr `npm run validate` y hacer la prueba manual.

### Entrada para `docs/APRENDIZAJES.md`
- **Qué pasó:** los subtítulos de YouTube traían texto de pantalla (títulos, créditos) y la app pedía escribirlo.
- **Por qué:** los datos mezclaban "lo que se dice" con "lo que se ve", y el código usaba la posición en el array para dos cosas: guardar el progreso y mostrarlo.
- **Qué hago la próxima vez:** separar el **índice de almacenamiento** (estable, nunca cambia) del **número que se muestra** (se calcula). Marcar los datos en vez de borrarlos para no romper lo que ya está guardado. Y reemplazar los parches por texto (regex como `IS_FILLER`) con un dato explícito.

## Tests

### `tests/domain/Cue.test.js` (nuevo)
- `it('una tupla de 3 elementos es una frase hablada')`
- `it('el 4º elemento "screen" marca la frase como no hablada')`
- `it('un 4º elemento desconocido tira error')`
- `it('createCue sin spoken la toma como hablada')`, para que el parser de transcripciones siga igual.

### `tests/domain/spoken.test.js` (nuevo)
Fixture: `[S, S, H, H, S, H, S, S]` (S = pantalla, H = hablada). Las habladas son los índices 2, 3 y 5.
- `it('nextSpokenIndex salta las de pantalla')`: desde 0 → 2, desde 4 → 5, desde 6 → 8 (`cues.length`).
- `it('prevSpokenIndex busca hacia atrás')`: desde 4 → 3, desde 1 → -1.
- `it('spokenCount cuenta solo las habladas antes del índice')`: `(cues, 0)` → 0, `(cues, 4)` → 2, `(cues)` → 3.
- `it('screenCueAt devuelve la frase de pantalla que está en el video en ese momento')`: tiempo dentro de un S → ese cue; dentro de un H o en un hueco → `null`.
- `it('startTimeFor arranca en 0 si antes solo hay frases de pantalla')`: `index 2` → 0, `index 5` → `start - 0.2`.
- `it('startTimeFor no cambia los videos sin frases de pantalla')`: todas H, `index 0` con `start 30` → 29,8.
- `it('videoProgress: progreso viejo en un crédito final cuenta como terminado')`: `savedIndex 6` → `{done: 3, total: 3, finished: true}`.
- `it('videoProgress: guardar cues.length es terminado')` y `it('videoProgress: sin progreso es 0')`.

### `tests/domain/timing.test.js` (agregar)
- `it('manualPlayLimit ignora las frases de pantalla')`: hablada que termina en 9 y pantalla que termina en 12; con time 9,6 → `Infinity` (no 12).
- `it('cueIndexAt sin pausa automática nunca cae en una frase de pantalla')`: con time dentro de un S, devuelve la última H anterior.

### `tests/domain/games.test.js` (modificar)
- Renombrar el primer test a `it('descarta frases muy cortas y las de pantalla')`, usando `{ text: 'We Asked a NASA Scientist.', spoken: false }` y una frase larga con `spoken: false` que **no** contenga "NASA" (prueba que ya no depende del texto).

### `tests/domain/library-data.test.js` (nuevo)
- `it('cada video de la biblioteca tiene la cantidad de frases habladas esperada')`: tabla `{ EJXTZ5jpSmk: 23, '2aVWZOFrjdc': 31, ryHNj_SLwlE: 36, 's3bffub-9UM': 28, 'r0bbq-soSfI': 26 }`, más los 5 de Charade con habladas == total.
- `it('ninguna frase de pantalla entra en los juegos')`: `eligibleRounds(videos, 'listen')` y `'order'` no tienen ningún cue con `spoken === false`.

### `tests/app/app.test.jsx` (integración)
Agregar al fixture `LIBRARY` un video `vid3`:
`[[0.2, 3, 'How big is space?', 'screen'], [3.5, 5, 'We asked a scientist.', 'screen'], [5.2, 7.5, 'Space is really big.'], [7.5, 10.8, 'It would take a long time.'], [11, 14, 'NASA production.', 'screen']]`
(2 habladas de 5; título `'How Big is Space?'`).
- `it('frases de pantalla: empieza en la primera hablada y carga el video en 0 s')`: `practice.index === 2`, `player.t === 0`, se ve `1/2`.
- `it('frases de pantalla: el texto se muestra en gris y no se pide')`: con `player.t = 1` y esperando > 200 ms, aparece `📺 En pantalla: How big is space?` y la línea grande sigue siendo `Space is really big.`.
- `it('frases de pantalla: al terminar la última hablada el video queda terminado')`: escribir las 2 habladas → `practice.finished === true` y `progress.get('vid3') === 5`.
- `it('la tarjeta cuenta solo las frases habladas')`: en el inicio, la tarjeta de vid3 dice `2 frases`.
- `it('progreso viejo apuntando a una frase de pantalla retoma en la próxima hablada')`: `progress.set('vid3', 1)` antes de abrir → `practice.index === 2`.

Los tests que ya existen tienen que seguir pasando sin cambios (vid1 y vid2 no tienen frases marcadas). Ojo: el test que hace clic en `'What is a Black Hole?'` usa `getAllByText(...)[0]`, así que el título nuevo tiene que ser distinto.

## Validación

### Automática
`npm run validate` (desde `frontend/`): lint + tests + build, todo en verde.

### Manual (`npm run dev` → http://localhost:5173/dictado-ingles/), en compu y en el celular
Camino feliz con **NASA · What is a Black Hole?** (borrar antes `dictado-prog-EJXTZ5jpSmk` en DevTools → Application → Local Storage):
1. La tarjeta dice **23 frases**.
2. Al abrirlo, el video arranca en 0:00 y la pantalla dice "Frase 1/23".
3. Play: mientras pasan el título y el cartel aparece en gris `📺 En pantalla: …`, no pausa y la frase grande ya es "What is a black hole?" (la 2).
4. Pausa después de la primera frase hablada.
5. ⏮ vuelve a 0:00. › y ‹ nunca caen en un cartel.
6. Con › hasta la última hablada ("and into our understanding…"): al escribirla aparece "¡Terminaste el video!" y los créditos siguen en gris si el video sigue corriendo.
7. De vuelta en el inicio, la tarjeta dice "✔ terminado" y el video no figura en "Seguir viendo".

Casos borde:
- **Progreso viejo en un cartel**: en DevTools poner `dictado-prog-EJXTZ5jpSmk = 1` → abrir → arranca en la frase 1/23, cargado en 0 s.
- **Progreso viejo en los créditos**: poner `= 25` → la tarjeta dice "✔ terminado". Al abrirlo empieza de nuevo.
- **Retomar a la mitad**: dictar 3 frases, salir y volver a abrir → la tarjeta dice "vas por la 4" y el video carga en la frase, no en 0 s.
- **Pausa automática desactivada** (⚙ Ajustes): el índice avanza solo con el video y nunca muestra un cartel como frase grande.
- **Juegos**: varias partidas de "¿Qué escuchaste?" y "Ordená la frase" con videos de NASA, sin ningún cartel ni crédito.
- **Charade**: sin cambios visibles (34 frases, mismo comportamiento).
- **Video propio**: pegar una transcripción → funciona igual que antes, sin texto gris.
- **Modo oscuro**: el texto gris se lee bien.

## Riesgos
- **Tiempos de las frases de pantalla**: `screenCueAt` usa `start <= t < end`. Si en el video el cartel dura más que el cue, el gris desaparece antes. Es aceptable.
- **Video sin frases habladas**: `start` dejaría el índice en `cues.length` y mostraría "Terminaste". En la biblioteca no pasa (lo controla `library-data.test.js`), así que no se agrega manejo especial.
- **`replayWindow`** (Tab) puede retroceder hasta un tramo de cartel para llegar a los N segundos. Solo se reproduce audio sin voz, así que es inofensivo y no se toca.
- **Usuarios con progreso guardado**: los índices siguen siendo válidos (el array no cambió) y los casos raros (progreso sobre un cartel) los cubren `start` y `videoProgress`.
- **Diff de `videos.json`**: si el script reescribe con indentación, el diff sería enorme. Hay que verificar `git diff --stat`.

## Qué NO se hace en este plan
- Detectar frases de pantalla automáticamente o en videos propios (F5).
- Marcar frases de pantalla en Charade.
- Cambiar el modo sin pausa automática más allá de saltear carteles (por ejemplo, que termine solo al final).
- Agregar videos nuevos a la biblioteca (B2).
- Cambiar cómo se guarda el progreso o las claves de `localStorage`.

## Commits sugeridos
1. `Marca las frases de pantalla de los videos de NASA en la biblioteca` (videos.json + library-data.test.js; el test usa `cueFromTuple`, así que va junto con el commit 2 o después)
2. `Agrega al dominio las frases de pantalla y cómo saltearlas` (Cue, spoken.js, timing, games + tests)
3. `Saltea las frases de pantalla en el dictado y cuenta solo las habladas` (PracticeSession, ProgressService, presentación + tests de integración)
4. `Documenta el formato "screen" y agrega el aprendizaje`

Orden recomendado para que cada commit pase `validate`: **2 → 1 → 3 → 4**.

## Estado de la implementación (2026-11-15)
| Paso | Estado | Commit |
|---|---|---|
| 1. Datos (`videos.json`) | ✅ 20 frases marcadas, `git diff --stat` = 1 línea, cuentas iguales a la tabla | `Marca las frases de pantalla…` |
| 2. Dominio: Cue | ✅ | `Agrega al dominio las frases de pantalla…` |
| 3. Dominio: spoken.js | ✅ | idem |
| 4. Dominio: timing | ✅ | idem |
| 5. Dominio: games | ✅ `IS_FILLER` eliminado | idem |
| 6. Test de datos | ✅ | `Marca las frases de pantalla…` |
| 7. Aplicación | ✅ | `Saltea las frases de pantalla…` |
| 8. Presentación | ✅ | idem |
| 9. Integración | ✅ 5 tests nuevos con `vid3` | idem |
| 10. Docs | ✅ | `Documenta el formato "screen"…` |
| 11. Validación | ✅ `npm run validate` (64 tests) · ⏳ prueba manual pendiente | — |

### Desvíos y notas
- **Mayúsculas en los datos**: el texto de las frases no siempre coincide en mayúsculas con lo que decía el plan
  (ej. `2aVWZOFrjdc[1]` = "We asked a NASA scientist.", `[34]` = "NASA. A NASA 360 production."). El script compara sin
  mayúsculas; los índices y las cuentas son exactamente los de la tabla.
- **`cueFromTuple`** pasó de arrow function a función con nombre (lanza error si el 4º elemento es desconocido); la firma es la misma.
- **Tests extra** (no pedidos, suman cobertura): `isSpoken` con objetos sin el campo, `startTimeFor` en un índice > 0 de un
  video propio, `cueIndexAt` cuando no hay hablada nueva, y en `library-data.test.js` que haya 5 videos de Charade y que el pool de juegos no quede vacío.
- **Modo oscuro**: `--soft` en oscuro es `#66748a` sobre `#0e131b` (contraste ≈ 3,9:1). Revisarlo en la prueba manual; si se lee poco, cambiar `.screen-cue` a `var(--muted)`.
