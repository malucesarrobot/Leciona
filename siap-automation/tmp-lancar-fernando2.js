const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const mat = '26129970400';
  const sel = `.item.recuperacao.nota[data-matricula="${mat}"] input`;
  await cdp.evaluate(c, `document.querySelector('${sel}').focus()`);
  await cdp.waitMs(300);
  const before = await cdp.evaluate(c, `document.querySelector('${sel}').value`);
  console.log('antes:', JSON.stringify(before));
  for (const ch of ['9', '0']) {
    await c.send('Input.dispatchKeyEvent', { type: 'char', text: ch }, c.sessionId);
    await cdp.waitMs(400);
    const v = await cdp.evaluate(c, `document.querySelector('${sel}').value`);
    console.log('apos char', ch, ':', JSON.stringify(v));
  }
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 9, key: 'Tab' }, c.sessionId);
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, key: 'Tab' }, c.sessionId);
  await cdp.waitMs(1500);
  const vfinal = await cdp.evaluate(c, `document.querySelector('${sel}').value`);
  console.log('final apos Tab:', JSON.stringify(vfinal));
}
main().catch(e => { console.error(e.message); process.exit(1); });
