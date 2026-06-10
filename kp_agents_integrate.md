# KP JARVIS — Integration Guide

## Files Added
- `kp_agents.js` — Frontend multi-agent client (drop into any page)
- `netlify/functions/kp-agent.js` — Backend Netlify function (all 5 agents)

## Step 1 — Add script to kp_output.html and kp_detail.html

Paste this just before `</body>`:

```html
<!-- KP JARVIS Multi-Agent Panel -->
<script src="kp_agents.js"></script>
<button
  onclick="KPAgents.openPanel()"
  style="
    position:fixed; bottom:20px; left:20px; z-index:99998;
    background:#6C63FF; color:#fff; border:none; border-radius:50px;
    padding:12px 20px; font-size:14px; font-weight:700; cursor:pointer;
    box-shadow:0 4px 20px rgba(108,99,255,0.5);
  "
  title="Ask JARVIS about your chart"
>
  🤖 Ask JARVIS
</button>
```

## Step 2 — Add to kp_match.html (for Match Advisor)

Same snippet above. The Match Advisor agent will auto-focus on H7/H2/H11.

## Step 3 — Netlify env variable

Make sure `ANTHROPIC_API_KEY` is set in your Netlify site → Site Settings → Environment Variables.
(Already used by parse-payslip.js so likely already set.)

## How it works

```
User types question
       ↓
kp_agents.js reads sessionStorage('kp_input') — already saved by your app
       ↓
POST /.netlify/functions/kp-agent { agent:'orchestrator', question, chartData }
       ↓
Orchestrator returns: relevantHouses, promise, timingVerdict, agentsConsulted
       ↓
Parallel calls to recommended sub-agents (chart, dasha, etc.)
       ↓
Each result rendered in the panel with colour-coded verdicts
```

## Programmatic usage (optional)

```js
// From any page that has kp_input in sessionStorage:
const result = await KPAgents.ask('Will I get promoted this year?');
console.log(result.orchestrator.finalAnswer);
console.log(result.agents.dasha.timingVerdict);
```

## Agents & their focus

| Agent       | Endpoint param  | Analyses                          |
|-------------|-----------------|-----------------------------------|
| JARVIS      | orchestrator    | Routes + synthesises final answer |
| Chart Analyst | chart         | CSL chain, significators, promise |
| Dasha Reader | dasha          | MD/AD/PD activation               |
| Match Advisor | match         | H7 promise, compatibility         |
| Transit Watch | transit       | Transit support/obstruction       |
