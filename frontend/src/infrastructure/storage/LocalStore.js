/**
 * Implementación de KeyValueStore con localStorage del navegador.
 * Usa el prefijo "dictado-" para ser compatible con los datos de la versión anterior.
 * @implements {import('../../application/ports').KeyValueStore}
 */
export class LocalStore {
  constructor(prefix = 'dictado-') { this.prefix = prefix; }
  get(key, fallback) {
    try { const v = localStorage.getItem(this.prefix + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  }
  set(key, value) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch { /* sin espacio o modo privado */ }
  }
}
