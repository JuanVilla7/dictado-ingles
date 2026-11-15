import { isLetter, baseLetter, cleanWord, tokenize } from '../services/text.js';

/** Después de esta cantidad de errores en la misma letra, se revela sola. */
export const MAX_MISSES = 3;

/**
 * Estado de una frase mientras el usuario la escribe letra por letra.
 * No sabe nada de pantallas: solo recibe teclas y responde qué pasó.
 */
export class DictationLine {
  constructor(text) {
    this.text = text;
    /** Palabras con sus caracteres. Cada letra que hay que escribir tiene un índice en `letters`. */
    this.words = tokenize(text).map((raw) => ({
      raw,
      word: cleanWord(raw),
      chars: [...raw].map((ch) => ({ ch, letterIndex: -1 })),
    }));
    /** Letras a escribir, en orden. `mark`: null (pendiente) | 'ok' (acertada) | 'rev' (revelada). */
    this.letters = [];
    this.words.forEach((w, wi) => {
      w.chars.forEach((c) => {
        if (isLetter(c.ch)) {
          c.letterIndex = this.letters.length;
          this.letters.push({ ch: c.ch, wordIndex: wi, mark: null });
        }
      });
    });
    this.pos = 0;
    this.misses = 0;
  }

  get done() { return this.pos >= this.letters.length; }
  get length() { return this.letters.length; }

  /** Palabra (sin signos) a la que pertenece la letra actual. */
  get currentWord() {
    const l = this.letters[this.pos];
    return l ? this.words[l.wordIndex].word : null;
  }

  /**
   * Procesa una tecla.
   * @returns {{kind: 'ignored'|'correct'|'wrong'|'revealed', completedWord: boolean, revealedWord: string|null}}
   */
  type(ch) {
    if (this.done || !isLetter(ch)) return { kind: 'ignored', completedWord: false, revealedWord: null };
    const letter = this.letters[this.pos];
    if (baseLetter(ch) === baseLetter(letter.ch)) {
      letter.mark = 'ok';
      return { kind: 'correct', ...this.#advance(), revealedWord: null };
    }
    this.misses++;
    if (this.misses >= MAX_MISSES) return this.hint();
    return { kind: 'wrong', completedWord: false, revealedWord: null };
  }

  /** Revela la letra actual (pista). Devuelve la palabra que costó, para guardarla en "Mis palabras". */
  hint() {
    if (this.done) return { kind: 'ignored', completedWord: false, revealedWord: null };
    const word = this.currentWord;
    this.letters[this.pos].mark = 'rev';
    return { kind: 'revealed', ...this.#advance(), revealedWord: word };
  }

  /** Revela todo lo que falta. */
  skip() {
    while (!this.done) { this.letters[this.pos].mark = 'rev'; this.pos++; }
  }

  /** ¿La palabra ya está completa (escrita o revelada)? Sirve para dejar tocarla y traducirla. */
  isWordComplete(wordIndex) {
    const letters = this.letters.filter((l) => l.wordIndex === wordIndex);
    return letters.length > 0 && letters.every((l) => l.mark);
  }

  #advance() {
    const wordIndex = this.letters[this.pos].wordIndex;
    this.pos++;
    this.misses = 0;
    const next = this.letters[this.pos];
    return { completedWord: !next || next.wordIndex !== wordIndex };
  }
}
