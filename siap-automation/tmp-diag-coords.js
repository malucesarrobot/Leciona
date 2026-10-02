const cdp = require('./cdp.js');
async function main() {
  const c = await cdp.connect();
  const mat = '26129970400';
  const sel = `.item.recuperacao.nota[data-matricula="${mat}"] input`;
  const info = await cdp.evaluate(c, `(function(){
    var el = document.querySelector('${sel}');
    el.scrollIntoView({block:'center'});
    var r = el.getBoundingClientRect();
    var x = r.x + r.width/2;
    var y = r.y + r.height/2;
    var atPoint = document.elementFromPoint(x, y);
    return JSON.stringify({
      rect: {x:r.x, y:r.y, w:r.width, h:r.height},
      clickX: x, clickY: y,
      elementAtPoint: atPoint ? atPoint.tagName + '.' + atPoint.className : 'NULL',
      devicePixelRatio: window.devicePixelRatio,
      innerW: window.innerWidth, innerH: window.innerHeight,
      scrollX: window.scrollX, scrollY: window.scrollY
    });
  })()`);
  console.log(info);
  const metrics = await c.send('Page.getLayoutMetrics', {}, c.sessionId).catch(e => 'erro: ' + e.message);
  console.log('layoutMetrics:', JSON.stringify(metrics));
}
main().catch(e => { console.error(e.message); process.exit(1); });
