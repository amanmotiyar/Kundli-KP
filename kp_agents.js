/**
 * kp_agents.js — KP JARVIS Voice-First Interface
 * Click button → JARVIS greets → preset questions → speaks answer
 */

window.KPAgents = (() => {

  const API_URL = '/.netlify/functions/kp-agent';

  const PRESET_QUESTIONS = [
    { icon: '💼', text: 'Will there be a promotion for me?' },
    { icon: '💍', text: 'Is marriage promised in my chart?' },
    { icon: '💰', text: 'How are my finances looking?' },
    { icon: '🏠', text: 'Any property purchase coming?' },
    { icon: '✈️',  text: 'Will I travel abroad?' },
    { icon: '❤️',  text: 'How is my health this period?' },
  ];

  // ── TTS ──────────────────────────────────────────────────────────
  let voices = [];
  function loadVoices() {
    voices = window.speechSynthesis?.getVoices() || [];
    if (!voices.length) {
      window.speechSynthesis?.addEventListener('voiceschanged', () => {
        voices = window.speechSynthesis.getVoices();
      });
    }
  }

  function speak(text, opts = {}) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      // Prefer a male English voice for JARVIS feel
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && /male|david|mark|daniel|alex|google uk/i.test(v.name)
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      utter.voice  = preferred || null;
      utter.rate   = opts.rate  || 0.92;
      utter.pitch  = opts.pitch || 0.80;
      utter.volume = opts.volume || 1;
      utter.onend  = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    });
  }

  // ── API call ─────────────────────────────────────────────────────
  async function callAgent(agent, question, chartData) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, question, chartData })
    });
    if (!resp.ok) throw new Error(`${resp.status}`);
    const data = await resp.json();
    return data.result;
  }

  async function ask(question) {
    const raw = sessionStorage.getItem('kp_input');
    const chartData = raw ? JSON.parse(raw) : null;
    if (!chartData) throw new Error('No chart data loaded.');
    const orch = await callAgent('orchestrator', question, chartData);
    const agentsToRun = orch.agentsConsulted || ['chart', 'dasha'];
    const subResults = {};
    await Promise.all(agentsToRun.map(async (ag) => {
      try { subResults[ag] = await callAgent(ag, question, chartData); }
      catch (e) { subResults[ag] = { error: e.message }; }
    }));
    return { orchestrator: orch, agents: subResults };
  }

  // ── UI ───────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('jarvis-styles')) return;
    const s = document.createElement('style');
    s.id = 'jarvis-styles';
    s.textContent = `
      #jarvis-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.85);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Segoe UI', sans-serif;
        animation: jarvisFadeIn 0.3s ease;
      }
      @keyframes jarvisFadeIn { from { opacity:0 } to { opacity:1 } }

      #jarvis-box {
        width: 520px; max-width: 95vw;
        background: #07091a;
        border: 1px solid #1e3a5f;
        border-radius: 16px;
        box-shadow: 0 0 60px rgba(0,150,255,0.15), 0 0 120px rgba(0,80,200,0.08);
        overflow: hidden;
        position: relative;
      }

      /* Animated top border */
      #jarvis-box::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, #00bfff, #6C63FF, #00bfff, transparent);
        background-size: 200% 100%;
        animation: jarvisScan 2s linear infinite;
      }
      @keyframes jarvisScan { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

      #jarvis-header {
        padding: 20px 24px 14px;
        display: flex; align-items: center; gap: 14px;
        border-bottom: 1px solid #0d1f35;
      }

      #jarvis-avatar {
        width: 48px; height: 48px; border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #1a6fff, #0a1a3f);
        border: 2px solid #1e5aff;
        display: flex; align-items: center; justify-content: center;
        font-size: 22px;
        box-shadow: 0 0 16px rgba(30,90,255,0.5);
        flex-shrink: 0;
      }
      #jarvis-avatar.speaking {
        animation: jarvisPulse 0.6s ease-in-out infinite alternate;
      }
      @keyframes jarvisPulse {
        from { box-shadow: 0 0 10px rgba(30,90,255,0.4); transform: scale(1); }
        to   { box-shadow: 0 0 28px rgba(30,90,255,0.9); transform: scale(1.06); }
      }
      #jarvis-avatar.thinking {
        animation: jarvisThink 1s linear infinite;
      }
      @keyframes jarvisThink {
        from { border-color: #1e5aff; } 50% { border-color: #00bfff; } to { border-color: #1e5aff; }
      }

      #jarvis-title { flex: 1; }
      #jarvis-title h2 {
        margin: 0; font-size: 17px; font-weight: 700; color: #a0c4ff;
        letter-spacing: 2px; text-transform: uppercase;
      }
      #jarvis-title p {
        margin: 2px 0 0; font-size: 12px; color: #3a6a9a; letter-spacing: 1px;
      }
      #jarvis-close {
        background: none; border: none; color: #3a5a7a; cursor: pointer;
        font-size: 20px; padding: 4px 8px; transition: color 0.2s;
      }
      #jarvis-close:hover { color: #aaa; }

      #jarvis-speech-bar {
        min-height: 64px; padding: 16px 24px;
        display: flex; align-items: center; gap: 12px;
        border-bottom: 1px solid #0d1f35;
      }

      #jarvis-waveform {
        display: flex; align-items: center; gap: 3px; flex-shrink: 0;
      }
      #jarvis-waveform span {
        display: block; width: 3px; background: #1e5aff; border-radius: 2px;
        height: 6px; transition: height 0.15s;
      }
      #jarvis-waveform.active span:nth-child(1) { animation: wave 0.8s ease-in-out infinite 0.0s; }
      #jarvis-waveform.active span:nth-child(2) { animation: wave 0.8s ease-in-out infinite 0.1s; }
      #jarvis-waveform.active span:nth-child(3) { animation: wave 0.8s ease-in-out infinite 0.2s; }
      #jarvis-waveform.active span:nth-child(4) { animation: wave 0.8s ease-in-out infinite 0.3s; }
      #jarvis-waveform.active span:nth-child(5) { animation: wave 0.8s ease-in-out infinite 0.2s; }
      #jarvis-waveform.active span:nth-child(6) { animation: wave 0.8s ease-in-out infinite 0.1s; }
      #jarvis-waveform.active span:nth-child(7) { animation: wave 0.8s ease-in-out infinite 0.0s; }
      @keyframes wave {
        0%,100% { height: 4px; } 50% { height: 20px; }
      }

      #jarvis-speech-text {
        font-size: 14px; color: #c0d8f0; line-height: 1.5; flex: 1;
        min-height: 20px;
      }

      #jarvis-presets {
        padding: 12px 16px 4px;
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
      }
      .jarvis-preset-btn {
        background: #0d1f35; border: 1px solid #1a3a5a;
        border-radius: 10px; padding: 10px 12px;
        color: #90b8d8; font-size: 13px; cursor: pointer;
        text-align: left; transition: all 0.2s;
        display: flex; align-items: center; gap: 8px;
      }
      .jarvis-preset-btn:hover {
        background: #122840; border-color: #1e5aff; color: #c0d8ff;
        box-shadow: 0 0 10px rgba(30,90,255,0.2);
      }
      .jarvis-preset-btn .p-icon { font-size: 16px; flex-shrink: 0; }

      #jarvis-custom-row {
        display: flex; gap: 8px; padding: 12px 16px 16px;
        border-top: 1px solid #0d1f35; margin-top: 8px;
      }
      #jarvis-custom-input {
        flex: 1; background: #0d1f35; border: 1px solid #1a3a5a;
        border-radius: 10px; color: #c0d8f0; padding: 10px 14px;
        font-size: 13px; outline: none;
        transition: border-color 0.2s;
      }
      #jarvis-custom-input:focus { border-color: #1e5aff; }
      #jarvis-custom-input::placeholder { color: #2a4a6a; }
      #jarvis-ask-btn {
        background: linear-gradient(135deg, #1e5aff, #6C63FF);
        color: #fff; border: none; border-radius: 10px;
        padding: 10px 18px; cursor: pointer; font-size: 13px; font-weight: 700;
        transition: opacity 0.2s; white-space: nowrap;
      }
      #jarvis-ask-btn:hover { opacity: 0.85; }
      #jarvis-ask-btn:disabled { opacity: 0.4; cursor: not-allowed; }

      #jarvis-answer-section {
        display: none; padding: 0 16px 16px;
      }
      #jarvis-answer-card {
        background: #0a1628; border: 1px solid #1a3a5a;
        border-radius: 10px; padding: 14px 16px;
      }
      #jarvis-verdict-badge {
        display: inline-block; padding: 3px 10px; border-radius: 20px;
        font-size: 11px; font-weight: 700; letter-spacing: 1px;
        margin-bottom: 8px; text-transform: uppercase;
      }
      .verdict-yes   { background: #0d2e0d; color: #66bb6a; border: 1px solid #2a6a2a; }
      .verdict-no    { background: #2e0d0d; color: #ef5350; border: 1px solid #6a2a2a; }
      .verdict-maybe { background: #2a200a; color: #ffa726; border: 1px solid #6a4a0a; }
      #jarvis-answer-text { font-size: 13px; color: #b0cce8; line-height: 1.6; }
      #jarvis-sub-details { margin-top: 10px; font-size: 12px; color: #5a7a9a; line-height: 1.5; }
      #jarvis-new-question-btn {
        margin-top: 12px; width: 100%; background: none;
        border: 1px solid #1a3a5a; border-radius: 8px;
        color: #3a7aaa; padding: 8px; cursor: pointer;
        font-size: 12px; transition: all 0.2s;
      }
      #jarvis-new-question-btn:hover { border-color: #1e5aff; color: #6aabff; }
    `;
    document.head.appendChild(s);
  }

  function buildPanel() {
    const overlay = document.createElement('div');
    overlay.id = 'jarvis-overlay';
    overlay.innerHTML = `
      <div id="jarvis-box">
        <div id="jarvis-header">
          <div id="jarvis-avatar">🤖</div>
          <div id="jarvis-title">
            <h2>J.A.R.V.I.S</h2>
            <p>KP Astrology Intelligence</p>
          </div>
          <button id="jarvis-close">✕</button>
        </div>

        <div id="jarvis-speech-bar">
          <div id="jarvis-waveform">
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span>
          </div>
          <div id="jarvis-speech-text">Initialising...</div>
        </div>

        <div id="jarvis-presets">
          ${PRESET_QUESTIONS.map(q => `
            <button class="jarvis-preset-btn" data-q="${q.text}">
              <span class="p-icon">${q.icon}</span>
              <span>${q.text}</span>
            </button>
          `).join('')}
        </div>

        <div id="jarvis-custom-row">
          <input id="jarvis-custom-input" type="text" placeholder="Or type your own question…" />
          <button id="jarvis-ask-btn">Ask</button>
        </div>

        <div id="jarvis-answer-section">
          <div id="jarvis-answer-card">
            <div id="jarvis-verdict-badge"></div>
            <div id="jarvis-answer-text"></div>
            <div id="jarvis-sub-details"></div>
            <button id="jarvis-new-question-btn">🔄 Ask another question</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close
    document.getElementById('jarvis-close').onclick = () => {
      window.speechSynthesis?.cancel();
      overlay.remove();
    };
    overlay.onclick = (e) => { if (e.target === overlay) { window.speechSynthesis?.cancel(); overlay.remove(); } };

    // Preset buttons
    overlay.querySelectorAll('.jarvis-preset-btn').forEach(btn => {
      btn.onclick = () => submitQuestion(btn.dataset.q);
    });

    // Custom input
    const input = document.getElementById('jarvis-custom-input');
    document.getElementById('jarvis-ask-btn').onclick = () => {
      if (input.value.trim()) submitQuestion(input.value.trim());
    };
    input.onkeydown = (e) => { if (e.key === 'Enter' && input.value.trim()) submitQuestion(input.value.trim()); };

    // New question
    document.getElementById('jarvis-new-question-btn').onclick = () => {
      document.getElementById('jarvis-answer-section').style.display = 'none';
      document.getElementById('jarvis-presets').style.display = 'grid';
      document.getElementById('jarvis-custom-row').style.display = 'flex';
      setSpeech('What else would you like to know, sir?');
      speak('What else would you like to know, sir?');
    };

    return overlay;
  }

  function setSpeech(text, state = 'idle') {
    const el = document.getElementById('jarvis-speech-text');
    const wv = document.getElementById('jarvis-waveform');
    const av = document.getElementById('jarvis-avatar');
    if (el) el.textContent = text;
    if (wv) wv.className = state === 'speaking' ? 'active' : '';
    if (av) av.className = state === 'thinking' ? 'thinking' : state === 'speaking' ? 'speaking' : '';
  }

  async function submitQuestion(question) {
    const askBtn = document.getElementById('jarvis-ask-btn');
    if (askBtn) askBtn.disabled = true;

    // Hide presets, show thinking
    document.getElementById('jarvis-presets').style.display = 'none';
    document.getElementById('jarvis-custom-row').style.display = 'none';
    document.getElementById('jarvis-answer-section').style.display = 'none';

    setSpeech('Analysing your chart, sir…', 'thinking');
    speak('Analysing your chart. One moment, sir.');

    try {
      const { orchestrator: orch, agents } = await ask(question);

      // Build spoken answer
      const finalAnswer = orch.finalAnswer || 'Analysis complete.';
      const promise     = orch.promise || '';
      const timing      = orch.timingVerdict || '';
      const spokenText  = `${finalAnswer} Promise is ${promise}. Timing is ${timing}.`;

      // Verdict class
      const vText = (promise + ' ' + timing).toLowerCase();
      let vClass = 'verdict-maybe', vLabel = 'Conditional';
      if (vText.includes('yes') || vText.includes('favour') || vText.includes('active')) {
        vClass = 'verdict-yes'; vLabel = 'Favourable';
      } else if (vText.includes('no') || vText.includes('unfav') || vText.includes('not')) {
        vClass = 'verdict-no'; vLabel = 'Unfavourable';
      }

      // Sub-agent details
      let subHtml = '';
      if (agents.dasha && !agents.dasha.error) {
        const d = agents.dasha;
        subHtml += `<div>⏳ <strong>Dasha:</strong> MD ${d.md||'?'} · AD ${d.ad||'?'} · PD ${d.pd||'?'} — ${d.timingVerdict||''}</div>`;
      }
      if (agents.chart && !agents.chart.error) {
        subHtml += `<div>🔭 <strong>Chart:</strong> ${agents.chart.summary||''}</div>`;
      }

      // Render answer
      document.getElementById('jarvis-verdict-badge').className = `jarvis-verdict-badge ${vClass}`;
      document.getElementById('jarvis-verdict-badge').textContent = vLabel;
      document.getElementById('jarvis-answer-text').textContent = finalAnswer;
      document.getElementById('jarvis-sub-details').innerHTML = subHtml;
      document.getElementById('jarvis-answer-section').style.display = 'block';

      // Speak answer
      setSpeech(finalAnswer, 'speaking');
      await speak(spokenText);
      setSpeech(finalAnswer, 'idle');

    } catch (err) {
      setSpeech(`Sorry sir, I encountered an error: ${err.message}`, 'idle');
      await speak(`Sorry sir, I encountered an error.`);
      // Show presets again
      document.getElementById('jarvis-presets').style.display = 'grid';
      document.getElementById('jarvis-custom-row').style.display = 'flex';
    }

    if (askBtn) askBtn.disabled = false;
  }

  async function openPanel() {
    if (document.getElementById('jarvis-overlay')) return;
    loadVoices();
    injectStyles();
    buildPanel();

    // Greet after short delay (let voices load)
    setTimeout(async () => {
      setSpeech('What would you like to know, sir?', 'speaking');
      await speak('Welcome. What would you like to know, sir?');
      setSpeech('What would you like to know, sir?', 'idle');
    }, 400);
  }

  return { openPanel, ask, speak };

})();
