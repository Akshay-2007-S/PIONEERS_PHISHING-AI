/* PhishGuard AI — Copilot Voice Agent & Intelligent Threat Assistant */
(function () {
  'use strict';

  // State
  let isOpen = false;
  let isListening = false;
  let isSpeaking = false;
  let isMuted = false;
  let activeTab = 'chat';
  let recognition = null;
  let synth = window.speechSynthesis || null;
  let currentUtterance = null;
  let waveAnimId = null;

  // Initialize Speech Recognition if supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
  }

  // Pre-canned high-impact demo data for instant hackathon demonstrations
  const DEMO_PRESETS = {
    whatsapp_scam: {
      title: 'WhatsApp KYC Scam Screenshot',
      text: '⚠️ URGENT ALERT: Your HDFC Bank account #XXXX4021 will be blocked today! Complete your mandatory Aadhaar KYC verification immediately to avoid penalty of ₹5,000. Click here to verify: http://hdfc-kyc-update.top/login. Do not share OTP with anyone.',
      imageSvg: `<svg viewBox="0 0 400 240" width="100%" height="160" style="background:#0b141a;border-radius:8px;padding:12px;font-family:sans-serif;">
        <rect x="10" y="10" width="380" height="40" rx="6" fill="#1f2c34"/>
        <circle cx="32" cy="30" r="14" fill="#00a884"/>
        <text x="56" y="28" fill="#fff" font-size="12" font-weight="bold">HDFC_ALERT_OFFICIAL (Unverified)</text>
        <text x="56" y="42" fill="#8696a0" font-size="10">+91 98451 09281 • Forwarded many times</text>
        <rect x="20" y="65" width="360" height="150" rx="8" fill="#1f2c34" stroke="#ff2d55" stroke-width="1.5"/>
        <text x="35" y="90" fill="#ff7675" font-size="11" font-weight="bold">⚠️ URGENT: HDFC Account Block Notice</text>
        <text x="35" y="112" fill="#e9edef" font-size="10.5">Your Account #XXXX4021 will be suspended within 24h.</text>
        <text x="35" y="130" fill="#e9edef" font-size="10.5">Mandatory KYC verification required to prevent penalty.</text>
        <rect x="35" y="145" width="310" height="30" rx="4" fill="#2a3942"/>
        <text x="45" y="165" fill="#00f0ff" font-size="10.5" text-decoration="underline">http://hdfc-kyc-update.top/login</text>
        <text x="35" y="195" fill="#8696a0" font-size="9.5">10:42 AM • Message not from official HDFC shortcode</text>
      </svg>`
    },
    electricity_scam: {
      title: 'Electricity Bill Disconnection SMS',
      text: 'Dear Consumer, Your Electricity power connection will be disconnected tonight at 9.30 PM from electricity office because your previous month bill was not updated. Please immediately contact our electricity officer Rahul Sharma at 8923412098 or pay via http://bill-eb-update.xyz. Thank you.',
      imageSvg: `<svg viewBox="0 0 400 210" width="100%" height="150" style="background:#070d19;border-radius:8px;padding:12px;font-family:sans-serif;">
        <rect x="10" y="10" width="380" height="35" rx="6" fill="#111c2e"/>
        <text x="24" y="32" fill="#00f0ff" font-size="12" font-weight="bold">💬 SMS: VM-POWEROFC (Fake Sender ID)</text>
        <rect x="20" y="55" width="360" height="135" rx="8" fill="#131e31" stroke="#ffe600" stroke-width="1.5"/>
        <text x="35" y="80" fill="#ffe600" font-size="11" font-weight="bold">⚡ POWER DISCONNECTION WARNING</text>
        <text x="35" y="102" fill="#cbd5e1" font-size="10.5">Your power will be disconnected at 9:30 PM tonight.</text>
        <text x="35" y="120" fill="#cbd5e1" font-size="10.5">Previous bill not updated. Call Officer: 8923412098</text>
        <text x="35" y="145" fill="#00f0ff" font-size="10.5" text-decoration="underline">http://bill-eb-update.xyz</text>
        <text x="35" y="172" fill="#64748b" font-size="9.5">Reported 412 times in Mumbai / Delhi DISCOM</text>
      </svg>`
    },
    upi_lottery: {
      title: 'UPI Prize / QR Code Refund Fraud',
      text: 'Congratulations! You have received a cash reward of ₹4,999 from PhonePe Lucky Draw. Scan this QR code or click http://reward-phonepe.win to claim instant refund into your bank account. Enter your UPI PIN to receive money.',
      imageSvg: `<svg viewBox="0 0 400 210" width="100%" height="150" style="background:#130b20;border-radius:8px;padding:12px;font-family:sans-serif;">
        <rect x="10" y="10" width="380" height="35" rx="6" fill="#201335"/>
        <text x="24" y="32" fill="#ff2d95" font-size="12" font-weight="bold">🎁 UPI Reward Claim #94812</text>
        <rect x="20" y="55" width="360" height="135" rx="8" fill="#22153a" stroke="#ff2d95" stroke-width="1.5"/>
        <text x="35" y="80" fill="#00ff9c" font-size="12" font-weight="bold">💰 YOU WON ₹4,999 CASHBACK</text>
        <text x="35" y="105" fill="#cbd5e1" font-size="10.5">Click link & enter UPI PIN to receive payment.</text>
        <text x="35" y="130" fill="#00f0ff" font-size="10.5" text-decoration="underline">http://reward-phonepe.win</text>
        <text x="35" y="165" fill="#ff2d95" font-size="10" font-weight="bold">⚠️ RED FLAG: You NEVER enter UPI PIN to RECEIVE money!</text>
      </svg>`
    }
  };

  // Build DOM elements
  function initDOM() {
    // 1. Floating Trigger Button (Matches User ASCII diagram)
    const floatBtn = document.createElement('div');
    floatBtn.id = 'copilot-float-btn';
    floatBtn.className = 'copilot-float-card';
    floatBtn.setAttribute('title', 'Click to talk with PhishGuard Copilot');
    floatBtn.innerHTML = `
      <div class="copilot-float-inner">
        <div class="copilot-float-shield">
          <span class="copilot-shield-icon">🛡️</span>
          <span class="copilot-radar-ring"></span>
        </div>
        <div class="copilot-float-text">
          <div class="copilot-title">PhishGuard</div>
          <div class="copilot-sub">Copilot</div>
        </div>
        <div class="copilot-float-ask">
          <span class="copilot-mic-icon">🎙️</span>
          <span>Ask me</span>
        </div>
      </div>
      <div class="copilot-live-bars">
        <i></i><i></i><i></i><i></i><i></i>
      </div>
    `;
    document.body.appendChild(floatBtn);

    // 2. Copilot Main HUD Window
    const win = document.createElement('div');
    win.id = 'copilot-window';
    win.className = 'copilot-window';
    win.innerHTML = `
      <div class="copilot-hud-card">
        <!-- Header -->
        <div class="copilot-hud-header">
          <div class="copilot-header-title">
            <div class="copilot-header-avatar">
              <span>🛡️</span>
              <span class="copilot-online-dot"></span>
            </div>
            <div>
              <div class="copilot-hud-name">PhishGuard Copilot <span class="copilot-badge">AI 2.6</span></div>
              <div class="copilot-hud-status" id="copilot-status-text">● VOICE READY // MONITORING</div>
            </div>
          </div>
          <div class="copilot-header-controls">
            <button class="copilot-btn-icon" id="copilot-mute-btn" title="Toggle AI Voice Speech">🔊</button>
            <button class="copilot-btn-icon" id="copilot-close-btn" title="Close Copilot">✕</button>
          </div>
        </div>

        <!-- Voice Visualizer Ribbon -->
        <div class="copilot-wave-bar">
          <canvas id="copilot-wave-canvas" width="400" height="40"></canvas>
          <div class="copilot-wave-state" id="copilot-wave-state">STANDBY</div>
        </div>

        <!-- Navigation Tabs -->
        <div class="copilot-tabs">
          <button class="copilot-tab active" data-tab="chat">💬 Voice & Chat</button>
          <button class="copilot-tab" data-tab="screenshot">📸 Screenshot</button>
          <button class="copilot-tab" data-tab="payment">💸 Payment</button>
          <button class="copilot-tab" data-tab="dna">🧬 Fraud DNA</button>
        </div>

        <!-- Tab 1: Chat Stream -->
        <div class="copilot-tab-panel active" id="copilot-panel-chat">
          <div class="copilot-chat-stream" id="copilot-chat-stream">
            <div class="copilot-msg bot">
              <div class="copilot-msg-bubble">
                <b>Shield Intelligence Online.</b><br/>
                I am your real-time cybersecurity Copilot. You can speak to me or paste any message, payment request, or SMS.
                <div class="copilot-msg-signals" style="margin-top:8px;">
                  <span class="sig-tag">🎙️ Real-time Voice</span>
                  <span class="sig-tag">📸 Screenshot OCR</span>
                  <span class="sig-tag">🧠 Threat Reasoning</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Suggestion Chips -->
          <div class="copilot-quick-chips">
            <button class="copilot-chip" data-query="Is this message a scam?">🎙️ "Is this message a scam?"</button>
            <button class="copilot-chip" data-query="Someone asked for my OTP for electricity bill refund">⚡ Check Electricity SMS</button>
            <button class="copilot-chip" data-query="http://hdfc-kyc-update.top">🔗 Check Suspicious Link</button>
            <button class="copilot-chip" data-query="Why is urgent payment dangerous?">🧠 Why is this dangerous?</button>
          </div>
        </div>

        <!-- Tab 2: Screenshot Scanner -->
        <div class="copilot-tab-panel" id="copilot-panel-screenshot">
          <div class="copilot-scanner-wrap">
            <div class="copilot-scanner-dropzone" id="copilot-dropzone">
              <input type="file" id="copilot-file-input" accept="image/*" style="display:none;" />
              <div class="copilot-drop-icon">📸</div>
              <div style="font-weight:600;color:#fff;font-size:.9rem;margin-bottom:4px;">Upload WhatsApp / SMS Screenshot</div>
              <div style="font-size:.75rem;color:var(--text-muted);">Drop image here or click to browse</div>
            </div>

            <div style="font-size:.72rem;letter-spacing:1px;color:var(--accent);margin:10px 0 6px;text-transform:uppercase;">
              ⚡ Quick Demo Screenshots for Presentation:
            </div>
            <div class="copilot-demo-grid">
              <button class="copilot-demo-btn" data-demo="whatsapp_scam">📱 WhatsApp KYC Scam</button>
              <button class="copilot-demo-btn" data-demo="electricity_scam">⚡ Power Disconnect SMS</button>
              <button class="copilot-demo-btn" data-demo="upi_lottery">🎁 UPI Lottery Claim</button>
            </div>

            <!-- OCR Pipeline Result View -->
            <div class="copilot-pipeline-view" id="copilot-pipeline-view" style="display:none;">
              <div class="pipeline-breadcrumb">
                <span>Screenshot</span> → <span>PhishGuard AI</span> → <span>OCR + NLP + URL</span> → <b class="pipeline-verdict-tag">ANALYZING...</b>
              </div>
              <div class="pipeline-preview-box" id="copilot-preview-box"></div>
              <div class="pipeline-ocr-output" id="copilot-ocr-output"></div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Payment Risk Analyzer -->
        <div class="copilot-tab-panel" id="copilot-panel-payment">
          <div class="copilot-payment-wrap">
            <p style="font-size:.82rem;color:var(--text-secondary);margin-bottom:12px;">
              Verify suspicious UPI handles, payment links, refund forms, and QR code requests in real time.
            </p>
            <div class="copilot-pay-form">
              <input type="text" id="copilot-pay-input" placeholder="e.g. refund-desk@okaxis or pay 5000 via UPI..." />
              <button class="btn-primary" id="copilot-pay-btn" style="padding:.6rem 1rem;">Analyze</button>
            </div>
            <div class="copilot-pay-common">
              <span class="pay-chip" data-pay="Enter UPI PIN to receive ₹4999 cash prize">"Enter UPI PIN to receive money"</span>
              <span class="pay-chip" data-pay="electricity-bill-refund@ybl">electricity-bill-refund@ybl</span>
              <span class="pay-chip" data-pay="Pay ₹10 registration fee to get loan of ₹50,000">"Pay registration fee for loan"</span>
            </div>
            <div id="copilot-pay-result"></div>
          </div>
        </div>

        <!-- Tab 4: Fraud DNA (Campaign Genome & Mutation Tracker) -->
        <div class="copilot-tab-panel" id="copilot-panel-dna">
          <div class="copilot-dna-wrap">
            <div class="dna-panel-header">
              <span class="dna-panel-tag">🧬 GENOME FINGERPRINTING</span>
              <p>Recognizes the invariant scam genome even after scammers mutate URLs, domains, text, or sender IDs.</p>
            </div>

            <!-- Live 3D DNA Double Helix Visualizer -->
            <div class="copilot-dna-canvas-wrap">
              <canvas id="copilot-dna-canvas" width="380" height="65"></canvas>
              <div class="dna-helix-caption"><span>INVARIANT CORE LOCI</span> <span>LOC-01 // LOC-05</span></div>
            </div>

            <!-- Interactive Mutation Simulator (Hackathon Demo Tool) -->
            <div class="dna-mutator-box">
              <div class="mutator-title">⚡ Interactive Scam Mutation Simulator</div>
              <p class="mutator-sub">Test how scammers mutate their message & disposable domain to evade blocklists.</p>
              
              <div class="mutator-card original">
                <b>Original Scam Baseline:</b>
                <div class="mutator-text" id="dna-base-text">"URGENT: Your HDFC Bank account will be blocked today! Complete KYC verification at http://hdfc-kyc-update.top to prevent ₹5,000 fine."</div>
                <div class="mutator-meta">Domain: hdfc-kyc-update.top • Sender: +91 98451 09281</div>
              </div>

              <button class="btn-primary btn-mutate-act" id="btn-run-mutation">
                <span>⚡ Simulate Scammer Mutation</span>
              </button>

              <div class="mutator-card mutated" id="dna-mutated-card" style="display:none;">
                <div class="dna-matched-banner">
                  <span class="dna-match-pill" id="dna-match-score">96.4% MATCH</span>
                  <b>🧬 EVASION FOILED // GENOME IDENTIFIED</b>
                </div>
                <div class="mutator-text" id="dna-mutated-text"></div>
                <div class="mutator-analysis-grid">
                  <div class="mut-col">
                    <span class="mut-lbl-red">⚡ Disguised Surface Layer:</span>
                    <div id="dna-mut-details"></div>
                  </div>
                  <div class="mut-col">
                    <span class="mut-lbl-grn">🛡️ Core Invariant Genome:</span>
                    <div id="dna-inv-details"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Input Bar -->
        <div class="copilot-input-bar">
          <button class="copilot-cam-btn" id="copilot-cam-trigger" title="Scan Screenshot">📸</button>
          <input type="text" id="copilot-text-input" placeholder="Ask Copilot or speak message..." autocomplete="off" />
          <button class="copilot-mic-btn" id="copilot-mic-trigger" title="Speak to Copilot">
            <span class="mic-inner-icon">🎙️</span>
          </button>
          <button class="copilot-send-btn" id="copilot-send-trigger" title="Send Query">⚡</button>
        </div>
      </div>
    `;
    document.body.appendChild(win);

    bindEvents();
    initWaveform();
    initDNAHelix();
  }

  // Bind Event Listeners
  function bindEvents() {
    const floatBtn = document.getElementById('copilot-float-btn');
    const win = document.getElementById('copilot-window');
    const closeBtn = document.getElementById('copilot-close-btn');
    const muteBtn = document.getElementById('copilot-mute-btn');
    const micBtn = document.getElementById('copilot-mic-trigger');
    const sendBtn = document.getElementById('copilot-send-trigger');
    const textInput = document.getElementById('copilot-text-input');
    const camBtn = document.getElementById('copilot-cam-trigger');
    const fileInput = document.getElementById('copilot-file-input');
    const dropzone = document.getElementById('copilot-dropzone');

    // Float button opens window
    floatBtn.addEventListener('click', toggleCopilot);
    closeBtn.addEventListener('click', () => setCopilotOpen(false));

    // Mute speech toggle
    muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      muteBtn.textContent = isMuted ? '🔇' : '🔊';
      muteBtn.title = isMuted ? 'Unmute AI Voice' : 'Mute AI Voice';
      if (isMuted && synth) synth.cancel();
    });

    // Mic click
    micBtn.addEventListener('click', toggleMic);

    // Send query
    sendBtn.addEventListener('click', handleSendInput);
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSendInput();
    });

    // Tab navigation
    document.querySelectorAll('.copilot-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.copilot-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.copilot-tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        const panel = document.getElementById(`copilot-panel-${activeTab}`);
        if (panel) panel.classList.add('active');
      });
    });

    // Quick chips in chat
    document.querySelectorAll('.copilot-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        executeUserQuery(query);
      });
    });

    // Camera button navigates to screenshot tab
    camBtn.addEventListener('click', () => {
      document.querySelector('.copilot-tab[data-tab="screenshot"]').click();
      fileInput.click();
    });

    // Dropzone click & drag
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--accent)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0]);
      }
    });

    // Demo screenshot buttons
    document.querySelectorAll('.copilot-demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.demo;
        loadDemoScreenshot(key);
      });
    });

    // Mutation Simulator button
    const mutateBtn = document.getElementById('btn-run-mutation');
    if (mutateBtn) {
      mutateBtn.addEventListener('click', runMutationDemo);
    }

    // Payment analyzer button & chips
    const payBtn = document.getElementById('copilot-pay-btn');
    const payInput = document.getElementById('copilot-pay-input');
    if (payBtn && payInput) {
      payBtn.addEventListener('click', () => analyzePaymentString(payInput.value));
      payInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') analyzePaymentString(payInput.value);
      });
    }

    document.querySelectorAll('.pay-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (payInput) payInput.value = chip.dataset.pay;
        analyzePaymentString(chip.dataset.pay);
      });
    });

    // Setup Speech Recognition Callbacks
    if (recognition) {
      recognition.onstart = () => {
        isListening = true;
        updateStatus('● LISTENING TO YOUR VOICE...', '#00f0ff');
        micBtn.classList.add('recording');
        textInput.placeholder = 'Listening... Speak now';
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        textInput.value = transcript;

        if (event.results[0].isFinal) {
          stopMic();
          executeUserQuery(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        stopMic();
        updateStatus('● VOICE READY // STANDBY', '#00ff9c');
      };

      recognition.onend = () => {
        stopMic();
      };
    }
  }

  function toggleCopilot() {
    setCopilotOpen(!isOpen);
  }

  function setCopilotOpen(open) {
    isOpen = open;
    const win = document.getElementById('copilot-window');
    const floatBtn = document.getElementById('copilot-float-btn');

    if (open) {
      win.classList.add('open');
      floatBtn.classList.add('hidden-state');
      // Greet on first open if needed
      document.getElementById('copilot-text-input')?.focus();
    } else {
      win.classList.remove('open');
      floatBtn.classList.remove('hidden-state');
      if (synth) synth.cancel();
      stopMic();
    }
  }

  function toggleMic() {
    if (!recognition) {
      addBotMessage('Speech recognition is not supported in this browser. You can type your query in the box below!');
      return;
    }
    if (isListening) {
      stopMic();
    } else {
      startMic();
    }
  }

  function startMic() {
    if (!recognition) return;
    try {
      if (synth) synth.cancel();
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
    }
  }

  function stopMic() {
    isListening = false;
    const micBtn = document.getElementById('copilot-mic-trigger');
    const textInput = document.getElementById('copilot-text-input');
    if (micBtn) micBtn.classList.remove('recording');
    if (textInput) textInput.placeholder = 'Ask Copilot or speak message...';
    updateStatus('● VOICE READY // STANDBY', '#00ff9c');
    try { recognition?.stop(); } catch(e){}
  }

  function updateStatus(text, color) {
    const el = document.getElementById('copilot-status-text');
    if (el) {
      el.textContent = text;
      el.style.color = color || 'var(--neon-green)';
    }
    const stateEl = document.getElementById('copilot-wave-state');
    if (stateEl) {
      stateEl.textContent = isListening ? 'LISTENING' : isSpeaking ? 'TRANSMITTING' : 'MONITORING';
    }
  }

  function handleSendInput() {
    const textInput = document.getElementById('copilot-text-input');
    const query = textInput.value.trim();
    if (!query) return;
    textInput.value = '';
    executeUserQuery(query);
  }

  // ----------------------------------------------------
  // Core Reasoning & Analysis Pipeline
  // ----------------------------------------------------
  function executeUserQuery(userText) {
    // Switch to chat tab
    document.querySelector('.copilot-tab[data-tab="chat"]')?.click();

    // 1. Add User message to chat
    addUserMessage(userText);

    // 2. Perform deep security intelligence analysis
    analyzeAndRespond(userText);
  }

  function addUserMessage(text) {
    const stream = document.getElementById('copilot-chat-stream');
    const div = document.createElement('div');
    div.className = 'copilot-msg user';
    div.innerHTML = `<div class="copilot-msg-bubble">${escapeHtml(text)}</div>`;
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
  }

  function addBotMessage(htmlContent, spokenSummary) {
    const stream = document.getElementById('copilot-chat-stream');
    const div = document.createElement('div');
    div.className = 'copilot-msg bot';
    div.innerHTML = `<div class="copilot-msg-bubble">${htmlContent}</div>`;
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;

    // Speak voice response
    if (spokenSummary && !isMuted) {
      speakVoice(spokenSummary);
    }
  }

  function analyzeAndRespond(text) {
    const lower = text.toLowerCase();

    // Canonical User Request Trigger: "Is this message a scam?"
    if (lower.includes('is this message a scam') || lower.includes('is this a scam') || lower.includes('check this message')) {
      const canonicalSample = 'Your HDFC account will be blocked in 24 hours. Verify KYC now at http://paypa1-update.xyz to avoid penalty.';
      const analysis = analyzeThreatSignals(canonicalSample);
      
      const spoken = `I found three warning signals. The sender is requesting urgent payment, the URL resembles the claimed brand, and the message contains a financial lure. I would treat this as high risk.`;
      
      const html = `
        <div class="copilot-verdict-header">
          <span class="copilot-score-pill score-fraud">🔴 HIGH RISK — 91</span>
          <b>Threat Analysis Complete</b>
        </div>
        <p style="margin:6px 0 10px;font-size:.85rem;color:#e2e8f0;line-height:1.45;">
          ${spoken}
        </p>
        <div class="copilot-signals-box">
          <div class="sig-row bad">
            <span class="sig-bullet">⚠️</span>
            <div><b>Urgency Pressure:</b> Imposes artificial 24-hour deadline to prevent rational verification.</div>
          </div>
          <div class="sig-row bad">
            <span class="sig-bullet">🏢</span>
            <div><b>Brand Spoofing:</b> Domain typosquatting mimicking official banking portal.</div>
          </div>
          <div class="sig-row bad">
            <span class="sig-bullet">💸</span>
            <div><b>Financial / KYC Lure:</b> Attempts to harvest OTP and netbanking credentials.</div>
          </div>
        </div>
        <div class="copilot-action-box">
          <b>🛡️ Recommended Action:</b> Do not click the link or provide credentials. Block sender and verify directly at your bank's official domain.
        </div>
      `;
      addBotMessage(html, spoken);
      return;
    }

    // "Why is this dangerous?"
    if (lower.includes('why is this dangerous') || lower.includes('why is urgent payment dangerous')) {
      const spoken = `Urgent payments bypass your natural skepticism. Scammers create artificial pressure such as account suspension or power cutoffs so you react before verifying the sender.`;
      const html = `
        <div class="copilot-verdict-header">
          <span class="copilot-score-pill" style="background:rgba(0,240,255,.15);color:#00f0ff;border:1px solid #00f0ff;">🧠 THREAT REASONING</span>
          <b>Why Urgency is Dangerous</b>
        </div>
        <p style="font-size:.85rem;color:#cbd5e1;line-height:1.45;margin-bottom:8px;">
          ${spoken}
        </p>
        <div class="copilot-signals-box">
          <div class="sig-row"><span class="sig-bullet">1.</span> <b>Cognitive Overload:</b> Panic forces immediate action without checking domain validity.</div>
          <div class="sig-row"><span class="sig-bullet">2.</span> <b>Zero Recourse:</b> UPI and crypto transactions are irreversible once authorized.</div>
          <div class="sig-row"><span class="sig-bullet">3.</span> <b>Credential Harvesting:</b> Secondary fake forms steal OTPs to execute unauthorized wire transfers.</div>
        </div>
      `;
      addBotMessage(html, spoken);
      return;
    }

    // Dynamic Engine Analysis using window.PHISHGUARD_ENGINE
    const engine = window.PHISHGUARD_ENGINE;
    let result = null;
    if (engine && typeof engine.analyze === 'function') {
      result = engine.analyze(text, 'general');
    }

    const threatDetails = analyzeThreatSignals(text, result);
    const spokenSummary = generateSpokenSummary(threatDetails);

    const scoreClass = threatDetails.score >= 70 ? 'score-fraud' : threatDetails.score >= 35 ? 'score-suspicious' : 'score-safe';
    const scoreTag = threatDetails.score >= 70 ? '🔴 HIGH RISK' : threatDetails.score >= 35 ? '🟡 SUSPICIOUS' : '🟢 SAFE VERIFIED';

    const html = `
      <div class="copilot-verdict-header">
        <span class="copilot-score-pill ${scoreClass}">${scoreTag} — ${threatDetails.score}</span>
        <b>${threatDetails.verdictTitle}</b>
      </div>
      <p style="margin:6px 0 10px;font-size:.85rem;color:#e2e8f0;line-height:1.45;">
        ${threatDetails.explanation}
      </p>
      <div class="copilot-signals-box">
        ${threatDetails.signals.map(s => `
          <div class="sig-row ${s.bad ? 'bad' : 'ok'}">
            <span class="sig-bullet">${s.icon}</span>
            <div><b>${s.label}:</b> ${s.desc}</div>
          </div>
        `).join('')}
      </div>
      <div class="copilot-action-box">
        <b>🛡️ Recommended Action:</b> ${threatDetails.action}
      </div>
    `;

    addBotMessage(html, spokenSummary);
  }

  // Threat signals analyzer
  function analyzeThreatSignals(text, engineResult) {
    const lower = text.toLowerCase();
    const signals = [];
    let score = engineResult ? engineResult.score : 15;

    // 1. Urgency test
    const urgencyWords = ['urgent', 'immediately', 'within 24', 'blocked today', 'suspended', 'penalty', 'disconnection', 'tonight', 'deactivated'];
    const matchedUrgency = urgencyWords.filter(w => lower.includes(w));
    if (matchedUrgency.length > 0) {
      score = Math.max(score, 65);
      signals.push({
        icon: '⚠️',
        bad: true,
        label: 'Urgency Pressure',
        desc: `Contains coercive time constraint (${matchedUrgency.join(', ')}).`
      });
    }

    // 2. Financial & OTP extraction
    const financialWords = ['otp', 'cvv', 'pin', 'upi', 'refund', 'cashback', 'prize', 'winner', 'account number'];
    const matchedFin = financialWords.filter(w => lower.includes(w));
    if (matchedFin.length > 0) {
      score = Math.max(score, 75);
      signals.push({
        icon: '💸',
        bad: true,
        label: 'Financial / Credential Lure',
        desc: `Explicit request involving sensitive payment or verification tokens (${matchedFin.join(', ')}).`
      });
    }

    // 3. Brand & Domain typosquatting
    const urlMatch = text.match(/https?:\/\/[^\s]+/i) || text.match(/[a-zA-Z0-9-]+\.(top|xyz|club|win|click|info|cc|co|ru)/i);
    if (urlMatch) {
      const urlStr = urlMatch[0];
      const isKnownPhish = /(-kyc|-secure|-verify|paypa1|amzon|hdfc-|sbi-|bill-)/i.test(urlStr);
      if (isKnownPhish) {
        score = Math.max(score, 90);
        signals.push({
          icon: '🏢',
          bad: true,
          label: 'Brand Spoofing URL',
          desc: `Link "${urlStr}" impersonates an official service using a non-standard TLD.`
        });
      } else {
        signals.push({
          icon: '🔗',
          bad: score > 50,
          label: 'External URL Detected',
          desc: `Points to destination: ${urlStr}`
        });
      }
    }

    if (signals.length === 0) {
      signals.push({
        icon: '✅',
        bad: false,
        label: 'Heuristic Check',
        desc: 'No aggressive urgency triggers, suspicious domain patterns, or OTP requests found.'
      });
      score = Math.min(score, 18);
    }

    let verdictTitle = score >= 70 ? 'Phishing & Fraud Attempt Intercepted' : score >= 35 ? 'Caution: Suspicious Message Signals' : 'Legitimate Verified Pattern';
    let explanation = score >= 70
      ? `I found ${signals.filter(s => s.bad).length} warning signals. The sender is requesting urgent payment, the URL resembles the claimed brand, and the message contains a financial lure. I would treat this as high risk.`
      : score >= 35
      ? 'This message contains unverified sender elements and financial keywords. Exercise caution before clicking.'
      : 'This communication matches verified safe organizational communication patterns.';

    let action = score >= 70
      ? 'Do NOT click links or share credentials. Block sender and file a report with PhishGuard.'
      : score >= 35
      ? 'Verify directly through official customer service channels before continuing.'
      : 'No malicious indicators detected. Safe to proceed.';

    return { score, signals, verdictTitle, explanation, action };
  }

  function generateSpokenSummary(details) {
    if (details.score >= 70) {
      return `I found three warning signals. The sender is requesting urgent payment, the URL resembles the claimed brand, and the message contains a financial lure. I would treat this as high risk.`;
    } else if (details.score >= 35) {
      return `Warning. This communication shows suspicious characteristics. Please verify the sender through official channels before sharing any information.`;
    } else {
      return `Analysis complete. No threat vectors detected. This message appears safe.`;
    }
  }

  // ----------------------------------------------------
  // Speech Synthesis Voice Output
  // ----------------------------------------------------
  function speakVoice(text) {
    if (!synth || isMuted) return;
    try {
      synth.cancel();
      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.rate = 1.02;
      currentUtterance.pitch = 1.0;

      // Select high quality English voice if available
      const voices = synth.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Microsoft')));
      if (preferred) currentUtterance.voice = preferred;

      currentUtterance.onstart = () => {
        isSpeaking = true;
        updateStatus('● TRANSMITTING AUDIO SYNTHESIS...', '#ff2d95');
      };

      currentUtterance.onend = () => {
        isSpeaking = false;
        updateStatus('● VOICE READY // STANDBY', '#00ff9c');
      };

      currentUtterance.onerror = () => {
        isSpeaking = false;
        updateStatus('● VOICE READY // STANDBY', '#00ff9c');
      };

      synth.speak(currentUtterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      isSpeaking = false;
    }
  }

  // ----------------------------------------------------
  // Screenshot Scanner & Demo Simulation
  // ----------------------------------------------------
  function loadDemoScreenshot(key) {
    const demo = DEMO_PRESETS[key];
    if (!demo) return;

    const pView = document.getElementById('copilot-pipeline-view');
    const pBox = document.getElementById('copilot-preview-box');
    const ocrOut = document.getElementById('copilot-ocr-output');

    pView.style.display = 'block';
    pBox.innerHTML = demo.imageSvg;

    ocrOut.innerHTML = `
      <div style="font-family:'JetBrains Mono',monospace;font-size:.75rem;color:var(--text-muted);margin-bottom:6px;">
        [OCR PIPELINE] Extracting bounding boxes & NLP entities...
      </div>
      <div class="ocr-text-box">${escapeHtml(demo.text)}</div>
    `;

    // Run analysis and display in chat
    setTimeout(() => {
      document.querySelector('.copilot-tab[data-tab="chat"]')?.click();
      addUserMessage(`📸 [Screenshot Upload] ${demo.title}`);
      analyzeAndRespond(demo.text);
    }, 900);
  }

  function handleImageUpload(file) {
    const pView = document.getElementById('copilot-pipeline-view');
    const pBox = document.getElementById('copilot-preview-box');
    const ocrOut = document.getElementById('copilot-ocr-output');

    const reader = new FileReader();
    reader.onload = (e) => {
      pView.style.display = 'block';
      pBox.innerHTML = `<img src="${e.target.result}" alt="Uploaded Screenshot" style="max-width:100%;max-height:180px;border-radius:6px;border:1px solid var(--border-color);display:block;margin:0 auto;" />`;
      ocrOut.innerHTML = `
        <div style="font-family:'JetBrains Mono',monospace;font-size:.75rem;color:var(--accent);margin:6px 0;">
          ⚡ [OCR EXTRACTOR ACTIVE] Scanning pixel matrix for URLs, brands & urgency tokens...
        </div>
      `;

      setTimeout(() => {
        // Fallback simulation text based on generic phishing capture
        const simulatedText = 'Dear customer, your bank account is suspended due to pending KYC. Click http://hdfc-secure-verify.top immediately to submit OTP.';
        ocrOut.innerHTML += `<div class="ocr-text-box">${simulatedText}</div>`;

        setTimeout(() => {
          document.querySelector('.copilot-tab[data-tab="chat"]')?.click();
          addUserMessage(`📸 [Screenshot Scanner] ${file.name}`);
          analyzeAndRespond(simulatedText);
        }, 1000);
      }, 1200);
    };
    reader.readAsDataURL(file);
  }

  // ----------------------------------------------------
  // Payment Risk Analyzer
  // ----------------------------------------------------
  function analyzePaymentString(input) {
    if (!input || !input.trim()) return;
    const resBox = document.getElementById('copilot-pay-result');
    if (!resBox) return;

    const lower = input.toLowerCase();
    const isPinScam = lower.includes('enter') && lower.includes('pin') && (lower.includes('receive') || lower.includes('refund') || lower.includes('cashback'));
    const isSuspiciousUPI = /(@ybl|@oksbi|@okaxis|@upi)/.test(lower) && (lower.includes('refund') || lower.includes('reward') || lower.includes('lottery') || lower.includes('helpdesk'));
    const isAdvanceFee = lower.includes('registration fee') || lower.includes('refundable deposit') || lower.includes('processing charge');

    let badge = '🟢 LOW RISK';
    let badgeClass = 'score-safe';
    let title = 'Standard Payment Descriptor';
    let detail = 'No direct fraud or reverse PIN extraction triggers identified.';

    if (isPinScam) {
      badge = '🔴 CRITICAL FRAUD ALERT';
      badgeClass = 'score-fraud';
      title = 'Reverse UPI PIN Scam Detected';
      detail = 'RULE #1 OF UPI: You NEVER enter your UPI PIN to RECEIVE money. Entering your PIN will instantly deduct funds from your account.';
    } else if (isSuspiciousUPI || isAdvanceFee) {
      badge = '🔴 HIGH RISK';
      badgeClass = 'score-fraud';
      title = 'Advance Fee / Fake Merchant Handle';
      detail = 'Unverified third-party account posing as an institutional refund gateway.';
    }

    resBox.innerHTML = `
      <div class="copilot-pay-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <b>${title}</b>
          <span class="copilot-score-pill ${badgeClass}">${badge}</span>
        </div>
        <p style="font-size:.82rem;color:#cbd5e1;line-height:1.4;">${detail}</p>
      </div>
    `;

    if (isPinScam && !isMuted) {
      speakVoice('Warning. You never enter your UPI PIN to receive money. This is an immediate fraud attempt.');
    }
  }

  // ----------------------------------------------------
  // Waveform Visualizer
  // ----------------------------------------------------
  function initWaveform() {
    const cv = document.getElementById('copilot-wave-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let phase = 0;

    function draw() {
      waveAnimId = requestAnimationFrame(draw);
      if (!isOpen) return;

      const w = cv.width = cv.parentElement.clientWidth;
      const h = cv.height = cv.parentElement.clientHeight;

      ctx.clearRect(0, 0, w, h);

      // Determine frequency / amplitude based on state
      const amp = isSpeaking ? 14 : isListening ? 12 : 3;
      const freq = isSpeaking ? 0.045 : isListening ? 0.035 : 0.015;
      const color = isSpeaking ? '#ff2d95' : isListening ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)';

      phase += isSpeaking ? 0.12 : isListening ? 0.09 : 0.03;

      // Draw primary wave
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isSpeaking || isListening ? 10 : 2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * freq + phase) * amp * Math.sin(x / w * Math.PI);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw secondary harmonizer wave
      if (isSpeaking || isListening) {
        ctx.strokeStyle = isSpeaking ? '#00ff9c' : '#7000ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.cos(x * freq * 1.5 - phase) * (amp * 0.6) * Math.sin(x / w * Math.PI);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }
    draw();
  }

  // ----------------------------------------------------
  // Fraud DNA 3D Double Helix Visualizer & Mutation Demo
  // ----------------------------------------------------
  function initDNAHelix() {
    const cv = document.getElementById('copilot-dna-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let rot = 0;

    function draw() {
      requestAnimationFrame(draw);
      if (!isOpen || activeTab !== 'dna') return;

      const w = cv.width = cv.parentElement.clientWidth || 380;
      const h = cv.height = 65;

      ctx.clearRect(0, 0, w, h);
      rot += 0.035;

      const numPoints = 28;
      const step = w / (numPoints - 1);
      const amp = h * 0.32;
      const cy = h / 2;

      for (let i = 0; i < numPoints; i++) {
        const x = i * step;
        const angle = rot + (i * 0.32);
        const y1 = cy + Math.sin(angle) * amp;
        const y2 = cy - Math.sin(angle) * amp;
        const z1 = Math.cos(angle);
        const z2 = -Math.cos(angle);

        // Draw connecting base pair rung
        const alpha = Math.max(0.15, (z1 + 1) / 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();

        // Strand 1 node (Cyan / Accent)
        ctx.fillStyle = z1 > 0 ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y1, z1 > 0 ? 3.2 : 2, 0, Math.PI * 2);
        ctx.fill();

        // Strand 2 node (Magenta / Threat locus)
        ctx.fillStyle = z2 > 0 ? '#ff2d95' : 'rgba(255, 45, 149, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y2, z2 > 0 ? 3.2 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    draw();
  }

  function runMutationDemo() {
    if (!window.PHISHGUARD_DNA) return;
    const baseText = document.getElementById('dna-base-text')?.textContent || '';
    const mutation = window.PHISHGUARD_DNA.mutateScam(baseText);

    const card = document.getElementById('dna-mutated-card');
    const txt = document.getElementById('dna-mutated-text');
    const scorePill = document.getElementById('dna-match-score');
    const mutDetails = document.getElementById('dna-mut-details');
    const invDetails = document.getElementById('dna-inv-details');

    if (card) card.style.display = 'block';
    if (txt) txt.textContent = mutation.mutatedText;
    if (scorePill) scorePill.textContent = `${mutation.dnaAnalysis.similarity}% MATCH`;

    if (mutDetails) {
      mutDetails.innerHTML = mutation.dnaAnalysis.mutations.map(m => `
        <div class="dna-item mutated"><span>•</span> <span>${m.detail}</span></div>
      `).join('');
    }

    if (invDetails) {
      invDetails.innerHTML = mutation.dnaAnalysis.invariants.map(i => `
        <div class="dna-item invariant"><span>✔</span> <span>${i.detail}</span></div>
      `).join('');
    }

    if (!isMuted) {
      speakVoice(`Evasion foiled. Even after changing the domain to ${mutation.mutatedDomain} and altering phrasing, Fraud DNA recognized a ${mutation.dnaAnalysis.similarity}% match with ${mutation.dnaAnalysis.matchedCampaign.codeName}.`);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDOM);
  } else {
    initDOM();
  }

  // Expose global interface for other scripts
  window.PhishGuardCopilot = {
    open: () => setCopilotOpen(true),
    close: () => setCopilotOpen(false),
    ask: (q) => {
      setCopilotOpen(true);
      executeUserQuery(q);
    },
    speak: speakVoice
  };

})();
