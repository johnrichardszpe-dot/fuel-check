/* Fuel Check - rating rules and data helpers, shared by the app and the node tests.
   Combination tables are from: Hines F, Tolhurst KG, Wilson AAG, McCarthy GJ (2010)
   Overall Fuel Hazard Assessment Guide, 4th edition. Fire and adaptive management report no. 82,
   Victorian Government Department of Sustainability and Environment, Melbourne.
   Table 7.1 (combined surface + near-surface) and Table 8.1 (Overall Fuel Hazard) copied cell by cell
   from the PDF and checked by the node tests. */
(function (root) {
  'use strict';
  var R = ['L', 'M', 'H', 'VH', 'E'];            // Low, Moderate, High, Very High, Extreme
  function idx(r) { var i = R.indexOf(r); if (i < 0) throw new Error('bad rating ' + r); return i; }

  // Table 7.1: rows = surface rating, columns = near-surface rating (L M H VH E)
  var T71 = {
    L:  ['L', 'L', 'M', 'H', 'VH'],
    M:  ['M', 'M', 'H', 'VH', 'E'],
    H:  ['H', 'VH', 'VH', 'VH', 'E'],
    VH: ['VH', 'VH', 'E', 'E', 'E'],
    E:  ['E', 'E', 'E', 'E', 'E']
  };
  // Table 8.1: bark group -> elevated rating -> columns = combined surface/near-surface (L M H VH E)
  var T81 = {
    LM: { // bark Low or Moderate
      L:  ['L', 'M', 'M', 'H', 'H'],
      M:  ['L', 'M', 'M', 'H', 'H'],
      H:  ['L', 'M', 'H', 'VH', 'VH'],
      VH: ['VH', 'VH', 'VH', 'VH', 'VH'],
      E:  ['E', 'E', 'E', 'E', 'E'] },
    H: { // bark High
      L:  ['L', 'M', 'H', 'H', 'H'],
      M:  ['L', 'M', 'H', 'H', 'H'],
      H:  ['L', 'H', 'H', 'VH', 'VH'],
      VH: ['VH', 'VH', 'VH', 'VH', 'E'],
      E:  ['E', 'E', 'E', 'E', 'E'] },
    VE: { // bark Very High or Extreme
      L:  ['L', 'VH', 'VH', 'VH', 'E'],
      M:  ['M', 'VH', 'VH', 'E', 'E'],
      H:  ['M', 'VH', 'E', 'E', 'E'],
      VH: ['E', 'E', 'E', 'E', 'E'],
      E:  ['E', 'E', 'E', 'E', 'E'] }
  };
  function barkGroup(b) { return (b === 'L' || b === 'M') ? 'LM' : b === 'H' ? 'H' : 'VE'; }
  function combineSurfaceNS(surface, nearSurface) { idx(surface); return T71[surface][idx(nearSurface)]; }
  function overallFromCombined(bark, elevated, combined) { idx(bark); idx(elevated); return T81[barkGroup(bark)][elevated][idx(combined)]; }
  // Full method: layers = {surface, ns, elev, bark}. Returns null until all four are rated.
  function overall(l) {
    if (!l || [l.surface, l.ns, l.elev, l.bark].some(function (r) { return R.indexOf(r) < 0; })) return null;
    var c = combineSurfaceNS(l.surface, l.ns);
    return { combined: c, overall: overallFromCombined(l.bark, l.elev, c) };
  }

  // Bark types (Tables 3.1, 3.3, 3.5): which ratings the guide allows for each type.
  // Fine fibrous (stringybark etc.): Low cannot occur. Ribbon/candle: only Moderate-Very High.
  // Other bark (smooth, box, ironbark, paperbark, gum-barked): Low-High. If >=10% of trees are fibrous, use fibrous.
  var BARK_TYPES = { fibrous: ['M', 'H', 'VH', 'E'], ribbon: ['M', 'H', 'VH'], other: ['L', 'M', 'H'], none: ['L'] };

  // Optional helper from measurements (Tables 4.1, 5.1, 6.1). The guide's ranges overlap and ask for
  // a "best fit of all key attributes", so these are only hints; overlaps are split at their middle.
  function band(x, cuts) { if (x == null || x === '' || !isFinite(x)) return null; x = +x; for (var i = 0; i < cuts.length; i++) if (x < cuts[i]) return R[i]; return 'E'; }
  var HINTS = {
    litterDepth: [10, 22.5, 27.5, 40],  // mm: L <10, M 10-25, H 20-30, VH 25-45, E >35
    surfaceCover: [60, 80, 90, 95],      // %:  L <60, M 60-80, H 80-90, VH >90, E >95
    nsCover: [10, 20, 40, 60],           // %:  L <10, M 10-20, H 20-40, VH 40-60, E >60
    elevCover: [20, 30, 50, 75]          // %:  L <20, M 20-30, H 30-50, VH 50-80, E >70
  };
  function hint(kind, x) { return band(x, HINTS[kind]); }

  // Table 9.2 indicative fuel loads (t/ha) by layer and rating [min, max]. Surface Extreme is "16-20+".
  var LOADS = {
    bark: { L: [0, 0], M: [1, 1], H: [2, 2], VH: [5, 5], E: [7, 7] },
    elev: { L: [0, 1], M: [1, 2], H: [2, 3], VH: [3, 5], E: [5, 8] },
    ns: { L: [1, 2], M: [2, 3], H: [3, 4], VH: [4, 6], E: [6, 8] },
    surface: { L: [2, 4], M: [4, 10], H: [8, 14], VH: [12, 20], E: [16, 20] }
  };
  function indicativeLoad(l) {
    var lo = 0, hi = 0, ok = true;
    ['surface', 'ns', 'elev', 'bark'].forEach(function (k) { var v = LOADS[k][l && l[k]]; if (!v) ok = false; else { lo += v[0]; hi += v[1]; } });
    return ok ? { min: lo, max: hi, plus: l.surface === 'E' } : null;
  }

  // ---- geo / compass helpers (same as Planting Survey / Tree Gauge) ----
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  function norm360(d) { d = d % 360; return d < 0 ? d + 360 : d; }
  function cameraHeading(alpha, beta, gamma) {
    var a = alpha * D2R, b = beta * D2R, g = gamma * D2R;
    var ca = Math.cos(a), sa = Math.sin(a), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
    var east = -(ca * sg + sa * sb * cg), north = ca * sb * cg - sa * sg;
    if (Math.abs(east) < 1e-9 && Math.abs(north) < 1e-9) return null;
    return norm360(Math.atan2(east, north) * R2D);
  }
  var DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function compassWord(deg) { return deg == null ? '' : DIRS[Math.round(norm360(deg) / 45) % 8]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function localStamp(iso) {
    var t = new Date(iso), o = -t.getTimezoneOffset(), s = o >= 0 ? '+' : '-'; o = Math.abs(o);
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes()) +
      ' ' + s + pad(Math.floor(o / 60)) + ':' + pad(o % 60);
  }
  function csvCell(v) {
    if (v == null) return ''; v = String(v);
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  var CSV_HEAD = ['site', 'vegetation', 'lat', 'lon', 'gps_accuracy_m', 'date_utc', 'date_local', 'surface', 'litter_depth_mm', 'surface_cover_pct',
    'near_surface', 'near_surface_cover_pct', 'elevated', 'elevated_cover_pct', 'bark_type', 'bark', 'combined_surface_near_surface', 'overall_fuel_hazard',
    'indicative_load_t_ha', 'photos', 'site_notes', 'check_notes'];
  function toCSV(db) {
    var rows = [CSV_HEAD], sites = {};
    (db.sites || []).forEach(function (s) { sites[s.id] = s; });
    (db.checks || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (c) {
      var s = sites[c.siteId] || {}, l = c.layers || {}, o = overall(l) || {}, ld = indicativeLoad(l);
      var np = (db.photos || []).filter(function (p) { return p.checkId === c.id; }).length;
      rows.push([s.name, s.veg, s.lat, s.lon, s.acc == null ? '' : Math.round(s.acc), new Date(c.date).toISOString(), localStamp(c.date),
        l.surface, l.depth, l.sCover, l.ns, l.nsCover, l.elev, l.eCover, l.barkType, l.bark, o.combined, o.overall,
        ld ? ld.min + '-' + ld.max + (ld.plus ? '+' : '') : '', np, s.notes, c.notes]);
    });
    return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }

  var api = { RATINGS: R, T71: T71, T81: T81, combineSurfaceNS: combineSurfaceNS, overallFromCombined: overallFromCombined, overall: overall,
    BARK_TYPES: BARK_TYPES, hint: hint, HINTS: HINTS, LOADS: LOADS, indicativeLoad: indicativeLoad,
    norm360: norm360, cameraHeading: cameraHeading, compassWord: compassWord, localStamp: localStamp, csvCell: csvCell, toCSV: toCSV, CSV_HEAD: CSV_HEAD };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FC = api;
})(this);
