import { useSyncExternalStore } from 'react';

/** Redibuja el componente cada vez que el caso de uso (Observable) emite un cambio. */
export function useObservable(observable) {
  useSyncExternalStore(observable.subscribe, observable.getVersion);
  return observable;
}
