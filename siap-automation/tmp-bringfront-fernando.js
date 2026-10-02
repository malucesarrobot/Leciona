const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  await c.send('Page.bringToFront', {}, c.sessionId);
  await cdp.waitMs(500);
  const mat = '26129970400';
  const sel = `.item.recuperacao.nota[data-matricula="${mat}"] input`;
  const rect = await cdp.evaluate(c, `(function(){
    var el=document.querySelector('${sel}');
    el.scrollIntoView({block:'center'});
    var r=el.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});
  })()`);
  const { x, y } = JSON.parse(rect);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, c.sessionId);
  await cdp.waitMs(50);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, c.sessionId);
  await cdp.waitMs(50);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, c.sessionId);
  await cdp.waitMs(300);
  const focado = await cdp.evaluate(c, `(function(){
    var a = document.activeElement;
    return a.closest('.item.recuperacao.nota') ? a.closest('.item.recuperacao.nota').getAttribute('data-matricula') : ('FORA:' + a.tagName);
  })()`);
  console.log('focado apos bringToFront + clique:', focado);
}
main().catch(e => { console.error(e.message); process.exit(1); });
