# 📚 Aprendizajes

Cosas que aprendí trabajando en este proyecto. Cada entrada: **qué pasó → por qué → qué hago la próxima vez.**

---

## 2026-11-14 — Primer día con Claude Code

### 1. Una verificación vacía no prueba nada
- **Qué pasó:** `git grep -n "/plan"` no mostró nada y el agente concluyó "no queda ningún /plan". Era falso: el comando estaba roto.
- **Por qué:** Git Bash en Windows convierte los argumentos que empiezan con `/` en rutas de Windows (`/plan` → `C:/Program Files/Git/plan`) y busca otra cosa.
- **Próxima vez:**
  - En Git Bash: `MSYS_NO_PATHCONV=1 git grep -n '/plan'`. En PowerShell no pasa.
  - Antes de confiar en un resultado vacío, probar la búsqueda con algo que **seguro** existe (ej. `.agents/plans/`).
  - Lo mismo con los tests: un test que nunca falla puede no estar probando nada.

### 2. `git mv` para renombrar
- `git mv viejo.md nuevo.md` registra un **renombre** y conserva el historial del archivo.
- Borrar y crear a mano se ve como dos cambios distintos.
- Ver qué entró en el último commit: `git show --stat`.

### 3. Modos de permiso de Claude Code (Shift+Tab)
| Modo | Qué hace | Cuándo |
|---|---|---|
| ⏸ Manual | lee solo, pide permiso para editar y correr comandos | **mientras aprendo** |
| ⏵⏵ Accept edits | edita sin preguntar; reviso después con `git diff` | cambios repetitivos y confianza |
| ⏸ Plan | investiga y propone, no toca archivos | antes de algo grande |
| ⏵⏵ Auto | decide solo | todavía no |

### 4. Nombres de comandos que chocan
- Claude Code ya trae `/plan` (modo plan). Un comando propio con el mismo nombre puede no ejecutarse.
- Solución: nombre único → `/plan-feature`.

### 5. Revisar lo que propone el agente (capa 4 de la pirámide)
- Leer la lista de cambios y buscar **lo que falta**, no solo lo que está. (Faltaba el renombre del archivo principal.)
- Verificar por mi cuenta después, no confiar solo en el resumen del agente.

### 6. Loop PIV (Planificar → Implementar → Validar)
1. `/prime` — cargar contexto (reglas, PRD, estructura, git log). No escribe código.
2. `/create-stories B4` — historias con criterios Dado/Cuando/Entonces.
3. `/plan-feature <historia>` — plan por capas con tests y validación. **Pensar antes qué archivos tocaría y comparar.**
4. `/clear` → `/implement <plan>` — contexto limpio; el plan es todo lo que necesita.
5. `/validate` (lint + tests + build) → probar a mano → `/review`.
6. Commit + push → mirar **Actions** en GitHub.

### 7. Las 5 reglas de oro (seminario)
1. Si lo escribís más de 2 veces → comando.
2. Reducir suposiciones: preguntas antes del PRD, revisar plan antes de ejecutar.
3. El contexto es rey: reset entre planificar e implementar.
4. El git log es memoria: commits chicos y descriptivos.
5. El sistema evoluciona: cada error del agente → regla nueva (`/create-rules`).

### 8. Clean Architecture en este proyecto
- `domain/` (reglas puras) ← `application/` (casos de uso + puertos) ← `presentation/` (React).
- `infrastructure/` implementa los puertos (YouTube, traductor, localStorage).
- `main.jsx` conecta todo (raíz de composición).
- ESLint **hace cumplir** las capas: si el dominio importa React, `npm run lint` falla.
- Ventaja: las reglas se testean sin navegador y cambiar una tecnología = cambiar un adaptador.

## 2026-11-15 — Frases de pantalla (issue #1)

### 1. Separar el índice que se guarda del número que se muestra
- **Qué pasó:** los subtítulos de YouTube traían texto de pantalla (títulos, carteles, créditos) y la app pedía escribirlo, aunque nadie lo dice.
- **Por qué:** los datos mezclaban "lo que se dice" con "lo que se ve", y el código usaba la posición en el array para dos cosas: guardar el progreso y mostrarlo ("Frase 3/27").
- **Próxima vez:**
  - Separar el **índice de almacenamiento** (estable, nunca cambia) del **número que se muestra** (se calcula, ej. contando solo las frases habladas).
  - **Marcar** los datos (`[inicio, fin, texto, "screen"]`) en vez de borrarlos: así no se rompe el progreso que la gente ya tiene guardado en `localStorage`.
  - Reemplazar los parches por texto (una regex como `IS_FILLER = /NASA 360|We Asked a NASA/`) por un **dato explícito**. La regex fallaba con cualquier crédito que no dijera "NASA".

### 2. Un script que edita datos tiene que verificar antes de escribir
- **Qué pasó:** el script que marcaba las frases en `videos.json` cortó con error: esperaba `"We Asked a NASA Scientist."` y en un video decía `"We asked a NASA scientist."` (solo cambiaban las mayúsculas).
- **Por qué:** los subtítulos de cada video los escribió alguien distinto; el mismo texto no siempre está igual.
- **Próxima vez:** el script valida **todo** primero y escribe el archivo **al final**, así un error no deja el archivo a medio cambiar. Comparar textos sin mayúsculas (`toLowerCase()`), y después revisar con `git diff --stat` que el cambio sea del tamaño esperado (acá, 1 sola línea).

---

## Pendiente
- [ ] Contrarreloj (B4): responder las 5 preguntas antes de `/create-stories B4`:
  1. ¿Frases de un video o de todos?
  2. ¿Se ve el video o solo se escucha?
  3. ¿Qué suma punto: letra, palabra o frase?
  4. ¿Récord general o por video?
  5. ¿Se puede saltar una frase? ¿Resta?
