const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const mat = '26129970400';
  const sel = `.item.recuperacao.nota[data-matricula="${mat}"] input`;
  const rect = await cdp.evaluate(c, `(function(){
    var el=document.querySelector('${sel}');
    if(!el) return null;
    el.scrollIntoView({block:'center'});
    var r=el.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});
  })()`);
  console.log('rect:', rect);
  const { x, y } = JSON.parse(rect);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, c.sessionId);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 3 }, c.sessionId);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 3 }, c.sessionId);
  await cdp.waitMs(300);
  const active = await cdp.evaluate(c, `(function(){
    var a = document.activeElement;
    return JSON.stringify({tag:a.tagName, matricula: a.closest('.item.recuperacao.nota') ? a.closest('.item.recuperacao.nota').getAttribute('data-matricula') : 'FORA'});
  })()`);
  console.log('focado apos clique:', active);
  for (let i = 0; i < 8; i++) {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 8, key: 'Backspace' }, c.sessionId);
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 8, key: 'Backspace' }, c.sessionId);
    await cdp.waitMs(100);
  }
  const vclear = await cdp.evaluate(c, `document.querySelector('${sel}').value`);
  console.log('limpo:', JSON.stringify(vclear));
  for (const ch of ['9', '0']) {
    await c.send('Input.dispatchKeyEvent', { type: 'char', text: ch }, c.sessionId);
    await cdp.waitMs(250);
    const v = await cdp.evaluate(c, `document.querySelector('${sel}').value`);
    console.log('apos', ch, ':', JSON.stringify(v));
  }
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, key: 'Tab' }, c.sessionId);
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, key: 'Tab' }, c.sessionId);
  await cdp.waitMs(1500);
  const vfinal = await cdp.evaluate(c, `document.querySelector('${sel}').value`);
  console.log('final:', JSON.stringify(vfinal));
}
main().catch(e => { console.error(e.message); process.exit(1); });
