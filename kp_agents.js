/**
 * kp_agents.js — KP JARVIS Voice-First Interface (ElevenLabs edition)
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

  // ── ElevenLabs audio playback ─────────────────────────────────
  let currentAudio = null;

  async function speakViaElevenLabs(text) {
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'tts_only', question: text, chartData: {}, tts: true })
      });
      const data = await resp.json();
      if (!data.audio) throw new Error('No audio returned');

      return new Promise((resolve) => {
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        const blob = base64ToBlob(data.audio, 'audio/mpeg');
        const url  = URL.createObjectURL(blob);
        currentAudio = new Audio(url);
        currentAudio.onended  = () => { URL.revokeObjectURL(url); resolve(); };
        currentAudio.onerror  = () => { resolve(); };
        currentAudio.play().catch(resolve);
      });
    } catch {
      // Fallback to browser TTS if ElevenLabs fails
      return browserSpeak(text);
    }
  }

  function base64ToBlob(base64, mime) {
    const bytes = atob(base64);
    const arr   = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  async function speakFromBase64(base64) {
    if (!base64) return;
    return new Promise((resolve) => {
      if (currentAudio) { currentAudio.pause(); currentAudio = null; }
      const blob = base64ToBlob(base64, 'audio/mpeg');
      const url  = URL.createObjectURL(blob);
      currentAudio = new Audio(url);
      currentAudio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      currentAudio.onerror = () => resolve();
      currentAudio.play().catch(resolve);
    });
  }

  // Browser TTS fallback
  function browserSpeak(text) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel();
      const utter   = new SpeechSynthesisUtterance(text);
      const voices  = window.speechSynthesis.getVoices();
      const pick    = voices.find(v => v.lang.startsWith('en') && /male|david|daniel|alex/i.test(v.name))
                   || voices.find(v => v.lang.startsWith('en')) || voices[0];
      utter.voice   = pick || null;
      utter.rate    = 0.90; utter.pitch = 0.78;
      utter.onend   = resolve; utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    });
  }

  // ── API ───────────────────────────────────────────────────────
  async function callAgent(agent, question, chartData, tts = false) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, question, chartData, tts })
    });
    if (!resp.ok) throw new Error(`${resp.status}`);
    return resp.json();
  }

  async function ask(question) {
    const raw = sessionStorage.getItem('kp_input');
    const chartData = raw ? JSON.parse(raw) : null;
    if (!chartData) throw new Error('No chart data loaded. Please analyse a chart first.');

    // Orchestrator with TTS=true so audio comes back together
    const orchResp = await callAgent('orchestrator', question, chartData, true);
    const orch     = orchResp.result;
    const audio    = orchResp.audio;

    // Sub-agents in parallel (no TTS needed)
    const agentsToRun = orch.agentsConsulted || ['chart', 'dasha'];
    const subResults  = {};
    await Promise.all(agentsToRun.map(async (ag) => {
      try { subResults[ag] = (await callAgent(ag, question, chartData, false)).result; }
      catch (e) { subResults[ag] = { error: e.message }; }
    }));

    return { orchestrator: orch, agents: subResults, audio };
  }

  // ── Styles ────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('jarvis-styles')) return;
    const s = document.createElement('style');
    s.id = 'jarvis-styles';
    s.textContent = `
      #jarvis-overlay {
        position:fixed;inset:0;z-index:99999;
        background:rgba(0,0,0,0.88);
        display:flex;align-items:center;justify-content:center;
        font-family:'Segoe UI',sans-serif;
        animation:jFadeIn 0.3s ease;
      }
      @keyframes jFadeIn{from{opacity:0}to{opacity:1}}

      #jarvis-box {
        width:540px;max-width:95vw;
        background:#06080f;
        border:1px solid #0d2a4a;
        border-radius:18px;
        box-shadow:0 0 80px rgba(0,120,255,0.12),0 0 160px rgba(0,60,180,0.06);
        overflow:hidden;position:relative;
      }
      #jarvis-box::before {
        content:'';position:absolute;top:0;left:0;right:0;height:2px;
        background:linear-gradient(90deg,transparent,#00cfff,#6C63FF,#00cfff,transparent);
        background-size:200% 100%;
        animation:jScan 2.4s linear infinite;
      }
      @keyframes jScan{0%{background-position:200% 0}100%{background-position:-200% 0}}

      #jarvis-header {
        padding:18px 22px 14px;
        display:flex;align-items:center;gap:14px;
        border-bottom:1px solid #0a1e32;
      }
      #jarvis-avatar {
        width:52px;height:52px;border-radius:50%;
        background:radial-gradient(circle at 35% 35%,#1a6fff,#080f2a);
        border:2px solid #1a50e0;
        display:flex;align-items:center;justify-content:center;
        font-size:24px;
        box-shadow:0 0 20px rgba(26,80,224,0.5);
        flex-shrink:0;transition:all 0.3s;
      }
      #jarvis-avatar.speaking{animation:jPulse 0.55s ease-in-out infinite alternate;}
      @keyframes jPulse{
        from{box-shadow:0 0 12px rgba(26,80,224,0.4);transform:scale(1);}
        to{box-shadow:0 0 34px rgba(0,200,255,0.8);transform:scale(1.07);}
      }
      #jarvis-avatar.thinking{animation:jThink 1.2s ease-in-out infinite;}
      @keyframes jThink{
        0%,100%{box-shadow:0 0 12px rgba(26,80,224,0.4);border-color:#1a50e0;}
        50%{box-shadow:0 0 28px rgba(0,200,255,0.7);border-color:#00cfff;}
      }
      #jarvis-title h2{
        margin:0;font-size:16px;font-weight:700;color:#7ab8ff;
        letter-spacing:3px;text-transform:uppercase;
      }
      #jarvis-title p{margin:2px 0 0;font-size:11px;color:#2a5a8a;letter-spacing:1.5px;}
      #jarvis-close{
        background:none;border:none;color:#2a4a6a;cursor:pointer;
        font-size:20px;padding:4px 8px;margin-left:auto;transition:color 0.2s;
      }
      #jarvis-close:hover{color:#aaa;}

      #jarvis-speech-bar{
        min-height:62px;padding:14px 22px;
        display:flex;align-items:center;gap:14px;
        border-bottom:1px solid #0a1e32;background:#07091a;
      }
      #jarvis-waveform{display:flex;align-items:center;gap:3px;flex-shrink:0;}
      #jarvis-waveform span{
        display:block;width:3px;background:#1a50e0;border-radius:2px;height:5px;
      }
      #jarvis-waveform.active span:nth-child(1){animation:jWave 0.75s ease-in-out infinite 0.00s;}
      #jarvis-waveform.active span:nth-child(2){animation:jWave 0.75s ease-in-out infinite 0.10s;}
      #jarvis-waveform.active span:nth-child(3){animation:jWave 0.75s ease-in-out infinite 0.20s;}
      #jarvis-waveform.active span:nth-child(4){animation:jWave 0.75s ease-in-out infinite 0.30s;}
      #jarvis-waveform.active span:nth-child(5){animation:jWave 0.75s ease-in-out infinite 0.20s;}
      #jarvis-waveform.active span:nth-child(6){animation:jWave 0.75s ease-in-out infinite 0.10s;}
      #jarvis-waveform.active span:nth-child(7){animation:jWave 0.75s ease-in-out infinite 0.00s;}
      @keyframes jWave{0%,100%{height:4px;}50%{height:22px;background:#00cfff;}}

      #jarvis-speech-text{
        font-size:13.5px;color:#90b8d8;line-height:1.55;flex:1;font-style:italic;
      }

      #jarvis-presets{
        padding:14px 16px 6px;
        display:grid;grid-template-columns:1fr 1fr;gap:8px;
      }
      .jarvis-preset-btn{
        background:#08101e;border:1px solid #102840;
        border-radius:10px;padding:11px 13px;
        color:#7090b0;font-size:12.5px;cursor:pointer;
        text-align:left;transition:all 0.2s;
        display:flex;align-items:center;gap:9px;
      }
      .jarvis-preset-btn:hover{
        background:#0d1e33;border-color:#1a5aff;color:#a0c8f0;
        box-shadow:0 0 12px rgba(26,90,255,0.18);
      }
      .p-icon{font-size:16px;flex-shrink:0;}

      #jarvis-custom-row{
        display:flex;gap:8px;padding:10px 16px 16px;
        border-top:1px solid #0a1e32;margin-top:6px;
      }
      #jarvis-custom-input{
        flex:1;background:#08101e;border:1px solid #102840;
        border-radius:10px;color:#b0cce8;padding:10px 14px;
        font-size:13px;outline:none;transition:border-color 0.2s;
      }
      #jarvis-custom-input:focus{border-color:#1a5aff;}
      #jarvis-custom-input::placeholder{color:#1e3a5a;}
      #jarvis-ask-btn{
        background:linear-gradient(135deg,#1a5aff,#6C63FF);
        color:#fff;border:none;border-radius:10px;
        padding:10px 20px;cursor:pointer;font-size:13px;font-weight:700;
        transition:opacity 0.2s;white-space:nowrap;
      }
      #jarvis-ask-btn:hover{opacity:0.85;}
      #jarvis-ask-btn:disabled{opacity:0.35;cursor:not-allowed;}

      #jarvis-answer-section{display:none;padding:0 16px 16px;}
      #jarvis-answer-card{
        background:#080f1e;border:1px solid #0d2a4a;
        border-radius:12px;padding:16px;
      }
      #jarvis-verdict-badge{
        display:inline-block;padding:3px 12px;border-radius:20px;
        font-size:11px;font-weight:700;letter-spacing:1.5px;
        margin-bottom:10px;text-transform:uppercase;
      }
      .v-yes  {background:#0a240a;color:#66bb6a;border:1px solid #1e5a1e;}
      .v-no   {background:#240a0a;color:#ef5350;border:1px solid #5a1e1e;}
      .v-maybe{background:#1e180a;color:#ffa726;border:1px solid #5a3a0a;}
      #jarvis-answer-text{font-size:13.5px;color:#9abcd8;line-height:1.65;}
      #jarvis-sub-details{margin-top:10px;font-size:12px;color:#3a6a8a;line-height:1.6;}
      #jarvis-sub-details div{margin-bottom:4px;}
      #jarvis-new-btn{
        margin-top:14px;width:100%;background:none;
        border:1px solid #0d2a4a;border-radius:8px;
        color:#2a6a9a;padding:9px;cursor:pointer;
        font-size:12px;transition:all 0.2s;letter-spacing:0.5px;
      }
      #jarvis-new-btn:hover{border-color:#1a5aff;color:#5aaaff;}
    `;
    document.head.appendChild(s);
  }

  // ── Build panel DOM ───────────────────────────────────────────
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
          <div id="jarvis-speech-text">Initialising systems…</div>
        </div>
        <div id="jarvis-presets">
          ${PRESET_QUESTIONS.map(q =>
            `<button class="jarvis-preset-btn" data-q="${q.text}">
               <span class="p-icon">${q.icon}</span><span>${q.text}</span>
             </button>`
          ).join('')}
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
            <button id="jarvis-new-btn">🔄 Ask another question</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close
    const close = () => {
      if (currentAudio) { currentAudio.pause(); currentAudio = null; }
      window.speechSynthesis?.cancel();
      overlay.remove();
    };
    document.getElementById('jarvis-close').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };

    // Presets
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
    document.getElementById('jarvis-new-btn').onclick = async () => {
      document.getElementById('jarvis-answer-section').style.display = 'none';
      document.getElementById('jarvis-presets').style.display = 'grid';
      document.getElementById('jarvis-custom-row').style.display = 'flex';
      setState('What else would you like to know, sir?', 'speaking');
      await speakViaElevenLabs('What else would you like to know, sir?');
      setState('What else would you like to know, sir?', 'idle');
    };

    return overlay;
  }

  function setState(text, mode = 'idle') {
    const txt = document.getElementById('jarvis-speech-text');
    const wv  = document.getElementById('jarvis-waveform');
    const av  = document.getElementById('jarvis-avatar');
    if (txt) txt.textContent = text;
    if (wv)  wv.className = mode === 'speaking' ? 'active' : '';
    if (av)  av.className = mode === 'thinking' ? 'thinking' : mode === 'speaking' ? 'speaking' : '';
  }

  async function submitQuestion(question) {
    const btn = document.getElementById('jarvis-ask-btn');
    if (btn) btn.disabled = true;

    document.getElementById('jarvis-presets').style.display = 'none';
    document.getElementById('jarvis-custom-row').style.display = 'none';
    document.getElementById('jarvis-answer-section').style.display = 'none';

    setState('Analysing your chart, sir…', 'thinking');
    // Speak "thinking" line via ElevenLabs
    speakViaElevenLabs('Analysing your chart. One moment, sir.');

    try {
      const { orchestrator: orch, agents, audio } = await ask(question);

      const finalAnswer = orch.finalAnswer || 'Analysis complete.';
      const promise     = orch.promise     || '';
      const timing      = orch.timingVerdict || '';

      // Verdict
      const vText = (promise + ' ' + timing).toLowerCase();
      let vClass = 'v-maybe', vLabel = 'Conditional';
      if (vText.includes('yes') || vText.includes('favour') || vText.includes('active')) {
        vClass = 'v-yes'; vLabel = '✔ Favourable';
      } else if (vText.includes('no') || vText.includes('unfav') || vText.includes('inact') || vText.includes('not p')) {
        vClass = 'v-no'; vLabel = '✘ Unfavourable';
      }

      // Sub details
      let subHtml = '';
      if (agents.dasha && !agents.dasha.error) {
        const d = agents.dasha;
        subHtml += `<div>⏳ <strong style="color:#5a8aaa">Dasha:</strong> MD ${d.md||'?'} · AD ${d.ad||'?'} · PD ${d.pd||'?'} — ${d.timingVerdict||''}</div>`;
      }
      if (agents.chart && !agents.chart.error) {
        subHtml += `<div>🔭 <strong style="color:#5a8aaa">Chart:</strong> ${agents.chart.summary||''}</div>`;
      }

      // Render
      document.getElementById('jarvis-verdict-badge').className = `jarvis-verdict-badge ${vClass}`;
      document.getElementById('jarvis-verdict-badge').textContent = vLabel;
      document.getElementById('jarvis-answer-text').textContent = finalAnswer;
      document.getElementById('jarvis-sub-details').innerHTML = subHtml;
      document.getElementById('jarvis-answer-section').style.display = 'block';

      // Play ElevenLabs audio (already generated by server)
      setState(finalAnswer, 'speaking');
      if (audio) {
        await speakFromBase64(audio);
      } else {
        await speakViaElevenLabs(`${finalAnswer} Promise is ${promise}. Timing is ${timing}.`);
      }
      setState(finalAnswer, 'idle');

    } catch (err) {
      setState(`Sorry sir, I encountered an error: ${err.message}`, 'idle');
      await speakViaElevenLabs('Sorry sir, I encountered an error. Please try again.');
      document.getElementById('jarvis-presets').style.display = 'grid';
      document.getElementById('jarvis-custom-row').style.display = 'flex';
    }

    if (btn) btn.disabled = false;
  }

  // ── Open ──────────────────────────────────────────────────────
  async function openPanel() {
    if (document.getElementById('jarvis-overlay')) return;
    injectStyles();
    buildPanel();

    setTimeout(async () => {
      setState('What would you like to know, sir?', 'speaking');
      await speakViaElevenLabs('Welcome. What would you like to know, sir?');
      setState('What would you like to know, sir?', 'idle');
    }, 300);
  }

  return { openPanel, ask };

})();
