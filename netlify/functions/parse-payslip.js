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

    const PROMPT = `You are reading an Indian employee payslip. Extract salary figures and return ONLY a JSON object — no markdown, no explanation.

Look for these values (all monthly, in INR numbers only, no commas, no symbols):
- basic: Basic Pay / Basic Salary
- hra: House Rent Allowance / HRA
- special: ALL other allowances added together (Supplementary, Special, Conveyance, LTA, Medical, etc.)
- grossEarnings: Total Earnings / Gross Pay (the total before deductions)
- netPay: Net Pay / Take Home / In-hand amount
- pf: Employee PF / Provident Fund deduction
- profTax: Professional Tax
- tds: Income Tax / TDS deducted this month

Rules:
- If Performance Pay or variable pay is shown separately, include it in special
- Use null for any field you cannot find
- Return ONLY this JSON: {"basic":null,"hra":null,"special":null,"grossEarnings":null,"netPay":null,"pf":null,"profTax":null,"tds":null}`;

    const msgContent = mediaType === 'application/pdf'
      ? [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
          { type: 'text', text: PROMPT }
        ]
      : [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: PROMPT }
        ];

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

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    // Validate it's parseable JSON
    JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: clean,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
