/* PhishGuard AI — PWA Installation & Windows App Integration */
(function () {
  'use strict';

  let deferredPrompt = null;

  // Detect standalone mode (Windows native window)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://');

  if (isStandalone) {
    document.documentElement.classList.add('pwa-standalone');
    console.log('🛡️ PhishGuard AI running in standalone Windows app mode.');
  }

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          console.log('🛡️ PWA ServiceWorker registered successfully with scope:', reg.scope);
        })
        .catch(err => {
          console.warn('PWA ServiceWorker registration failed:', err);
        });
    });
  }

  // 2. Capture Browser PWA Detection Event (beforeinstallprompt)
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default Chrome mini-infobar on mobile/desktop
    e.preventDefault();
    deferredPrompt = e;
    window.deferredPwaPrompt = e;

    console.log('💡 Browser detected PWA installability!');

    // Show Install button in topbar
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn && !isStandalone) {
      installBtn.classList.remove('hidden');
      installBtn.classList.add('show-pulse');
    }

    // Show cyber install prompt banner if not closed recently
    const promptDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (!promptDismissed && !isStandalone) {
      setTimeout(showPwaInstallModal, 2500);
    }
  });

  // 3. Trigger Installation Prompt
  window.installPwaApp = async function () {
    if (!deferredPrompt) {
      // If deferredPrompt is not yet available, explain how to install via browser omnibox
      showCustomToast('Click the install icon in your browser address bar to install PhishGuard AI.');
      return;
    }

    // Hide custom modal if open
    hidePwaInstallModal();

    // Show the native Windows / Chromium install prompt: "Install PhishGuard AI?"
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      showCustomToast('🛡️ Installing PhishGuard AI to Windows...');
    }

    // Reset prompt
    deferredPrompt = null;
    window.deferredPwaPrompt = null;

    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) installBtn.classList.add('hidden');
  };

  // 4. App Installed Event Handler
  window.addEventListener('appinstalled', (evt) => {
    console.log('🎉 PhishGuard AI was installed as an application!');
    deferredPrompt = null;
    window.deferredPwaPrompt = null;

    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) installBtn.classList.add('hidden');

    hidePwaInstallModal();
    showCustomToast('🛡️ PhishGuard AI installed! Launching standalone Windows app...');
  });

  // 5. PWA Modal Helpers
  function showPwaInstallModal() {
    let modal = document.getElementById('pwa-install-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pwa-install-modal';
      modal.className = 'pwa-modal-wrap';
      modal.innerHTML = `
        <div class="pwa-modal-card">
          <button class="pwa-close-btn" onclick="window.dismissPwaModal()" title="Close">&times;</button>
          <div class="pwa-modal-header">
            <div class="pwa-shield-badge">🛡️</div>
            <div>
              <h3>Install PhishGuard AI?</h3>
              <p>Experience unified threat protection as a native Windows desktop application</p>
            </div>
          </div>
          <div class="pwa-modal-features">
            <div class="pwa-feat-item">⚡ <span>Ultra-fast zero-latency protection window</span></div>
            <div class="pwa-feat-item">🖥️ <span>Runs in dedicated standalone Windows frame</span></div>
            <div class="pwa-feat-item">🔒 <span>Works seamlessly with system security tray</span></div>
          </div>
          <div class="pwa-modal-actions">
            <button class="btn-ghost" onclick="window.dismissPwaModal()">Not Now</button>
            <button class="btn-primary pwa-btn-glow" onclick="window.installPwaApp()">⬇ Install PhishGuard</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    requestAnimationFrame(() => modal.classList.add('active'));
  }

  window.dismissPwaModal = function () {
    const modal = document.getElementById('pwa-install-modal');
    if (modal) {
      modal.classList.remove('active');
      sessionStorage.setItem('pwa_prompt_dismissed', '1');
    }
  };

  function hidePwaInstallModal() {
    const modal = document.getElementById('pwa-install-modal');
    if (modal) modal.classList.remove('active');
  }

  function showCustomToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'cy-pwa-toast';
    toast.innerHTML = `<span style="color:var(--accent,#00f0ff);font-weight:700;">● SYSTEM</span> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // Also bind to manual install click on topbar button
  document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', window.installPwaApp);
    }
  });

})();
