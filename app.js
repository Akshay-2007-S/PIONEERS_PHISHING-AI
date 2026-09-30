/**
 * PhishGuard AI — Main Application
 * Handles auth, routing, UI state, notifications, and scan results
 */

/* =====================================================
   GLOBAL STATE
   ===================================================== */
const STATE = {
  currentUser: null,
  currentPage: 'dashboard',
  currentChannel: 'url',
  scanHistory: [],
  notifications: [],
  statsCount: { safe: 142, suspicious: 28, fraud: 9 },
  sidebarOpen: false,
  themeIsDark: true,
  notifOpen: false,
  bg3dEnabled: true,
};

// Load from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem('pgState');
    if (saved) {
      const parsed = JSON.parse(saved);
      STATE.scanHistory = parsed.scanHistory || [];
      STATE.statsCount = parsed.statsCount || STATE.statsCount;
      STATE.themeIsDark = parsed.themeIsDark !== undefined ? parsed.themeIsDark : true;
    }
  } catch (e) {}
}

function saveState() {
  try {
    localStorage.setItem('pgState', JSON.stringify({
      scanHistory: STATE.scanHistory.slice(0, 200),
      statsCount: STATE.statsCount,
      themeIsDark: STATE.themeIsDark,
    }));
  } catch (e) {}
}

/* =====================================================
   AUTHENTICATION — Supabase Real Auth
   ===================================================== */
let authMode = 'login';

function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('signup-name-field').classList.toggle('hidden', mode === 'login');
  document.getElementById('auth-btn-text').textContent = mode === 'login' ? 'Login to PhishGuard' : 'Create Account';
  clearAuthMessage();
}

/* -- Auth UI helpers -- */
function showAuthMessage(text, type = 'error') {
  const el = document.getElementById('auth-message');
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-message auth-msg-' + type;
  el.classList.remove('hidden');
}

function clearAuthMessage() {
  const el = document.getElementById('auth-message');
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

function setAuthLoading(loading) {
  const btn     = document.getElementById('auth-submit-btn');
  const spinner = document.getElementById('auth-spinner');
  const btnText = document.getElementById('auth-btn-text');
  if (loading) {
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    btn.disabled = true;
  } else {
    btnText.classList.remove('hidden');
    spinner.classList.add('hidden');
    btn.disabled = false;
  }
}

/* -- Main auth handler (signup / login) -- */
async function handleAuth(e) {
  e.preventDefault();
  clearAuthMessage();

  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name     = authMode === 'signup'
    ? (document.getElementById('auth-name').value.trim() || email.split('@')[0])
    : null;

  if (!email || !password) {
    showAuthMessage('Please enter your email and password.');
    return;
  }
  if (authMode === 'signup' && password.length < 6) {
    showAuthMessage('Password must be at least 6 characters.');
    return;
  }

  setAuthLoading(true);

  if (authMode === 'signup') {
    /* ---- SIGN UP ---- */
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: name || email.split('@')[0] } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
        showAuthMessage('⚠️ An account with this email already exists. Please login instead.');
      } else {
        showAuthMessage('❌ ' + error.message);
      }
      setAuthLoading(false);
      return;
    }

    // Email confirmation required (Supabase default)
    if (data.user && !data.session) {
      showAuthMessage('✅ Account created! Check your email for a confirmation link before logging in.', 'success');
      _showVerifyBanner(email);
      setAuthLoading(false);
      return;
    }

    // Email confirmation disabled — session returned immediately
    if (data.session) {
      _enterDashboard(data.user);
    }

  } else {
    /* ---- LOGIN ---- */
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
        showAuthMessage('❌ Incorrect password. If you have no account yet, click Sign Up first.');
      } else if (msg.includes('email not confirmed')) {
        showAuthMessage('📧 Please verify your email first. Check your inbox for a confirmation link.');
      } else if (msg.includes('user not found') || msg.includes('no user')) {
        showAuthMessage('❌ No account found for this email. Please sign up first.');
      } else {
        showAuthMessage('❌ ' + error.message);
      }
      setAuthLoading(false);
      return;
    }

    _enterDashboard(data.user);
  }

  setAuthLoading(false);
}

/* -- Disabled: Guest Access removed per requirements -- */
function guestLogin() {
  showAuthMessage('Guest access is disabled. Please sign up or log in.', 'info');
}

/* -- Show verification banner -- */
function _showVerifyBanner(email) {
  const banner = document.getElementById('verify-banner');
  if (!banner) return;
  banner.classList.remove('hidden');
  const emailEl = document.getElementById('verify-email');
  if (emailEl) emailEl.textContent = email;
}

/* -- Enter dashboard with a Supabase user object -- */
function _enterDashboard(supaUser) {
  const name  = supaUser.user_metadata?.full_name || supaUser.email.split('@')[0];
  const email = supaUser.email;
  loginUser({ name, email });
}

