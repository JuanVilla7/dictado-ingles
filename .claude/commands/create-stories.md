---
description: Convierte un ítem del PRD en historias de usuario con criterios de aceptación
argument-hint: "<ID del backlog, ej: B1>"
---
1. Leé el ítem "$ARGUMENTS" en `.agents/PRD.md`. Si no existe o es ambiguo, preguntame antes de seguir.
2. Dividilo en historias chicas (cada una implementable y testeable en una sesión):
   - **Como** <usuario> **quiero** <acción> **para** <beneficio>
   - **Criterios de aceptación** (Dado / Cuando / Entonces), incluyendo casos borde.
   - **Capas afectadas**: domain / application / infrastructure / presentation.
   - **Cómo se valida**: qué tests nuevos y qué prueba manual.
3. Ordenalas por dependencia y guardalas en `.agents/stories/$ARGUMENTS-<nombre>.md`.
4. Mostrámelas y esperá mi OK.
