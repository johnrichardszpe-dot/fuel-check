const puppeteer = require(process.env.PUPPETEER || 'puppeteer-core');
const URL = process.argv[2] || 'http://localhost:8766/'; const SHOT = process.argv[3];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await b.createBrowserContext(); const pg = await ctx.newPage();
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [], bad = [];
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  pg.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  pg.on('dialog', d => d.accept());
  await ctx.overridePermissions(new globalThis.URL(URL).origin, ['geolocation']);
  await pg.goto(URL, { waitUntil: 'networkidle0' });
  await pg.setGeolocation({ latitude: -31.9523, longitude: 116.0812, accuracy: 7 });
  await pg.evaluate(() => navigator.serviceWorker.ready);
  const W = ms => new Promise(r => setTimeout(r, ms));
  const click = async s => { await pg.waitForSelector(s); await pg.click(s); await W(200); };
  await click('a[href="#site-edit/new"]');
  await pg.type('[name=name]', 'Bush block, east side'); await pg.select('[name=veg]', 'woodland');
  await click('#bGps'); await W(1500); const gpsTxt = await pg.$eval('#gpsTxt', e => e.textContent);
  await click('button[type=submit]');
  await click('#bNew');
  // step 1 surface
  await click('.rc[data-r=H]'); await pg.evaluate(() => document.querySelector('details').open = true);
  await pg.type('#iDepth', '24'); await pg.type('#iCover', '85'); const hint = await pg.$eval('#hint', e => e.textContent);
  await click('a[href$="/surface"]'); await W(1500); await click('#snap'); await W(1200);
  const photoBtn = await pg.$eval('a[href$="/surface"]', e => e.textContent);
  await W(2800); await pg.evaluate(() => scrollTo(0, 330));
  if (SHOT) await pg.screenshot({ path: SHOT.replace('.png', '-step.png') });
  await click('#bNext');
  await click('.rc[data-r=M]'); await click('#bNext');   // near-surface
  await click('.rc[data-r=M]'); await click('#bNext');   // elevated
  const disabledFib = await pg.$$eval('.rc:disabled', e => e.map(x => x.dataset.r));
  await click('input[name=bt][value=ribbon]'); const disabledRib = await pg.$$eval('.rc:disabled', e => e.map(x => x.dataset.r));
  await click('input[name=bt][value=fibrous]');
  await click('.rc[data-r=VH]'); await click('#bNext');
  const big = await pg.$eval('.big-r b', e => e.textContent); const chips = await pg.$$eval('.lt .chip', e => e.map(x => x.textContent));
  const load = await pg.$eval('.card p b', e => e.textContent);
  if (SHOT) await pg.screenshot({ path: SHOT });
  await pg.type('[name=notes]', 'Dry, no burn for 8 yrs'); await click('button[type=submit]');
  const csv = await pg.evaluate(() => FC.toCSV(FCApp.DB));
  const items = await pg.$$eval('.item b', e => e.map(x => x.textContent));
  await pg.setOfflineMode(true); await pg.goto(URL + '#', { waitUntil: 'load' }); await W(800);
  const off = await pg.$$eval('.item b', e => e.map(x => x.textContent)); const offChip = await pg.$$eval('.item .chip', e => e.map(x => x.textContent));
  await pg.goto(URL + '#about', { waitUntil: 'load' }); await W(400); const aboutOk = await pg.$eval('main', e => e.textContent.includes('Hines'));
  await pg.setOfflineMode(false);
  console.log(JSON.stringify({ errs, bad, gpsTxt, hint, photoBtn, disabledFib, disabledRib, big, chips, load, items, csv: csv.split('\r\n').slice(0, 2), offline: off, offChip, aboutOk }, null, 1));
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