/* -- Shared loginUser: populates UI, shows dashboard -- */
function loginUser(user) {
  STATE.currentUser = user;
  document.getElementById('auth-overlay').classList.remove('active');
  document.getElementById('app').classList.remove('hidden');

  // Set user info in sidebar & settings
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  document.getElementById('user-avatar-sidebar').textContent = initial;
  document.getElementById('user-name-sidebar').textContent  = (user.name || user.email).split(' ')[0];
  document.getElementById('settings-username').textContent  = user.name || user.email.split('@')[0];
  document.getElementById('settings-email').textContent     = user.email;

  // Initialize dashboard
  renderActivityList();
  renderHistoryList();
  initNotifications();
  updateStats();

  // Apply saved theme
  if (!STATE.themeIsDark) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('theme-btn').textContent = '☀️';
  }
}

/* -- Logout -- */
async function logout() {
  await supabaseClient.auth.signOut();
  STATE.currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-overlay').classList.add('active');
  document.getElementById('auth-form').reset();
  clearAuthMessage();
  const banner = document.getElementById('verify-banner');
  if (banner) banner.classList.add('hidden');
  setAuthLoading(false);
  document.getElementById('auth-btn-text').textContent = 'Login to PhishGuard';
  switchAuthTab('login');
}

/* -- Supabase session bootstrap (called at page load) -- */
async function initSupabaseAuth() {
  // Restore session if user refreshes the page
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    _enterDashboard(session.user);
  }

  // React to future auth events (email verification link click, signout, etc.)
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session && !STATE.currentUser) {
      _enterDashboard(session.user);
    }
    if (event === 'SIGNED_OUT') {
      STATE.currentUser = null;
      document.getElementById('app')?.classList.add('hidden');
      document.getElementById('auth-overlay')?.classList.add('active');
    }
  });
}

/* =====================================================
   NAVIGATION
   ===================================================== */
function switchPage(page) {
  STATE.currentPage = page;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });

  // Show target page
  const target = document.getElementById('page-' + page);
  if (target) { target.classList.remove('hidden'); target.classList.add('active'); }

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.getElementById('nav-' + page);
  if (navBtn) navBtn.classList.add('active');

  // Page-specific init
  if (page === 'threats') initThreatGraph();
  if (page === 'history') renderHistoryList();
  if (window.set3DScene) window.set3DScene(page);

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  STATE.sidebarOpen = !STATE.sidebarOpen;
  sidebar.classList.toggle('open', STATE.sidebarOpen);
}
function closeSidebar() {
  STATE.sidebarOpen = false;
  document.getElementById('sidebar').classList.remove('open');
}

/* =====================================================
   THEME TOGGLE
   ===================================================== */
function toggleTheme() {
  STATE.themeIsDark = !STATE.themeIsDark;
  document.documentElement.setAttribute('data-theme', STATE.themeIsDark ? 'dark' : 'light');
  document.getElementById('theme-btn').textContent = STATE.themeIsDark ? '🌙' : '☀️';
  const toggle = document.getElementById('theme-toggle-settings');
  if (toggle) toggle.classList.toggle('active', !STATE.themeIsDark);
  saveState();
}

function toggle3DBg(el) {
  el.classList.toggle('active');
  STATE.bg3dEnabled = el.classList.contains('active');
  const canvas = document.getElementById('bg-canvas');
  canvas.style.opacity = STATE.bg3dEnabled ? '1' : '0';
}

/* =====================================================
   NOTIFICATIONS
   ===================================================== */
