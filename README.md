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
npm run lint     # ESLint + reglas de arquitectura
npm test         # tests (Vitest)
npm run build    # compila a frontend/dist
npm run validate # las tres cosas juntas
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

**Las reglas de capas están automatizadas:** `frontend/eslint.config.js` hace fallar el lint si, por ejemplo,
el dominio importa React o la interfaz instancia infraestructura.

## Desarrollo asistido por IA (capa de IA + loop PIV)

El repo tiene dos capas: el código y la **capa de IA**, todo el contexto que le dice a un agente (Claude Code) cómo trabajar acá.
Está versionada junto al código, así que mejora con commits como cualquier otra cosa.

```
CLAUDE.md                 → importa .agents/AGENT.md (Claude Code lo carga solo)
.agents/
├── AGENT.md              reglas globales: stack, comandos, arquitectura, estilo (siempre cargado, corto)
├── PRD.md                producto: problema, funcionalidades, backlog
├── reference/            contexto bajo demanda: architecture, components, testing, content
├── plans/                planes generados por /plan
└── stories/              historias generadas por /create-stories
.claude/commands/         comandos reutilizables (/prime, /plan, /implement, …)
```

**Loop PIV — Planificar, Implementar, Validar:**

1. **Planificar:** `/prime` carga el contexto (reglas, PRD, estructura, git log) → `/plan <feature>` escribe un plan en `.agents/plans/` con estrategia de validación. El agente pregunta antes de asumir.
2. **Implementar:** reset de contexto (`/clear`) → `/implement .agents/plans/<plan>.md`. El plan es todo lo que necesita.
3. **Validar:** `/validate` (lint + tests + build) → `/review` → prueba manual.

| Comando | Para qué |
|---|---|
| `/install` | instalar dependencias y levantar el servidor |
| `/prime`, `/prime-client`, `/prime-usecase`, `/prime-components` | cargar contexto general o enfocado |
| `/create-prd`, `/prd-interactive` | definir o ampliar el producto |
| `/create-stories` | pasar un ítem del backlog a historias de usuario |
| `/plan`, `/implement` | planificar y ejecutar |
| `/validate`, `/review`, `/security-review` | validar, revisar código y seguridad |
| `/create-rules` | incorporar a AGENT.md lo aprendido de un error |

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
