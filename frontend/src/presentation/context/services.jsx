import { createContext, useContext } from 'react';

/** Inyección de dependencias: main.jsx crea los servicios y los componentes los piden con useServices(). */
const ServicesContext = createContext(null);
export const ServicesProvider = ServicesContext.Provider;
export function useServices() {
  const s = useContext(ServicesContext);
  if (!s) throw new Error('useServices debe usarse dentro de <ServicesProvider>');
  return s;
}
