---
description: Carga el contexto del proyecto antes de planificar (PIV - Planificar)
argument-hint: "[tema opcional, ej: juegos]"
---
Prepará contexto para trabajar en este proyecto. **No escribas código.**

1. Leé `.agents/AGENT.md` (si no está ya cargado) y `.agents/PRD.md`.
2. Mirá la estructura: `git ls-files frontend/src frontend/tests | head -100`.
3. Leé la memoria del proyecto: `git log --oneline -20`.
4. Revisá si hay planes o historias en curso: `ls .agents/plans .agents/stories`.
5. Si me pasaste un tema ($ARGUMENTS), leé los archivos relacionados y la referencia que corresponda en `.agents/reference/`.

Al final, resumime en español y en pocas líneas:
- qué hace la app y en qué estado está,
- qué cambió en los últimos commits,
- qué archivos son relevantes para "$ARGUMENTS" (si lo hay),
- dudas o riesgos que veas antes de planificar.
