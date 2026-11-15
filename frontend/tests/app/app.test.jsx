// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { FakePlayer, MemoryStore, fakeTranslator, fakePhonetics, silentSounds, fakeSpeech } from './fakes.js';
import { SettingsService } from '../../src/application/usecases/SettingsService.js';
import { StatsService } from '../../src/application/usecases/StatsService.js';
import { WordsService } from '../../src/application/usecases/WordsService.js';
import { ProgressService } from '../../src/application/usecases/ProgressService.js';
import { LibraryService } from '../../src/application/usecases/LibraryService.js';
import { PracticeSession } from '../../src/application/usecases/PracticeSession.js';
import { GameSession } from '../../src/application/usecases/GameSession.js';
import { ReviewSession } from '../../src/application/usecases/ReviewSession.js';
import { ServicesProvider } from '../../src/presentation/context/services.jsx';
import { ToastProvider } from '../../src/presentation/context/toast.jsx';
import { App } from '../../src/presentation/App.jsx';

const LIBRARY = [
  { id: 'vid1', show: 'NASA', title: 'What is a Black Hole?', cat: 'ciencia', level: 'B1', dur: 93,
    cues: [[0.2, 3.2, 'What is a black hole?'], [3.7, 5.3, 'We asked a scientist.'], [7.9, 10.2, 'The name is a little misleading.'], [10.2, 12.9, 'Black holes are not actually holes.']] },
  { id: 'vid2', show: 'Charade', title: 'When Strangers Meet', cat: 'pelicula', level: 'B1', dur: 109,
    cues: [[0.9, 3.5, "It's hers. Where'd you find him?"], [3.6, 5.8, 'He was throwing snowballs at the baron.'], [5.9, 9, 'Is he still there now?'], [9.1, 12.5, 'Is your husband with you today?']] },
];

function setup() {
  window.scrollTo = () => {};
  const store = new MemoryStore(), player = new FakePlayer();
  const settings = new SettingsService(store), stats = new StatsService(store);
  const words = new WordsService(store, fakeTranslator), progress = new ProgressService(store);
  const services = {
    store, player, settings, stats, words, progress, translator: fakeTranslator, phonetics: fakePhonetics, speech: fakeSpeech, sounds: silentSounds,
    library: new LibraryService({ getAll: async () => LIBRARY }),
    practice: new PracticeSession({ player, stats, words, progress, settings, sounds: silentSounds }),
    games: new GameSession({ player, stats, sounds: silentSounds, store }),
    review: new ReviewSession({ words, stats, sounds: silentSounds }),
  };
  render(<ServicesProvider value={services}><ToastProvider><App /></ToastProvider></ServicesProvider>);
  return services;
}
const wait = (ms) => act(() => new Promise((r) => setTimeout(r, ms)));
const typeText = (s) => { const box = screen.getByPlaceholderText('Escribí aquí…'); for (const ch of s) fireEvent.change(box, { target: { value: ch } }); };

describe('App (integración con puertos falsos)', () => {
  let s;
  beforeEach(async () => { document.body.innerHTML = ''; s = setup(); await wait(10); });

  it('muestra la biblioteca en el inicio', () => {
    expect(screen.getAllByText('What is a Black Hole?').length).toBeGreaterThan(0);
    expect(screen.getByText('📚 Biblioteca')).toBeTruthy();
  });

  it('dictado: escribir una frase completa pasa a la siguiente y suma estadísticas', async () => {
    fireEvent.click(screen.getAllByText('What is a Black Hole?')[0]);
    await wait(10);
    expect(s.player.id).toBe('vid1');
    typeText('whatisablackhole');
    await wait(500);
    expect(s.practice.index).toBe(1);
    expect(s.stats.today().phr).toBe(1);
    expect(screen.getByText('2/4')).toBeTruthy();
  });

  it('pausa automática al final del bloque y play manual no se vuelve a frenar enseguida', async () => {
    fireEvent.click(screen.getAllByText('What is a Black Hole?')[0]);
    await wait(10);
    s.player.play(); s.player.t = 4.1; await wait(80);
    expect(s.player.isPaused()).toBe(true);
    expect(s.practice.pausedByLine).toBe(true);
    s.practice.togglePlay(); await wait(80);
    expect(s.player.isPaused()).toBe(false);
  });

  it('pista/errores guardan la palabra en Mis palabras', async () => {
    fireEvent.click(screen.getAllByText('What is a Black Hole?')[0]);
    await wait(10);
    typeText('zzz');
    expect(s.words.has('What')).toBe(true);
    fireEvent.click(screen.getByText('⭐ Mis palabras'));
    await wait(10);
    expect(screen.getByText('What')).toBeTruthy();
  });

  it('tocar una palabra escrita abre la traducción', async () => {
    fireEvent.click(screen.getAllByText('What is a Black Hole?')[0]);
    await wait(10);
    typeText('what');
    const word = document.querySelector('.line .word.tap');
    fireEvent.click(word);
    await wait(20);
    expect(document.querySelector('.pop').textContent).toContain('[es] What');
  });

  it('juego ¿Qué escuchaste?: 10 rondas máximo, puntaje y resultado', async () => {
    fireEvent.click(screen.getByText('🎮 Juegos'));
    fireEvent.click(screen.getByText('¿Qué escuchaste?'));
    fireEvent.click(screen.getByText('🎲 Mezclar todos los videos'));
    await wait(20);
    while (!s.games.finished) {
      act(() => s.games.choose(s.games.round.cue.text));
      act(() => s.games.next());
    }
    await wait(10);
    expect(s.games.score).toBe(s.games.total);
    expect(screen.getByText(/Perfecto/)).toBeTruthy();
  });

  it('juego Ordená la frase: tocar las palabras en orden es correcto', async () => {
    fireEvent.click(screen.getByText('🎮 Juegos'));
    fireEvent.click(screen.getByText('Ordená la frase'));
    fireEvent.click(screen.getAllByText('When Strangers Meet')[0]);
    await wait(20);
    const bank = document.querySelector('.bank');
    for (let i = 0; i < s.games.tokens.length; i++) {
      const btn = [...within(bank).getAllByRole('button')].find((b) => !b.classList.contains('used') && b.textContent === s.games.tokens[i]);
      fireEvent.click(btn);
    }
    expect(s.games.correct).toBe(true);
  });

  it('repaso de palabras con tarjetas', async () => {
    s.words.add('hers', "It's hers.");
    fireEvent.click(screen.getByText('⭐ Mis palabras'));
    fireEvent.click(screen.getByText(/Repasar/));
    await wait(10);
    fireEvent.click(screen.getByText('Mostrar significado'));
    fireEvent.click(screen.getByText('🙂 Bien'));
    await wait(10);
    expect(s.words.get('hers').box).toBe(1);
  });
});
