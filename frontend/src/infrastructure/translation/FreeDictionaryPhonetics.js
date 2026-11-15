/**
 * Pronunciación (IPA + audio) desde dictionaryapi.dev.
 * @implements {import('../../application/ports').Phonetics}
 */
export class FreeDictionaryPhonetics {
  #cache = new Map();
  lookup(word) {
    const w = word.toLowerCase().replace(/’/g, "'").replace(/'s$/, '');
    if (!this.#cache.has(w)) {
      this.#cache.set(w, fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!j) return null;
          const ph = j.flatMap((e) => e.phonetics || []);
          return {
            ipa: j[0].phonetic || ph.map((p) => p.text).find(Boolean) || '',
            audio: ph.map((p) => p.audio).find((a) => a && /-us\.mp3$/.test(a)) || ph.map((p) => p.audio).find(Boolean) || '',
          };
        })
        .catch(() => null));
    }
    return this.#cache.get(w);
  }
}
