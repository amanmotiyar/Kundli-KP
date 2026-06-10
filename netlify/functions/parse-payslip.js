// Netlify serverless function — proxies payslip PDF/image to Anthropic API
// API key stored as Netlify env var: ANTHROPIC_API_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    const { mediaType, base64Data } = JSON.parse(event.body);

    const PROMPT = 'You are reading an Indian employee payslip. Extract ONLY the following monthly figures and return a JSON object with no markdown, no explanation, no backticks. Fields (monthly INR numbers only, no commas, no rupee symbol): basic (Basic Pay), hra (House Rent Allowance), special (Supplementary/Special Allowance + all other allowances combined), pf (Employee PF / Provident Fund deduction), profTax (Professional Tax monthly), tds (Income Tax deducted this month). If not found use null. Return exactly: {"basic":number|null,"hra":number|null,"special":number|null,"pf":number|null,"profTax":number|null,"tds":number|null}';

    const msgContent = mediaType === 'application/pdf'
      ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } }, { type: 'text', text: PROMPT }]
      : [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } }, { type: 'text', text: PROMPT }];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: msgContent }],
      }),
    });

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: clean,
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
