# Contenido de la biblioteca (`frontend/public/videos.json`)

```json
{ "id": "ID_DE_YOUTUBE", "show": "NASA", "title": "What is a Black Hole?", "cat": "ciencia", "level": "B1", "dur": 93,
  "cues": [[0.2, 3.2, "What is a black hole?"], [3.7, 5.3, "We Asked a NASA Scientist."]] }
```

- `cat`: `pelicula` | `ciencia` (si se agrega otra, sumar el filtro en `HomePage.jsx` → `CATEGORIES`).
- `level`: `A2` | `B1` | `B2` | `C1`.
- `cues`: `[inicio, fin, texto]` en segundos, con los tiempos reales de los subtítulos.

## Licencias (obligatorio)
Solo dominio público o licencias libres:
- Agencias del gobierno de EE.UU. (NASA, VOA Learning English): dominio público.
- Películas de dominio público (ej. *Charade*, 1963).
- **No** agregar series, películas o canciones con derechos (The Office, Friends, etc.).

## Calidad de subtítulos
- Revisar errores de OCR en subtítulos de películas viejas: "l" por "I", palabras pegadas ("thankyou"), números con espacios ("1 854").
- El video tiene que permitir reproducción embebida (`playableInEmbed`).
