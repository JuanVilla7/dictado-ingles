/**
 * Pronuncia una palabra: con el audio del diccionario si hay, si no con la voz del sistema.
 * @implements {import('../../application/ports').Speech}
 */
export class BrowserSpeech {
  say(word, audioUrl) {
    if (audioUrl) new Audio(audioUrl).play().catch(() => this.#tts(word));
    else this.#tts(word);
  }
  #tts(word) {
    try {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US'; u.rate = 0.85;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch { /* sin síntesis de voz */ }
  }
}
