/**
 * KP JARVIS — Multi-Agent Netlify Function
 * POST /.netlify/functions/kp-agent
 * Body: { agent, question, chartData, tts? }
 * If tts=true, also returns base64 audio via ElevenLabs
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
- finalAnswer must be 2-3 sentences, plain English, no jargon. This will be spoken aloud.

Question: "${question}"

Respond in this JSON format (no markdown, no backticks):
{
  "relevantHouses": [7, 2, 11],
  "promise": "Yes / No / Conditional",
  "promiseReason": "...",
  "timingVerdict": "Favourable / Unfavourable / Neutral",
  "timingReason": "...",
  "finalAnswer": "2-3 sentence plain-English verdict spoken aloud",
  "agentsConsulted": ["chart", "dasha"]
}`,

  chart: (chartData, question) => `
You are the KP Chart Analyst agent. Analyse the cuspal sub-lord chain for houses relevant to the question.

KP Chart JSON:
${JSON.stringify(chartData, null, 2)}

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

KP Chart JSON:
${JSON.stringify(chartData, null, 2)}

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

Question: "${question}"

Respond in JSON (no markdown):
{
  "sensitivePoints": ["7th cusp SL degree in Libra 12 degrees"],
  "transitNote": "Watch for Jupiter transiting over these degrees...",
  "transitVerdict": "Supportive / Obstructive / Neutral / Unknown",
  "reason": "..."
}`
};

// ── ElevenLabs TTS ────────────────────────────────────────────────
async function generateSpeech(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '9375G6zswFk7v9bKTVQF';
  if (!apiKey) return null;

  try {
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.35,
          use_speaker_boost: true
        }
      })
    });

    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch {
    return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Anthropic API key not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { agent = 'orchestrator', question, chartData, tts = false } = body;

  // TTS-only mode (for greeting)
  if (agent === 'tts_only' && tts) {
    const audio = await generateSpeech(question); // question field holds the text to speak
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio })
    };
  }

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'You are a KP Astrology expert agent. Always respond in strict JSON as instructed. No markdown, no backticks, no preamble.',
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

    // Generate ElevenLabs audio for the final answer if requested
    let audio = null;
    if (tts && parsed.finalAnswer) {
      const spokenText = `${parsed.finalAnswer} Promise is ${parsed.promise || 'unclear'}. Timing looks ${parsed.timingVerdict || 'uncertain'}.`;
      audio = await generateSpeech(spokenText);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, result: parsed, audio })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
