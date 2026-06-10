/**
 * kp_agents.js — KP JARVIS Multi-Agent Client
 *
 * Usage (add to any page that has chartData in sessionStorage):
 *   <script src="kp_agents.js"></script>
 *   <script> KPAgents.openPanel(); </script>
 *
 * Or call programmatically:
 *   const result = await KPAgents.ask('Will I get married this year?');
 */

window.KPAgents = (() => {

  // ── Config ──────────────────────────────────────────────────────
  const API_URL = '/.netlify/functions/kp-agent';

  const AGENT_META = {
    orchestrator: { label: 'JARVIS',         icon: '🤖', color: '#6C63FF' },
    chart:        { label: 'Chart Analyst',  icon: '🔭', color: '#2E86AB' },
    dasha:        { label: 'Dasha Reader',   icon: '⏳', color: '#E07A5F' },
    match:        { label: 'Match Advisor',  icon: '💍', color: '#3D405B' },
    transit:      { label: 'Transit Watch',  icon: '🌙', color: '#81B29A' },
  };

  // ── Core API call ────────────────────────────────────────────────
  async function callAgent(agent, question, chartData) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, question, chartData })
    });
    if (!resp.ok) throw new Error(`Agent ${agent} failed: ${resp.status}`);
    const data = await resp.json();
    return data.result;
  }

  // ── Orchestrated ask (runs orchestrator + sub-agents) ─────────────
  async function ask(question, chartData) {
    if (!chartData) {
      const raw = sessionStorage.getItem('kp_input');
      chartData = raw ? JSON.parse(raw) : null;
    }
    if (!chartData) throw new Error('No chart data found in sessionStorage (kp_input).');

    // Step 1: Orchestrator decides which agents to consult
    const orchResult = await callAgent('orchestrator', question, chartData);

    // Step 2: Run sub-agents the orchestrator recommends (or default set)
    const agentsToRun = orchResult.agentsConsulted || ['chart', 'dasha'];
    const subResults = {};
    await Promise.all(
      agentsToRun.map(async (ag) => {
        try {
          subResults[ag] = await callAgent(ag, question, chartData);
        } catch (e) {
          subResults[ag] = { error: e.message };
        }
      })
    );

    return { orchestrator: orchResult, agents: subResults };
  }

  // ── Text-to-Speech (different voice per agent) ────────────────────
  function speak(text, agentName) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();

    // Voice personality map (indices into available voices — fallback gracefully)
    const voiceMap = { orchestrator: 0, chart: 1, dasha: 2, match: 3, transit: 4 };
    const idx = voiceMap[agentName] || 0;

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = voices[idx % voices.length] || null;
    utter.rate  = agentName === 'orchestrator' ? 0.95 : 1.0;
    utter.pitch = agentName === 'orchestrator' ? 0.85 : 1.0;
    window.speechSynthesis.speak(utter);
  }

  // ── UI Panel ─────────────────────────────────────────────────────
  function openPanel() {
    if (document.getElementById('kp-jarvis-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'kp-jarvis-panel';
    panel.innerHTML = `
      <div id="kp-jarvis-header">
        <span>🤖 KP JARVIS</span>
        <div>
          <button id="kp-jarvis-voice-btn" title="Toggle voice" style="background:none;border:none;cursor:pointer;font-size:16px;color:#ccc;">🔊</button>
          <button id="kp-jarvis-close" title="Close">✕</button>
        </div>
      </div>
      <div id="kp-jarvis-agents-bar">
        ${Object.entries(AGENT_META).map(([k,v]) =>
          `<span class="kp-agent-badge" data-agent="${k}" style="border-color:${v.color}">${v.icon} ${v.label}</span>`
        ).join('')}
      </div>
      <div id="kp-jarvis-messages"></div>
      <div id="kp-jarvis-input-row">
        <input id="kp-jarvis-input" type="text" placeholder="Ask about your chart… e.g. Will I get a job soon?" />
        <button id="kp-jarvis-send">Ask</button>
      </div>
    `;

    // Styles
    const style = document.createElement('style');
    style.textContent = `
      #kp-jarvis-panel {
        position: fixed; bottom: 20px; right: 20px; width: 400px; max-height: 560px;
        background: #0f0f1a; border: 1px solid #333; border-radius: 12px;
        display: flex; flex-direction: column; z-index: 99999;
        font-family: 'Segoe UI', sans-serif; box-shadow: 0 8px 40px rgba(0,0,0,0.6);
        overflow: hidden;
      }
      #kp-jarvis-header {
        padding: 12px 16px; background: #1a1a2e; display: flex;
        justify-content: space-between; align-items: center;
        color: #a0a0ff; font-weight: 700; font-size: 15px; border-bottom: 1px solid #333;
      }
      #kp-jarvis-header button {
        background: none; border: none; color: #888; cursor: pointer; font-size: 16px; padding: 2px 6px;
      }
      #kp-jarvis-agents-bar {
        display: flex; gap: 6px; padding: 8px 12px; flex-wrap: wrap;
        background: #12122a; border-bottom: 1px solid #2a2a3a;
      }
      .kp-agent-badge {
        font-size: 11px; padding: 3px 8px; border-radius: 20px;
        border: 1px solid; color: #ccc; background: #1e1e30; cursor: pointer;
        transition: opacity 0.2s;
      }
      .kp-agent-badge:hover { opacity: 0.75; }
      #kp-jarvis-messages {
        flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px;
      }
      .kp-msg { border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 1.5; max-width: 100%; }
      .kp-msg-user { background: #1e2a3a; color: #90caf9; align-self: flex-end; }
      .kp-msg-agent { background: #1a1a2e; color: #e0e0e0; border-left: 3px solid #6C63FF; }
      .kp-msg-agent .kp-agent-label { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
      .kp-msg-verdict { margin-top: 6px; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
      .kp-verdict-yes    { background: #1a3a1a; color: #66bb6a; }
      .kp-verdict-no     { background: #3a1a1a; color: #ef5350; }
      .kp-verdict-maybe  { background: #2a2a1a; color: #ffa726; }
      .kp-typing { color: #666; font-style: italic; font-size: 12px; }
      .kp-sub-block { margin-top: 8px; padding: 8px; background: #111128; border-radius: 6px; font-size: 12px; color: #aaa; }
      .kp-sub-block strong { color: #ccc; }
      #kp-jarvis-input-row {
        display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid #333; background: #0f0f1a;
      }
      #kp-jarvis-input {
        flex: 1; background: #1a1a2e; border: 1px solid #444; border-radius: 8px;
        color: #fff; padding: 8px 12px; font-size: 13px; outline: none;
      }
      #kp-jarvis-send {
        background: #6C63FF; color: #fff; border: none; border-radius: 8px;
        padding: 8px 14px; cursor: pointer; font-size: 13px; font-weight: 600;
        transition: background 0.2s;
      }
      #kp-jarvis-send:hover { background: #5a53e0; }
      #kp-jarvis-send:disabled { background: #444; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(panel);

    // State
    let voiceEnabled = false;
    const msgBox = document.getElementById('kp-jarvis-messages');
    const input   = document.getElementById('kp-jarvis-input');
    const sendBtn = document.getElementById('kp-jarvis-send');

    // Voice toggle
    document.getElementById('kp-jarvis-voice-btn').onclick = () => {
      voiceEnabled = !voiceEnabled;
      document.getElementById('kp-jarvis-voice-btn').style.color = voiceEnabled ? '#6C63FF' : '#ccc';
    };

    // Close
    document.getElementById('kp-jarvis-close').onclick = () => panel.remove();

    // Agent badge click → pre-fill example questions
    const EXAMPLES = {
      orchestrator: 'Will I get married this year?',
      chart:        'What does my 7th house promise?',
      dasha:        'Is current dasha supporting my career?',
      match:        'Is my match compatible?',
      transit:      'What transits should I watch for my finances?',
    };
    document.querySelectorAll('.kp-agent-badge').forEach(badge => {
      badge.onclick = () => { input.value = EXAMPLES[badge.dataset.agent] || ''; input.focus(); };
    });

    function addMsg(html, cls) {
      const div = document.createElement('div');
      div.className = `kp-msg ${cls}`;
      div.innerHTML = html;
      msgBox.appendChild(div);
      msgBox.scrollTop = msgBox.scrollHeight;
      return div;
    }

    function verdictClass(v) {
      if (!v) return '';
      const lv = v.toLowerCase();
      if (lv.includes('yes') || lv.includes('favour') || lv.includes('active') || lv.includes('compat') || lv.includes('promis')) return 'kp-verdict-yes';
      if (lv.includes('no') || lv.includes('unfav') || lv.includes('inact') || lv.includes('incompat') || lv.includes('not')) return 'kp-verdict-no';
      return 'kp-verdict-maybe';
    }

    function renderOrch(r) {
      const vc = verdictClass(r.promise + ' ' + r.timingVerdict);
      return `
        <div class="kp-agent-label" style="color:#6C63FF">🤖 JARVIS — Orchestrator</div>
        <div>${r.finalAnswer || '—'}</div>
        <div class="kp-msg-verdict ${vc}">
          Promise: ${r.promise || '?'} &nbsp;|&nbsp; Timing: ${r.timingVerdict || '?'}
        </div>
        ${r.promiseReason ? `<div class="kp-sub-block"><strong>Promise:</strong> ${r.promiseReason}</div>` : ''}
        ${r.timingReason  ? `<div class="kp-sub-block"><strong>Timing:</strong> ${r.timingReason}</div>` : ''}
      `;
    }

    function renderChart(r) {
      const blocks = (r.houseAnalysis || []).map(h =>
        `<div class="kp-sub-block">
          <strong>H${h.house}</strong> — NL: ${h.nl}, SL: ${h.sl} | Sigs: [${(h.slSignificators||[]).join(', ')}]
          <span style="color:${h.promised ? '#66bb6a' : '#ef5350'}"> ${h.promised ? '✔ Promised' : '✗ Not Promised'}</span><br>
          <span style="color:#999">${h.reason || ''}</span>
        </div>`
      ).join('');
      return `<div class="kp-agent-label" style="color:#2E86AB">🔭 Chart Analyst</div>${blocks}<div>${r.summary||''}</div>`;
    }

    function renderDasha(r) {
      return `
        <div class="kp-agent-label" style="color:#E07A5F">⏳ Dasha Reader</div>
        <div class="kp-sub-block">
          MD: <strong>${r.md||'?'}</strong> [${(r.mdSignificators||[]).join(', ')}] &nbsp;
          AD: <strong>${r.ad||'?'}</strong> [${(r.adSignificators||[]).join(', ')}] &nbsp;
          PD: <strong>${r.pd||'?'}</strong> [${(r.pdSignificators||[]).join(', ')}]
        </div>
        <div class="kp-msg-verdict ${verdictClass(r.timingVerdict)}">${r.timingVerdict||'?'}</div>
        <div class="kp-sub-block">${r.reason||''}</div>
        ${r.periodNote ? `<div style="color:#888;font-size:11px;margin-top:4px">${r.periodNote}</div>` : ''}
      `;
    }

    function renderMatch(r) {
      return `
        <div class="kp-agent-label" style="color:#3D405B">💍 Match Advisor</div>
        <div class="kp-sub-block">7th CSL: <strong>${r.h7Csl||'?'}</strong> — Signifies 7th: ${r.h7CslSignifies7 ? '✔' : '✗'}</div>
        <div class="kp-msg-verdict ${verdictClass(r.matchVerdict)}">${r.matchVerdict||'?'}</div>
        <div class="kp-sub-block">${r.reason||''}</div>
      `;
    }

    function renderTransit(r) {
      return `
        <div class="kp-agent-label" style="color:#81B29A">🌙 Transit Watch</div>
        <div class="kp-msg-verdict ${verdictClass(r.transitVerdict)}">${r.transitVerdict||'?'}</div>
        <div class="kp-sub-block">${r.transitNote||r.reason||''}</div>
      `;
    }

    const RENDERERS = { chart: renderChart, dasha: renderDasha, match: renderMatch, transit: renderTransit };

    async function handleSend() {
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      sendBtn.disabled = true;

      addMsg(q, 'kp-msg-user');
      const typingDiv = addMsg('<span class="kp-typing">JARVIS is consulting the chart…</span>', 'kp-msg-agent');

      try {
        const { orchestrator: orch, agents } = await ask(q);

        typingDiv.remove();
        addMsg(renderOrch(orch), 'kp-msg-agent');
        if (voiceEnabled) speak(orch.finalAnswer || '', 'orchestrator');

        for (const [agentKey, res] of Object.entries(agents)) {
          const renderer = RENDERERS[agentKey];
          if (renderer) addMsg(renderer(res), 'kp-msg-agent');
        }
      } catch (err) {
        typingDiv.innerHTML = `<span style="color:#ef5350">Error: ${err.message}</span>`;
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    }

    sendBtn.onclick = handleSend;
    input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(); };

    // Preload TTS voices
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', () => {});

    // Welcome message
    addMsg(`
      <div class="kp-agent-label" style="color:#6C63FF">🤖 JARVIS</div>
      Chart loaded. I have access to your KP data — cusps, planets, significators, and current Dasha.<br><br>
      <span style="color:#888">Ask any KP question. E.g. <em>"Will I get a job soon?"</em> or <em>"Is marriage promised in my chart?"</em></span>
    `, 'kp-msg-agent');
  }

  // ── Public API ────────────────────────────────────────────────────
  return { ask, callAgent, openPanel, speak };

})();
