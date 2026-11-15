# Contenido de la biblioteca (`frontend/public/videos.json`)

```json
{ "id": "ID_DE_YOUTUBE", "show": "NASA", "title": "What is a Black Hole?", "cat": "ciencia", "level": "B1", "dur": 93,
  "cues": [[0.2, 3.2, "What is a black hole?"], [3.7, 5.3, "We Asked a NASA Scientist."]] }
```

- `cat`: `pelicula` | `ciencia` (si se agrega otra, sumar el filtro en `HomePage.jsx` → `CATEGORIES`).
- `level`: `A2` | `B1` | `B2` | `C1`.
- `cues`: `[inicio, fin, texto]` en segundos, con los tiempos reales de los subtítulos.
  - 4º elemento opcional `"screen"`: `[inicio, fin, texto, "screen"]` marca una **frase de pantalla**, texto que se ve en el
    video (título, cartel, créditos) pero **nadie dice**. Usarlo solo después de confirmarlo mirando el video.
  - Las frases de pantalla **no se borran**: el array no cambia de largo ni de orden, porque `prog-<videoId>` guarda el
    índice crudo. En el dictado se saltean (se muestran en gris), no cuentan en "Frase X/Y" ni en el % y no entran en los juegos.
  - Cualquier otro valor en el 4º elemento tira error en `cueFromTuple` (lo detecta `tests/domain/library-data.test.js`).
  - Si se marcan frases nuevas, actualizar la tabla de habladas en `tests/domain/library-data.test.js`.

## Licencias (obligatorio)
Solo dominio público o licencias libres:
- Agencias del gobierno de EE.UU. (NASA, VOA Learning English): dominio público.
- Películas de dominio público (ej. *Charade*, 1963).
- **No** agregar series, películas o canciones con derechos (The Office, Friends, etc.).

## Calidad de subtítulos
- Revisar errores de OCR en subtítulos de películas viejas: "l" por "I", palabras pegadas ("thankyou"), números con espacios ("1 854").
- El video tiene que permitir reproducción embebida (`playableInEmbed`).
- Revisar títulos, carteles y créditos: si el subtítulo trae texto que solo aparece en pantalla y nadie lo dice
  (ej. en NASA: la pregunta del título, "We Asked a NASA Scientist.", "NASA. A NASA 360 Production."), marcarlo con `"screen"`.
