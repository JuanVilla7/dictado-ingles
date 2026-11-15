/**
 * Traductor inglés → español. Usa el servicio gratuito de Google y, si falla, MyMemory.
 * Guarda en memoria lo ya traducido.
 * @implements {import('../../application/ports').Translator}
 */
export class GoogleTranslator {
  #cache = new Map();
  translate(text) {
    if (!this.#cache.has(text)) {
      const q = encodeURIComponent(text);
      this.#cache.set(text,
        fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&hl=es&dt=t&dt=bd&q=${q}`)
          .then((r) => r.json())
          .then((j) => ({
            main: (j[0] || []).map((x) => x[0]).join(''),
            alternatives: (j[1] || []).map((d) => ({ pos: d[0], terms: (d[1] || []).slice(0, 4) })),
          }))
          .catch(() => fetch(`https://api.mymemory.translated.net/get?langpair=en|es&q=${q}`)
            .then((r) => r.json())
            .then((j) => ({ main: (j.responseData?.translatedText || '').replace(/<[^>]+>/g, ''), alternatives: [] })))
          .catch(() => ({ main: '', alternatives: [] })));
    }
    return this.#cache.get(text);
  }
}