function initNotifications() {
  STATE.notifications = [
    { icon: '🔴', title: 'Fraud Blocked', text: 'prize-claim.xyz was blocked — Risk: 94/100', time: '2 min ago' },
    { icon: '🟡', title: 'Suspicious Link', text: 'bit.ly/win-now — Shortened URL warning', time: '15 min ago' },
    { icon: '🟡', title: 'Brand Spoofing', text: 'Impersonating HDFC Bank detected', time: '1 hr ago' },
  ];
  renderNotifications();
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  const badge = document.getElementById('notif-badge');
  if (!list) return;

  list.innerHTML = STATE.notifications.map(n => `
    <div class="notif-item">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-text">
        <strong>${n.title}</strong>
        ${n.text}
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('') || '<div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:.85rem;">No notifications</div>';

  badge.textContent = STATE.notifications.length;
  badge.style.display = STATE.notifications.length > 0 ? 'flex' : 'none';
}

function toggleNotifications() {
  STATE.notifOpen = !STATE.notifOpen;
  document.getElementById('notif-panel').classList.toggle('hidden', !STATE.notifOpen);
}

function clearNotifications() {
  STATE.notifications = [];
  renderNotifications();
  document.getElementById('notif-panel').classList.add('hidden');
  STATE.notifOpen = false;
}

function pushNotification(icon, title, text) {
  STATE.notifications.unshift({ icon, title, text, time: 'just now' });
  renderNotifications();
  // Flash badge
  const badge = document.getElementById('notif-badge');
  badge.style.transform = 'scale(1.5)';
  setTimeout(() => { badge.style.transform = 'scale(1)'; }, 300);
}

// Close notif panel clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-btn')) {
    document.getElementById('notif-panel')?.classList.add('hidden');
    STATE.notifOpen = false;
  }
});

/* =====================================================
   STATS & ACTIVITY
   ===================================================== */
function updateStats() {
  document.getElementById('stat-safe').textContent = STATE.statsCount.safe;
  document.getElementById('stat-suspicious').textContent = STATE.statsCount.suspicious;
  document.getElementById('stat-fraud').textContent = STATE.statsCount.fraud;
  document.getElementById('stat-total').textContent = STATE.statsCount.safe + STATE.statsCount.suspicious + STATE.statsCount.fraud;
}

// Animated counter
function animateCounter(el, target) {
  const start = parseInt(el.textContent) || 0;
  const delta = target - start;
  const duration = 600;
  const stepTime = 16;
  const steps = duration / stepTime;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(start + (delta * step / steps));
    if (step >= steps) { el.textContent = target; clearInterval(timer); }
  }, stepTime);
}

function renderActivityList() {
  const el = document.getElementById('activity-list');
  const recent = STATE.scanHistory.slice(0, 6);

  // Seed with some demo data if empty
  const demoItems = [
    { url: 'https://google.com', verdictClass: 'safe', riskScore: 4, channel: 'URL', timestamp: Date.now() - 120000 },
    { url: 'https://bit.ly/win-now-prize', verdictClass: 'suspicious', riskScore: 55, channel: 'WhatsApp', timestamp: Date.now() - 900000 },
    { url: 'https://hdfc-netbanking-verify.xyz/login', verdictClass: 'fraud', riskScore: 92, channel: 'Email', timestamp: Date.now() - 3600000 },
    { url: 'https://github.com/torvalds/linux', verdictClass: 'safe', riskScore: 3, channel: 'URL', timestamp: Date.now() - 7200000 },
    { url: 'https://prize-claim.xyz/winner?id=2847', verdictClass: 'fraud', riskScore: 96, channel: 'SMS', timestamp: Date.now() - 14400000 },
  ];

  const items = recent.length > 0 ? recent : demoItems;

  el.innerHTML = items.map(item => `
    <div class="activity-item">
      <span class="activity-badge badge-${item.verdictClass}">${item.verdictClass.toUpperCase()}</span>
      <span class="activity-url" title="${item.primaryURL || item.url}">${item.primaryURL || item.url}</span>
      <span class="activity-source">${item.channel || 'URL'}</span>
      <span class="activity-score" style="color:${PHISHGUARD_ENGINE.getRiskColor(item.riskScore)}">${item.riskScore}/100</span>
    </div>
  `).join('');
}

/* =====================================================
   CORE SCAN ENGINE — UI
   ===================================================== */
function setChannel(channel) {
  STATE.currentChannel = channel;
  document.querySelectorAll('.ch-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('ch-' + channel).classList.add('active');

  ['url', 'email', 'whatsapp', 'sms'].forEach(ch => {
    document.getElementById('channel-' + ch).classList.toggle('hidden', ch !== channel);
  });
}

async function runScan() {
  const channelInputMap = {
    url: 'input-url',
    email: 'input-email',
    whatsapp: 'input-whatsapp',
    sms: 'input-sms',
  };
  const inputId = channelInputMap[STATE.currentChannel];
  const content = document.getElementById(inputId)?.value?.trim();

  if (!content) {
    alert('Please enter a URL or message to analyze.');
    return;
  }

  await performScan(content, STATE.currentChannel, 'result-card', 'result-placeholder', 'scan-btn', 'scan-spinner', 'scan-btn-text');

  // Show extracted URLs if multi-URL
  const urls = PHISHGUARD_ENGINE.extractURLs(content);
  if (urls.length > 1) {
    const panel = document.getElementById('extracted-urls-panel');
    const list = document.getElementById('extracted-urls-list');
    panel.classList.remove('hidden');
    list.innerHTML = urls.map(url => `
      <div class="extracted-url-item">
        <span class="eurl-text" title="${url}">${url}</span>
        <button class="eurl-scan-btn" onclick="quickScanURL('${encodeURIComponent(url)}')">Scan This</button>
      </div>
    `).join('');
  }
}

async function quickScan() {
  const content = document.getElementById('quick-scan-input')?.value?.trim();
  if (!content) return;
  
  // Switch to scan page
  switchPage('scan');
  document.getElementById('input-url').value = content;
  setChannel('url');
  await runScan();
}

async function quickScanURL(encodedURL) {
  const url = decodeURIComponent(encodedURL);
  switchPage('scan');
  document.getElementById('input-url').value = url;
  setChannel('url');
  await runScan();
}

async function analyzeEmail() {
  const from = document.getElementById('email-from')?.value?.trim() || '';
  const subject = document.getElementById('email-subject')?.value?.trim() || '';
  const body = document.getElementById('email-body')?.value?.trim() || '';
  const combined = `From: ${from}\nSubject: ${subject}\n\n${body}`;

  if (!body && !from) {
    alert('Please enter at least the sender address or email body.');
    return;
  }

  // Show scanning state
  showScanning(document.getElementById('email-result-container'));
  const btnText = document.getElementById('email-btn-text');
  const spinner = document.getElementById('email-spinner');
  if (btnText) btnText.classList.add('hidden');
  if (spinner) spinner.classList.remove('hidden');

  await delay(1600);

  const result = PHISHGUARD_ENGINE.analyze(combined, 'email');
  
  // Extra check: suspicious from domain
  if (from && from.includes('@')) {
    const domain = from.split('@')[1];
    if (domain && !PHISHGUARD_ENGINE.knownSafeDomains.includes(domain)) {
      result.indicators.unshift('📧 Sender domain is not a known trusted provider');
      result.riskScore = Math.min(result.riskScore + 8, 100);
    }
  }

  result.channel = 'email';

  addToHistory(result);
  
  const container = document.getElementById('email-result-container');
  container.innerHTML = buildResultCard(result, true);

  if (btnText) btnText.classList.remove('hidden');
  if (spinner) spinner.classList.add('hidden');

  // Push notification if bad
  if (result.verdictClass === 'fraud') pushNotification('🔴', 'Phishing Email', `Risk: ${result.riskScore}/100`);
  else if (result.verdictClass === 'suspicious') pushNotification('🟡', 'Suspicious Email', `Risk: ${result.riskScore}/100`);
}

async function scanWAMessage() {
  const content = document.getElementById('wa-scan-input')?.value?.trim();
  if (!content) { alert('Please paste a WhatsApp message or link.'); return; }

  const btnText = document.getElementById('wa-btn-text');
  const spinner = document.getElementById('wa-spinner');
  if (btnText) btnText.classList.add('hidden');
  if (spinner) spinner.classList.remove('hidden');

  const container = document.getElementById('wa-result-container');
  showScanning(container);

  await delay(1500);

  const result = PHISHGUARD_ENGINE.analyze(content, 'whatsapp');
  addToHistory(result);

  container.innerHTML = `<div class="wa-result-card">${buildResultCard(result, true)}</div>`;

  if (btnText) btnText.classList.remove('hidden');
  if (spinner) spinner.classList.add('hidden');

  if (result.verdictClass === 'fraud') pushNotification('🔴', 'WhatsApp Fraud Link', `Risk: ${result.riskScore}/100 — ${result.primaryURL}`);
  else if (result.verdictClass === 'suspicious') pushNotification('🟡', 'Suspicious WA Link', `Risk: ${result.riskScore}/100`);
}

async function checkBrowserURL() {
  const urlInput = document.getElementById('browser-url-input');
  const url = urlInput?.value?.trim();
  if (!url) return;

  // Set favicon to scanning
  document.getElementById('browser-url-icon').textContent = '⏳';
  document.getElementById('browser-idle').classList.add('hidden');
  document.getElementById('browser-warning').classList.add('hidden');
  document.getElementById('browser-safe').classList.add('hidden');
  document.getElementById('browser-content').innerHTML += '<div id="browser-scanning" style="text-align:center;"><div style="font-size:2rem;animation:rotate 1s linear infinite;display:inline-block;">⚙️</div><p style="margin-top:.5rem;color:var(--text-secondary);">Scanning...</p></div>';

  await delay(1400);

  const result = PHISHGUARD_ENGINE.analyze(url, 'browser');
  addToHistory(result);

  // Remove scanning spinner
  const scanEl = document.getElementById('browser-scanning');
  if (scanEl) scanEl.remove();

  if (result.verdictClass === 'fraud' || result.verdictClass === 'suspicious') {
    const warning = document.getElementById('browser-warning');
    warning.classList.remove('hidden');
    document.getElementById('browser-url-icon').textContent = '🔴';
    document.getElementById('bw-title').textContent = result.verdictClass === 'fraud' ? '🚨 Dangerous Site Blocked' : '⚠️ Suspicious Site Warning';
    document.getElementById('bw-msg').textContent = result.verdictClass === 'fraud'
      ? `PhishGuard has blocked this page. ${result.indicators[0] || ''}`
      : `This page has raised security concerns. Proceed with caution.`;
    document.getElementById('bw-risk-score').textContent = `Risk Score: ${result.riskScore}/100`;
    urlInput.style.color = result.verdictClass === 'fraud' ? 'var(--fraud)' : 'var(--suspicious)';
    if (result.verdictClass === 'fraud') pushNotification('🔴', 'Browser Blocked Fraud', `${url} — Risk: ${result.riskScore}/100`);
  } else {
    document.getElementById('browser-safe').classList.remove('hidden');
    document.getElementById('browser-url-icon').textContent = '🔒';
    document.getElementById('bs-msg').textContent = `✅ ${url} passed all PhishGuard security checks. Risk: ${result.riskScore}/100`;
    urlInput.style.color = 'var(--safe)';
  }
}

function resetBrowser() {
  document.getElementById('browser-warning').classList.add('hidden');
  document.getElementById('browser-safe').classList.add('hidden');
  document.getElementById('browser-idle').classList.remove('hidden');
  document.getElementById('browser-url-icon').textContent = '🔒';
  document.getElementById('browser-url-input').style.color = '';
  document.getElementById('browser-url-input').value = '';
}

function proceedAnyway() {
  const url = document.getElementById('browser-url-input').value;
  if (confirm(`⚠️ You are about to visit a potentially dangerous site:\n${url}\n\nPhishGuard cannot protect you once you proceed. Continue?`)) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function toggleFeature(el) {
  el.closest('.feature-item').classList.toggle('active');
}

// WA simulator
function loadWAMessage() {
  const input = document.getElementById('wa-message-input');
  const text = input.value.trim();
  if (!text) return;

  const urls = PHISHGUARD_ENGINE.extractURLs(text);
  const chat = document.getElementById('wa-chat');
  const bubble = document.createElement('div');
  bubble.className = 'wa-bubble received';
  bubble.innerHTML = `
    <div class="wa-msg-text">${text.replace(/(https?:\/\/[^\s]+)/g, '')}</div>
    ${urls.length > 0 ? `<div class="wa-link-preview"><span class="wa-link-url">${urls[0]}</span></div>` : ''}
    <div class="wa-time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} ✓✓</div>
  `;
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
  document.getElementById('wa-scan-input').value = text;
  input.value = '';
}

/* =====================================================
   GENERIC SCAN HELPER
   ===================================================== */
async function performScan(content, channel, resultCardId, placeholderId, btnId, spinnerId, btnTextId) {
  const placeholder = document.getElementById(placeholderId);
  const resultCard = document.getElementById(resultCardId);
  const btn = document.getElementById(btnId);
  const spinner = document.getElementById(spinnerId);
  const btnText = document.getElementById(btnTextId);

  // Show loading
  if (placeholder) placeholder.classList.add('hidden');
  if (resultCard) {
    resultCard.classList.remove('hidden');
    resultCard.innerHTML = buildScanningHTML();
  }
  if (btnText) btnText.classList.add('hidden');
  if (spinner) spinner.classList.remove('hidden');
  if (btn) btn.disabled = true;

  // Simulate analysis steps
  await delay(500);
  updateScanStep(resultCard, 'Extracting URLs...');
  await delay(400);
  updateScanStep(resultCard, 'Analyzing domain & SSL...');
  await delay(400);
  updateScanStep(resultCard, 'Checking brand signatures...');
  await delay(300);
  updateScanStep(resultCard, 'Running NLP engine...');
  await delay(300);
  updateScanStep(resultCard, 'Computing risk score...');
  await delay(300);

  const result = PHISHGUARD_ENGINE.analyze(content, channel);
  addToHistory(result);

  if (resultCard) resultCard.innerHTML = buildResultCard(result, false);
  if (placeholder) placeholder.classList.add('hidden');

  if (btnText) btnText.classList.remove('hidden');
  if (spinner) spinner.classList.add('hidden');
  if (btn) btn.disabled = false;

  // Push notification for bad results
  if (result.verdictClass === 'fraud') {
    pushNotification('🔴', 'Fraud Detected!', `Risk ${result.riskScore}/100 — ${result.primaryURL}`);
  } else if (result.verdictClass === 'suspicious') {
    pushNotification('🟡', 'Suspicious Content', `Risk ${result.riskScore}/100 — ${result.primaryURL}`);
  }

  // Update stats
  if (result.verdictClass === 'safe') {
    STATE.statsCount.safe = (STATE.statsCount.safe || 0) + 1;
    animateCounter(document.getElementById('stat-safe'), STATE.statsCount.safe);
  } else if (result.verdictClass === 'suspicious') {
    STATE.statsCount.suspicious = (STATE.statsCount.suspicious || 0) + 1;
    animateCounter(document.getElementById('stat-suspicious'), STATE.statsCount.suspicious);
  } else {
    STATE.statsCount.fraud = (STATE.statsCount.fraud || 0) + 1;
    animateCounter(document.getElementById('stat-fraud'), STATE.statsCount.fraud);
  }
  updateStats();
  renderActivityList();
  saveState();

  return result;
}

function buildScanningHTML() {
  return `
    <div class="scanning-overlay">
      <div class="scan-ring-outer">
        <div class="scan-ring-inner">🛡️</div>
      </div>
      <div class="scanning-text">Analyzing...</div>
      <div class="scanning-steps" id="scan-step-text">Initializing engine...</div>
    </div>
  `;
}

function updateScanStep(card, text) {
  const stepEl = card?.querySelector('#scan-step-text');
  if (stepEl) stepEl.textContent = text;
}

function showScanning(container) {
  container.innerHTML = `<div class="glass-card">${buildScanningHTML()}</div>`;
}

/* =====================================================
   RESULT CARD BUILDER
   ===================================================== */
function buildResultCard(result, compact = false) {
  const { verdict, verdictClass, riskScore, primaryURL, indicators, goodSignals, brandAnalysis, paymentAnalysis, nlpAnalysis, channel } = result;
  const icon = PHISHGUARD_ENGINE.getVerdictIcon(verdictClass);
  const riskColor = PHISHGUARD_ENGINE.getRiskColor(riskScore);

  const allIndicators = [...indicators, ...(goodSignals || [])];

  return `
    <div class="result-card" style="animation:result-appear 0.4s ease;">
      <div class="result-header ${verdictClass}">
        <span class="result-verdict-icon">${icon}</span>
        <div class="result-verdict verdict-${verdictClass}">${verdict}</div>
        ${brandAnalysis?.impersonatedBrand ? `<div class="result-subtitle">⚠️ Impersonating: ${brandAnalysis.impersonatedBrand}</div>` : ''}
        <div class="risk-score-display" style="margin-top:1rem;">
          <span class="risk-score-label">Risk Score</span>
          <span class="risk-score-value" style="color:${riskColor}">${riskScore}<span class="risk-score-max">/100</span></span>
        </div>
        <div style="width:100%;background:rgba(255,255,255,0.1);border-radius:99px;height:6px;margin-top:0.75rem;overflow:hidden;">
          <div style="width:${riskScore}%;height:100%;background:${riskColor};border-radius:99px;transition:width 1s ease;box-shadow:0 0 10px ${riskColor}40;"></div>
        </div>
      </div>
      <div class="result-body">
        ${primaryURL ? `
          <div class="result-section">
            <h4>Analyzed ${channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp Message' : 'URL'}</h4>
            <div class="result-url">${primaryURL}</div>
          </div>` : ''}
        
        ${allIndicators.length > 0 ? `
          <div class="result-section">
            <h4>Analysis Findings</h4>
            <div class="result-indicators">
              ${allIndicators.slice(0, 7).map(ind => `
                <div class="indicator-row">
                  <div class="indicator-dot ${ind.startsWith('✅') ? 'dot-ok' : ind.startsWith('⚠️') || ind.startsWith('💰') || ind.startsWith('🎁') || ind.startsWith('🚨') ? 'dot-warn' : 'dot-bad'}"></div>
                  <span>${ind}</span>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

        ${paymentAnalysis?.detected ? `
          <div class="result-section">
            <h4>💳 Financial Risk</h4>
            <div class="indicator-row"><div class="indicator-dot dot-warn"></div><span>Payment / financial content detected. Never share UPI, bank, or card details via links.</span></div>
          </div>` : ''}

        ${result.fraudDNA && result.fraudDNA.hasMatch ? `
          <div class="result-section fraud-dna-card">
            <div class="fraud-dna-header">
              <div class="dna-icon-pulse">🧬</div>
              <div style="flex:1;">
                <div class="dna-title">Fraud DNA Recognized // <span style="color:var(--accent);">${result.fraudDNA.similarity}% Genetic Match</span></div>
                <div class="dna-campaign">${result.fraudDNA.matchedCampaign?.codeName} (#${result.fraudDNA.matchedCampaign?.id}) • Active since ${result.fraudDNA.matchedCampaign?.activeSince}</div>
              </div>
              <span class="dna-badge">CAMPAIGN GENOME</span>
            </div>
            <div class="dna-sequence-bar">
              <span class="dna-seq-text">${result.fraudDNA.dnaSequence}</span>
              <span class="dna-hash">${result.fraudDNA.dnaHash}</span>
            </div>
            <p class="dna-desc">${result.fraudDNA.lineageSummary}</p>
            <div class="dna-comparison-grid">
              <div class="dna-col">
                <div class="dna-col-hdr mutated">⚡ Surface Mutations (Attempted Evasion)</div>
                ${result.fraudDNA.mutations.map(m => `<div class="dna-item mutated"><span>•</span> <span>${m.detail}</span></div>`).join('')}
              </div>
              <div class="dna-col">
                <div class="dna-col-hdr invariant">🛡️ Core Invariant Genome (Recognized)</div>
                ${result.fraudDNA.invariants.map(i => `<div class="dna-item invariant"><span>✔</span> <span>${i.detail}</span></div>`).join('')}
              </div>
            </div>
          </div>` : ''}

        <div class="result-section">
          <h4>Channel</h4>
          <div class="indicator-row">
            <div class="indicator-dot dot-ok"></div>
            <span>${{ url: '🔗 Direct URL', email: '📧 Email', whatsapp: '💬 WhatsApp', sms: '📱 SMS', browser: '🌐 Browser' }[channel] || channel}</span>
          </div>
        </div>
      </div>
      ${verdictClass === 'fraud' ? `
        <div class="result-actions">
          <button class="btn-danger" onclick="copyBlock('${encodeURIComponent(primaryURL)}')">🚫 Block & Report</button>
          <button class="btn-ghost" onclick="copyBlock('${encodeURIComponent(primaryURL)}')">📋 Copy Report</button>
        </div>` : ''}
    </div>
  `;
}

function copyBlock(encodedURL) {
  const url = decodeURIComponent(encodedURL);
  const text = `PhishGuard AI — FRAUD DETECTED\nURL: ${url}\nThis link has been flagged as a phishing / fraud attempt. Do NOT click.`;
  navigator.clipboard.writeText(text).catch(() => {});
  alert('📋 Report copied to clipboard! Share it to warn others.');
}

/* =====================================================
   SCAN HISTORY
   ===================================================== */
let historyFilter = 'all';
let historySearch = '';

function addToHistory(result) {
  STATE.scanHistory.unshift({
    ...result,
    id: Date.now(),
  });
  saveState();
}

function filterHistory() {
  historySearch = document.getElementById('history-search')?.value?.toLowerCase() || '';
  renderHistoryList();
}

function filterByResult(filter, btn) {
  historyFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHistoryList();
}

function renderHistoryList() {
  const list = document.getElementById('history-list');
  if (!list) return;

  const demoHistory = [
    { primaryURL: 'https://hdfc-netbanking-verify.xyz/login', verdictClass: 'fraud', riskScore: 92, channel: 'email', timestamp: Date.now() - 3600000 },
    { primaryURL: 'https://prize-claim.xyz/winner?id=2847', verdictClass: 'fraud', riskScore: 96, channel: 'whatsapp', timestamp: Date.now() - 7200000 },
    { primaryURL: 'https://bit.ly/win-now-prize', verdictClass: 'suspicious', riskScore: 55, channel: 'sms', timestamp: Date.now() - 10800000 },
    { primaryURL: 'https://github.com/torvalds/linux', verdictClass: 'safe', riskScore: 3, channel: 'url', timestamp: Date.now() - 14400000 },
    { primaryURL: 'https://google.com', verdictClass: 'safe', riskScore: 4, channel: 'url', timestamp: Date.now() - 18000000 },
    { primaryURL: 'https://amazon-deals-india.xyz/offer', verdictClass: 'fraud', riskScore: 88, channel: 'email', timestamp: Date.now() - 21600000 },
    { primaryURL: 'https://paytm-kyc-update.site/verify', verdictClass: 'fraud', riskScore: 94, channel: 'whatsapp', timestamp: Date.now() - 86400000 },
    { primaryURL: 'https://stackoverflow.com/questions/12345', verdictClass: 'safe', riskScore: 2, channel: 'url', timestamp: Date.now() - 90000000 },
    { primaryURL: 'https://gov-income-tax-refund.tk/claim', verdictClass: 'fraud', riskScore: 91, channel: 'sms', timestamp: Date.now() - 172800000 },
  ];

  const combined = [...STATE.scanHistory, ...demoHistory];
  let items = combined;

  if (historyFilter !== 'all') {
    items = items.filter(i => i.verdictClass === historyFilter);
  }
  if (historySearch) {
    items = items.filter(i => (i.primaryURL || '').toLowerCase().includes(historySearch));
  }

  if (items.length === 0) {
    list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">No scan history found.</div>';
    return;
  }

  list.innerHTML = items.slice(0, 50).map(item => {
    const ago = timeAgo(item.timestamp || Date.now());
    const riskColor = PHISHGUARD_ENGINE.getRiskColor(item.riskScore);
    return `
      <div class="history-item">
        <span class="activity-badge badge-${item.verdictClass}">${item.verdictClass}</span>
        <span class="history-channel">${(item.channel || 'url').toUpperCase()}</span>
        <span class="history-url" title="${item.primaryURL}">${item.primaryURL || '—'}</span>
        <span class="history-score" style="color:${riskColor}">${item.riskScore}/100</span>
        <span class="history-time">${ago}</span>
      </div>
    `;
  }).join('');
}

function clearHistory() {
  if (confirm('Clear all scan history? This cannot be undone.')) {
    STATE.scanHistory = [];
    saveState();
    renderHistoryList();
  }
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

/* =====================================================
   THREAT GRAPH
   ===================================================== */
function initThreatGraph() {
  const canvas = document.getElementById('threat-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Resize canvas
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.min(rect.width - 48, 900);
  canvas.height = Math.min(canvas.width * 0.56, 500);

  const W = canvas.width, H = canvas.height;

  const nodes = [
    { x: W*0.5, y: H*0.5, r: 18, color: '#00aaff', label: 'You', type: 'device' },
    { x: W*0.15, y: H*0.25, r: 14, color: '#00e676', label: 'google.com', type: 'safe' },
    { x: W*0.25, y: H*0.7, r: 14, color: '#00e676', label: 'github.com', type: 'safe' },
    { x: W*0.8, y: H*0.2, r: 16, color: '#ff4444', label: 'prize-claim.xyz', type: 'fraud' },
    { x: W*0.85, y: H*0.6, r: 16, color: '#ff4444', label: 'hdfc-verify.xyz', type: 'fraud' },
    { x: W*0.6, y: H*0.15, r: 13, color: '#ffd700', label: 'bit.ly/win', type: 'suspicious' },
    { x: W*0.35, y: H*0.35, r: 14, color: '#00e676', label: 'amazon.in', type: 'safe' },
    { x: W*0.7, y: H*0.75, r: 15, color: '#ff4444', label: 'upi-reward.tk', type: 'fraud' },
    { x: W*0.45, y: H*0.85, r: 13, color: '#ffd700', label: 'tinyurl.com', type: 'suspicious' },
    { x: W*0.12, y: H*0.55, r: 12, color: '#00e676', label: 'sbi.co.in', type: 'safe' },
  ];

  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9],
    [3, 4], [3, 7], [5, 3], [8, 7],
  ];

  let animFrame = 0;
  let nodeVels = nodes.map(() => ({ dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4 }));

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(8,12,20,0)';
    ctx.fillRect(0, 0, W, H);

    // Draw edges
    edges.forEach(([a, b]) => {
      const na = nodes[a], nb = nodes[b];
      const isBad = na.type === 'fraud' || nb.type === 'fraud' || na.type === 'suspicious' || nb.type === 'suspicious';
      const gradient = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
      gradient.addColorStop(0, na.color + '66');
      gradient.addColorStop(1, nb.color + '66');
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = isBad ? 1.5 : 1;
      ctx.setLineDash(isBad ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      // Pulse ring for fraud nodes
      if (node.type === 'fraud') {
        const pulse = 0.5 + 0.5 * Math.sin(animFrame * 0.06 + i);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + 8 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff444440';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Glow
      const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 2.5);
      grd.addColorStop(0, node.color + '55');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.font = `${node.type === 'device' ? 'bold ' : ''}11px Inter, sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.r + 14);
    });

    // Animate floating
    nodes.forEach((node, i) => {
      if (i === 0) return; // Don't move center node
      node.x += nodeVels[i].dx;
      node.y += nodeVels[i].dy;
      const origX = [W*0.5,W*0.15,W*0.25,W*0.8,W*0.85,W*0.6,W*0.35,W*0.7,W*0.45,W*0.12][i];
      const origY = [H*0.5,H*0.25,H*0.7,H*0.2,H*0.6,H*0.15,H*0.35,H*0.75,H*0.85,H*0.55][i];
      // Spring back
      node.x += (origX - node.x) * 0.005;
      node.y += (origY - node.y) * 0.005;
      // Boundary
      if (node.x < node.r || node.x > W - node.r) nodeVels[i].dx *= -1;
      if (node.y < node.r || node.y > H - node.r) nodeVels[i].dy *= -1;
    });

    animFrame++;
    requestAnimationFrame(draw);
  }

  draw();
}

