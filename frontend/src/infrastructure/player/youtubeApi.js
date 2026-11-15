/** Carga (una sola vez) la API de iframes de YouTube. */
let apiPromise = null;
export function loadYouTubeApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = reject;
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('YouTube no respondió')), 10000);
  });
  apiPromise.catch(() => { apiPromise = null; });
  return apiPromise;
}
