/**
 * Bahama Flix — registro do service worker e prompt de instalação do PWA.
 */
(function () {
  'use strict';

  const installBtn = document.getElementById('install-btn');
  let deferredPrompt = null;
  let updateAvailable = false;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = new URL('sw.js', document.baseURI).href;
      const scope = new URL('./', document.baseURI).href;

      navigator.serviceWorker.register(swUrl, { scope })
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                updateAvailable = true;
              }
            });
          });
        })
        .catch((error) => {
          console.warn('[PWA] Não foi possível registrar o service worker:', error);
        });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!updateAvailable) return;
      updateAvailable = false;
      window.location.reload();
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (installBtn) installBtn.hidden = false;
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.hidden = true;
      if (choice.outcome === 'accepted') {
        console.info('[PWA] Bahama Flix instalado neste dispositivo.');
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installBtn) installBtn.hidden = true;
  });
})();
