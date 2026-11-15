# Arquitectura — referencia detallada

## Capas y dependencias

```
presentation/  ──►  application/  ──►  domain/
                         ▲
infrastructure/ ─────────┘ (implementa los puertos de application/ports)
main.jsx = raíz de composición (conoce todo, conecta todo)
```

## Flujo de una tecla (ejemplo completo)

1. `PracticePage.jsx` (presentation) recibe el `onChange` del input y llama `practice.type(ch)`.
2. `PracticeSession.type()` (application) mide el tiempo, delega en `DictationLine.type()` y registra estadísticas con `StatsService`.
3. `DictationLine.type()` (domain) compara la letra y devuelve `{kind: 'correct'|'wrong'|'revealed', completedWord, revealedWord}`.
4. Si se reveló una palabra, `PracticeSession` la guarda con `WordsService.add(..., {failed: true})`.
5. `PracticeSession` llama `emit()` → `useObservable(practice)` hace que React redibuje.

## Puertos actuales (`src/application/ports/index.js`)

| Puerto | Adaptador | Para qué |
|---|---|---|
| `VideoPlayer` | `infrastructure/player/MediaPlayer.js` | YouTube (iframe API) o archivo local (`<video>`) |
| `Translator` | `infrastructure/translation/GoogleTranslator.js` | EN→ES (fallback MyMemory) |
| `Phonetics` | `infrastructure/translation/FreeDictionaryPhonetics.js` | IPA + audio |
| `KeyValueStore` | `infrastructure/storage/LocalStore.js` | persistencia en localStorage |
| `LibraryRepository` | `infrastructure/library/StaticLibraryRepository.js` | `public/videos.json` |
| `SoundEffects` | `infrastructure/audio/WebAudioSounds.js` | sonidos de acierto/error |
| `Speech` | `infrastructure/audio/BrowserSpeech.js` | pronunciar palabras |
| `TranscriptReader` | `infrastructure/transcripts/transcriptParser.js` | .srt/.vtt/texto de YouTube → Cues |

## Casos de uso actuales (`src/application/usecases/`)

| Caso de uso | Responsabilidad |
|---|---|
| `PracticeSession` | Dictado de un video: escritura, pausas automáticas, Tab, progreso |
| `GameSession` | Juegos `listen` (¿Qué escuchaste?) y `order` (Ordená la frase) |
| `ReviewSession` | Repaso de palabras con tarjetas |
| `WordsService` | Guardar/quitar/calificar palabras (Mis palabras) |
| `StatsService` | Estadísticas por día y racha |
| `ProgressService` | En qué frase quedaste por video |
| `SettingsService` | Preferencias (modo, velocidad, tema, sonido) |
| `LibraryService` | Carga la biblioteca y convierte frases a `Cue` |

## Receta: agregar un caso de uso
1. Reglas puras en `src/domain/` + test en `tests/domain/`.
2. Clase en `src/application/usecases/` que extienda `Observable`, reciba dependencias por constructor y llame `emit()` al cambiar.
3. Instanciarla en `src/main.jsx` y agregarla al objeto `services`.
4. Agregarla también en `tests/app/app.test.jsx` (función `setup`).
5. Usarla en React con `const { miCaso } = useServices(); useObservable(miCaso);`.

## Receta: agregar un servicio externo (ej. otro traductor)
1. Si el contrato no existe, documentarlo como `@typedef` en `ports/index.js`.
2. Clase en `src/infrastructure/...` con `@implements {import('../../application/ports').Translator}`.
3. Reemplazar la instancia en `main.jsx` (una línea).
4. Fake en `tests/app/fakes.js` si los tests lo necesitan.

## Decisiones tomadas (y por qué)
- **Observable + useSyncExternalStore** en lugar de Redux/Zustand: los casos de uso no dependen de React y se testean solos.
- **Un solo reproductor compartido** (práctica y juegos): un iframe de YouTube por página es más estable.
- **Pausa al final del bloque real (`bEnd`)**: las transcripciones copiadas de YouTube traen tiempos cada ~10 s; dentro del bloque los tiempos son estimados y pausar ahí cortaba frases.
- **Play manual = seguir hasta el próximo bloque** (`manualPlayLimit`): si no, la pausa automática volvía a frenar el video al instante.
