/* Fuel Check - UI. Data in IndexedDB on the phone only. */
(function () {
  'use strict';
  var VERSION = '0.1.0';
  var lang = (navigator.language || 'en').slice(0, 2); if (!STRINGS[lang]) lang = 'en';
  function t(k, v) {
    var s = (STRINGS[lang] && STRINGS[lang][k]) || STRINGS.en[k]; if (s == null) s = k;
    if (v && typeof s === 'string') Object.keys(v).forEach(function (n) { s = s.split('{' + n + '}').join(v[n]); });
    return s;
  }
  function tt(k, sub) { var o = t(k); return (o && o[sub]) || sub; }
  function rn(r) { return r ? tt('R', r) : '–'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  var main = $('main');
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function day(iso) { return iso ? FC.localStamp(iso).slice(0, 10) : ''; }
  function toast(msg) { var e = $('toast'); e.textContent = msg; e.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(function () { e.hidden = true; }, 2600); }
  var LAYERS = ['surface', 'ns', 'elev', 'bark'], RADIUS = { surface: 10, ns: 10, elev: 10, bark: 20 };
  function chip(r) { return r ? '<span class="chip r' + r + '">' + esc(rn(r)) + '</span>' : '<span class="chip">' + esc(t('notRated')) + '</span>'; }
  function mapURL(s) { return 'https://www.openstreetmap.org/?mlat=' + s.lat + '&mlon=' + s.lon + '#map=17/' + s.lat + '/' + s.lon; }

  // ---------- storage (IndexedDB) ----------
  var STORES = ['sites', 'checks', 'photos'];
  var DB = { sites: [], checks: [], photos: [] }, idb = null;
  function openDB() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('no idb'));
      var q = indexedDB.open('fuel-check', 1);
      q.onupgradeneeded = function () { STORES.forEach(function (s) { if (!q.result.objectStoreNames.contains(s)) q.result.createObjectStore(s, { keyPath: 'id' }); }); };
      q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); };
    });
  }
  function tx(store, mode, fn) {
    return new Promise(function (res, rej) {
      if (!idb) return res();
      var x = idb.transaction(store, mode), r = fn(x.objectStore(store));
      x.oncomplete = function () { res(r && r.result); }; x.onerror = function () { rej(x.error); };
    });
  }
  function put(store, obj) {
    var arr = DB[store], i = arr.findIndex(function (o) { return o.id === obj.id; });
    if (i >= 0) arr[i] = obj; else arr.push(obj);
    return tx(store, 'readwrite', function (s) { s.put(obj); }).catch(function () { toast(t('storageWarn')); });
  }
  function del(store, id) { DB[store] = DB[store].filter(function (o) { return o.id !== id; }); return tx(store, 'readwrite', function (s) { s.delete(id); }); }
  function loadAll() { return Promise.all(STORES.map(function (s) { return tx(s, 'readonly', function (st) { return st.getAll(); }).then(function (r) { DB[s] = r || []; }); })); }
  function get(store, id) { return DB[store].filter(function (o) { return o.id === id; })[0]; }
  function checksOf(siteId) { return DB.checks.filter(function (c) { return c.siteId === siteId; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
  function photosOf(checkId, layer) { return DB.photos.filter(function (p) { return p.checkId === checkId && (!layer || p.layer === layer); }); }
  function delCheck(c) { photosOf(c.id).forEach(function (p) { del('photos', p.id); }); return del('checks', c.id); }
  function resultOf(c) { return FC.overall(c.layers); }

  // ---------- sensors ----------
  var heading = null, gotAbs = false, compassOn = false;
  function onOrient(e, abs) {
    if (e.webkitCompassHeading != null) { heading = FC.norm360(e.webkitCompassHeading); if (window.onHeading) window.onHeading(); return; }
    var a = e.alpha; if (a == null || (!abs && !e.absolute)) return;
    var h = FC.cameraHeading(a, e.beta || 0, e.gamma || 0); if (h == null) h = FC.norm360(360 - a);
    heading = h; if (window.onHeading) window.onHeading();
  }
  function startCompass() {
    if (compassOn) return; compassOn = true;
    var go = function () {
      if ('ondeviceorientationabsolute' in window) addEventListener('deviceorientationabsolute', function (e) { gotAbs = true; onOrient(e, true); });
      addEventListener('deviceorientation', function (e) { if (!gotAbs) onOrient(e, false); });
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then(go, go);
    else go();
  }
  var gpsWatch = null;
  function stopGps() { if (gpsWatch != null && navigator.geolocation) navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null; }
  function bestGps(cb, fail) {
    stopGps(); if (!navigator.geolocation) return fail();
    var best = null;
    gpsWatch = navigator.geolocation.watchPosition(function (p) {
      if (!best || p.coords.accuracy <= best.acc) best = { lat: +p.coords.latitude.toFixed(6), lon: +p.coords.longitude.toFixed(6), acc: p.coords.accuracy };
      cb(best);
    }, function () { fail(); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
  }

  // ---------- drawings (simple SVG, no photos) ----------
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  var LC = { surface: '#a0522d', ns: '#c9a227', elev: '#3f8f3f', bark: '#7a4a2a' };
  // Overview: all four layers, the current one in colour, others grey
  function overview(cur) {
    function c(l) { return l === cur ? LC[l] : '#c8cec6'; }
    var s = '<svg class="ov" viewBox="0 0 200 110" role="img" aria-label="' + esc(tt('layers', cur)) + '">';
    s += '<rect x="0" y="0" width="200" height="110" fill="#eef4fb"/><ellipse cx="150" cy="22" rx="38" ry="18" fill="#dfe5dc"/>';
    s += '<rect x="144" y="30" width="12" height="70" fill="' + c('bark') + '"/>';
    if (cur === 'bark') s += '<path d="M144 40 l-5 14 M156 46 l5 16 M144 62 l-6 12 M156 70 l5 10" stroke="#4a2a12" stroke-width="2.5"/>';
    s += '<path d="M40 98 q-14 -30 4 -48 q18 -6 26 10 q14 20 -2 38z" fill="' + c('elev') + '"/><path d="M92 98 q-8 -22 6 -32 q14 0 16 14 q4 12 -6 18z" fill="' + c('elev') + '"/>';
    [[12, 98], [22, 98], [76, 98], [118, 98], [128, 98], [178, 98]].forEach(function (p) { s += '<path d="M' + p[0] + ' ' + p[1] + ' l-4 -12 l6 9 l2 -14 l3 14 l5 -10 l-3 13z" fill="' + c('ns') + '"/>'; });
    s += '<rect x="0" y="98" width="200" height="6" fill="' + c('surface') + '"/><rect x="0" y="104" width="200" height="6" fill="#8d7b68"/>';
    return s + '</svg>';
  }
  // One picture per rating (lvl 0..4)
  function pic(layer, r) {
    var lvl = FC.RATINGS.indexOf(r), g = rnd(7 + lvl * 13 + layer.length), s = '<svg class="pic" viewBox="0 0 120 80" role="img" aria-label="' + esc(t('illus', { r: tt('layers', layer) + ' ' + rn(r) })) + '">';
    s += '<rect width="120" height="80" fill="#f3f6ef"/>';
    var i, x, y;
    if (layer === 'surface') {
      s += '<rect x="0" y="40" width="120" height="40" fill="#c9b89c"/>';
      var cover = [0.35, 0.7, 0.85, 0.95, 1][lvl], th = [2, 4, 6, 9, 12][lvl];
      for (i = 0; i < 12; i++) { if (g() < cover) s += '<rect x="' + (i * 10) + '" y="' + (40 - th + 2) + '" width="10.5" height="' + th + '" fill="#8b5a2b"/>'; }
      for (i = 0; i < 8 + lvl * 12; i++) { x = g() * 116; y = 44 + g() * 32; s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="3.5" ry="1.6" fill="' + (g() < 0.5 ? '#8b5a2b' : '#b07a3a') + '" transform="rotate(' + Math.round(g() * 180) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>'; }
      s += '<text x="4" y="12" class="pt">' + ['<1 cm', '1–2.5 cm', '2–3 cm', '2.5–4.5 cm', '>3.5 cm'][lvl] + '</text>';
    } else if (layer === 'ns') {
      s += '<rect x="0" y="66" width="120" height="14" fill="#c9b89c"/>';
      var n = [1, 3, 6, 10, 16][lvl];
      for (i = 0; i < n; i++) {
        x = (i + 0.5) * 120 / n + (g() - 0.5) * 4; var w = [8, 10, 12, 14, 14][lvl], h = 14 + g() * 12;
        s += '<path d="M' + (x - w / 2).toFixed(1) + ' 66 L' + (x - w / 3).toFixed(1) + ' ' + (66 - h * 0.8).toFixed(1) + ' L' + x.toFixed(1) + ' ' + (66 - h * 0.4).toFixed(1) + ' L' + (x + 1).toFixed(1) + ' ' + (66 - h).toFixed(1) + ' L' + (x + w / 3).toFixed(1) + ' ' + (66 - h * 0.7).toFixed(1) + ' L' + (x + w / 2).toFixed(1) + ' 66z" fill="' + (g() < lvl * 0.15 ? '#c7a65a' : '#8aa83a') + '"/>';
      }
    } else if (layer === 'elev') {
      s += '<rect x="0" y="70" width="120" height="10" fill="#c9b89c"/>';
      var m = [1, 2, 3, 5, 8][lvl];
      for (i = 0; i < m; i++) {
        x = (i + 0.5) * 120 / m + (g() - 0.5) * 6; var rx = [9, 11, 13, 13, 12][lvl], top = 18 + g() * 10, gap = lvl >= 3 ? 70 : 56;
        s += '<rect x="' + (x - 1).toFixed(1) + '" y="' + (top + 20) + '" width="2" height="' + (70 - top - 20) + '" fill="#6b4a2a"/>';
        s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + (top + 14) + '" rx="' + rx + '" ry="' + ((gap - top) / 2).toFixed(1) + '" fill="' + (lvl >= 3 && g() < 0.4 ? '#7f8f3a' : '#3f8f3f') + '"/>';
      }
      s += '<path d="M6 76 l4 -10 l4 10" stroke="#333" stroke-width="2" fill="none"/><circle cx="10" cy="62" r="3" fill="#333"/>';
    } else {
      s += '<rect x="0" y="72" width="120" height="8" fill="#c9b89c"/><rect x="48" y="4" width="24" height="68" fill="' + (lvl === 0 ? '#d9d2c3' : '#9a6a44') + '"/>';
      if (lvl === 1) s += '<rect x="48" y="40" width="24" height="32" fill="#2b2522"/>';
      if (lvl === 2) s += '<rect x="48" y="52" width="24" height="20" fill="#2b2522"/>';
      for (i = 0; i < [0, 2, 6, 12, 20][lvl]; i++) {
        y = 8 + g() * 58; var side = g() < 0.5 ? -1 : 1, len = 6 + g() * (4 + lvl * 4); x = side < 0 ? 48 : 72;
        s += '<path d="M' + x + ' ' + y.toFixed(1) + ' q' + (side * 4) + ' ' + (len / 2).toFixed(1) + ' ' + (side * (2 + lvl)) + ' ' + len.toFixed(1) + '" stroke="#5b3a20" stroke-width="' + (1.5 + lvl * 0.5) + '" fill="none"/>';
      }
      if (lvl >= 3) for (i = 0; i < 6; i++) s += '<path d="M' + (50 + i * 4) + ' 6 v64" stroke="#5b3a20" stroke-width="1"/>';
    }
    return s + '</svg>';
  }

  // ---------- files ----------
  function download(name, blob) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
    toast(t('exported', { f: name }));
  }
  function stamp() { return FC.localStamp(new Date().toISOString()).slice(0, 10); }
  function exportCSV() { if (!DB.checks.length) return toast(t('nothing')); download('fuel-check-' + stamp() + '.csv', new Blob(['\ufeff' + FC.toCSV(DB)], { type: 'text/csv' })); }
  function blobToData(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); }); }
  function dataToBlob(d) { return fetch(d).then(function (r) { return r.blob(); }); }
  function backup() {
    if (!DB.sites.length) return toast(t('nothing'));
    var withPhotos = DB.photos.length && confirm(t('backupPhotos'));
    var ph = withPhotos ? Promise.all(DB.photos.map(function (p) { return blobToData(p.blob).then(function (d) { var c = Object.assign({}, p); delete c.blob; c.data = d; return c; }); })) : Promise.resolve([]);
    ph.then(function (photos) {
      var o = { app: 'fuel-check', version: VERSION, exported: new Date().toISOString(), sites: DB.sites, checks: DB.checks, photos: photos };
      download('fuel-check-backup-' + stamp() + '.json', new Blob([JSON.stringify(o)], { type: 'application/json' }));
    });
  }
  function restore(file) {
    var r = new FileReader();
    r.onload = function () {
      var o; try { o = JSON.parse(r.result); } catch (e) { o = null; }
      if (!o || o.app !== 'fuel-check') return toast(t('badFile'));
      var n = 0, jobs = [];
      ['sites', 'checks'].forEach(function (s) { (o[s] || []).forEach(function (x) { n++; jobs.push(put(s, x)); }); });
      (o.photos || []).forEach(function (p) { n++; jobs.push(dataToBlob(p.data).then(function (b) { var c = Object.assign({}, p); delete c.data; c.blob = b; return put('photos', c); })); });
      Promise.all(jobs).then(function () { toast(t('restored', { n: n })); render(); });
    };
    r.readAsText(file);
  }
  function summaryText(s) {
    var L = [t('summaryHead', { site: s.name, veg: tt('vegTypes', s.veg) })];
    if (s.lat != null) L.push(t('summaryGps', { lat: s.lat, lon: s.lon, acc: Math.round(s.acc), map: mapURL(s) }));
    checksOf(s.id).forEach(function (c) {
      var o = resultOf(c); if (!o) return; var ld = FC.indicativeLoad(c.layers), l = c.layers;
      L.push(t('summaryCheck', { date: day(c.date), o: rn(o.overall).toUpperCase(), s: rn(l.surface), n: rn(l.ns), e: rn(l.elev), b: rn(l.bark), c: rn(o.combined),
        load: ld ? t('summaryLoad', { l: ld.min + '–' + ld.max + (ld.plus ? '+' : '') }) : '' }) + (c.notes ? ' ' + c.notes : ''));
    });
    L.push(t('summaryNote')); L.push('— ' + t('appName') + ' (free) ' + location.href.split('#')[0]);
    return L.join('\n');
  }
  function shareSummary(s) {
    var txt = summaryText(s);
    if (navigator.share) { navigator.share({ title: t('appName'), text: txt }).catch(function () {}); return; }
    sheet('<h2>' + esc(t('share')) + '</h2><textarea id="sumTxt" rows="12" readonly>' + esc(txt) + '</textarea><button class="go" id="cp">' + t('copy') + '</button><button data-close>' + t('close') + '</button>', function () {
      $('cp').onclick = function () { $('sumTxt').select(); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast(t('copied')); }, function () { document.execCommand('copy'); toast(t('copied')); }); };
    });
  }
  function sheet(html, init) {
    var s = $('sheet'); s.innerHTML = '<div class="panel">' + html + '</div>'; s.hidden = false;
    s.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = closeSheet; }); if (init) init(s);
  }
  function closeSheet() { $('sheet').hidden = true; $('sheet').innerHTML = ''; }

  // ---------- views ----------
  var cleanup = null;
  function go(h) { location.hash = h; }
  function render() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    stopGps(); window.onHeading = null; closeSheet();
    var h = location.hash.replace(/^#\/?/, '').split('/'), v = h[0] || '', id = h[1];
    document.body.className = 'v-' + (v || 'home');
    if (v === 'site' && get('sites', id)) viewSite(get('sites', id));
    else if (v === 'site-edit') viewSiteEdit(id === 'new' ? null : get('sites', id));
    else if (v === 'check' && get('checks', id)) viewStep(get('checks', id), Math.max(0, Math.min(3, +h[2] || 0)));
    else if (v === 'result' && get('checks', id)) viewResult(get('checks', id));
    else if (v === 'photo' && get('checks', id) && LAYERS.indexOf(h[2]) >= 0) viewPhoto(get('checks', id), h[2]);
    else if (v === 'about') viewAbout();
    else viewHome();
    window.scrollTo(0, 0);
  }
  function top(title, backTo) {
    return '<header class="bar">' + (backTo != null ? '<a class="back" href="#' + backTo + '">' + t('back') + '</a>' : '<img src="icons/icon-192.png" alt="" class="logo">') +
      '<h1>' + esc(title) + '</h1>' + (backTo == null ? '<a class="back" href="#about" aria-label="' + esc(t('about')) + '">ⓘ</a>' : '') + '</header>';
  }
  function latest(s) { var cs = checksOf(s.id).filter(resultOf); return cs[cs.length - 1]; }

  function viewHome() {
    var h = top(t('appName')) + '<p class="lead">' + t('tagline') + '</p><h2>' + t('sites') + '</h2>';
    if (!DB.sites.length) h += '<p class="empty">' + t('noSites') + '</p>';
    DB.sites.slice().sort(function (a, b) { return a.created < b.created ? -1 : 1; }).forEach(function (s) {
      var c = latest(s), o = c && resultOf(c);
      h += '<div class="item"><a href="#site/' + s.id + '"><b>' + esc(s.name) + '</b><span>' + esc(tt('vegTypes', s.veg)) + ' · ' + t('checksN', { n: checksOf(s.id).length }) +
        (c ? ' · ' + t('lastCheck', { date: day(c.date) }) : '') + '</span></a>' + (o ? chip(o.overall) : '') +
        (s.lat != null ? ' <a class="maplink" href="' + mapURL(s) + '" target="_blank" rel="noopener">' + t('mapLink') + '</a>' : '') + '</div>';
    });
    h += '<a class="btn go" href="#site-edit/new">' + t('newSite') + '</a>' +
      '<button id="bCsv">' + t('exportCsv') + '</button><div class="row"><button id="bBak">' + t('backup') + '</button><button id="bRes">' + t('restore') + '</button></div>' +
      '<input type="file" id="fRes" accept=".json,application/json" hidden><div class="card"><h3>' + t('howTo') + '</h3>' + t('howToText') + '<p class="small">' + t('install') + '</p></div>';
    main.innerHTML = h;
    $('bCsv').onclick = exportCSV; $('bBak').onclick = backup;
    $('bRes').onclick = function () { $('fRes').click(); }; $('fRes').onchange = function () { if (this.files[0]) restore(this.files[0]); };
  }

  function viewSiteEdit(s) {
    var n = !s; s = s || { id: uid(), name: '', veg: 'forest', notes: '', lat: null, lon: null, acc: null, created: new Date().toISOString() };
    var vt = t('vegTypes'), g = s.lat != null ? { lat: s.lat, lon: s.lon, acc: s.acc } : null;
    main.innerHTML = top(n ? t('newSite').replace('+ ', '') : t('editSite'), n ? '' : 'site/' + s.id) +
      '<form id="f" class="form"><label>' + t('siteName') + '<input name="name" required placeholder="' + esc(t('siteHint')) + '" value="' + esc(s.name) + '"></label>' +
      '<label>' + t('veg') + '<select name="veg">' + Object.keys(vt).map(function (k) { return '<option value="' + k + '"' + (k === s.veg ? ' selected' : '') + '>' + esc(vt[k]) + '</option>'; }).join('') + '</select></label>' +
      '<fieldset><legend>' + t('gps') + '</legend><p id="gpsTxt">' + (g ? t('gpsGot', { acc: Math.round(g.acc) }) : t('gpsNone')) + '</p><button type="button" id="bGps">' + t('getGps') + '</button></fieldset>' +
      '<label>' + t('notes') + '<textarea name="notes" rows="3">' + esc(s.notes) + '</textarea></label>' +
      '<button class="go" type="submit">' + t('save') + '</button>' + (n ? '' : '<button type="button" class="bad" id="bDel">' + t('del') + '</button>') + '</form>';
    $('bGps').onclick = function () {
      $('gpsTxt').textContent = t('gpsWait');
      bestGps(function (b) { g = b; $('gpsTxt').textContent = t('gpsGot', { acc: Math.round(b.acc) }) + ' (' + b.lat + ', ' + b.lon + ')'; }, function () { $('gpsTxt').textContent = t('gpsFail'); });
    };
    $('f').onsubmit = function (e) {
      e.preventDefault(); var f = e.target;
      if (!f.name.value.trim()) return toast(t('needName'));
      s.name = f.name.value.trim(); s.veg = f.veg.value; s.notes = f.notes.value;
      if (g) { s.lat = g.lat; s.lon = g.lon; s.acc = Math.round(g.acc * 10) / 10; }
      put('sites', s).then(function () { go('site/' + s.id); });
    };
    if (!n) $('bDel').onclick = function () {
      if (!confirm(t('confirmDelSite', { name: s.name }))) return;
      checksOf(s.id).forEach(delCheck); del('sites', s.id).then(function () { go(''); });
    };
  }

  function viewSite(s) {
    var h = top(s.name, '');
    h += '<div class="card"><p>' + esc(tt('vegTypes', s.veg)) + '<br>' + (s.lat != null ? s.lat + ', ' + s.lon + ' (±' + Math.round(s.acc) + ' m) <a href="' + mapURL(s) + '" target="_blank" rel="noopener">' + t('mapLink') + '</a>' : t('gpsNone')) +
      (s.notes ? '<br><i>' + esc(s.notes) + '</i>' : '') + '</p><a class="btn small" href="#site-edit/' + s.id + '">' + t('edit') + '</a></div>';
    h += '<button class="go big" id="bNew">' + t('newCheck') + '</button><h2>' + t('checks') + '</h2>';
    var cs = checksOf(s.id); if (!cs.length) h += '<p class="empty">' + t('noChecks') + '</p>';
    cs.slice().reverse().forEach(function (c) {
      var o = resultOf(c), l = c.layers;
      h += '<a class="item" href="#' + (o ? 'result/' + c.id : 'check/' + c.id + '/0') + '"><b>' + esc(FC.localStamp(c.date).slice(0, 16)) + ' ' + chip(o && o.overall) + '</b><span>' +
        LAYERS.map(function (k) { return esc(tt('layers', k).split(' (')[0]) + ': ' + esc(rn(l[k])); }).join(' · ') + '</span></a>';
    });
    if (cs.length) h += '<button id="bShare">' + t('share') + '</button>';
    main.innerHTML = h;
    $('bNew').onclick = function () {
      var c = { id: uid(), siteId: s.id, date: new Date().toISOString(), layers: {}, notes: '' };
      put('checks', c).then(function () { go('check/' + c.id + '/0'); });
    };
    if ($('bShare')) $('bShare').onclick = function () { shareSummary(s); };
  }

  function viewStep(c, i) {
    var k = LAYERS[i], l = c.layers, s = get('sites', c.siteId), D = t('desc')[k];
    var allowed = k === 'bark' ? FC.BARK_TYPES[l.barkType || 'fibrous'] : FC.RATINGS;
    var h = top(tt('layers', k), 'site/' + c.siteId) + '<p class="small">' + t('step', { n: i + 1 }) + ' · ' + esc(s ? s.name : '') + '</p>' +
      '<div class="steps">' + LAYERS.map(function (x, j) { return '<a href="#check/' + c.id + '/' + j + '" class="' + (j === i ? 'on ' : '') + (l[x] ? 'r' + l[x] : '') + '">' + (j + 1) + '</a>'; }).join('') + '</div>' +
      '<div class="card">' + overview(k) + '<p>' + t('layerWhat')[k] + '</p><p class="small">' + t('lookArea', { r: RADIUS[k] * 2, d: RADIUS[k] }) + '</p></div>';
    if (k === 'bark') {
      var bt = t('barkTypes');
      h += '<fieldset><legend>' + t('barkType') + '</legend>' + Object.keys(bt).map(function (b) {
        return '<label class="opt"><input type="radio" name="bt" value="' + b + '"' + ((l.barkType || 'fibrous') === b ? ' checked' : '') + '> ' + esc(bt[b]) + '</label>'; }).join('') +
        '<p class="small">' + t('barkRule') + '</p></fieldset>';
    }
    h += '<p><b>' + t('pickOne') + '</b></p><div class="cards">' + FC.RATINGS.map(function (r) {
      var ok = allowed.indexOf(r) >= 0;
      return '<button type="button" class="rc' + (l[k] === r ? ' sel' : '') + '" data-r="' + r + '"' + (ok ? '' : ' disabled') + '>' + pic(k, r) +
        '<span class="rh r' + r + '">' + esc(rn(r)) + '</span><span class="rd">' + esc(D[r]) + '</span></button>';
    }).join('') + '</div>';
    if (k !== 'bark') {
      h += '<details class="card"' + (l.depth != null || l[k + 'Cv'] != null ? ' open' : '') + '><summary>' + t('optional') + '</summary><div class="form">' +
        (k === 'surface' ? '<label>' + t('depth') + '<input type="number" inputmode="decimal" min="0" step="any" id="iDepth" value="' + esc(l.depth) + '"></label>' : '') +
        '<label>' + t('cover') + '<input type="number" inputmode="numeric" min="0" max="100" id="iCover" value="' + esc(l[{ surface: 'sCover', ns: 'nsCover', elev: 'eCover' }[k]]) + '"></label>' +
        '<p id="hint" class="hint"></p><p class="small">' + t('hintNote') + '</p></div></details>';
    }
    var np = photosOf(c.id, k).length;
    h += '<a class="btn" href="#photo/' + c.id + '/' + k + '">' + t('photo') + (np ? ' · ' + t('photoN', { n: np }) : '') + '</a>' +
      '<div class="row"><a class="btn" href="#check/' + c.id + '/' + Math.max(0, i - 1) + '"' + (i ? '' : ' hidden') + '>' + t('prev') + '</a>' +
      '<button class="go" id="bNext">' + (i < 3 ? t('next') : t('finish')) + '</button></div>';
    main.innerHTML = h;
    main.querySelectorAll('.rc').forEach(function (b) {
      b.onclick = function () {
        l[k] = b.dataset.r; if (k === 'bark' && !l.barkType) l.barkType = 'fibrous'; put('checks', c);
        main.querySelectorAll('.rc').forEach(function (x) { x.classList.toggle('sel', x === b); });
        var st = main.querySelectorAll('.steps a')[i]; st.className = 'on r' + l[k];
      };
    });
    main.querySelectorAll('input[name=bt]').forEach(function (r) {
      r.onchange = function () { l.barkType = r.value; if (l.bark && FC.BARK_TYPES[r.value].indexOf(l.bark) < 0) delete l.bark; put('checks', c).then(render); };
    });
    if (k !== 'bark') {
      var ck = { surface: 'sCover', ns: 'nsCover', elev: 'eCover' }[k], hk = { surface: 'surfaceCover', ns: 'nsCover', elev: 'elevCover' }[k];
      var upd = function () {
        var d = $('iDepth') ? $('iDepth').value : '', cv = $('iCover').value;
        if ($('iDepth')) { if (d === '') delete l.depth; else l.depth = +d; }
        if (cv === '') delete l[ck]; else l[ck] = +cv;
        var parts = [];
        if ($('iDepth') && d !== '') parts.push(rn(FC.hint('litterDepth', d)) + ' (depth)');
        if (cv !== '') parts.push(rn(FC.hint(hk, cv)) + ' (cover)');
        $('hint').textContent = parts.length ? t('hint', { r: parts.join(', ') }) : '';
      };
      if ($('iDepth')) $('iDepth').oninput = function () { upd(); put('checks', c); };
      $('iCover').oninput = function () { upd(); put('checks', c); }; upd();
    }
    $('bNext').onclick = function () { go(i < 3 ? 'check/' + c.id + '/' + (i + 1) : 'result/' + c.id); };
  }

  function viewResult(c) {
    var o = resultOf(c), l = c.layers, s = get('sites', c.siteId), h = top(t('result'), 'site/' + c.siteId);
    var missing = LAYERS.filter(function (k) { return !l[k]; });
    if (!o) {
      main.innerHTML = h + '<div class="card"><p>' + t('notRated') + ':</p>' + missing.map(function (k) { return '<a class="btn" href="#check/' + c.id + '/' + LAYERS.indexOf(k) + '">' + esc(tt('layers', k)) + '</a>'; }).join('') + '</div>';
      return;
    }
    var ld = FC.indicativeLoad(l);
    h += '<div class="big-r r' + o.overall + '"><small>' + t('overall') + '</small><b>' + esc(rn(o.overall)) + '</b><small>' + esc(s ? s.name : '') + '</small></div>' +
      '<div class="card"><table class="lt">' + LAYERS.map(function (k, i) {
        return '<tr><td><a href="#check/' + c.id + '/' + i + '">' + esc(tt('layers', k)) + '</a></td><td>' + chip(l[k]) + '</td></tr>' + (k === 'ns' ? '<tr class="sub"><td>→ ' + t('combined') + '</td><td>' + chip(o.combined) + '</td></tr>' : '');
      }).join('') + '</table>' +
      (ld ? '<p>' + t('load') + ': <b>~' + ld.min + '–' + ld.max + (ld.plus ? '+' : '') + ' t/ha</b></p><p class="small">' + t('loadNote') + '</p>' : '') + '</div>' +
      '<div class="card"><h3>' + t('meaning') + '</h3><p>' + esc(t('mean')[o.overall]) + '</p><h3>' + t('actions') + '</h3><p>' + esc(t('act')[o.overall]) + '</p><p class="small">' + esc(t('actAll')) + '</p>' +
      '<details><summary>' + t('authority') + '</summary>' + t('authorityLinks') + '</details></div>' +
      '<form id="f" class="form"><label>' + t('checkDate') + '<input type="datetime-local" name="date" value="' + FC.localStamp(c.date).slice(0, 16).replace(' ', 'T') + '"></label>' +
      '<label>' + t('checkNotes') + '<textarea name="notes" rows="3">' + esc(c.notes) + '</textarea></label>' +
      '<button class="go big" type="submit">' + t('done') + '</button><button type="button" id="bShare">' + t('share') + '</button><button type="button" class="bad" id="bDel">' + t('del') + '</button></form>';
    main.innerHTML = h;
    var f = $('f');
    function keep() { var d = new Date(f.date.value); if (!isNaN(d)) c.date = d.toISOString(); c.notes = f.notes.value; return put('checks', c); }
    f.onsubmit = function (e) { e.preventDefault(); keep().then(function () { go('site/' + c.siteId); }); };
    $('bShare').onclick = function () { keep().then(function () { shareSummary(s); }); };
    $('bDel').onclick = function () { if (confirm(t('confirmDel'))) delCheck(c).then(function () { go('site/' + c.siteId); }); };
  }

  function compress(src, w, h) {
    var max = 1280, k = Math.min(1, max / Math.max(w, h)), cv = document.createElement('canvas');
    cv.width = Math.round(w * k); cv.height = Math.round(h * k); cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
    return new Promise(function (res) { cv.toBlob(function (b) { res({ blob: b, w: cv.width, h: cv.height }); }, 'image/jpeg', 0.7); });
  }
  function viewPhoto(c, k) {
    var stream = null, i = LAYERS.indexOf(k), urls = [], back = '#check/' + c.id + '/' + i;
    var thumbs = photosOf(c.id, k).map(function (p) { var u = URL.createObjectURL(p.blob); urls.push(u); return '<img src="' + u + '" alt="">'; }).join('');
    main.innerHTML = '<div class="cam"><video id="vid" playsinline muted autoplay></video>' +
      '<div class="camtop"><a class="back" href="' + back + '">' + t('back') + '</a><span>' + esc(tt('layers', k)) + '</span><span id="hd">' + t('noCompass') + '</span></div>' +
      '<div class="cambot"><div class="camthumbs">' + thumbs + '</div><button class="go big" id="snap">' + t('takePhoto') + '</button><button id="pick">' + t('pickPhoto') + '</button>' +
      '<input type="file" id="file" accept="image/*" capture="environment" hidden></div></div>';
    document.body.className = 'v-photo';
    cleanup = function () { if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); }); urls.forEach(URL.revokeObjectURL); };
    startCompass();
    window.onHeading = function () { if (heading != null) $('hd').textContent = t('facing', { b: Math.round(heading), w: FC.compassWord(heading) }); };
    function saveBlob(r) {
      var o = { id: uid(), checkId: c.id, layer: k, date: new Date().toISOString(), bearing: heading == null ? null : Math.round(heading), w: r.w, h: r.h, blob: r.blob };
      put('photos', o).then(function () { toast(t('photoSaved')); location.hash = back; });
    }
    var vid = $('vid');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
        .then(function (st) { stream = st; vid.srcObject = st; }, function () { toast(t('noCamera')); });
    } else toast(t('noCamera'));
    $('snap').onclick = function () { if (!stream || !vid.videoWidth) return $('file').click(); compress(vid, vid.videoWidth, vid.videoHeight).then(saveBlob); };
    $('pick').onclick = function () { $('file').click(); };
    $('file').onchange = function () {
      var fl = this.files[0]; if (!fl) return;
      var img = new Image(), u = URL.createObjectURL(fl);
      img.onload = function () { compress(img, img.naturalWidth, img.naturalHeight).then(function (r) { URL.revokeObjectURL(u); saveBlob(r); }); };
      img.src = u;
    };
  }

  function viewAbout() {
    main.innerHTML = top(t('about'), '') + '<div class="card">' + t('aboutText') + '</div><div class="card"><h3>' + t('sources') + '</h3>' + t('sourcesText') + '</div>' +
      '<div class="card"><h3>' + t('authority') + '</h3>' + t('authorityLinks') + '</div><div class="card"><h3>' + t('howTo') + '</h3>' + t('howToText') + '</div>' +
      '<p class="small center">' + t('version', { v: VERSION }) + ' · <a href="https://github.com/johnrichardszpe-dot/fuel-check">GitHub</a></p>';
  }

  // ---------- start ----------
  window.addEventListener('hashchange', render);
  $('sheet').addEventListener('click', function (e) { if (e.target.id === 'sheet') closeSheet(); });
  openDB().then(function (d) { idb = d; return loadAll(); }).catch(function () { toast(t('storageWarn')); }).then(function () {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    render();
  });
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  window.FCApp = { DB: DB, version: VERSION };
})();