/* =====================================================
   MODAL
   ===================================================== */
function closeModal() {
  document.getElementById('result-modal').classList.add('hidden');
}

/* =====================================================
   UTILS
   ===================================================== */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* =====================================================
   AUTH CARD 3D TILT EFFECT
   ===================================================== */
const authCard = document.getElementById('auth-card-3d');
if (authCard) {
  authCard.addEventListener('mousemove', (e) => {
    const rect = authCard.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    authCard.style.transform = `perspective(1000px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg)`;
  });
  authCard.addEventListener('mouseleave', () => {
    authCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    authCard.style.transition = 'transform 0.5s ease';
  });
  authCard.addEventListener('mouseenter', () => {
    authCard.style.transition = 'transform 0.05s';
  });
}

/* =====================================================
   MODAL CARD 3D TILT
   ===================================================== */
const modalCard = document.getElementById('modal-card-3d');
if (modalCard) {
  modalCard.addEventListener('mousemove', (e) => {
    const rect = modalCard.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    modalCard.style.transform = `perspective(800px) rotateY(${dx * 5}deg) rotateX(${-dy * 5}deg)`;
  });
  modalCard.addEventListener('mouseleave', () => {
    modalCard.style.transform = '';
    modalCard.style.transition = 'transform 0.5s ease';
  });
}

/* =====================================================
   INIT
   ===================================================== */
loadState();
initSupabaseAuth();
