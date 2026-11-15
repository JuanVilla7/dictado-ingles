# 🎧 Dictado en inglés

App web para entrenar el oído en inglés: mirás un video, escuchás una frase y la escribís letra por letra.
Incluye una biblioteca de videos listos para usar, traducción al tocar una palabra, repaso de vocabulario
con repetición espaciada y dos juegos de escucha.

**Demo:** https://juanvilla7.github.io/dictado-ingles/

## Funcionalidades

- **Dictado** con huecos de letras, subtítulo completo o sin pistas. El video se pausa al final de cada frase y `Tab` la repite.
- **Biblioteca** de videos de dominio público (escenas de *Charade* (1963) y videos de NASA) con subtítulos sincronizados.
- **Tu propio video** de YouTube pegando su transcripción (o un archivo local + `.srt`/`.vtt`).
- **Traducción** al tocar una palabra ya escrita: significado, IPA y audio de pronunciación.
- **Mis palabras:** se guardan las palabras tocadas o difíciles y se repasan con tarjetas (sistema de cajas de Leitner).
- **Juegos:** *¿Qué escuchaste?* (elegir entre frases casi iguales) y *Ordená la frase*.
- **Racha diaria**, estadísticas, modo oscuro e instalable como app (PWA).

## Cómo correrlo

```bash
cd frontend
npm install
npm run dev      # servidor local en http://localhost:5173/dictado-ingles/
npm test         # tests (Vitest)
npm run build    # compila a frontend/dist
```

Cada push a `main` corre los tests, compila y publica en GitHub Pages (`.github/workflows/deploy.yml`).

## Arquitectura (Clean Architecture)

El código del front está dividido en cuatro capas. **Las dependencias apuntan siempre hacia adentro:**
la interfaz conoce a los casos de uso, los casos de uso conocen al dominio, y el dominio no conoce a nadie.

```
            ┌──────────────────────────────────────────────┐
            │  presentation/  (React: páginas, componentes) │
            │   ┌──────────────────────────────────────┐   │
            │   │ application/ (casos de uso + puertos) │   │
            │   │   ┌──────────────────────────────┐   │   │
            │   │   │ domain/ (reglas puras)        │   │   │
            │   │   └──────────────────────────────┘   │   │
            │   └──────────────────────────────────────┘   │
            └──────────────────────────────────────────────┘
  infrastructure/ (YouTube, traductor, localStorage…) implementa los puertos
  main.jsx = raíz de composición: crea todo y lo conecta
```

| Capa | Qué tiene | Depende de |
|---|---|---|
| `domain/` | Entidades y reglas puras: `DictationLine` (letras, aciertos, pistas), `Word` (repetición espaciada), `Cue`, reglas de pausa (`timing`), distractores, juegos, racha. Sin React, sin navegador, sin APIs. | nada |
| `application/` | Casos de uso: `PracticeSession`, `GameSession`, `ReviewSession`, `WordsService`, `StatsService`… y los **puertos** (`ports/index.js`): interfaces de lo que necesitan (`VideoPlayer`, `Translator`, `KeyValueStore`…). | `domain` |
| `infrastructure/` | Adaptadores concretos de los puertos: `MediaPlayer` (YouTube + `<video>`), `GoogleTranslator`, `FreeDictionaryPhonetics`, `LocalStore` (localStorage), `StaticLibraryRepository` (videos.json), parser de transcripciones. | `application` (puertos), `domain` |
| `presentation/` | React: `App`, páginas (`HomePage`, `PracticePage`, `WordsPage`, `GamesPage`), componentes y hooks. Los servicios llegan por contexto (`useServices()`). | `application`, `domain` |

**¿Por qué así?**
- Las reglas importantes (cuándo pausar, cómo se califica una letra, cuándo vuelve una palabra) se testean sin navegador: ver `tests/domain`.
- Cambiar una tecnología es cambiar un adaptador. Ejemplo: para usar otro traductor, se crea una clase con `translate(text)` y se reemplaza **una línea** en `main.jsx`.
- La app se puede probar entera con implementaciones falsas de los puertos (`tests/app/fakes.js`), sin YouTube ni internet.

**Cómo se comunica la interfaz con los casos de uso:** cada caso de uso extiende `Observable`; React se suscribe con
`useObservable()` (basado en `useSyncExternalStore`) y se redibuja cuando el caso de uso emite un cambio.

### Mapa de carpetas

```
frontend/
├── public/                 videos.json (biblioteca), íconos, manifest y service worker
├── src/
│   ├── domain/
│   │   ├── entities/       Cue, DictationLine, Word
│   │   └── services/       text, timing, distractors, games, streak
│   ├── application/
│   │   ├── ports/          interfaces (JSDoc) de lo que se necesita de afuera
│   │   └── usecases/       PracticeSession, GameSession, ReviewSession, WordsService, StatsService…
│   ├── infrastructure/     player, translation, storage, library, transcripts, audio
│   ├── presentation/       App, pages, components, hooks, context, styles
│   └── main.jsx            raíz de composición
└── tests/
    ├── domain/             tests unitarios de las reglas
    ├── infrastructure/     parser de transcripciones
    └── app/                integración de la app con puertos falsos
```

## Agregar un video a la biblioteca

Editar `frontend/public/videos.json`. Cada video tiene:

```json
{ "id": "ID_DE_YOUTUBE", "show": "NASA", "title": "Título", "cat": "ciencia", "level": "B1", "dur": 93,
  "cues": [[0.2, 3.2, "What is a black hole?"], [3.7, 5.3, "..."]] }
```

`cues` = frases como `[inicio, fin, texto]` en segundos. Usar solo contenido con licencia libre o de dominio público.

## Próximos pasos posibles

- `backend/` (ej. .NET con Clean Architecture) para buscar subtítulos de cualquier video y traducir del lado del servidor.
- Cuentas de usuario para sincronizar progreso entre dispositivos.
- Juego de pronunciación con micrófono.
