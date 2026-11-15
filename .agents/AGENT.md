# AGENT.md — Reglas globales del proyecto

> Este archivo se carga en TODAS las sesiones. Mantenerlo corto: el detalle va en `.agents/reference/` (contexto bajo demanda).

## Proyecto
**Dictado en inglés**: app web para entrenar el oído en inglés escribiendo lo que se dice en videos.
React 18 + Vite, JavaScript (sin TypeScript), Vitest, ESLint. Todo el front vive en `frontend/`.
Se publica en GitHub Pages con `.github/workflows/deploy.yml` en cada push a `main`.
El dueño es estudiante de programación: explicar en **español rioplatense**, claro y sin dar nada por sabido.

## Comandos (desde `frontend/`)
| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor local en http://localhost:5173/dictado-ingles/ |
| `npm run lint` | ESLint + reglas de arquitectura |
| `npm test` | Vitest: dominio, parser e integración |
| `npm run build` | compila a `dist/` |
| `npm run validate` | lint + tests + build (correr SIEMPRE antes de terminar) |

## Arquitectura: Clean Architecture
Dependencias hacia adentro: `presentation → application → domain`. `infrastructure` implementa los puertos.
**ESLint hace cumplir estas reglas** (`frontend/eslint.config.js`): si el lint falla por `no-restricted-imports`, la solución es mover el código a la capa correcta, nunca desactivar la regla.

- `src/domain/` — reglas puras. Sin React, `window`, `document`, `fetch` ni `localStorage`.
- `src/application/usecases/` — casos de uso. Solo dominio + puertos (`src/application/ports/index.js`). Dependencias por constructor. Extienden `Observable` y llaman `emit()`.
- `src/infrastructure/` — adaptadores concretos de los puertos (`@implements`).
- `src/presentation/` — React. Servicios con `useServices()`, se redibuja con `useObservable()`. Sin reglas de negocio.
- `src/main.jsx` — raíz de composición: único lugar que instancia infraestructura.

Detalle y ejemplos: `.agents/reference/architecture.md`.

## Reglas que no se negocian
1. Lógica nueva → primero en `domain/` con su test en `frontend/tests/domain/`.
2. Servicio externo nuevo → puerto en `ports/index.js` + adaptador en `infrastructure/` + conexión en `main.jsx` + fake en `tests/app/fakes.js`.
3. No romper `localStorage`: prefijo `dictado-` y claves `settings`, `words`, `days`, `best`, `prog-<videoId>`, `url`, `transcript`, `idx`.
4. `VideoStage` se monta una sola vez (se oculta con CSS). Desmontarlo recarga el iframe de YouTube.
5. Biblioteca (`frontend/public/videos.json`): solo contenido de dominio público o con licencia libre.
6. No asumir: si un requisito es ambiguo, **preguntar antes** de planificar o implementar.

## Estilo
- Código en inglés; textos de interfaz y comentarios en español. Comentarios que expliquen el *por qué*.
- Funciones chicas; preferir funciones puras.
- Commits frecuentes, en español e imperativo: "Agrega juego de pronunciación". El git log es la memoria del proyecto.

## Flujo de trabajo (loop PIV)
`/prime` → `/plan <feature>` → (reset de contexto) → `/implement <plan>` → `/validate` → `/review`.
Los planes se guardan en `.agents/plans/`, el PRD en `.agents/PRD.md`, las historias en `.agents/stories/`.

## Contexto bajo demanda (leer solo si hace falta)
- `.agents/reference/architecture.md` — capas, flujo de datos, cómo agregar un caso de uso o un puerto
- `.agents/reference/components.md` — patrones de React en este proyecto
- `.agents/reference/testing.md` — cómo testear cada capa, fakes
- `.agents/reference/content.md` — formato de `videos.json` y licencias
