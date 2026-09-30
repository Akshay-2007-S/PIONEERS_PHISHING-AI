/**
 * PhishGuard AI — Unified Threat Engine
 * Handles all analysis logic: URL, Brand, Payment, NLP, Risk Scoring
 */

/* =====================================================
   THREAT DATABASE / INTELLIGENCE
   ===================================================== */
const PHISHGUARD_ENGINE = {

  // Known phishing domains (simulated)
  knownPhishingDomains: [
    'phishing-site', 'prize-claim', 'reward-wallet', 'free-money', 'lucky-draw',
    'win-prize', 'bank-verify', 'update-kyc', 'kyc-alert', 'otp-verify',
    'account-suspended', 'netbanking-', 'secure-login', 'verify-now',
    'claimnow', 'freereward', 'instant-cashback', 'upi-reward',
    'credential', 'login-verify', 'paypalservice', 'amazon-deals-india',
    'hdfc-secure', 'sbi-netbanking', 'paytm-kyc', 'gov-scheme', 'uidai-verify'
  ],

  // Known safe domains
  knownSafeDomains: [
    'google.com', 'gmail.com', 'youtube.com', 'github.com', 'microsoft.com',
    'apple.com', 'amazon.com', 'hdfc.com', 'sbi.co.in', 'paytm.com',
    'flipkart.com', 'myntra.com', 'uidai.gov.in', 'incometax.gov.in',
    'npci.org.in', 'rbi.org.in', 'icicibank.com', 'axisbank.com',
    'stackoverflow.com', 'mozilla.org', 'wikipedia.org', 'linkedin.com',
    'twitter.com', 'facebook.com', 'instagram.com', 'whatsapp.com'
  ],

  // Brand impersonation patterns
  brandPatterns: [
    { brand: 'HDFC Bank', patterns: ['hdfc', 'hdfcbank'], legitimate: 'hdfcbank.com' },
    { brand: 'SBI', patterns: ['sbi', 'sbionline', 'statebank'], legitimate: 'sbi.co.in' },
    { brand: 'PayTM', patterns: ['paytm', 'pay-tm', 'paytmm'], legitimate: 'paytm.com' },
    { brand: 'Amazon', patterns: ['amazon', 'amzon', 'amazzon', 'amaz0n'], legitimate: 'amazon.in' },
    { brand: 'Google', patterns: ['google', 'g00gle', 'googgle'], legitimate: 'google.com' },
    { brand: 'Apple', patterns: ['apple', 'app1e', 'appl3'], legitimate: 'apple.com' },
    { brand: 'UIDAI/Aadhaar', patterns: ['uidai', 'aadhaar', 'aadhar'], legitimate: 'uidai.gov.in' },
    { brand: 'Income Tax', patterns: ['incometax', 'itr', 'taxrefund'], legitimate: 'incometax.gov.in' },
    { brand: 'ICICI Bank', patterns: ['icici', 'icicibankk'], legitimate: 'icicibank.com' },
    { brand: 'Flipkart', patterns: ['flipkart', 'flipkartt', 'f1ipkart'], legitimate: 'flipkart.com' },
    { brand: 'PhonePe', patterns: ['phonepe', 'phone-pe', 'ph0nepe'], legitimate: 'phonepe.com' },
    { brand: 'GPay / Google Pay', patterns: ['gpay', 'googlepay', 'g-pay'], legitimate: 'pay.google.com' },
  ],

  // Payment / Financial scam indicators
  paymentIndicators: [
    // UPI
    'upi', '@okicici', '@oksbi', '@ybl', '@upi',
    // Bank
    'ifsc', 'account number', 'beneficiary', 'transfer funds',
    // Card
    'cvv', 'card number', 'expiry', 'pin number', 'otm', 'credit card',
    // UPI / Indian specific
    '₹', 'paytm', 'phonepe', 'gpay', 'bhim',
    // Urgency payment
    'pay now', 'pay immediately', 'transfer now', 'send money immediately',
    'registration fee', 'refundable deposit', 'processing fee',
  ],

  // Phishing NLP patterns
  urgencyPatterns: [
    'urgent', 'immediately', 'act now', 'expires today', 'limited time',
    'within 24 hours', 'account will be suspended', 'account suspended',
    'verify now', 'failure to', 'will be blocked', 'last chance',
    'do not ignore', 'final notice', 'immediate action required',
  ],

  rewardPatterns: [
    'congratulations', 'you have won', 'you won', 'winner', 'selected',
    'lucky draw', 'prize', 'reward', 'cashback', 'free gift', 'claim now',
    'you are selected', 'special offer', 'exclusive offer', '₹50,000',
    'lakh rupees', 'jackpot', 'bonus amount', 'unclaimed money',
  ],

  personalInfoPatterns: [
    'enter your otp', 'provide your password', 'login credentials',
    'update kyc', 'complete kyc', 'aadhar number', 'pan number',
    'bank account details', 'credit card details', 'net banking',
    'enter your pin', 'verify your identity', 'confirm identity',
  ],

  suspiciousTLDs: ['.xyz', '.tk', '.ml', '.ga', '.cf', '.gq', '.work', '.click', '.loan', '.review', '.top', '.win', '.men', '.download'],
  
  shortenedURLDomains: ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.io', 'rb.gy', 'cutt.ly', 'is.gd', 'tiny.cc'],

  // ===================================================
  // MAIN ANALYSIS ENGINE
  // ===================================================
  analyze(content, channel = 'url') {
    const startTime = Date.now();
    
    // Step 1: Extract URLs
    const urls = this.extractURLs(content);
    const primaryURL = urls.length > 0 ? urls[0] : content.trim();

    // Initialize scoring
    let riskScore = 0;
    const indicators = [];
    const goodSignals = [];

    // Step 2: URL Analysis
    const urlAnalysis = this.analyzeURL(primaryURL);
    riskScore += urlAnalysis.score;
    indicators.push(...urlAnalysis.indicators);
    goodSignals.push(...urlAnalysis.goodSignals);

    // Step 3: Brand Detection
    const brandAnalysis = this.analyzeBrand(primaryURL, content);
    riskScore += brandAnalysis.score;
    if (brandAnalysis.detected) indicators.push(...brandAnalysis.indicators);

    // Step 4: Payment/Financial Detection
    const paymentAnalysis = this.analyzePayment(content);
    riskScore += paymentAnalysis.score;
    if (paymentAnalysis.detected) indicators.push(...paymentAnalysis.indicators);

    // Step 5: NLP Analysis (text patterns)
    const nlpAnalysis = this.analyzeNLP(content);
    riskScore += nlpAnalysis.score;
    indicators.push(...nlpAnalysis.indicators);
    goodSignals.push(...nlpAnalysis.goodSignals);

    // Step 6: Channel-specific boosts
    if (channel === 'whatsapp' || channel === 'sms') {
      if (paymentAnalysis.detected) riskScore += 10;
      if (nlpAnalysis.hasReward) riskScore += 12;
      if (nlpAnalysis.hasUrgency) riskScore += 8;
    }

    // Cap score at 100
    riskScore = Math.min(Math.round(riskScore), 100);
    riskScore = Math.max(riskScore, 0);

    // Determine verdict
    let verdict, verdictClass;
    if (riskScore >= 65) {
      verdict = riskScore >= 80 ? 'FRAUD DETECTED' : 'POTENTIAL FRAUD';
      verdictClass = 'fraud';
    } else if (riskScore >= 30) {
      verdict = 'SUSPICIOUS';
      verdictClass = 'suspicious';
    } else {
      verdict = 'SAFE';
      verdictClass = 'safe';
    }

    const analysisTime = Date.now() - startTime;
    const fraudDNA = (typeof window !== 'undefined' && window.PHISHGUARD_DNA)
      ? window.PHISHGUARD_DNA.analyzeDNA(content, primaryURL)
      : null;

    return {
      verdict,
      verdictClass,
      riskScore,
      primaryURL,
      allURLs: urls,
      indicators: [...new Set(indicators)],
      goodSignals: [...new Set(goodSignals)],
      brandAnalysis,
      paymentAnalysis,
      nlpAnalysis,
      urlAnalysis,
      fraudDNA,
      channel,
      analysisTime,
      timestamp: new Date().toISOString(),
    };
  },

  // ===================================================
  // URL EXTRACTOR
  // ===================================================
  extractURLs(text) {
    const urlRegex = /https?:\/\/[^\s\u0000-\u001F"<>[\]{}|\\^`]+/gi;
    const found = text.match(urlRegex) || [];
    // Also try to catch www. without http
    const wwwRegex = /(?<![/\w])www\.[a-z0-9-]+\.[a-z]{2,}[^\s]*/gi;
    const wwwFound = (text.match(wwwRegex) || []).map(u => 'http://' + u);
    return [...new Set([...found, ...wwwFound])];
  },

  // ===================================================
  // URL ANALYSIS
  // ===================================================
  analyzeURL(url) {
    let score = 0;
    const indicators = [];
    const goodSignals = [];

    if (!url || url.length < 4) return { score: 0, indicators: [], goodSignals: [] };

    const urlLower = url.toLowerCase();

    // Check known safe domains
    for (const safe of this.knownSafeDomains) {
      if (urlLower.includes(safe) && this.isLegitimate(urlLower, safe)) {
        score -= 10;
        goodSignals.push(`✅ Known legitimate domain: ${safe}`);
        break;
      }
    }

    // Check known phishing domains
    for (const phish of this.knownPhishingDomains) {
      if (urlLower.includes(phish)) {
        score += 35;
        indicators.push(`⚠️ Matches known phishing pattern: "${phish}"`);
        break;
      }
    }

    // HTTPS check
    if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
      score += 8;
      indicators.push('⚠️ Not using HTTPS — connection may be insecure');
    } else if (url.startsWith('https://')) {
      goodSignals.push('✅ Encrypted HTTPS connection');
    }

    // Suspicious TLDs
    for (const tld of this.suspiciousTLDs) {
      try {
        const domain = new URL(url.startsWith('http') ? url : 'http://' + url).hostname;
        if (domain.endsWith(tld)) {
          score += 20;
          indicators.push(`⚠️ Suspicious top-level domain: ${tld}`);
          break;
        }
      } catch (e) {}
    }

    // Shortened URL
    for (const short of this.shortenedURLDomains) {
      if (urlLower.includes(short)) {
        score += 18;
        indicators.push(`⚠️ Shortened URL detected (${short}) — destination unknown`);
        break;
      }
    }

    // URL length (very long URLs can be obfuscating)
    if (url.length > 150) {
      score += 10;
      indicators.push('⚠️ Unusually long URL — may be masking true destination');
    }

    // Suspicious keywords in URL
    const suspiciousKeywords = ['login', 'verify', 'secure', 'update', 'confirm', 'account', 'banking', 'reward', 'prize', 'claim', 'free', 'win', 'kyc'];
    const foundKw = suspiciousKeywords.filter(kw => urlLower.includes(kw));
    if (foundKw.length >= 2) {
      score += 15;
      indicators.push(`⚠️ Multiple suspicious keywords in URL: ${foundKw.slice(0, 3).join(', ')}`);
    } else if (foundKw.length === 1) {
      score += 5;
    }

    // IP address instead of domain name
    if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
      score += 30;
      indicators.push('🔴 URL uses raw IP address instead of domain — major red flag');
    }

    // Multiple subdomains (subdomain abuse)
    try {
      const hostname = new URL(url.startsWith('http') ? url : 'http://' + url).hostname;
      const parts = hostname.split('.');
      if (parts.length > 4) {
        score += 15;
        indicators.push('⚠️ Excessive subdomains — common phishing technique');
      }
    } catch (e) {}

    // @ symbol in URL
    if (url.includes('@')) {
      score += 25;
      indicators.push('🔴 @ symbol in URL — bypasses domain trust indicators');
    }

    // Redirect indicators
    if (urlLower.includes('redirect') || urlLower.includes('url=') || urlLower.includes('goto=') || urlLower.includes('target=')) {
      score += 12;
      indicators.push('⚠️ URL contains redirect parameter — may lead to different destination');
    }

    return { score: Math.max(score, 0), indicators, goodSignals };
  },

  isLegitimate(urlLower, safeDomain) {
    try {
      const domain = new URL(urlLower.startsWith('http') ? urlLower : 'http://' + urlLower).hostname;
      return domain === safeDomain || domain.endsWith('.' + safeDomain);
    } catch { return false; }
  },

  // ===================================================
  // BRAND DETECTION
  // ===================================================
  analyzeBrand(url, content) {
    const combined = (url + ' ' + content).toLowerCase();
    const result = { detected: false, score: 0, indicators: [], impersonatedBrand: null };

    for (const bp of this.brandPatterns) {
      const found = bp.patterns.some(p => combined.includes(p));
      if (!found) continue;

      // Check if it's the legitimate domain
      const legitimateDomain = bp.legitimate;
      const isLegit = url.toLowerCase().includes(legitimateDomain);

      if (isLegit) {
        result.detected = false; // Legitimate brand usage
        return { ...result, goodSignals: [`✅ Matches legitimate ${bp.brand} domain`] };
      }

      // Brand mentioned but NOT on official domain — typosquatting!
      result.detected = true;
      result.impersonatedBrand = bp.brand;
      result.score = 40;
      result.indicators.push(
        `🔴 Impersonating brand: ${bp.brand}`,
        `⚠️ Official domain is ${legitimateDomain} — this URL is NOT it`,
        `⚠️ Typosquatting / brand spoofing detected`
      );
      break;
    }
    return result;
  },

  // ===================================================
  // PAYMENT / FINANCIAL DETECTION
  // ===================================================
  analyzePayment(content) {
    const lower = content.toLowerCase();
    const result = { detected: false, score: 0, indicators: [], types: [] };

    for (const indicator of this.paymentIndicators) {
      if (lower.includes(indicator.toLowerCase())) {
        result.detected = true;
        result.types.push(indicator);
      }
    }

    if (result.detected) {
      result.score = Math.min(result.types.length * 6, 35);
      const uniqueTypes = result.types.slice(0, 3);
      result.indicators.push(
        `💰 Financial / payment content detected: ${uniqueTypes.join(', ')}`,
        '⚠️ Be extremely cautious sharing payment or banking details'
      );
    }

    return result;
  },

  // ===================================================
  // NLP ENGINE
  // ===================================================
  analyzeNLP(content) {
    const lower = content.toLowerCase();
    const result = {
      score: 0, indicators: [], goodSignals: [],
      hasUrgency: false, hasReward: false, hasPersonalInfoRequest: false
    };

    // Urgency patterns
    const urgencyMatches = this.urgencyPatterns.filter(p => lower.includes(p));
    if (urgencyMatches.length > 0) {
      result.hasUrgency = true;
      result.score += Math.min(urgencyMatches.length * 8, 25);
      result.indicators.push(`🚨 Urgency tactics detected: "${urgencyMatches[0]}"`);
    }

    // Reward patterns
    const rewardMatches = this.rewardPatterns.filter(p => lower.includes(p));
    if (rewardMatches.length > 0) {
      result.hasReward = true;
      result.score += Math.min(rewardMatches.length * 7, 28);
      result.indicators.push(`🎁 Reward/prize bait detected: "${rewardMatches[0]}"`);
    }

    // Personal info requests
    const personalMatches = this.personalInfoPatterns.filter(p => lower.includes(p));
    if (personalMatches.length > 0) {
      result.hasPersonalInfoRequest = true;
      result.score += Math.min(personalMatches.length * 9, 30);
      result.indicators.push(`🔑 Requesting sensitive personal information`);
    }

    // Very short content with a link (typical scam SMS)
    if (content.length < 100 && this.extractURLs(content).length > 0) {
      result.score += 8;
      result.indicators.push('⚠️ Very short message with a link — common in smishing attacks');
    }

    // Multiple exclamation marks (pressure tactics)
    const exclamations = (content.match(/!/g) || []).length;
    if (exclamations > 2) {
      result.score += 5;
      result.indicators.push('⚠️ Multiple exclamation marks — pressure / excitement tactic');
    }

    // Large money amounts (₹ + big number)
    if (/₹\s*\d{4,}/.test(content) || /rs\.?\s*\d{4,}/i.test(content) || /\d{4,}\s*rupees/i.test(content)) {
      result.score += 15;
      result.indicators.push('💸 Large monetary amount mentioned — potential lure scam');
    }

    return result;
  },

  // ===================================================
  // VERDICT DISPLAY DATA
  // ===================================================
  getVerdictIcon(verdictClass) {
    return { safe: '🟢', suspicious: '🟡', fraud: '🔴' }[verdictClass] || '🔵';
  },

  getRiskColor(score) {
    if (score >= 70) return 'var(--fraud)';
    if (score >= 35) return 'var(--suspicious)';
    return 'var(--safe)';
  },

  getVerdictEmoji(verdictClass) {
    return { safe: '✅', suspicious: '⚠️', fraud: '🚨' }[verdictClass] || '🔵';
  }
};

// Export for use in app.js
window.PHISHGUARD_ENGINE = PHISHGUARD_ENGINE;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PHISHGUARD_ENGINE;
}
