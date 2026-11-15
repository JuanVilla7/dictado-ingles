# Testing — cómo y qué testear

Vitest (`npm test`). Tres niveles:

| Carpeta | Qué se testea | Entorno |
|---|---|---|
| `tests/domain/` | reglas puras (DictationLine, Word, timing, distractores, juegos, racha) | Node |
| `tests/infrastructure/` | adaptadores sin red (parser de transcripciones) | Node |
| `tests/app/` | la app completa con puertos falsos (`fakes.js`) | jsdom (`// @vitest-environment jsdom`) |

## Reglas
- Todo cambio en `domain/` lleva test. Nombres de test en español describiendo el comportamiento: `it('revela la letra después de 3 errores')`.
- Para funciones con azar, inyectar `random` (ver `shuffle(items, random)`).
- Tests de integración: usar `FakePlayer` (tiempo manual con `player.t = 4.1`), `MemoryStore`, `fakeTranslator`.
- Esperas en jsdom: `await wait(ms)` envuelve en `act()`.
- No hacer requests reales a internet en los tests.

## Pirámide de validación (del seminario)
1. Lint + reglas de arquitectura → `npm run lint` (agente, itera)
2. Unit tests → `npm test` (agente, itera)
3. Integración/E2E → `tests/app/` + probar en el navegador (agente)
4. Revisión de código → `/review` (vos + IA)
5. Prueba manual del camino feliz y casos borde → vos
