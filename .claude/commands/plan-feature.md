---
description: Produce un plan de implementación detallado con estrategia de validación (no implementa)
argument-hint: "<feature o historia, ej: .agents/stories/B1-pronunciacion.md>"
---
Objetivo: planificar "$ARGUMENTS". **No escribas código de la app.**

1. Si no corriste `/prime` en esta sesión, cargá el contexto mínimo (AGENT.md, PRD, `git log --oneline -15`).
2. Leé los archivos involucrados. Para investigar en paralelo podés usar sub-agentes, **solo para leer, nunca para implementar**.
3. **Preguntame** cualquier cosa ambigua antes de cerrar el plan. Cada pregunta es una suposición que no hacés.
4. Escribí el plan en `.agents/plans/<AAAA-MM-DD>-<nombre>.md` con esta estructura:
   - **Objetivo** y criterio de "terminado".
   - **Contexto**: archivos relevantes y decisiones existentes que hay que respetar.
   - **Diseño por capa**: qué va en domain / application (¿puerto nuevo?) / infrastructure / presentation / main.jsx.
   - **Pasos** numerados, chicos, cada uno con los archivos a crear/modificar.
   - **Tests**: casos concretos (nombres de `it(...)`) por capa.
   - **Validación**: `npm run validate` + qué probar a mano en el navegador (camino feliz y casos borde).
   - **Riesgos** y qué NO se hace en este plan.
   - **Commits sugeridos** (mensajes en español).
5. El plan tiene que poder ejecutarse en una sesión nueva sin esta conversación. Mostrámelo y esperá mi OK.
