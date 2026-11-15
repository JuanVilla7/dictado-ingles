/**
 * Base mínima para que la interfaz se entere de los cambios (patrón Observer).
 * React se suscribe con useSyncExternalStore (ver presentation/hooks/useObservable.js).
 */
export class Observable {
  #listeners = new Set();
  version = 0;
  subscribe = (fn) => { this.#listeners.add(fn); return () => this.#listeners.delete(fn); };
  getVersion = () => this.version;
  emit() { this.version++; this.#listeners.forEach((fn) => fn()); }
}
