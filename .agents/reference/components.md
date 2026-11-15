# Componentes React — patrones del proyecto

- **Servicios por contexto:** `const { practice, words } = useServices();` (nunca `new` de infraestructura en un componente).
- **Redibujar con el caso de uso:** `useObservable(practice);` justo después de obtenerlo.
- **Estado local solo de UI** (popup abierto, panel de ajustes visible). Si el estado afecta reglas o se persiste, va al caso de uso.
- **Atajos de teclado:** `useEffect` con `document.addEventListener('keydown', ...)` y limpieza en el return. Ignorar si el foco está en `SELECT`, `TEXTAREA` o un `INPUT` que no sea la caja de escritura.
- **Timers:** usar `useInterval(fn, ms)` (`presentation/hooks/useInterval.js`).
- **Modales:** `<Modal onClose={...}>` (`presentation/components/Modal.jsx`). Clases: `big`, `sumgrid`, `btns`.
- **Avisos:** `const toast = useToast(); toast('texto');`
- **Estilos:** todo en `presentation/styles/app.css` con variables CSS (`--accent`, `--card`, `--muted`…). El modo oscuro cambia las variables con `[data-theme=dark]`; no usar colores fijos.
- **Páginas:** `presentation/pages/*Page.jsx`. La navegación vive en `App.jsx` (`view`: `home | practice | games | words`).
- **El video:** `VideoStage` está siempre montado en `App.jsx`; se muestra/oculta con la prop `visible`.
