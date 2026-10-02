const cdp = require('./cdp.js');

async function preencherRecuperacao(c, matricula, valorTexto) {
  const sel = `.item.recuperacao.nota[data-matricula="${matricula}"] input`;
  // Page.bringToFront é obrigatório antes do clique — sem isso, em sessão CDP
  // longa, o clique "acerta" as coordenadas certas (confirmado via
  // elementFromPoint) mas o foco real nunca muda pro campo, e digitar não
  // salva nada (descoberto 29/09, depois de muita depuração).
  await c.send('Page.bringToFront', {}, c.sessionId).catch(() => {});
  await cdp.waitMs(300);
  const rect = await cdp.evaluate(c, `(function(){ var el=document.querySelector('${sel}'); if(!el) return null; el.scrollIntoView({block:'center'}); var r=el.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2}); })()`);
  if (!rect) return { matricula, status: 'CAMPO-NAO-ACHADO' };
  const { x, y } = JSON.parse(rect);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, c.sessionId);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 3 }, c.sessionId);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 3 }, c.sessionId);
  await cdp.waitMs(200);
  for (let i = 0; i < 8; i++) {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 8, key: 'Backspace' }, c.sessionId);
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 8, key: 'Backspace' }, c.sessionId);
    await cdp.waitMs(90);
  }
  for (const ch of valorTexto.replace(',', '')) {
    await c.send('Input.dispatchKeyEvent', { type: 'char', text: ch }, c.sessionId);
    await cdp.waitMs(180);
  }
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, key: 'Tab' }, c.sessionId);
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, key: 'Tab' }, c.sessionId);
  await cdp.waitMs(1000);
  const valorFinal = await cdp.evaluate(c, `document.querySelector('${sel}').value`);
  return { matricula, status: 'OK', valorFinal };
}

module.exports = { preencherRecuperacao };
