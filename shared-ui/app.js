(function () {
  const $ = (s) => document.querySelector(s);
  const cfg = window.APP_CONFIG || {};
  const AGENTS = window.AGENTS || [];
  const nat = window.native || null;           // Electron (preload)
  const droid = window.AndroidBridge || null;  // Android (WebView)
  const platform = nat ? 'desktop' : droid ? 'android' : 'web';
  document.body.classList.add(platform);

  const base = (cfg.workerUrl || '').replace(/\/$/, '');
  const msgs = $('#msgs'), input = $('#input'), sel = $('#agent');
  let agent = AGENTS[0], history = [];
  let screenOn = false, micOn = false, busy = false, speaking = false;
  let soundOn = cfg.voiceOut !== 'off';

  /* ---------- Interfaz ---------- */
  function addMsg(role, text) {
    const d = document.createElement('div');
    d.className = 'msg ' + role;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }
  function renderChips() {
    const c = $('#chips');
    c.innerHTML = '';
    (agent.suggested || []).forEach((q) => {
      const b = document.createElement('button');
      b.textContent = q;
      b.onclick = () => { c.innerHTML = ''; send(q); };
      c.appendChild(b);
    });
  }
  function applyAgent(a) {
    agent = a; history = []; msgs.innerHTML = '';
    document.documentElement.style.setProperty('--c1', a.color || '#2E7D32');
    document.documentElement.style.setProperty('--c2', a.accent || '#00ACC1');
    $('#title').textContent = a.name;
    $('#sub').textContent = a.specialty || '';
    addMsg('bot', a.greeting);
    renderChips();
  }
  if (!agent) { addMsg('err', 'No hay agentes cargados. Ejecutá scripts/build_config.py.'); return; }
  if (AGENTS.length > 1) {
    AGENTS.forEach((a) => sel.add(new Option(a.name, a.id)));
    sel.onchange = () => applyAgent(AGENTS.find((a) => a.id === sel.value));
  } else sel.style.display = 'none';
  applyAgent(agent);

  /* ---------- Burbuja (solo escritorio) ---------- */
  if (nat) {
    const bubble = $('#bubble');
    const setExpanded = (v) => { document.body.classList.toggle('collapsed', !v); nat.setExpanded(v); };
    $('#collapse').onclick = () => setExpanded(false);
    let down = null, moved = false;
    bubble.addEventListener('pointerdown', (e) => { down = { x: e.screenX, y: e.screenY }; moved = false; bubble.setPointerCapture(e.pointerId); });
    bubble.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.screenX - down.x, dy = e.screenY - down.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (moved) { nat.move(dx, dy); down = { x: e.screenX, y: e.screenY }; }
    });
    bubble.addEventListener('pointerup', () => { if (!moved) setExpanded(true); down = null; });
  } else {
    $('#collapse').style.display = 'none';
  }

  /* ---------- Pantalla ---------- */
  const eyeBtn = $('#eye');
  if (droid && !droid.hasScreen()) { eyeBtn.disabled = true; eyeBtn.title = 'Sin permiso de captura de pantalla'; eyeBtn.style.opacity = .4; }
  eyeBtn.onclick = () => {
    screenOn = !screenOn;
    eyeBtn.classList.toggle('on', screenOn);
    $('#eyebadge').hidden = !screenOn;
    addMsg('sys', screenOn
      ? '👁 Ahora puedo ver tu pantalla cada vez que me escribas o me hables. Apagalo cuando quieras.'
      : 'Dejé de ver tu pantalla.');
  };
  async function capture() {
    try {
      if (nat) return await nat.captureScreen();
      if (droid) return await new Promise((r) => setTimeout(() => r(droid.captureScreen()), 0));
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const v = document.createElement('video'); v.srcObject = s; await v.play();
      const k = Math.min(1, 1280 / v.videoWidth);
      const c = document.createElement('canvas'); c.width = v.videoWidth * k; c.height = v.videoHeight * k;
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
      s.getTracks().forEach((t) => t.stop());
      return c.toDataURL('image/jpeg', 0.7).split(',')[1];
    } catch (e) { return ''; }
  }

  /* ---------- Conversación ---------- */
  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    if (!base || base.startsWith('PEGAR')) { addMsg('err', 'Falta poner la URL del servidor (workerUrl) en config.json.'); return; }
    busy = true;
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    const wait = addMsg('bot', '…');
    try {
      const image = screenOn ? await capture() : '';
      const r = await fetch(base + '/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: agent.system, messages: history.slice(-12), image }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error del servidor');
      wait.textContent = d.text;
      history.push({ role: 'assistant', content: d.text });
      await speak(d.text);
    } catch (e) {
      wait.remove(); history.pop();
      addMsg('err', 'No pude responder: ' + e.message);
    } finally { busy = false; }
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const t = input.value; input.value = ''; send(t); } });
  $('#send').onclick = () => { const t = input.value; input.value = ''; send(t); };

  /* ---------- Voz de salida ---------- */
  $('#sound').onclick = () => { soundOn = !soundOn; $('#sound').textContent = soundOn ? '🔊' : '🔇'; if (!soundOn) speechSynthesis && speechSynthesis.cancel(); };
  function sysSpeak(t) {
    return new Promise((res) => {
      if (!window.speechSynthesis) return res();
      const u = new SpeechSynthesisUtterance(t); u.lang = 'es-AR';
      u.onend = u.onerror = () => res();
      speechSynthesis.speak(u);
    });
  }
  function playBlob(b) {
    return new Promise((res, rej) => { const a = new Audio(URL.createObjectURL(b)); a.onended = () => res(); a.onerror = () => rej(new Error('audio')); a.play().catch(rej); });
  }
  async function speak(text) {
    if (!soundOn) return;
    const clean = text.replace(/[*_`#>~]/g, '').replace(/\p{Extended_Pictographic}/gu, '').trim();
    if (!clean) return;
    speaking = true;
    try {
      if (cfg.voiceOut === 'elevenlabs') {
        const r = await fetch(base + '/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: clean }) });
        if (r.ok) { await playBlob(await r.blob()); return; }
      }
      await sysSpeak(clean);
    } catch (e) { await sysSpeak(clean); }
    finally { speaking = false; lastVoice = Date.now(); }
  }

  /* ---------- Voz de entrada (micrófono continuo con detección de silencio) ---------- */
  let stream, ac, an, buf, timer, rec, chunks, recStart, lastVoice = 0;
  const micBtn = $('#mic');
  async function startMic() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) { addMsg('err', 'No pude acceder al micrófono: ' + e.message); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    an = ac.createAnalyser(); an.fftSize = 1024;
    ac.createMediaStreamSource(stream).connect(an);
    buf = new Uint8Array(an.fftSize);
    micOn = true; micBtn.classList.add('on');
    addMsg('sys', '🎤 Te escucho. Hablá y hacé una pausa cuando termines.');
    timer = setInterval(tick, 80);
  }
  function stopMic() {
    micOn = false; micBtn.classList.remove('on');
    clearInterval(timer);
    if (rec && rec.state !== 'inactive') { rec.onstop = null; rec.stop(); }
    rec = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (ac) ac.close();
  }
  micBtn.onclick = () => (micOn ? stopMic() : startMic());
  function level() {
    an.getByteTimeDomainData(buf);
    let s = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
    return Math.sqrt(s / buf.length);
  }
  function tick() {
    if (!micOn) return;
    if (busy || speaking) { if (rec) { rec.onstop = null; if (rec.state !== 'inactive') rec.stop(); rec = null; } return; }
    const loud = level() > 0.03, now = Date.now();
    if (loud) {
      lastVoice = now;
      if (!rec) {
        chunks = []; recStart = now;
        rec = new MediaRecorder(stream);
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        rec.onstop = onRecStop;
        rec.start();
      }
    } else if (rec && now - lastVoice > 1300) {
      rec.stop();
    }
  }
  async function onRecStop() {
    const dur = Date.now() - recStart, mime = rec ? rec.mimeType : 'audio/webm';
    rec = null;
    if (dur < 700 || !chunks.length) return;
    try {
      busy = true;
      const r = await fetch(base + '/stt', { method: 'POST', headers: { 'Content-Type': mime || 'audio/webm' }, body: new Blob(chunks, { type: mime }) });
      const d = await r.json();
      busy = false;
      if (!r.ok) throw new Error(d.error || 'No se pudo transcribir');
      if (d.text && d.text.trim()) send(d.text);
    } catch (e) { busy = false; addMsg('err', 'Voz de entrada: ' + e.message); }
  }
})();
