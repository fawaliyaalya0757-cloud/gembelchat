/**
 * GROQ.CHAT — Cloudflare Worker Proxy
 * 
 * Setup:
 * 1. Deploy file ini ke Cloudflare Workers
 * 2. Di dashboard Workers, tambah Environment Variable:
 *    GROQ_API_KEY = sk-xxxxxxxxxxxx (key Groq kamu)
 * 3. Copy URL worker kamu, paste ke index.html di variabel WORKER_URL
 */

const ALLOWED_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only allow POST to /chat
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // Check API key exists
    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    const { messages, model = 'llama-3.3-70b-versatile', system } = body;

    // Validate
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
    if (!ALLOWED_MODELS.includes(model)) {
      return new Response(JSON.stringify({ error: 'Model not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // Build messages with optional system prompt
    const finalMessages = system
      ? [{ role: 'system', content: String(system).slice(0, 500) }, ...messages]
      : messages;

    // Limit history to last 20 messages to save tokens
    const trimmed = finalMessages.slice(-20);

    // Forward to Groq
    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model,
        messages: trimmed,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!groqResp.ok) {
      const err = await groqResp.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: err.error?.message || 'Groq error' }), {
        status: groqResp.status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // Stream response back to client
    return new Response(groqResp.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...CORS_HEADERS,
      },
    });
  }
};
