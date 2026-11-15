---
description: Corre lint + tests + build y reporta fallas (capas 1–3 de la pirámide)
---
Desde `frontend/`:
1. `npm run lint` — si hay errores de `no-restricted-imports`, explicá qué regla de arquitectura se rompió y en qué capa debería ir ese código.
2. `npm test` — listá los tests que fallan con la causa probable.
3. `npm run build`.

Reportá en una tabla: capa · resultado · detalle. Si todo pasa, decime qué conviene probar a mano en el navegador según los últimos cambios (`git diff --stat HEAD~1`). No arregles nada sin preguntarme, salvo que te lo pida.
