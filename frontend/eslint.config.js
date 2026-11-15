import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Lint + reglas de ARQUITECTURA (Clean Architecture).
 * Si una capa importa algo que no debe, `npm run lint` falla. Así ni una persona ni un agente de IA
 * pueden romper la arquitectura sin darse cuenta.
 */
const layer = (forbidden, message) => ({
  'no-restricted-imports': ['error', { patterns: forbidden.map((group) => ({ group: [group], message })) }],
});

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  // JSX: marcar variables usadas en JSX como usadas
  { files: ['**/*.jsx'], rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|^React$', argsIgnorePattern: '^_' }] } },

  // ---------- Reglas de capas ----------
  {
    files: ['src/domain/**/*.js'],
    languageOptions: { globals: {} }, // el dominio no conoce window, document, fetch ni localStorage
    rules: layer(['react', 'react-dom', '**/application/**', '**/infrastructure/**', '**/presentation/**'],
      'El dominio es puro: no puede importar React ni otras capas.'),
  },
  {
    files: ['src/application/**/*.js'],
    rules: layer(['react', 'react-dom', '**/infrastructure/**', '**/presentation/**'],
      'Los casos de uso solo dependen del dominio y de los puertos (application/ports).'),
  },
  {
    files: ['src/infrastructure/**/*.js'],
    rules: layer(['react', 'react-dom', '**/presentation/**'],
      'La infraestructura implementa puertos: no conoce la interfaz.'),
  },
  {
    files: ['src/presentation/**/*.{js,jsx}'],
    rules: layer(['**/infrastructure/**'],
      'La interfaz recibe los servicios por useServices(); no instancia infraestructura (eso se hace en main.jsx).'),
  },
  // Tests: corren en Node + jsdom
  { files: ['tests/**/*.{js,jsx}', '*.config.js'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
];
