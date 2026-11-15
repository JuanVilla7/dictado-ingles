# CLAUDE.md — guía para trabajar en este repo con Claude Code

## Proyecto
App web para practicar dictado en inglés (React 18 + Vite, JavaScript, sin TypeScript). El front vive en `frontend/`.
Se publica en GitHub Pages con `.github/workflows/deploy.yml` en cada push a `main`.
El dueño del proyecto es estudiante de programación y prefiere explicaciones en **español rioplatense**.

## Comandos (desde `frontend/`)
- `npm run dev` — servidor local
- `npm test` — Vitest (dominio, parser e integración de la app)
- `npm run build` — compila a `dist/`

Antes de dar por terminado un cambio: correr `npm test` y `npm run build`.

## Arquitectura: Clean Architecture (respetar SIEMPRE)
Las dependencias apuntan hacia adentro: `presentation → application → domain`. `infrastructure` implementa los puertos de `application`.

- `src/domain/` — reglas puras. **Prohibido** importar React, usar `window`, `document`, `fetch`, `localStorage` o cualquier cosa de otras capas.
- `src/application/usecases/` — casos de uso. Solo usan el dominio y los **puertos** (`src/application/ports/index.js`). Reciben sus dependencias por constructor. Extienden `Observable` y llaman `emit()` cuando cambia su estado.
- `src/infrastructure/` — adaptadores concretos (YouTube, traductores, localStorage, fetch). Cada clase implementa un puerto (anotar con `@implements`).
- `src/presentation/` — React. Obtiene servicios con `useServices()` y se redibuja con `useObservable(servicio)`. No contiene reglas de negocio: si hay un `if` que decide algo del juego/dictado, va al dominio o al caso de uso.
- `src/main.jsx` — raíz de composición: el único archivo que instancia infraestructura y la inyecta.

### Reglas prácticas
- Lógica nueva → primero en `domain/` con su test en `tests/domain/`.
- Servicio externo nuevo → definir el puerto en `ports/index.js`, implementarlo en `infrastructure/`, conectarlo en `main.jsx`, y agregar un fake en `tests/app/fakes.js`.
- No romper la compatibilidad de `localStorage`: las claves usan el prefijo `dictado-` (`settings`, `words`, `days`, `best`, `prog-<videoId>`, `url`, `transcript`, `idx`).
- El componente `VideoStage` se monta una sola vez y se oculta con CSS: no desmontarlo (se recargaría el iframe de YouTube).
- Biblioteca (`public/videos.json`): solo contenido de dominio público o con licencia libre.

## Estilo
- Nombres en inglés en el código; textos de la interfaz y comentarios en español.
- Funciones chicas y puras cuando se pueda. Comentarios que expliquen el *por qué*.
- Commits en español, en imperativo: "Agrega juego de pronunciación", "Corrige pausa al cambiar de video".
