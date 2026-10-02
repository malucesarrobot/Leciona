const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function tentarLancar(c, mat, valor) {
  const sel = `.item.recuperacao.nota[data-matricula="${mat}"] input`;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const rect = await cdp.evaluate(c, `(function(){
      var el=document.querySelector('${sel}');
      if(!el) return null;
      el.scrollIntoView({block:'center', behavior:'instant'});
      var r=el.getBoundingClientRect();
      return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});
    })()`);
    if (!rect) { console.log('tentativa', tentativa, ': campo nao existe'); await cdp.waitMs(500); continue; }
    const { x, y } = JSON.parse(rect);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, c.sessionId);
    await cdp.waitMs(50);
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, c.sessionId);
    await cdp.waitMs(50);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, c.sessionId);
    await cdp.waitMs(250);
    const focado = await cdp.evaluate(c, `(function(){
      var a = document.activeElement;
      return a.closest('.item.recuperacao.nota') ? a.closest('.item.recuperacao.nota').getAttribute('data-matricula') : 'FORA';
    })()`);
    console.log('tentativa', tentativa, '- focado:', focado);
    if (focado !== mat) { await cdp.waitMs(400); continue; }

    const chars = valor.replace(',', '').split('');
    for (const ch of chars) {
      await c.send('Input.dispatchKeyEvent', { type: 'char', text: ch }, c.sessionId);
      await cdp.waitMs(250);
    }
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, key: 'Tab' }, c.sessionId);
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, key: 'Tab' }, c.sessionId);
    await cdp.waitMs(1500);
    const vfinal = await cdp.evaluate(c, `document.querySelector('${sel}').value`);
    console.log('tentativa', tentativa, '- valor apos digitar+Tab:', JSON.stringify(vfinal));
    if (vfinal === valor) return true;
  }
  return false;
}

async function main() {
  const c = await cdp.connect();
  await nav.navigateToNotas(c, nav.SERIE['1'], '1A', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3500);
  const c2 = await cdp.connect();
  console.log('url:', await cdp.evaluate(c2, 'location.href'));

  const ok = await tentarLancar(c2, '26129970400', '9,0');
  console.log('resultado tentarLancar:', ok);

  // confirma via nova navegacao (persistencia real)
  const c3 = await cdp.connect();
  await nav.navigateToNotas(c3, nav.SERIE['1'], '1A', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3500);
  const c4 = await cdp.connect();
  let persistido = 'NAO-ACHOU';
  for (let i = 0; i < 8; i++) {
    persistido = await cdp.evaluate(c4, `(function(){
      var el = document.querySelector('.item.recuperacao.nota[data-matricula="26129970400"]');
      return el ? el.getAttribute('data-nota') : 'NAO-ACHOU';
    })()`);
    if (persistido !== 'NAO-ACHOU') break;
    await cdp.waitMs(500);
  }
  console.log('PERSISTIDO (apos reload real):', persistido);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
