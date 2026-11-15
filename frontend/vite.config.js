import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La app se publica en https://juanvilla7.github.io/dictado-ingles/
export default defineConfig({
  base: '/dictado-ingles/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
  },
});
