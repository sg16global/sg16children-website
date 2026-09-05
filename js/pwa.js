if ('serviceWorker' in navigator) {
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  function activateWaitingWorker(reg) {
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async function registerSw() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            activateWaitingWorker(reg);
          }
        });
      });

      activateWaitingWorker(reg);

      async function checkForUpdate() {
        try {
          await reg.update();
        } catch {
          /* offline or blocked */
        }
      }

      checkForUpdate();
      setInterval(checkForUpdate, 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
      window.addEventListener('focus', checkForUpdate);
    } catch {
      /* SW unsupported or blocked */
    }
  }

  window.addEventListener('load', registerSw);
}
