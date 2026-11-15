---
description: Revisión de seguridad de los cambios pendientes
---
Revisá `git diff` + `git diff --staged` (o todo `frontend/src` si te lo pido) buscando:
- **XSS**: uso de `dangerouslySetInnerHTML`, `innerHTML` o HTML armado con texto de subtítulos/traducciones/usuario.
- **Datos externos**: respuestas de APIs (traductor, diccionario, YouTube) usadas sin validar.
- **Secretos**: API keys o tokens en el código o en `public/`.
- **Dependencias**: `npm audit --omit=dev` en `frontend/`.
- **Privacidad**: qué se guarda en localStorage y si algo sensible se manda a terceros.
- **Contenido**: que lo agregado a `videos.json` sea de dominio público.

Reportá hallazgos con gravedad, archivo:línea y cómo arreglarlo. Si no hay nada, decilo explícitamente.
