/**
 * Lee la biblioteca de videos desde public/videos.json.
 * Más adelante se puede reemplazar por un backend sin tocar el resto de la app.
 * @implements {import('../../application/ports').LibraryRepository}
 */
export class StaticLibraryRepository {
  constructor(url = `${import.meta.env.BASE_URL}videos.json`) { this.url = url; }
  async getAll() {
    const r = await fetch(this.url);
    if (!r.ok) throw new Error('No se pudo cargar la biblioteca');
    return r.json();
  }
}
