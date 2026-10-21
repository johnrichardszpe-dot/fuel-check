const F = require('./logic.js'); const assert = require('assert'); const eq = assert.strictEqual;
// Table 7.1 transcribed independently as text rows, exactly as printed in the guide (page 34)
const t71 = `L L M H VH
M M H VH E
H VH VH VH E
VH VH E E E
E E E E E`.split('\n').map(r => r.split(' '));
F.RATINGS.forEach((s, i) => F.RATINGS.forEach((n, j) => eq(F.combineSurfaceNS(s, n), t71[i][j], `T7.1 surface ${s} near-surface ${n}`)));
// Table 8.1 as printed (page 35): 15 rows = bark group (LM, H, VE) x elevated (L..E); columns = combined L..E
const t81 = `L M M H H
L M M H H
L M H VH VH
VH VH VH VH VH
E E E E E
L M H H H
L M H H H
L H H VH VH
VH VH VH VH E
E E E E E
L VH VH VH E
M VH VH E E
M VH E E E
E E E E E
E E E E E`.split('\n').map(r => r.split(' '));
const barks = [['L', 'M'], ['H'], ['VH', 'E']];
barks.forEach((grp, g) => grp.forEach(b => F.RATINGS.forEach((el, i) => F.RATINGS.forEach((c, j) =>
  eq(F.overallFromCombined(b, el, c), t81[g * 5 + i][j], `T8.1 bark ${b} elevated ${el} combined ${c}`)))));
// Monotonic: raising any one layer never lowers the overall rating
const ix = r => F.RATINGS.indexOf(r); let combos = 0;
for (const s of F.RATINGS) for (const n of F.RATINGS) for (const e of F.RATINGS) for (const b of F.RATINGS) {
  const o = ix(F.overall({ surface: s, ns: n, elev: e, bark: b }).overall); combos++;
  for (const k of ['surface', 'ns', 'elev', 'bark']) {
    const L = { surface: s, ns: n, elev: e, bark: b }; if (L[k] === 'E') continue;
    L[k] = F.RATINGS[ix(L[k]) + 1]; assert(ix(F.overall(L).overall) >= o, `monotonic ${JSON.stringify(L)}`);
  }
}
eq(combos, 625);
// Worked example: guide cover photo (Bark E, Elevated M, Near-surface L, Surface VH => Overall E)
const cover = F.overall({ surface: 'VH', ns: 'L', elev: 'M', bark: 'E' }); eq(cover.combined, 'VH'); eq(cover.overall, 'E');
eq(F.overall({ surface: 'L', ns: 'L', elev: 'L', bark: 'L' }).overall, 'L');
eq(F.overall({ surface: 'M', ns: 'M', elev: 'L', bark: 'M' }).overall, 'M');
eq(F.overall({ surface: 'H', ns: 'M', elev: 'M', bark: 'H' }).combined, 'VH');
eq(F.overall({ surface: 'H', ns: 'M', elev: 'M', bark: 'H' }).overall, 'H');
eq(F.overall({ surface: 'H', ns: 'M', elev: 'M' }), null, 'incomplete');
assert.throws(() => F.combineSurfaceNS('X', 'L'));
// Bark types allowed
assert.deepStrictEqual(F.BARK_TYPES.fibrous, ['M', 'H', 'VH', 'E']); assert.deepStrictEqual(F.BARK_TYPES.ribbon, ['M', 'H', 'VH']); assert.deepStrictEqual(F.BARK_TYPES.other, ['L', 'M', 'H']);
// Hints
eq(F.hint('litterDepth', 5), 'L'); eq(F.hint('litterDepth', 15), 'M'); eq(F.hint('litterDepth', 25), 'H'); eq(F.hint('litterDepth', 30), 'VH'); eq(F.hint('litterDepth', 50), 'E');
eq(F.hint('surfaceCover', 50), 'L'); eq(F.hint('surfaceCover', 85), 'H'); eq(F.hint('surfaceCover', 97), 'E');
eq(F.hint('nsCover', 5), 'L'); eq(F.hint('nsCover', 30), 'H'); eq(F.hint('nsCover', 70), 'E');
eq(F.hint('elevCover', 25), 'M'); eq(F.hint('elevCover', 60), 'VH'); eq(F.hint('elevCover', ''), null);
// Indicative loads (Table 9.2)
assert.deepStrictEqual(F.indicativeLoad({ surface: 'L', ns: 'L', elev: 'L', bark: 'L' }), { min: 3, max: 7, plus: false });
assert.deepStrictEqual(F.indicativeLoad({ surface: 'E', ns: 'E', elev: 'E', bark: 'E' }), { min: 34, max: 43, plus: true });
// CSV
const db = { sites: [{ id: 's', name: 'Bush block, east', veg: 'forest', lat: -32.1, lon: 116.0, acc: 7.4, notes: 'x' }],
  checks: [{ id: 'c', siteId: 's', date: '2026-10-21T04:00:00.000Z', notes: 'dry "windy"', layers: { surface: 'H', depth: 24, ns: 'M', elev: 'M', barkType: 'fibrous', bark: 'H' } }],
  photos: [{ checkId: 'c' }, { checkId: 'c' }] };
const lines = F.toCSV(db).trim().split('\r\n'); eq(lines.length, 2);
assert(lines[1].startsWith('"Bush block, east",forest,-32.1,116,7,2026-10-21T04:00:00.000Z'), lines[1]);
assert(lines[1].includes(',H,24,,M,,M,,fibrous,H,VH,H,13-21,2,x,"dry ""windy"""'), lines[1]);
eq(F.compassWord(350), 'N'); eq(Math.round(F.cameraHeading(90, 90, 0)), 270);
console.log('All Fuel Check tests passed (' + combos + ' layer combinations checked)');
