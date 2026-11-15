---
description: Revisión de código de los cambios pendientes o de una rama/PR
argument-hint: "[rama o rango, por defecto los cambios sin commitear]"
---
Revisá los cambios de `$ARGUMENTS` (si está vacío: `git diff` + `git diff --staged`; si es una rama: `git diff main...$ARGUMENTS`).

Revisá, en este orden:
1. **Arquitectura**: ¿cada cosa está en su capa? ¿hay reglas de negocio en React? ¿infraestructura instanciada fuera de `main.jsx`?
2. **Correctitud**: bugs, casos borde (frase vacía, video sin subtítulos, sin internet, localStorage lleno).
3. **Tests**: ¿la lógica nueva del dominio tiene test? ¿los nombres describen el comportamiento?
4. **Compatibilidad**: ¿se respetan las claves de localStorage?
5. **Legibilidad**: nombres, funciones largas, comentarios que expliquen el porqué.

Devolvé una lista ordenada por gravedad: 🔴 bloqueante · 🟡 conviene arreglar · 🟢 sugerencia, con archivo:línea y propuesta concreta. Explicá en español simple, como para alguien que está aprendiendo.
