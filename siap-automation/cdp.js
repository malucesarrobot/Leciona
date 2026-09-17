/* Cliente CDP mínimo via WebSocket nativo do Node — bypassa o Playwright de propósito.
   O `chromium.connectOverCDP()` do Playwright trava no handshake com o Chrome usado
   nesta automação (build 150.x); o protocolo CDP puro (fetch + WebSocket nativo)
   funciona normalmente. Não trocar de volta pro Playwright sem antes testar se o
   travamento ainda acontece.

   Uso básico:
     const cdp = require('./cdp.js');
     const c = await cdp.connect();          // acha a aba do SIAP já aberta e conecta
     await cdp.evaluate(c, 'document.title'); // roda JS na página, devolve o valor
     await cdp.click(c, '#algumBotao');       // clique sintético (funciona em <input type=submit>)
     await cdp.realClick(c, 'td[data-canonica="2026/9/15"]'); // clique de mouse de verdade
     await cdp.close(c);

   Pré-requisito: Chrome aberto com --remote-debugging-port=9222, com uma aba
   logada em https://siap.educacao.go.gov.br (login manual da professora, esta
   automação nunca vê a senha). Ver README.md nesta pasta pro comando exato. */

async function findSiapTarget() {
  const res = await fetch('http://localhost:9222/json/list');
  const list = await res.json();
  const t = list.find(x => x.type === 'page' && x.url.includes('siap.educacao.go.gov.br'));
  if (!t) throw new Error('Aba do SIAP não encontrada — confirme que o Chrome de automação está aberto e logado (ver README.md)');
  return t;
}

async function connect() {
  const verRes = await fetch('http://localhost:9222/json/version');
  const ver = await verRes.json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 1;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };
  function send(method, params, sessionId) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      pending.set(reqId, { resolve, reject });
      const payload = { id: reqId, method, params: params || {} };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
      setTimeout(() => { if (pending.has(reqId)) { pending.delete(reqId); reject(new Error('CDP timeout: ' + method)); } }, 45000);
    });
  }
  const target = await findSiapTarget();
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.id, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  return { ws, send, sessionId };
}

async function evaluate(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, cdp.sessionId);
  if (r.exceptionDetails) throw new Error('JS error: ' + JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

async function click(cdp, selector) {
  return evaluate(cdp, `(function(){ const el = document.querySelector(${JSON.stringify(selector)}); if(!el) return 'NOTFOUND'; el.click(); return 'OK'; })()`);
}

async function fill(cdp, selector, value) {
  return evaluate(cdp, `(function(){ const el = document.querySelector(${JSON.stringify(selector)}); if(!el) return 'NOTFOUND'; el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return 'OK'; })()`);
}

async function waitMs(ms) { return new Promise(r => setTimeout(r, ms)); }

async function close(cdp) { cdp.ws.close(); }

/* Clique de mouse "de verdade" via coordenadas (Input.dispatchMouseEvent).
   NECESSÁRIO pras células do calendário (`td[data-canonica]`) — elas não respondem
   a `.click()` sintético via DOM (mecanismo de binding delas exige um evento de
   mouse real, diferente dos botões normais `<input type=submit>`, que funcionam
   com `click()` comum). Descoberto depois de várias horas de estado
   client-side "grudado" na data errada — se voltar a acontecer isso, é essa a causa. */
async function realClick(cdp, selector) {
  const rect = await evaluate(cdp, `(function(){ const el = document.querySelector(${JSON.stringify(selector)}); if(!el) return null; el.scrollIntoView({block:'center', behavior:'instant'}); const r = el.getBoundingClientRect(); return {x: r.x + r.width/2, y: r.y + r.height/2}; })()`);
  if (!rect) return 'NOTFOUND';
  await waitMs(80);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y }, cdp.sessionId);
  await waitMs(30);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 }, cdp.sessionId);
  await waitMs(30);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 }, cdp.sessionId);
  return 'OK';
}

/* Clica e CONFIRMA que o atributo mudou pro valor esperado antes de seguir,
   tentando de novo se não mudou (o clique de calendário às vezes falha
   silenciosamente sob uso intenso — nunca prosseguir sem confirmar). */
async function clickAndVerify(cdp, selector, attrCheck, expectedAfter, maxTries) {
  maxTries = maxTries || 4;
  for (let i = 0; i < maxTries; i++) {
    await realClick(cdp, selector);
    await waitMs(350);
    const after = await evaluate(cdp, `document.querySelector(${JSON.stringify(selector)})?.getAttribute(${JSON.stringify(attrCheck)})`);
    if (after === expectedAfter) return true;
    await waitMs(300);
  }
  return false;
}

module.exports = { connect, evaluate, click, fill, waitMs, close, realClick, clickAndVerify };
