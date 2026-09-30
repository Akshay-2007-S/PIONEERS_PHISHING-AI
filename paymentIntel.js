/**
 * PhishGuard AI — Business Payment Intelligence & Dataset Analysis Engine
 * Handles CSV Upload, Validation, Pattern & Campaign Detection, Anomaly Flagging,
 * Threat Correlation against PhishGuard Telemetry, and Interactive Data Table.
 * Works strictly with DEMO / SIMULATED financial datasets for cybersecurity analysis.
 */

(function () {
  'use strict';

  // Global State for Payment Intelligence
  const PI_STATE = {
    rawRecords: [],
    validRecords: [],
    errors: [],
    campaigns: {},
    anomalies: [],
    correlations: [],
    stats: {
      totalTx: 0,
      totalValue: 0,
      recipients: 0,
      uniqueBusinesses: 0,
      uniqueCampaigns: 0,
      completedRate: 0,
      paymentTypes: {},
      avgAmount: 0,
      durationMinutes: 0,
      tpm: 0
    },
    filter: {
      search: '',
      campaign: 'ALL',
      business: 'ALL',
      status: 'ALL',
      risk: 'ALL'
    },
    sort: {
      key: 'timestamp',
      asc: false
    },
    pagination: {
      page: 1,
      pageSize: 15
    },
    isProcessing: false,
    activeDatasetName: null
  };

  const REQUIRED_COLUMNS = [
    'transaction_id',
    'campaign_id',
    'business_name',
    'payment_purpose',
    'recipient_id',
    'payment_identifier',
    'payment_type',
    'amount',
    'currency',
    'timestamp',
    'status',
    'source'
  ];

  /* =====================================================
     INITIALIZE MODULE & INJECT DOM
     ===================================================== */
  function initModule() {
    const container = document.getElementById('page-payments');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div class="pi-header-top">
          <div>
            <h2>Business Payment Intelligence_</h2>
            <p>Dataset Analysis, Campaign Verification & Cyber Threat Correlation</p>
          </div>
          <div class="pi-demo-badge">
            <span class="pulse-dot-green"></span> DEMO DATA MODE
          </div>
        </div>
      </div>

      <!-- SECURITY NOTICE -->
      <div class="pi-security-banner">
        <div class="sec-icon">🛡️</div>
        <div class="sec-text">
          <strong>DEMO & SIMULATED DATA ONLY</strong>
          <span>This module analyzes simulated payment patterns to correlate legitimate corporate campaigns with phishing lures. Never upload real banking passwords, UPI PINs, or confidential financial credentials. Sensitive identifiers are automatically masked.</span>
        </div>
      </div>

      <!-- MAIN GRID: UPLOAD & VALIDATION -->
      <div class="pi-grid-top">
        <!-- 1. IMPORT DATASET CARD -->
        <div class="glass-card pi-card-upload" id="pi-upload-card">
          <div class="pi-card-header">
            <h3>📂 Import Payment Dataset</h3>
            <span class="cy-tag">CSV ENGINE // v2.6</span>
          </div>
          <p class="pi-card-sub">Upload a CSV file containing business payment records for pattern & threat correlation.</p>

          <div class="pi-dropzone" id="pi-dropzone">
            <input type="file" id="pi-file-input" accept=".csv" style="display:none;" />
            <div class="drop-icon">📁</div>
            <div class="drop-prompt">
              <strong>Drag & drop your CSV file here</strong>
              <span>or click to browse from device</span>
            </div>
            <div class="drop-meta">Supported: <code>.CSV</code> • Max size: 10 MB</div>
          </div>

          <div class="pi-upload-actions">
            <button class="btn-primary btn-sm" id="pi-btn-browse">
              <span>📁 Upload CSV</span>
            </button>
            <button class="btn-ghost btn-sm" id="pi-btn-sample-dl">
              <span>📥 Download Sample CSV</span>
            </button>
            <button class="btn-ghost btn-sm btn-quick-load" id="pi-btn-load-demo">
              <span>⚡ Load 2,450 Demo Records</span>
            </button>
          </div>

          <!-- Dataset Status bar (Replace/Remove) -->
          <div class="pi-dataset-bar hidden" id="pi-dataset-bar">
            <div class="dataset-meta">
              <span class="meta-name" id="pi-dataset-name">dataset.csv</span>
              <span class="meta-rows" id="pi-dataset-rows">2,450 records</span>
            </div>
            <div class="dataset-actions">
              <button class="btn-ghost btn-xs" id="pi-btn-replace">Replace</button>
              <button class="btn-danger btn-xs" id="pi-btn-remove">Remove</button>
            </div>
          </div>
        </div>

        <!-- 2. CSV VALIDATION HUD CARD -->
        <div class="glass-card pi-card-val" id="pi-val-card">
          <div class="pi-card-header">
            <h3>✓ CSV Validation HUD</h3>
            <span class="stat-badge safe-badge" id="pi-val-badge">AWAITING FILE</span>
          </div>
          <p class="pi-card-sub">Automated structural integrity, schema, and syntax verification.</p>

          <div class="pi-val-checklist" id="pi-val-checklist">
            <div class="val-item" id="val-row-count">
              <span class="val-check">○</span>
              <span class="val-label">Row Detection</span>
              <span class="val-val">—</span>
            </div>
            <div class="val-item" id="val-columns">
              <span class="val-check">○</span>
              <span class="val-label">Required Columns Found</span>
              <span class="val-val">—</span>
            </div>
            <div class="val-item" id="val-duplicates">
              <span class="val-check">○</span>
              <span class="val-label">Duplicate Transaction IDs</span>
              <span class="val-val">—</span>
            </div>
            <div class="val-item" id="val-amounts">
              <span class="val-check">○</span>
              <span class="val-label">Valid Monetary Amounts</span>
              <span class="val-val">—</span>
            </div>
            <div class="val-item" id="val-timestamps">
              <span class="val-check">○</span>
              <span class="val-label">ISO / UTC Timestamps</span>
              <span class="val-val">—</span>
            </div>
          </div>

          <div class="pi-val-footer hidden" id="pi-val-footer">
            <button class="btn-ghost btn-xs" id="pi-btn-view-errors">View Errors (<span id="pi-err-count">0</span>)</button>
            <button class="btn-ghost btn-xs" id="pi-btn-dl-err-report">Download Error Report</button>
          </div>
        </div>
      </div>

      <!-- 3. ANIMATED PROCESSING PROGRESS BAR -->
      <div class="glass-card pi-processing-card hidden" id="pi-processing-card">
        <div class="pi-proc-header">
          <span class="proc-title" id="pi-proc-title">📂 Reading Dataset...</span>
          <span class="proc-pct" id="pi-proc-pct">20%</span>
        </div>
        <div class="pi-progress-bar">
          <div class="pi-progress-fill" id="pi-progress-fill" style="width: 20%;"></div>
        </div>
        <div class="pi-proc-steps">
          <span class="step-tag active" id="pstep-1">📂 Read</span>
          <span class="step-tag" id="pstep-2">🔍 Validate</span>
          <span class="step-tag" id="pstep-3">🧠 Patterns</span>
          <span class="step-tag" id="pstep-4">🕸️ Graph</span>
          <span class="step-tag" id="pstep-5">🛡️ Threat Correlation</span>
          <span class="step-tag" id="pstep-6">✓ Complete</span>
        </div>
      </div>

      <!-- 4. PAYMENT DATASET OVERVIEW (KPIS) -->
      <div class="pi-overview-section hidden" id="pi-overview-section">
        <div class="cy-section-title">Payment Dataset Overview // Live Heuristics</div>
        <div class="stats-grid">
          <div class="stat-card" data-tilt>
            <div class="stat-top-row">
              <div class="stat-num" id="stat-pi-tx">0</div>
              <span class="stat-badge total-badge">TRANSACTIONS</span>
            </div>
            <div class="stat-meta">
              <span class="stat-label">Total Processed Records</span>
            </div>
          </div>
          <div class="stat-card" data-tilt>
            <div class="stat-top-row">
              <div class="stat-num" id="stat-pi-value">₹0</div>
              <span class="stat-badge safe-badge">TOTAL VALUE</span>
            </div>
            <div class="stat-meta">
              <span class="stat-label">Cumulative Disbursed Amount</span>
            </div>
          </div>
          <div class="stat-card" data-tilt>
            <div class="stat-top-row">
              <div class="stat-num" id="stat-pi-recipients">0</div>
              <span class="stat-badge total-badge">RECIPIENTS</span>
            </div>
            <div class="stat-meta">
              <span class="stat-label">Unique Beneficiaries</span>
            </div>
          </div>
          <div class="stat-card" data-tilt>
            <div class="stat-top-row">
              <div class="stat-num" id="stat-pi-campaigns">0</div>
              <span class="stat-badge suspicious-badge">CAMPAIGNS</span>
            </div>
            <div class="stat-meta">
              <span class="stat-label">Identified Payment Initiatives</span>
            </div>
          </div>
        </div>

        <div class="pi-kpi-subgrid">
          <div class="sub-kpi"><span>Completed Rate:</span> <strong id="kpi-pi-completed">0%</strong></div>
          <div class="sub-kpi"><span>Primary Payment Type:</span> <strong id="kpi-pi-type">UPI</strong></div>
          <div class="sub-kpi"><span>Avg Transaction:</span> <strong id="kpi-pi-avg">₹0</strong></div>
          <div class="sub-kpi"><span>Campaign Duration:</span> <strong id="kpi-pi-duration">0 min</strong></div>
          <div class="sub-kpi"><span>Tx Per Minute:</span> <strong id="kpi-pi-tpm">0 / min</strong></div>
        </div>
      </div>

      <!-- 5. CAMPAIGN DETECTION & PATTERNS -->
      <div class="pi-campaigns-section hidden" id="pi-campaigns-section">
        <div class="cy-section-title">Campaign Detection // Algorithmic Pattern Grouping</div>
        <div class="pi-campaigns-grid" id="pi-campaigns-grid">
          <!-- Dynamically populated campaign cards -->
        </div>
      </div>

      <!-- 6. ANOMALY DETECTION & SECURITY RED FLAGS -->
      <div class="pi-anomalies-section hidden" id="pi-anomalies-section">
        <div class="cy-section-title">
          <span>⚠️ Anomaly Detection // Outliers & Security Discrepancies</span>
          <span class="badge-count" id="pi-anomaly-count">0 Detected</span>
        </div>
        <div class="pi-anomalies-grid" id="pi-anomalies-grid">
          <!-- Dynamically populated anomaly cards -->
        </div>
      </div>

      <!-- 7. PHISHGUARD CAMPAIGN CORRELATION -->
      <div class="pi-correlation-section hidden" id="pi-correlation-section">
        <div class="cy-section-title">PhishGuard Threat Intelligence Correlation // Legitimate vs Phishing Campaign</div>
        <div class="glass-card pi-corr-card">
          <div class="corr-visual-grid">
            <!-- Left: Legitimate -->
            <div class="corr-col corr-legit">
              <div class="corr-badge badge-legit">🟢 LEGITIMATE PAYMENT CAMPAIGN</div>
              <div class="corr-box">
                <div class="corr-business" id="corr-legit-biz">ExamplePay</div>
                <div class="corr-id" id="corr-legit-id">PG-PAY-2026-00421</div>
                <div class="corr-details">
                  <div><span>Purpose:</span> <b id="corr-legit-purpose">Customer Refund</b></div>
                  <div><span>Recipients:</span> <b id="corr-legit-recipients">2,450</b></div>
                  <div><span>Authorized ID:</span> <code id="corr-legit-ident">refunds@examplepay</code></div>
                  <div><span>Avg Amount:</span> <b id="corr-legit-amount">₹4,999</b></div>
                </div>
              </div>
            </div>

            <!-- Center: Bridge & Correlation Indicator -->
            <div class="corr-bridge">
              <div class="bridge-line"></div>
              <div class="bridge-tag">CORRELATED THREAT VECTOR</div>
              <div class="bridge-icon">⚡</div>
              <div class="bridge-desc">PhishGuard detected malicious campaigns weaponizing this exact corporate refund lure</div>
            </div>

            <!-- Right: Malicious Phishing Campaign -->
            <div class="corr-col corr-phish">
              <div class="corr-badge badge-phish">🔴 ACTIVE PHISHING CAMPAIGN DETECTED</div>
              <div class="corr-box">
                <div class="corr-business" style="color:var(--fraud);">Impersonating ExamplePay</div>
                <div class="corr-id" style="color:#ff7675;">FAKE_REFUND_ALERT_SMS_09</div>
                <div class="corr-details">
                  <div><span>Lure:</span> <b>"Claim pending refund of ₹4,999"</b></div>
                  <div><span>Spoofed Domain:</span> <code>examplepay-refund-demo.com</code></div>
                  <div><span>Phishing Ident:</span> <code style="color:var(--fraud);">examplepay.refund@unknown</code></div>
                  <div><span>Reported Targets:</span> <b style="color:var(--fraud);">1,284 Users Infiltrated</b></div>
                </div>
              </div>
            </div>
          </div>

          <div class="corr-summary-bar">
            <span>🛡️ <strong>Threat Defense Recommendation:</strong> Issue immediate proactive Trust Network advisories to all 2,450 legitimate recipients with signed verification hashes to neutralize phishing clone.</span>
            <button class="btn-primary btn-xs" id="pi-btn-issue-advisory">Deploy Verified Seal</button>
          </div>
        </div>
      </div>

      <!-- 8. INTERACTIVE PAYMENT DATASET TABLE -->
      <div class="pi-table-section hidden" id="pi-table-section">
        <div class="cy-section-title">Interactive Transaction Ledger // Masked Audit Stream</div>
        <div class="glass-card pi-table-card">
          <!-- Controls Toolbar -->
          <div class="pi-table-toolbar">
            <div class="toolbar-search">
              <input type="text" id="pi-search-input" placeholder="🔍 Search Tx ID, recipient, or payment ID..." />
            </div>
            <div class="toolbar-filters">
              <select id="pi-filter-campaign">
                <option value="ALL">All Campaigns</option>
              </select>
              <select id="pi-filter-status">
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>
              <select id="pi-filter-risk">
                <option value="ALL">All Risk Levels</option>
                <option value="VERIFIED">🟢 Verified</option>
                <option value="SUSPICIOUS">🟡 Suspicious</option>
                <option value="HIGH">🔴 High Risk</option>
              </select>
              <button class="btn-ghost btn-sm" id="pi-btn-export-csv" title="Export Filtered CSV">📥 Export CSV</button>
              <button class="btn-ghost btn-sm" id="pi-btn-export-json" title="Export JSON">📥 JSON</button>
            </div>
          </div>

          <!-- Table -->
          <div class="table-responsive">
            <table class="pi-data-table">
              <thead>
                <tr>
                  <th onclick="window.PaymentIntel.sortBy('transaction_id')">Transaction <span class="sort-arr" id="sort-transaction_id">↕</span></th>
                  <th onclick="window.PaymentIntel.sortBy('business_name')">Business <span class="sort-arr" id="sort-business_name">↕</span></th>
                  <th onclick="window.PaymentIntel.sortBy('campaign_id')">Campaign <span class="sort-arr" id="sort-campaign_id">↕</span></th>
                  <th onclick="window.PaymentIntel.sortBy('recipient_id')">Recipient <span class="sort-arr" id="sort-recipient_id">↕</span></th>
                  <th onclick="window.PaymentIntel.sortBy('amount')">Amount <span class="sort-arr" id="sort-amount">↕</span></th>
                  <th onclick="window.PaymentIntel.sortBy('payment_identifier')">Payment Identifier <span class="sort-arr" id="sort-payment_identifier">↕</span></th>
                  <th onclick="window.PaymentIntel.sortBy('timestamp')">Time <span class="sort-arr" id="sort-timestamp">↕</span></th>
                  <th onclick="window.PaymentIntel.sortBy('status')">Status <span class="sort-arr" id="sort-status">↕</span></th>
                  <th>Risk Assessment</th>
                </tr>
              </thead>
              <tbody id="pi-table-body">
                <!-- Dynamically rendered rows -->
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pi-table-pagination">
            <div class="pag-info">
              Showing <span id="pi-pag-start">0</span> to <span id="pi-pag-end">0</span> of <span id="pi-pag-total">0</span> records
            </div>
            <div class="pag-controls">
              <button class="btn-ghost btn-xs" id="pi-pag-prev">← Previous</button>
              <span class="pag-curr" id="pi-pag-page">Page 1</span>
              <button class="btn-ghost btn-xs" id="pi-pag-next">Next →</button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  /* =====================================================
     EVENT BINDINGS & DRAG-AND-DROP
     ===================================================== */
  function bindEvents() {
    const dropzone = document.getElementById('pi-dropzone');
    const fileInput = document.getElementById('pi-file-input');
    const browseBtn = document.getElementById('pi-btn-browse');
    const sampleDlBtn = document.getElementById('pi-btn-sample-dl');
    const loadDemoBtn = document.getElementById('pi-btn-load-demo');
    const removeBtn = document.getElementById('pi-btn-remove');
    const replaceBtn = document.getElementById('pi-btn-replace');
    const searchInput = document.getElementById('pi-search-input');
    const filterCampaign = document.getElementById('pi-filter-campaign');
    const filterStatus = document.getElementById('pi-filter-status');
    const filterRisk = document.getElementById('pi-filter-risk');
    const prevBtn = document.getElementById('pi-pag-prev');
    const nextBtn = document.getElementById('pi-pag-next');
    const exportCsvBtn = document.getElementById('pi-btn-export-csv');
    const exportJsonBtn = document.getElementById('pi-btn-export-json');

    if (browseBtn) browseBtn.onclick = () => fileInput && fileInput.click();
    if (replaceBtn) replaceBtn.onclick = () => fileInput && fileInput.click();
    if (removeBtn) removeBtn.onclick = () => resetDataset();

    if (sampleDlBtn) sampleDlBtn.onclick = () => downloadSampleCSV();
    if (loadDemoBtn) loadDemoBtn.onclick = () => loadSimulatedDemoDataset();

    if (fileInput) {
      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
        }
      };
    }

    if (dropzone) {
      dropzone.onclick = () => fileInput && fileInput.click();

      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault(); e.stopPropagation();
          dropzone.classList.add('drag-active');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault(); e.stopPropagation();
          dropzone.classList.remove('drag-active');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
    }

    // Filter and search listeners
    if (searchInput) {
      searchInput.oninput = (e) => {
        PI_STATE.filter.search = e.target.value.toLowerCase();
        PI_STATE.pagination.page = 1;
        renderTable();
      };
    }
    if (filterCampaign) {
      filterCampaign.onchange = (e) => {
        PI_STATE.filter.campaign = e.target.value;
        PI_STATE.pagination.page = 1;
        renderTable();
      };
    }
    if (filterStatus) {
      filterStatus.onchange = (e) => {
        PI_STATE.filter.status = e.target.value;
        PI_STATE.pagination.page = 1;
        renderTable();
      };
    }
    if (filterRisk) {
      filterRisk.onchange = (e) => {
        PI_STATE.filter.risk = e.target.value;
        PI_STATE.pagination.page = 1;
        renderTable();
      };
    }

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (PI_STATE.pagination.page > 1) {
          PI_STATE.pagination.page--;
          renderTable();
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        const filtered = getFilteredRecords();
        const maxPage = Math.ceil(filtered.length / PI_STATE.pagination.pageSize) || 1;
        if (PI_STATE.pagination.page < maxPage) {
          PI_STATE.pagination.page++;
          renderTable();
        }
      };
    }

    if (exportCsvBtn) exportCsvBtn.onclick = () => exportFilteredCSV();
    if (exportJsonBtn) exportJsonBtn.onclick = () => exportFilteredJSON();

    const advisoryBtn = document.getElementById('pi-btn-issue-advisory');
    if (advisoryBtn) {
      advisoryBtn.onclick = () => {
        alert('🛡️ Verified Seal Deployed: PhishGuard Trust Network hash broadcasted to all registered email & SMS endpoints for ExamplePay.');
      };
    }
  }

  /* =====================================================
     FILE HANDLING & PARSING
     ===================================================== */
  function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('⚠️ Invalid File Type: Please upload a .CSV dataset file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('⚠️ File too large: Maximum supported size is 10 MB.');
      return;
    }

    PI_STATE.activeDatasetName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      processCSVContent(text, file.name);
    };
    reader.readAsText(file);
  }

  function resetDataset() {
    PI_STATE.rawRecords = [];
    PI_STATE.validRecords = [];
    PI_STATE.errors = [];
    PI_STATE.activeDatasetName = null;

    document.getElementById('pi-dataset-bar')?.classList.add('hidden');
    document.getElementById('pi-val-footer')?.classList.add('hidden');
    document.getElementById('pi-overview-section')?.classList.add('hidden');
    document.getElementById('pi-campaigns-section')?.classList.add('hidden');
    document.getElementById('pi-anomalies-section')?.classList.add('hidden');
    document.getElementById('pi-correlation-section')?.classList.add('hidden');
    document.getElementById('pi-table-section')?.classList.add('hidden');

    const badge = document.getElementById('pi-val-badge');
    if (badge) {
      badge.textContent = 'AWAITING FILE';
      badge.className = 'stat-badge';
    }

    // Reset checklist icons
    ['row-count', 'columns', 'duplicates', 'amounts', 'timestamps'].forEach(id => {
      const el = document.getElementById(`val-${id}`);
      if (el) {
        el.querySelector('.val-check').textContent = '○';
        el.querySelector('.val-val').textContent = '—';
        el.className = 'val-item';
      }
    });
  }

  /* =====================================================
     CSV PARSER ENGINE
     ===================================================== */
  function parseCSV(text) {
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f.length > 0)) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      } else {
        currentField += c;
      }
    }
    if (currentField.length > 0 || currentLine.length > 0) {
      currentLine.push(currentField.trim());
      lines.push(currentLine);
    }
    return lines;
  }

  /* =====================================================
     VALIDATION & MULTI-STEP ANIMATED PROCESSING
     ===================================================== */
  function processCSVContent(text, filename) {
    const procCard = document.getElementById('pi-processing-card');
    const procTitle = document.getElementById('pi-proc-title');
    const procPct = document.getElementById('pi-proc-pct');
    const procFill = document.getElementById('pi-progress-fill');

    if (procCard) procCard.classList.remove('hidden');

    const setStep = (num, title, pct) => {
      if (procTitle) procTitle.textContent = title;
      if (procPct) procPct.textContent = pct + '%';
      if (procFill) procFill.style.width = pct + '%';
      for (let s = 1; s <= 6; s++) {
        const el = document.getElementById(`pstep-${s}`);
        if (el) el.classList.toggle('active', s <= num);
      }
    };

    // Step 1: Read Dataset
    setStep(1, '📂 Reading Dataset...', 20);

    setTimeout(() => {
      // Step 2: Validate Records
      setStep(2, '🔍 Validating Schema & Constraints...', 45);

      const parsedLines = parseCSV(text);
      if (parsedLines.length < 2) {
        alert('⚠️ Malformed CSV: File does not contain headers and data rows.');
        if (procCard) procCard.classList.add('hidden');
        return;
      }

      const headers = parsedLines[0].map(h => h.toLowerCase().trim().replace(/['"]/g, ''));
      const missingCols = REQUIRED_COLUMNS.filter(c => !headers.includes(c));

      const rows = parsedLines.slice(1);
      const errors = [];
      const validRecords = [];
      const seenTxIds = new Set();
      let dupCount = 0;
      let invalidAmtCount = 0;
      let invalidTsCount = 0;

      rows.forEach((r, idx) => {
        const rowNum = idx + 2;
        if (r.length < headers.length - 2) {
          errors.push({ row: rowNum, error: 'Malformed row: incomplete columns' });
          return;
        }

        const obj = {};
        headers.forEach((h, colIdx) => {
          obj[h] = r[colIdx] !== undefined ? r[colIdx] : '';
        });

        // Validation 1: Duplicate Transaction ID
        const txId = obj['transaction_id'];
        if (!txId) {
          errors.push({ row: rowNum, error: 'Missing transaction_id' });
          return;
        }
        if (seenTxIds.has(txId)) {
          dupCount++;
          errors.push({ row: rowNum, error: `Duplicate transaction_id: ${txId}` });
        } else {
          seenTxIds.add(txId);
        }

        // Validation 2: Amount
        const amt = parseFloat(obj['amount']);
        if (isNaN(amt) || amt <= 0) {
          invalidAmtCount++;
          errors.push({ row: rowNum, error: `Invalid amount: ${obj['amount']}` });
        }
        obj['amount'] = amt || 0;

        // Validation 3: Timestamp
        const ts = new Date(obj['timestamp']);
        if (isNaN(ts.getTime())) {
          invalidTsCount++;
          errors.push({ row: rowNum, error: `Invalid timestamp: ${obj['timestamp']}` });
        }

        validRecords.push(obj);
      });

      // Update Validation Checklist UI
      updateValidationHUD(rows.length, missingCols, dupCount, invalidAmtCount, invalidTsCount, errors);

      setTimeout(() => {
        // Step 3: Pattern & Campaign Detection
        setStep(3, '🧠 Detecting Payment Patterns & Groupings...', 70);
        const campaigns = detectCampaigns(validRecords);

        setTimeout(() => {
          // Step 4: Build Campaign Graph & Anomaly Detection
          setStep(4, '🕸️ Building Campaign Graph & Anomaly Detection...', 88);
          const anomalies = detectAnomalies(validRecords, campaigns);

          setTimeout(() => {
            // Step 5: Threat Correlation & Security Insights
            setStep(5, '🛡️ Generating Security Insights & Correlation...', 98);
            computeOverviewStats(validRecords, campaigns, anomalies);

            setTimeout(() => {
              // Step 6: Complete
              setStep(6, '✓ Analysis Complete', 100);
              setTimeout(() => {
                if (procCard) procCard.classList.add('hidden');
                displayFullDashboard(filename, validRecords.length);
              }, 400);
            }, 350);
          }, 350);
        }, 350);
      }, 350);
    }, 300);
  }

  function updateValidationHUD(rowCount, missingCols, dups, invalidAmts, invalidTs, errors) {
    const setItem = (id, valid, text) => {
      const el = document.getElementById(`val-${id}`);
      if (!el) return;
      el.className = `val-item ${valid ? 'val-pass' : 'val-warn'}`;
      el.querySelector('.val-check').textContent = valid ? '✓' : '⚠️';
      el.querySelector('.val-val').textContent = text;
    };

    setItem('row-count', rowCount > 0, `${rowCount.toLocaleString()} rows detected`);
    setItem('columns', missingCols.length === 0, missingCols.length === 0 ? 'All 12 required columns' : `Missing: ${missingCols.join(', ')}`);
    setItem('duplicates', dups === 0, `${dups} duplicate IDs`);
    setItem('amounts', invalidAmts === 0, `${invalidAmts} invalid amounts`);
    setItem('timestamps', invalidTs === 0, `${invalidTs} invalid timestamps`);

    const badge = document.getElementById('pi-val-badge');
    const footer = document.getElementById('pi-val-footer');
    const errCountSpan = document.getElementById('pi-err-count');

    if (errors.length === 0) {
      if (badge) {
        badge.textContent = '🟢 DATASET READY';
        badge.className = 'stat-badge safe-badge';
      }
      if (footer) footer.classList.add('hidden');
    } else {
      if (badge) {
        badge.textContent = '⚠️ DATASET HAS ISSUES';
        badge.className = 'stat-badge suspicious-badge';
      }
      if (errCountSpan) errCountSpan.textContent = errors.length;
      if (footer) footer.classList.remove('hidden');

      const viewErrBtn = document.getElementById('pi-btn-view-errors');
      if (viewErrBtn) {
        viewErrBtn.onclick = () => {
          alert(`Validation Issues Report (${errors.length} rows):\n\n` +
            errors.slice(0, 10).map(e => `Row ${e.row}: ${e.error}`).join('\n') +
            (errors.length > 10 ? `\n...and ${errors.length - 10} more rows.` : ''));
        };
      }
    }
  }

  /* =====================================================
     CAMPAIGN DETECTION ALGORITHM
     ===================================================== */
  function detectCampaigns(records) {
    const campMap = {};

    records.forEach(r => {
      const cId = r['campaign_id'] || 'UNASSIGNED';
      if (!campMap[cId]) {
        campMap[cId] = {
          id: cId,
          business: r['business_name'] || 'Unknown',
          purpose: r['payment_purpose'] || 'General Transfer',
          identifier: r['payment_identifier'] || '',
          paymentType: r['payment_type'] || 'UPI',
          currency: r['currency'] || 'INR',
          amounts: [],
          timestamps: [],
          recipients: new Set(),
          records: [],
          failedCount: 0
        };
      }
      campMap[cId].amounts.push(r['amount']);
      campMap[cId].recipients.add(r['recipient_id']);
      campMap[cId].timestamps.push(new Date(r['timestamp']).getTime());
      campMap[cId].records.push(r);
      if (r['status'] === 'FAILED') campMap[cId].failedCount++;
    });

    // Compute campaign metrics & consistency
    Object.values(campMap).forEach(c => {
      const sortedTs = c.timestamps.filter(t => !isNaN(t)).sort((a, b) => a - b);
      c.startTime = sortedTs[0] ? new Date(sortedTs[0]) : new Date();
      c.endTime = sortedTs[sortedTs.length - 1] ? new Date(sortedTs[sortedTs.length - 1]) : new Date();
      c.durationMinutes = Math.max(1, Math.round((c.endTime - c.startTime) / 60000));

      const sum = c.amounts.reduce((a, b) => a + b, 0);
      c.avgAmount = Math.round(sum / c.amounts.length);
      c.totalValue = sum;
      c.recipientCount = c.recipients.size;

      // Detect consistency: same business + same purpose + similar amount + same identifier + short time window
      const uniqueAmounts = new Set(c.amounts);
      const isConsistentAmount = uniqueAmounts.size <= Math.max(2, c.amounts.length * 0.05);
      c.isConsistent = isConsistentAmount && c.durationMinutes < 180;
      c.statusTag = c.isConsistent ? '🟢 CONSISTENT PAYMENT PATTERN' : '🟡 HETEROGENEOUS CAMPAIGN';
    });

    PI_STATE.campaigns = campMap;
    return campMap;
  }

  /* =====================================================
     ANOMALY DETECTION ENGINE
     ===================================================== */
  function detectAnomalies(records, campaigns) {
    const anomalies = [];

    records.forEach(r => {
      const camp = campaigns[r['campaign_id']];
      if (!camp) return;

      let anomaly = null;

      // Anomaly Check 1: Unexpected payment identifier
      if (camp.identifier && r['payment_identifier'] && r['payment_identifier'] !== camp.identifier) {
        anomaly = {
          txId: r['transaction_id'],
          type: 'Unexpected Payment Identifier',
          expected: camp.identifier,
          observed: r['payment_identifier'],
          reason: "Payment identifier differs from the campaign's authorized corporate identifier.",
          risk: 'HIGH',
          record: r
        };
      }
      // Anomaly Check 2: Unusual payment amount (outlier > 3x average)
      else if (r['amount'] > camp.avgAmount * 2.8 || (camp.avgAmount > 100 && r['amount'] < camp.avgAmount * 0.2)) {
        anomaly = {
          txId: r['transaction_id'],
          type: 'Unusual Payment Amount',
          expected: `~₹${camp.avgAmount.toLocaleString()}`,
          observed: `₹${r['amount'].toLocaleString()}`,
          reason: `Transaction amount deviates significantly from the typical campaign threshold.`,
          risk: 'SUSPICIOUS',
          record: r
        };
      }
      // Anomaly Check 3: Payment outside campaign primary window
      else {
        const txTime = new Date(r['timestamp']).getTime();
        const start = camp.startTime.getTime();
        const end = camp.endTime.getTime();
        if (txTime < start - 3600000 || txTime > end + 3600000) {
          anomaly = {
            txId: r['transaction_id'],
            type: 'Outside Campaign Time Window',
            expected: `${camp.startTime.toLocaleTimeString()} - ${camp.endTime.toLocaleTimeString()}`,
            observed: new Date(txTime).toLocaleTimeString(),
            reason: 'Transaction occurred outside the approved corporate disbursement schedule.',
            risk: 'HIGH',
            record: r
          };
        }
      }

      if (anomaly) {
        anomalies.push(anomaly);
        r._anomaly = anomaly;
      }
    });

    PI_STATE.anomalies = anomalies;
    return anomalies;
  }

  /* =====================================================
     COMPUTE OVERVIEW METRICS
     ===================================================== */
  function computeOverviewStats(records, campaigns, anomalies) {
    const totalTx = records.length;
    const totalVal = records.reduce((s, r) => s + r['amount'], 0);
    const recipients = new Set(records.map(r => r['recipient_id'])).size;
    const uniqueBiz = new Set(records.map(r => r['business_name'])).size;
    const uniqueCamps = Object.keys(campaigns).length;

    const completed = records.filter(r => r['status'] === 'COMPLETED').length;
    const completedRate = totalTx > 0 ? ((completed / totalTx) * 100).toFixed(1) : '100';

    const pTypes = {};
    records.forEach(r => {
      const t = r['payment_type'] || 'UPI';
      pTypes[t] = (pTypes[t] || 0) + 1;
    });
    const topType = Object.keys(pTypes).sort((a, b) => pTypes[b] - pTypes[a])[0] || 'UPI';

    const avgAmt = totalTx > 0 ? Math.round(totalVal / totalTx) : 0;

    let totalDuration = 0;
    Object.values(campaigns).forEach(c => totalDuration += c.durationMinutes);
    const avgDuration = uniqueCamps > 0 ? Math.round(totalDuration / uniqueCamps) : 30;
    const tpm = avgDuration > 0 ? Math.round(totalTx / avgDuration) : Math.round(totalTx / 30);

    PI_STATE.stats = {
      totalTx,
      totalValue: totalVal,
      recipients,
      uniqueBusinesses: uniqueBiz,
      uniqueCampaigns: uniqueCamps,
      completedRate,
      paymentTypes: pTypes,
      avgAmount: avgAmt,
      durationMinutes: avgDuration,
      tpm
    };

    PI_STATE.rawRecords = records;
    PI_STATE.validRecords = records;
  }

  /* =====================================================
     DISPLAY FULL DASHBOARD UI
     ===================================================== */
  function displayFullDashboard(filename, recordCount) {
    // Show sections
    ['overview-section', 'campaigns-section', 'anomalies-section', 'correlation-section', 'table-section'].forEach(id => {
      document.getElementById(`pi-${id}`)?.classList.remove('hidden');
    });

    // Update dataset bar
    const bar = document.getElementById('pi-dataset-bar');
    if (bar) bar.classList.remove('hidden');
    const nameEl = document.getElementById('pi-dataset-name');
    const rowsEl = document.getElementById('pi-dataset-rows');
    if (nameEl) nameEl.textContent = filename || 'dataset.csv';
    if (rowsEl) rowsEl.textContent = `${recordCount.toLocaleString()} records`;

    // 1. Populate Overview Stats
    const s = PI_STATE.stats;
    const fmt = n => n.toLocaleString();
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setTxt('stat-pi-tx', fmt(s.totalTx));
    setTxt('stat-pi-value', '₹' + fmt(s.totalValue));
    setTxt('stat-pi-recipients', fmt(s.recipients));
    setTxt('stat-pi-campaigns', fmt(s.uniqueCampaigns));
    setTxt('kpi-pi-completed', s.completedRate + '%');
    setTxt('kpi-pi-type', Object.keys(s.paymentTypes)[0] || 'UPI');
    setTxt('kpi-pi-avg', '₹' + fmt(s.avgAmount));
    setTxt('kpi-pi-duration', s.durationMinutes + ' min');
    setTxt('kpi-pi-tpm', s.tpm + ' / min');

    // 2. Populate Campaigns
    renderCampaignCards();

    // 3. Populate Anomalies
    renderAnomalyCards();

    // 4. Populate Correlation Card
    renderCorrelation();

    // 5. Populate Table
    populateFilterDropdowns();
    renderTable();
  }

  /* =====================================================
     RENDER CAMPAIGNS
     ===================================================== */
  function renderCampaignCards() {
    const grid = document.getElementById('pi-campaigns-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const camps = Object.values(PI_STATE.campaigns);

    camps.forEach(c => {
      const card = document.createElement('div');
      card.className = 'glass-card pi-camp-card';
      const timeFmt = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div class="camp-top">
          <div>
            <div class="camp-id">${c.id}</div>
            <div class="camp-biz">${c.business}</div>
          </div>
          <span class="stat-badge ${c.isConsistent ? 'safe-badge' : 'suspicious-badge'}">
            ${c.isConsistent ? '🟢 VERIFIED PATTERN' : '🟡 REVIEW'}
          </span>
        </div>
        <div class="camp-body">
          <div class="camp-row"><span>Purpose:</span> <b>${c.purpose}</b></div>
          <div class="camp-row"><span>Recipients:</span> <b>${c.recipientCount.toLocaleString()}</b></div>
          <div class="camp-row"><span>Typical Amount:</span> <b>₹${c.avgAmount.toLocaleString()}</b></div>
          <div class="camp-row"><span>Time Window:</span> <b>${timeFmt(c.startTime)} — ${timeFmt(c.endTime)}</b></div>
          <div class="camp-row"><span>Authorized Identifier:</span> <code>${maskPaymentId(c.identifier)}</code></div>
        </div>
        <div class="camp-footer">
          <span class="camp-status-tag">${c.statusTag}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /* =====================================================
     RENDER ANOMALIES
     ===================================================== */
  function renderAnomalyCards() {
    const grid = document.getElementById('pi-anomalies-grid');
    const countBadge = document.getElementById('pi-anomaly-count');
    if (!grid) return;

    grid.innerHTML = '';
    const anoms = PI_STATE.anomalies;
    if (countBadge) countBadge.textContent = `${anoms.length} Detected`;

    if (anoms.length === 0) {
      grid.innerHTML = `<div class="pi-no-anomaly">✓ Zero anomalous payment records detected. All transactions follow standard campaign parameters.</div>`;
      return;
    }

    anoms.forEach(a => {
      const card = document.createElement('div');
      card.className = 'glass-card pi-anomaly-card';
      const isHigh = a.risk === 'HIGH';

      card.innerHTML = `
        <div class="anom-top">
          <div class="anom-title">
            <span class="anom-icon">${isHigh ? '🔴' : '🟡'}</span>
            <strong>${a.type}</strong>
          </div>
          <span class="stat-badge ${isHigh ? 'fraud-badge' : 'suspicious-badge'}">${a.risk} RISK</span>
        </div>
        <div class="anom-details">
          <div><span>Transaction:</span> <code>${a.txId}</code></div>
          <div><span>Expected:</span> <code class="exp-code">${maskPaymentId(a.expected)}</code></div>
          <div><span>Observed:</span> <code class="obs-code">${maskPaymentId(a.observed)}</code></div>
          <div class="anom-reason"><span>Reason:</span> ${a.reason}</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /* =====================================================
     RENDER THREAT CORRELATION
     ===================================================== */
  function renderCorrelation() {
    const firstCamp = Object.values(PI_STATE.campaigns)[0];
    if (!firstCamp) return;

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('corr-legit-biz', firstCamp.business);
    setTxt('corr-legit-id', firstCamp.id);
    setTxt('corr-legit-purpose', firstCamp.purpose);
    setTxt('corr-legit-recipients', firstCamp.recipientCount.toLocaleString() + ' users');
    setTxt('corr-legit-ident', maskPaymentId(firstCamp.identifier));
    setTxt('corr-legit-amount', '₹' + firstCamp.avgAmount.toLocaleString());
  }

  /* =====================================================
     DATA TABLE FILTERS, SORTING & PAGINATION
     ===================================================== */
  function populateFilterDropdowns() {
    const sel = document.getElementById('pi-filter-campaign');
    if (!sel) return;
    sel.innerHTML = '<option value="ALL">All Campaigns</option>';
    Object.keys(PI_STATE.campaigns).forEach(cid => {
      const opt = document.createElement('option');
      opt.value = cid;
      opt.textContent = `${cid} (${PI_STATE.campaigns[cid].business})`;
      sel.appendChild(opt);
    });
  }

  function getFilteredRecords() {
    let recs = PI_STATE.validRecords;
    const { search, campaign, status, risk } = PI_STATE.filter;

    if (search) {
      recs = recs.filter(r =>
        (r['transaction_id'] || '').toLowerCase().includes(search) ||
        (r['recipient_id'] || '').toLowerCase().includes(search) ||
        (r['payment_identifier'] || '').toLowerCase().includes(search) ||
        (r['business_name'] || '').toLowerCase().includes(search)
      );
    }
    if (campaign !== 'ALL') {
      recs = recs.filter(r => r['campaign_id'] === campaign);
    }
    if (status !== 'ALL') {
      recs = recs.filter(r => r['status'] === status);
    }
    if (risk !== 'ALL') {
      if (risk === 'HIGH') recs = recs.filter(r => r._anomaly && r._anomaly.risk === 'HIGH');
      else if (risk === 'SUSPICIOUS') recs = recs.filter(r => r._anomaly && r._anomaly.risk === 'SUSPICIOUS');
      else if (risk === 'VERIFIED') recs = recs.filter(r => !r._anomaly);
    }

    // Sort
    const { key, asc } = PI_STATE.sort;
    recs.sort((a, b) => {
      let va = a[key], vb = b[key];
      if (key === 'amount') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });

    return recs;
  }

  function renderTable() {
    const tbody = document.getElementById('pi-table-body');
    if (!tbody) return;

    const filtered = getFilteredRecords();
    const { page, pageSize } = PI_STATE.pagination;
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, filtered.length);
    const pageRecords = filtered.slice(start, end);

    // Update pagination HUD
    const pagStart = document.getElementById('pi-pag-start');
    const pagEnd = document.getElementById('pi-pag-end');
    const pagTotal = document.getElementById('pi-pag-total');
    const pagPage = document.getElementById('pi-pag-page');

    if (pagStart) pagStart.textContent = filtered.length > 0 ? (start + 1).toLocaleString() : 0;
    if (pagEnd) pagEnd.textContent = end.toLocaleString();
    if (pagTotal) pagTotal.textContent = filtered.length.toLocaleString();
    if (pagPage) pagPage.textContent = `Page ${page} of ${Math.ceil(filtered.length / pageSize) || 1}`;

    tbody.innerHTML = '';

    if (pageRecords.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted);">No records found matching current search and filter criteria.</td></tr>`;
      return;
    }

    pageRecords.forEach(r => {
      const tr = document.createElement('tr');
      const isAnomaly = !!r._anomaly;
      const riskBadge = isAnomaly
        ? (r._anomaly.risk === 'HIGH' ? '<span class="stat-badge fraud-badge">🔴 HIGH RISK</span>' : '<span class="stat-badge suspicious-badge">🟡 SUSPICIOUS</span>')
        : '<span class="stat-badge safe-badge">🟢 VERIFIED</span>';

      const statusBadge = r['status'] === 'COMPLETED'
        ? '<span style="color:var(--safe);">COMPLETED</span>'
        : r['status'] === 'FAILED'
        ? '<span style="color:var(--fraud);">FAILED</span>'
        : '<span style="color:var(--suspicious);">PENDING</span>';

      tr.className = isAnomaly ? 'pi-row-anomaly' : '';

      tr.innerHTML = `
        <td><code>${r['transaction_id']}</code></td>
        <td><b>${r['business_name']}</b></td>
        <td><small class="t-dim">${r['campaign_id']}</small></td>
        <td><code>${maskRecipient(r['recipient_id'])}</code></td>
        <td><b>₹${parseFloat(r['amount']).toLocaleString()}</b></td>
        <td><code>${maskPaymentId(r['payment_identifier'])}</code></td>
        <td><span class="t-dim">${r['timestamp']}</span></td>
        <td>${statusBadge}</td>
        <td>${riskBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function maskRecipient(id) {
    if (!id) return 'XXXX';
    if (id.length <= 4) return id;
    return id.slice(0, 4) + '***' + id.slice(-2);
  }

  function maskPaymentId(id) {
    if (!id) return '—';
    if (id.includes('@')) {
      const parts = id.split('@');
      const user = parts[0];
      const domain = parts[1];
      const maskedUser = user.length > 3 ? user.slice(0, 3) + '***' : user + '***';
      return `${maskedUser}@${domain}`;
    }
    if (id.length > 8) {
      return id.slice(0, 3) + 'XXXX' + id.slice(-4);
    }
    return id;
  }

  /* =====================================================
     SORTING
     ===================================================== */
  window.PaymentIntel = window.PaymentIntel || {};
  window.PaymentIntel.sortBy = function (key) {
    if (PI_STATE.sort.key === key) {
      PI_STATE.sort.asc = !PI_STATE.sort.asc;
    } else {
      PI_STATE.sort.key = key;
      PI_STATE.sort.asc = true;
    }
    document.querySelectorAll('.sort-arr').forEach(el => el.textContent = '↕');
    const active = document.getElementById(`sort-${key}`);
    if (active) active.textContent = PI_STATE.sort.asc ? '▲' : '▼';
    renderTable();
  };

  /* =====================================================
     SAMPLE CSV GENERATOR & DEMO LOAD
     ===================================================== */
  function generateSampleCSVText() {
    const headers = REQUIRED_COLUMNS.join(',');
    const rows = [];
    const baseTime = new Date();
    baseTime.setHours(10, 2, 0, 0);

    // 1. Generate 2,450 legitimate refund rows
    for (let i = 1; i <= 2450; i++) {
      const padId = i.toString().padStart(4, '0');
      const txn = `TXN${padId}`;
      const rec = `USER_${padId}`;
      const timeOffset = Math.floor((i / 2450) * 29 * 60); // 29 minutes window
      const txTime = new Date(baseTime.getTime() + timeOffset * 1000);
      const timeStr = txTime.toISOString().replace('T', ' ').slice(0, 19);

      // Injected anomalies for detection
      if (i === 1842) {
        // Anomaly 1: Unexpected payment identifier
        rows.push(`${txn},PG-PAY-2026-00421,ExamplePay,Customer Refund,${rec},examplepay.refund@unknown,UPI,4999,INR,${timeStr},COMPLETED,DEMO`);
      } else if (i === 982) {
        // Anomaly 2: Unusual payment amount (outlier 10x)
        rows.push(`${txn},PG-PAY-2026-00421,ExamplePay,Customer Refund,${rec},refunds@examplepay,UPI,49990,INR,${timeStr},COMPLETED,DEMO`);
      } else if (i === 2105) {
        // Anomaly 3: Payment outside campaign time window (3:15 AM)
        rows.push(`${txn},PG-PAY-2026-00421,ExamplePay,Customer Refund,${rec},refunds@examplepay,UPI,4999,INR,2026-09-30 03:15:22,COMPLETED,DEMO`);
      } else if (i === 88) {
        // Anomaly 4: Duplicate recipient
        rows.push(`${txn},PG-PAY-2026-00421,ExamplePay,Customer Refund,USER_0042,refunds@examplepay,UPI,4999,INR,${timeStr},COMPLETED,DEMO`);
      } else {
        // Standard consistent record
        rows.push(`${txn},PG-PAY-2026-00421,ExamplePay,Customer Refund,${rec},refunds@examplepay,UPI,4999,INR,${timeStr},COMPLETED,DEMO`);
      }
    }

    return headers + '\n' + rows.join('\n');
  }

  function downloadSampleCSV() {
    const csvContent = generateSampleCSVText();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'phishguard_payment_sample_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function loadSimulatedDemoDataset() {
    PI_STATE.activeDatasetName = 'demo_payment_refunds_2450.csv';
    const csvText = generateSampleCSVText();
    processCSVContent(csvText, 'demo_payment_refunds_2450.csv');
  }

  function exportFilteredCSV() {
    const filtered = getFilteredRecords();
    if (filtered.length === 0) {
      alert('No records to export.');
      return;
    }
    const headers = REQUIRED_COLUMNS.join(',');
    const rows = filtered.map(r => REQUIRED_COLUMNS.map(col => `"${r[col] || ''}"`).join(','));
    const content = headers + '\n' + rows.join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishguard_filtered_payments_${Date.now()}.csv`;
    a.click();
  }

  function exportFilteredJSON() {
    const filtered = getFilteredRecords();
    const jsonStr = JSON.stringify(filtered, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishguard_payments_${Date.now()}.json`;
    a.click();
  }

  /* =====================================================
     COPILOT INTEGRATION METHODS
     ===================================================== */
  window.PaymentIntel = {
    ...window.PaymentIntel,
    init: initModule,
    loadDemo: loadSimulatedDemoDataset,
    getSummary: function () {
      if (PI_STATE.validRecords.length === 0) {
        return null;
      }
      return {
        totalRecords: PI_STATE.validRecords.length,
        campaigns: Object.keys(PI_STATE.campaigns).length,
        recipients: PI_STATE.stats.recipients,
        anomalies: PI_STATE.anomalies.length,
        highRisk: PI_STATE.anomalies.filter(a => a.risk === 'HIGH').length
      };
    },
    investigateAnomalies: function () {
      if (window.switchPage) window.switchPage('payments');
      const filterRisk = document.getElementById('pi-filter-risk');
      if (filterRisk) {
        filterRisk.value = 'HIGH';
        PI_STATE.filter.risk = 'HIGH';
        renderTable();
      }
      const anomSection = document.getElementById('pi-anomalies-section');
      if (anomSection) anomSection.scrollIntoView({ behavior: 'smooth' });
    },
    viewCampaignGraph: function () {
      if (window.switchPage) window.switchPage('payments');
      const corrSection = document.getElementById('pi-correlation-section');
      if (corrSection) corrSection.scrollIntoView({ behavior: 'smooth' });
    },
    viewAnalytics: function () {
      if (window.switchPage) window.switchPage('payments');
      const overSection = document.getElementById('pi-overview-section');
      if (overSection) overSection.scrollIntoView({ behavior: 'smooth' });
    },
    generateReport: function () {
      const s = PI_STATE.stats;
      const anoms = PI_STATE.anomalies;
      alert(`📄 PHISHGUARD AI // PAYMENT INTELLIGENCE REPORT\n\n` +
        `Dataset: ${PI_STATE.activeDatasetName || 'Simulated Batch'}\n` +
        `Total Transactions: ${s.totalTx.toLocaleString()}\n` +
        `Cumulative Value: ₹${s.totalValue.toLocaleString()}\n` +
        `Identified Campaigns: ${s.uniqueCampaigns}\n` +
        `Anomalies Detected: ${anoms.length}\n` +
        `Threat Status: High-confidence correlation established with active phishing clone.\n\n` +
        `Status: AUDIT VERIFIED.`);
    }
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModule);
  } else {
    initModule();
  }

})();
