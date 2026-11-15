---
description: Ejecuta un plan en una ventana de contexto fresca (PIV - Implementar)
argument-hint: "<ruta del plan, ej: .agents/plans/2026-11-20-pronunciacion.md>"
---
Implementá el plan `$ARGUMENTS`. Idealmente en una sesión nueva (después de `/clear`): el plan es todo el contexto que necesitás.

1. Leé el plan completo y `.agents/AGENT.md`. Si algo del plan contradice las reglas o el código actual, **pará y preguntame**.
2. Seguí los pasos en orden. Para cada paso:
   - si toca el dominio, escribí primero el test (`frontend/tests/domain/`) y después el código;
   - corré `npm test` (y `npm run lint` si tocaste imports) e iterá hasta que pase;
   - hacé un commit con el mensaje sugerido del plan.
3. Al final corré `npm run validate` (desde `frontend/`). Si falla, arreglalo; no desactives reglas de ESLint ni saltees tests.
4. Marcá en el plan qué pasos quedaron hechos y anotá cualquier desvío.
5. Resumime qué cambió, qué tests agregaste y qué tengo que probar a mano.
