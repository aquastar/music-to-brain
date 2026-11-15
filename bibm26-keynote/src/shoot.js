const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file:///home/user/music-to-brain/bibm26-keynote/index.html');
  await p.waitForTimeout(1500);
  const n = await p.evaluate(() => Reveal.getTotalSlides());
  const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  for (let i = 0; i < n; i++) {
    if (only && !only.includes(i)) continue;
    await p.evaluate(i => { Reveal.slide(i); const s=Reveal.getCurrentSlide(); s.querySelectorAll('.fragment').forEach(f=>f.classList.add('visible')); }, i);
    await p.waitForTimeout(i===0?2500:350);
    await p.screenshot({ path: process.env.OUT + `/s${String(i).padStart(2,'0')}.png` });
  }
  // overlap check: any element bottom below the ref top, or below 690
  const issues = [];
  for (let i = 0; i < n; i++) {
    const r = await p.evaluate(i => { Reveal.slide(i); const s=Reveal.getCurrentSlide(); s.querySelectorAll('.fragment').forEach(f=>f.classList.add('visible'));
      const sb=s.getBoundingClientRect(); const ref=s.querySelector('.ref'); const lim = ref? ref.getBoundingClientRect().top-12 : sb.top+700;
      const bad=[]; s.querySelectorAll('h2,p,li,img,svg.fig,.people,.photos,iframe,.audio-row').forEach(e=>{ if(e.closest('.ref')||e.closest('aside'))return; const r=e.getBoundingClientRect(); if(r.height===0)return; if(r.bottom>lim+0.5||r.right>sb.left+1280) bad.push(e.tagName+(e.className&&e.className.baseVal!==undefined?'.'+e.className.baseVal:'.'+e.className)+' '+Math.round(r.bottom-sb.top)+'/'+Math.round(lim-sb.top)+' w'+Math.round(r.right-sb.left));});
      return bad; }, i);
    if (r.length) issues.push(i + ': ' + r.join(' | '));
  }
  console.log(issues.join('\n') || 'no overflow');
  await b.close();
})();
