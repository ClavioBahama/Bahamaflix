/**
 * Bahama Flix — registro do service worker e instalação do PWA.
 * No iPhone o Safari não dispara `beforeinstallprompt`; mostramos instruções.
 */
(function () {
  'use strict';

  const installBtn = document.getElementById('install-btn');
  const installModal = document.getElementById('install-modal');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inStandalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  let deferredPrompt = null;
  let updateAvailable = false;

  function showInstallButton(label) {
    if (!installBtn) return;
    if (label) installBtn.textContent = label;
    installBtn.hidden = false;
  }

  function closeModal() {
    if (installModal) installModal.hidden = true;
  }

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

  // Safari/iOS nunca emite beforeinstallprompt: oferecemos o passo a passo.
  if (isIOS && !inStandalone) showInstallButton('Adicionar à tela inicial');

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (isIOS) {
        installModal.hidden = false;
        return;
      }
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

  document.getElementById('install-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('install-modal-ok')?.addEventListener('click', closeModal);
  installModal?.addEventListener('click', (event) => {
    if (event.target === installModal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && installModal && !installModal.hidden) closeModal();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installBtn) installBtn.hidden = true;
    closeModal();
  });
})();
