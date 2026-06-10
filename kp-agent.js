/**
 * KP JARVIS — Multi-Agent Netlify Function
 * POST /api/kp-agent
 *
 * Body: { agent: 'orchestrator'|'chart'|'dasha'|'match'|'transit', question: string, chartData: object }
 */

const AGENTS = {

  orchestrator: (chartData, question) => `
You are JARVIS — the master KP Astrology orchestrator. You receive a question and a KP chart, then produce a concise routing plan AND a synthesised final answer.

KP Chart JSON:
${JSON.stringify(chartData, null, 2)}

Rules:
- Always reason in KP Paddhati (Cuspal Sub-Lord theory, Significators via Star Lord chain, Dasha-Antardasha-PD activation).
- Identify which houses are relevant to the question.
- Check if the Cuspal Sub-Lord of the primary house signifies that house (promise check).
- Check if current MD/AD/PD lords activate that house.
- Give a clear VERDICT: Promised / Timing Favourable / Not Promised / Timing Unfavourable.
- Be concise. No generic astrology filler.

Question: "${question}"

Respond in this JSON format (no markdown, no backticks):
{
  "relevantHouses": [7, 2, 11],
  "promise": "Yes / No / Conditional",
  "promiseReason": "...",
  "timingVerdict": "Favourable / Unfavourable / Neutral",
  "timingReason": "...",
  "finalAnswer": "2-3 sentence plain-English verdict",
  "agentsConsulted": ["chart", "dasha"]
}`,

  chart: (chartData, question) => `
You are the KP Chart Analyst agent. Analyse the cuspal sub-lord chain for houses relevant to the question.

KP Chart JSON:
${JSON.stringify(chartData, null, 2)}

Rules:
- For each relevant house: identify Sign, Star Lord (NL), Sub Lord (SL).
- Check SL's significators (houses it signifies via occupation + lordship of its own NL's houses).
- State clearly: does the SL signify the house in question? (This is "Promise".)
- Be technical and precise. KP terminology only.

Question: "${question}"

Respond in JSON (no markdown):
{
  "houseAnalysis": [
    {
      "house": 7,
      "sign": "Scorpio",
      "nl": "Saturn",
      "sl": "Venus",
      "slSignificators": [2, 7, 11],
      "promised": true,
      "reason": "SL Venus signifies houses 2, 7, 11 — promise exists."
    }
  ],
  "summary": "one-line KP summary"
}`,

  dasha: (chartData, question) => `
You are the KP Dasha Interpreter agent. Assess whether the current Mahadasha / Antardasha / PD period activates the houses relevant to the question.

KP Chart JSON (focus on dba field):
${JSON.stringify(chartData, null, 2)}

Rules:
- Extract MD, AD, PD lords from chartData.dba.
- For each lord, state which houses they signify (via planetSig).
- Check if they signify the relevant houses for the question.
- Mention approximate period dates if available.
- Give a Timing Verdict: Active / Inactive / Partial.

Question: "${question}"

Respond in JSON (no markdown):
{
  "md": "Jupiter",
  "ad": "Venus",
  "pd": "Mercury",
  "mdSignificators": [2, 9, 11],
  "adSignificators": [7, 2],
  "pdSignificators": [7, 11],
  "timingVerdict": "Active",
  "reason": "All three period lords signify house 7 — timing is active.",
  "periodNote": "AD Venus runs till approx [date from chartData]"
}`,

  match: (chartData, question) => `
You are the KP Match Advisor agent. Analyse Kundli compatibility using KP principles.

KP Chart JSON:
${JSON.stringify(chartData, null, 2)}

Rules:
- Focus on house 7 (partner), 2 (family), 11 (fulfilment), 4 (happiness).
- Check if 7th CSL signifies 7th house (marriage promise).
- Check Lagna lord strength and its connection to 7th.
- Check if 6, 8, 12 lords afflict the 7th house (obstacles).
- In KP, Dosha is secondary — focus on CSL-based promise.

Question: "${question}"

Respond in JSON (no markdown):
{
  "h7Csl": "Venus",
  "h7CslSignifies7": true,
  "obstacleHouses": [],
  "matchVerdict": "Compatible / Incompatible / Conditional",
  "reason": "..."
}`,

  transit: (chartData, question) => `
You are the KP Transit Watcher agent. Analyse current planetary transits in context of the natal KP chart.

KP Chart JSON:
${JSON.stringify(chartData, null, 2)}

Rules:
- In KP, transits are secondary confirmation — Dasha must agree first.
- Check if any transiting planets are over the natal sub-lord positions of relevant house cusps.
- Jupiter and Saturn transits over 7th, 2nd, 11th are significant for marriage.
- Note any major transit support or obstruction.

Question: "${question}"

Note: You may not have live transit data — if so, explain what transits to watch for and why, based on the natal chart's sensitive points.

Respond in JSON (no markdown):
{
  "sensitivePoints": ["7th cusp SL degree in Libra 12°30'", "..."],
  "transitNote": "Watch for Jupiter transiting over these degrees...",
  "transitVerdict": "Supportive / Obstructive / Neutral / Unknown (no live data)",
  "reason": "..."
}`
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { agent = 'orchestrator', question, chartData } = body;

  if (!question || !chartData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'question and chartData are required' }) };
  }

  const promptFn = AGENTS[agent];
  if (!promptFn) {
    return { statusCode: 400, body: JSON.stringify({ error: `Unknown agent: ${agent}` }) };
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: `You are a KP (Krishnamurti Paddhati) Astrology expert agent. Always respond in strict JSON as instructed. No markdown, no backticks, no preamble.`,
        messages: [{ role: 'user', content: promptFn(chartData, question) }]
      })
    });

    const data = await resp.json();
    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    const raw = data.content?.[0]?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { raw };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, result: parsed })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
