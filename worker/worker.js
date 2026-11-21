// Servidor intermedio (Cloudflare Worker). Guarda las claves; la app nunca las lleva.
// Secretos: ANTHROPIC_API_KEY (obligatorio), ELEVENLABS_API_KEY (opcional: transcripción y voz natural).
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const path = new URL(req.url).pathname;
    try {
      if (req.method === 'GET') return json({ ok: true, servicio: 'agente-flotante' });
      if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
      if (path === '/chat') return await chat(req, env);
      if (path === '/stt') return await stt(req, env);
      if (path === '/tts') return await tts(req, env);
      return json({ error: 'Ruta desconocida' }, 404);
    } catch (e) {
      return json({ error: 'Error interno: ' + e.message }, 500);
    }
  },
};

async function chat(req, env) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'Falta el secreto ANTHROPIC_API_KEY en el Worker' }, 500);
  const b = await req.json();
  if (!Array.isArray(b.messages) || !b.messages.length) return json({ error: 'Sin mensajes' }, 400);
  const messages = b.messages.slice(-14).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content).slice(0, 4000),
  }));
  if (messages[0].role !== 'user') messages.shift();
  const last = messages[messages.length - 1];
  if (b.image && typeof b.image === 'string' && b.image.length < 3_000_000 && last.role === 'user') {
    last.content = [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b.image } },
      { type: 'text', text: last.content },
    ];
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env.MODEL || 'claude-sonnet-5-5',
      max_tokens: 600,
      system: String(b.system || '').slice(0, 80000),
      messages,
    }),
  });
  const d = await r.json();
  if (!r.ok) return json({ error: (d.error && d.error.message) || 'Error de Anthropic' }, 502);
  const text = (d.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
  return json({ text });
}

async function stt(req, env) {
  if (!env.ELEVENLABS_API_KEY) return json({ error: 'La entrada por voz necesita el secreto ELEVENLABS_API_KEY' }, 501);
  const audio = await req.arrayBuffer();
  if (audio.byteLength > 5_000_000) return json({ error: 'Audio demasiado largo' }, 413);
  const fd = new FormData();
  fd.append('model_id', 'scribe_v1');
  fd.append('language_code', 'spa');
  fd.append('file', new Blob([audio], { type: req.headers.get('content-type') || 'audio/webm' }), 'voz.webm');
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST', headers: { 'xi-api-key': env.ELEVENLABS_API_KEY }, body: fd,
  });
  const d = await r.json();
  if (!r.ok) return json({ error: 'ElevenLabs: ' + JSON.stringify(d.detail || d).slice(0, 200) }, 502);
  return json({ text: d.text || '' });
}

async function tts(req, env) {
  if (!env.ELEVENLABS_API_KEY) return json({ error: 'La voz natural necesita el secreto ELEVENLABS_API_KEY' }, 501);
  const { text } = await req.json();
  const voz = env.VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ text: String(text).slice(0, 1500), model_id: 'eleven_multilingual_v2' }),
  });
  if (!r.ok) return json({ error: 'ElevenLabs TTS falló (' + r.status + ')' }, 502);
  return new Response(r.body, { headers: { ...CORS, 'Content-Type': 'audio/mpeg' } });
}
