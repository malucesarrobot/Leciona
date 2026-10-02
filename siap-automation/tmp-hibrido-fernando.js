const cdp = require('./cdp.js');
const nav = require('./nav.js');

async function main() {
  const c = await cdp.connect();
  await nav.navigateToNotas(c, nav.SERIE['1'], '1A', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3500);
  const c2 = await cdp.connect();
  console.log('url:', await cdp.evaluate(c2, 'location.href'));

  const mat = '26129970400';
  const sel = `.item.recuperacao.nota[data-matricula="${mat}"] input`;

  // dispara mousedown/mouseup/click sinteticos direto no elemento (sem depender de coordenada de tela)
  await cdp.evaluate(c2, `(function(){
    var el = document.querySelector('${sel}');
    el.scrollIntoView({block:'center'});
    ['mousedown','mouseup','click'].forEach(function(t){
      el.dispatchEvent(new MouseEvent(t, {bubbles:true, cancelable:true, view:window}));
    });
    el.focus();
  })()`);
  await cdp.waitMs(300);
  const focado = await cdp.evaluate(c2, `(function(){
    var a = document.activeElement;
    return a.closest('.item.recuperacao.nota') ? a.closest('.item.recuperacao.nota').getAttribute('data-matricula') : 'FORA';
  })()`);
  console.log('focado:', focado);

  for (const ch of ['9', '0']) {
    await c2.send('Input.dispatchKeyEvent', { type: 'char', text: ch }, c2.sessionId);
    await cdp.waitMs(300);
    const v = await cdp.evaluate(c2, `document.querySelector('${sel}').value`);
    console.log('apos', ch, ':', JSON.stringify(v));
  }
  await c2.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, key: 'Tab' }, c2.sessionId);
  await c2.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, key: 'Tab' }, c2.sessionId);
  await cdp.waitMs(1500);
  const vfinal = await cdp.evaluate(c2, `document.querySelector('${sel}').value`);
  console.log('final:', JSON.stringify(vfinal));

  // confirma persistencia com reload real
  const c3 = await cdp.connect();
  await nav.navigateToNotas(c3, nav.SERIE['1'], '1A', nav.DISCIPLINA.Historia);
  await cdp.waitMs(3500);
  const c4 = await cdp.connect();
  let persistido = 'NAO-ACHOU';
  for (let i = 0; i < 8; i++) {
    persistido = await cdp.evaluate(c4, `(function(){
      var el = document.querySelector('.item.recuperacao.nota[data-matricula="${mat}"]');
      return el ? el.getAttribute('data-nota') : 'NAO-ACHOU';
    })()`);
    if (persistido !== 'NAO-ACHOU') break;
    await cdp.waitMs(500);
  }
  console.log('PERSISTIDO apos reload:', persistido);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
