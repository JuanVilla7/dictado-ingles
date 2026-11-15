# PRD — Dictado en inglés

**Estado:** v2 en producción · **Dueño:** Juan Cruz Villa · **Última actualización:** 2026-11-14

## 1. Problema
Quien aprende inglés con nivel intermedio (B1) entiende textos pero le cuesta **entender el inglés hablado**: las palabras
se pegan, se reducen ("gonna", "wanna") y los subtítulos hacen que lea en vez de escuchar. Las apps de dictado existentes
son pagas, usan audios artificiales o no dejan elegir el contenido.

## 2. Objetivo
Una app web gratuita donde el usuario mira videos reales, **escucha frase por frase y la escribe**, recibiendo feedback
inmediato letra por letra, y repasa el vocabulario que le costó.

### Métricas de éxito
- El usuario completa al menos 1 video por sesión.
- La racha diaria se mantiene 5+ días.
- La precisión promedio sube con el tiempo (dato en estadísticas por día).

## 3. Usuario
Hispanohablante, nivel A2–B2, practica desde la compu o el celular, 10–30 minutos por día.

## 4. Funcionalidades (v2 — implementado)
| # | Funcionalidad | Criterio de aceptación principal |
|---|---|---|
| F1 | Biblioteca de videos | 10 videos de dominio público con subtítulos sincronizados; filtro por categoría |
| F2 | Dictado letra por letra | Signos y espacios se completan solos; error = la letra tiembla; 3 errores = se revela |
| F3 | Pausa automática + Tab | El video se pausa al terminar la frase; Tab repite ≥ N segundos (3/5/8/10) |
| F4 | Modos de ver la frase | Huecos / subtítulo completo / sin pistas |
| F5 | Video propio | Link de YouTube + transcripción pegada (limpia tiempos leídos, personajes, capítulos) o .srt/.vtt |
| F6 | Traducción al tocar | Palabra ya escrita → traducción, IPA, audio; frase anterior traducible entera |
| F7 | Mis palabras | Se guardan las tocadas y las difíciles; repaso con tarjetas (Leitner) |
| F8 | ¿Qué escuchaste? | 10 rondas, 3 opciones que difieren en una palabra confundible |
| F9 | Ordená la frase | 10 rondas, armar la frase tocando palabras |
| F10 | Progreso y racha | Racha diaria, frases y precisión del día, "seguir viendo" |
| F11 | PWA + modo oscuro | Instalable, funciona offline la interfaz |

## 5. Fuera de alcance (por ahora)
- Cuentas de usuario y sincronización entre dispositivos.
- Contenido con derechos de autor en la biblioteca.
- Backend propio (todo corre en el navegador).

## 6. Backlog (próximas versiones)
| ID | Idea | Valor | Esfuerzo | Notas |
|---|---|---|---|---|
| B1 | Juego de pronunciación (shadowing) con micrófono | Alto | M | Web Speech API; no anda en todos los navegadores |
| B2 | Más videos en la biblioteca (20+) | Alto | S | Solo dominio público; revisar OCR |
| B3 | Estadísticas históricas (gráfico de precisión por día) | Medio | S | Datos ya guardados en `days` |
| B4 | Contrarreloj: palabras correctas en 60 s | Medio | S | Reusa DictationLine |
| B5 | Backend .NET (Clean Architecture) para buscar subtítulos de cualquier video | Alto | L | Resuelve el copiar/pegar de transcripciones |
| B6 | Cuentas + sincronización de progreso | Medio | L | Depende de B5 |
| B7 | Tests E2E en navegador real (Playwright) | Medio | M | Capa 3 de la pirámide de validación |

## 7. Restricciones técnicas
- Hosting estático (GitHub Pages) → sin servidor propio por ahora.
- YouTube IFrame API: algunos videos no permiten reproducción embebida.
- Servicios gratuitos de traducción/diccionario: pueden fallar; siempre con fallback.
