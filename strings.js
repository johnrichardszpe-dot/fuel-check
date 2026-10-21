/* All words shown in the app. To add a language, copy the "en" block, give it a code (e.g. "fr"),
   and translate the text on the right of each colon. Keep {words} in curly brackets as they are.
   Layer descriptions are plain-language summaries of the Overall Fuel Hazard Assessment Guide (4th ed., 2010). */
var STRINGS = {
  en: {
    appName: 'Fuel Check',
    tagline: 'A simple look at how much bushfire fuel is on your block, step by step.',
    sites: 'Your places', noSites: 'Nothing saved yet. Tap "New place" to start.',
    newSite: '+ New place', editSite: 'Edit place', siteName: 'Place name', siteHint: 'e.g. Back paddock, School bush strip, Lot 12 east',
    veg: 'Main vegetation', notes: 'Notes', save: 'Save', cancel: 'Cancel', del: 'Delete', back: '‹ Back', close: 'Close', edit: 'Edit',
    vegTypes: { forest: 'Forest (tall trees, closed)', woodland: 'Woodland (scattered trees)', shrub: 'Shrubland / heath / scrub', mallee: 'Mallee', grass: 'Grassland / pasture',
      plantation: 'Plantation', garden: 'Garden / around buildings', other: 'Other' },
    confirmDelSite: 'Delete "{name}" and ALL its checks and photos?', confirmDel: 'Delete this check and its photos?', needName: 'Please type a name.',
    gps: 'Location (GPS)', getGps: '📍 Get GPS', gpsWait: 'Getting GPS… stand still in the middle of the spot', gpsGot: 'GPS saved: ±{acc} m',
    gpsNone: 'No GPS yet', gpsFail: 'GPS not available. You can still save.', mapLink: '🗺 Open in map',
    checks: 'Checks at this place', noChecks: 'No checks yet. Do one now, and again each year before the fire season.',
    newCheck: '▶ Start a fuel check', lastCheck: 'Last check {date}', checksN: '{n} checks', notRated: 'not finished',
    step: 'Step {n} of 4', next: 'Next ›', prev: '‹ Back', finish: 'See result ›', pickOne: 'Tap the picture that fits best.',
    lookArea: 'Look over a circle about {r} m across from where you stand ({d} m radius). Pick the best overall fit, not the worst corner.',
    optional: 'Optional measurements', depth: 'Litter depth (mm), average of 5 spots', cover: 'Cover (%) seen from above',
    hint: 'Your numbers suggest about: {r}', hintNote: 'Numbers are a guide only. Choose the picture that fits best overall.',
    photo: '📷 Photo of this layer', photoN: '{n} photo(s)', photoSaved: 'Photo saved',
    takePhoto: '● Take photo', pickPhoto: 'Choose / take photo', noCamera: 'Camera not available here. You can pick a photo instead.',
    facing: 'Facing {b}° {w}', noCompass: 'No compass reading',
    R: { L: 'Low', M: 'Moderate', H: 'High', VH: 'Very High', E: 'Extreme' },
    layers: { surface: 'Surface fuel (litter)', ns: 'Near-surface fuel', elev: 'Elevated fuel (shrubs)', bark: 'Bark fuel' },
    layerWhat: {
      surface: 'Dead leaves, twigs, bark and grass <b>lying flat on the ground</b>. Logs and thick sticks do not count.',
      ns: 'Low plants and dead stuff <b>touching the ground but standing up off it</b>: grass tussocks, sedges, low ferns, small low shrubs, dead leaves caught in them. It always burns when the litter burns.',
      elev: '<b>Shrubs and young trees</b> standing upright, mostly with a gap below them, with most leaves near the top. A small fire may pass underneath. Tall tree crowns are not counted.',
      bark: '<b>Bark on tree trunks and branches</b>. Loose, stringy or ribbon bark makes embers that start spot fires ahead of the fire.'
    },
    desc: {
      surface: {
        L: 'Patchy litter. More bare soil or rock than litter. Very thin, under about 1 cm. Under 60% covered.',
        M: 'Litter mostly joined up, some bare patches. Thin, about 1–2.5 cm. About 60–80% covered.',
        H: 'Litter well joined, little bare soil. Layers from fresh leaves to rotting ones, about 2–3 cm. About 80–90% covered.',
        VH: 'Litter covers nearly everything. Thick, about 2.5–4.5 cm. Over 90% covered.',
        E: 'Thick carpet of litter, no gaps, deeper than about 3.5 cm. Over 95% covered.' },
      ns: {
        L: 'Almost none. Under 10% of the ground covered, very little dead material.',
        M: 'A few clumps with big gaps (gaps many times wider than the clumps). About 10–20% cover.',
        H: 'Gaps still bigger than the clumps. Starting to hide logs and rocks. About 20–40% cover, more than 20% dead.',
        VH: 'Clumps as big as or bigger than the gaps. About 40–60% cover, more than 30% dead. Fire can run through it without the litter.',
        E: 'Almost no gaps. Logs and rocks hidden. Over 60% cover, more than half dead.' },
      elev: {
        L: 'Few shrubs (under 20% cover) or plants that do not burn well. Easy to walk anywhere without picking a path.',
        M: 'Some shrubs (about 20–30% cover). Easy to pick a path, you brush them now and then. Leaves mostly at the top.',
        H: 'More shrubs (about 30–50% cover). You can find a path but brush against them most of the time.',
        VH: 'Lots of shrubs (about 50–80% cover), fine leaves and twigs from bottom to top, 20–30% dead. Must pick your path carefully.',
        E: 'Thick shrubs (over 70% cover), fine fuel top to bottom, over 30% dead. Very hard to get through, you have to push.' },
      bark: {
        L: 'No trees, or trunks and branches smooth with no loose bark.',
        M: 'Bark tight (stringybark: hard to pull off, trunk mostly black from old fire; ribbon bark: almost smooth, no long ribbons; other bark: rubs off only with firm pressure, a little).',
        H: 'Some loose pieces (stringybark: mostly tight, 50–90% of trunk charred; ribbon bark: long ribbons high up, lower trunk smooth; other bark: breaks off with light pressure, lots of it).',
        VH: 'Many loose pieces, deep cracks, 10–50% charred (stringybark); or ribbons hanging to the ground / loose bark all over the trunk (ribbon bark).',
        E: 'Stringybark only: big wads break off with light hand pressure, deep cracks, almost no charring. Huge amounts of bark.' }
    },
    barkType: 'What kind of bark do most trees have?', barkTypes: {
      fibrous: 'Stringy / fibrous (like stringybark; fine fibres like string)', ribbon: 'Ribbon / candle (long strips hang off; trunk often smooth)',
      other: 'Other (smooth, flaky, box, ironbark, paperbark)', none: 'No trees here' },
    barkRule: 'If 1 in 10 trees or more have stringy/fibrous bark, choose "Stringy / fibrous". Some ratings cannot happen with some bark types, so they are greyed out.',
    result: 'Result', overall: 'Overall fuel hazard', combined: 'Surface + near-surface combined', load: 'Indicative fine fuel load', loadNote: 'Rough t/ha from the guide’s Table 9.2 (forest averages). Not a measurement.',
    checkDate: 'Date and time', checkNotes: 'Notes (weather, last fire, recent burn or slashing)', done: '✔ Save check',
    meaning: 'What this means', actions: 'Common things people do',
    mean: {
      L: 'Not much fine fuel. A fire here would usually be small and fairly easy to put out in normal weather.',
      M: 'Some fuel. Fires spread but are mostly manageable with early attack in normal weather.',
      H: 'Plenty of fuel. Fires can spread steadily, flames get taller and embers may start spot fires. Harder to control.',
      VH: 'Lots of fuel joined from ground to shrubs or bark. Fires spread fast with tall flames and spotting. Hard to control.',
      E: 'Very heavy, joined-up fuel. Fires would be very intense and very hard or impossible to control, even in milder weather.' },
    act: {
      L: 'Keep it this way: rake or mow before the fire season and check again next year.',
      M: 'Keep the area near buildings clear. Rake litter and mow grass near the house, sheds and fences.',
      H: 'Reduce fuel near buildings and access tracks: rake litter, mow, prune low branches, remove dead shrubs. Ask your local fire authority about options.',
      VH: 'Reduce fuel as a priority, starting closest to buildings and roads. Get advice from your local brigade, fire authority or council before burning or clearing.',
      E: 'Get local advice soon. Large fuel reduction may need permits, contractors or a planned burn. Check your bushfire plan and know when to leave.' },
    actAll: 'Never burn or clear without checking local rules, permits and fire danger ratings. Native vegetation clearing often needs approval.',
    authority: 'Find your local fire authority advice', authorityLinks: '<ul><li>Western Australia: <a href="https://www.dfes.wa.gov.au/" rel="noopener">DFES</a> and your shire’s firebreak notice</li><li>Victoria: <a href="https://www.cfa.vic.gov.au/" rel="noopener">CFA</a> · NSW: <a href="https://www.rfs.nsw.gov.au/" rel="noopener">RFS</a> · Queensland: <a href="https://www.fire.qld.gov.au/" rel="noopener">QFES</a> · South Australia: <a href="https://www.cfs.sa.gov.au/" rel="noopener">CFS</a> · Tasmania: <a href="https://www.fire.tas.gov.au/" rel="noopener">TFS</a> · ACT: <a href="https://esa.act.gov.au/" rel="noopener">ESA</a> · NT: <a href="https://pfes.nt.gov.au/" rel="noopener">PFES</a></li><li>Elsewhere: your national or regional fire service and local council.</li></ul>',
    exportCsv: '⬇ Export CSV (spreadsheet)', share: '↗ Share summary', backup: '💾 Backup file', restore: '📂 Restore backup',
    backupPhotos: 'Include photos in the backup? (bigger file)', restored: 'Restored {n} records', badFile: 'That file is not a Fuel Check backup.',
    exported: 'Saved {f}', copied: 'Summary copied', nothing: 'Nothing to export yet.', copy: 'Copy',
    summaryHead: 'Fuel Check — {site} ({veg})', summaryGps: 'Location: {lat}, {lon} (±{acc} m) {map}',
    summaryCheck: '{date}: OVERALL {o}. Surface {s}, near-surface {n}, elevated {e}, bark {b} (surface+near-surface {c}).{load}',
    summaryLoad: ' Indicative load {l} t/ha.', summaryNote: 'Self-assessment using a simplified guide, not an official fuel hazard or BAL assessment.',
    about: 'About', version: 'Version {v}',
    aboutText: '<p><b>Fuel Check</b> is a free app for landholders, council officers, volunteer brigades and schools to look at bushfire fuel in a simple, repeatable way. Made by <b>John Richards</b>. No account, no adverts, no server. It works offline after the first visit.</p>' +
      '<h3>How the rating works</h3><p>You rate four fuel layers Low to Extreme: surface (litter), near-surface, elevated (shrubs) and bark. The app combines them using the tables in the <b>Overall Fuel Hazard Assessment Guide, 4th edition</b> (Hines, Tolhurst, Wilson &amp; McCarthy 2010, Victorian Department of Sustainability and Environment, report no. 82): first surface with near-surface (Table 7.1), then that with elevated and bark (Table 8.1). The tables were copied cell by cell from the guide and are checked by automatic tests. The layer descriptions are shortened plain-English summaries; the drawings are simple sketches, not the guide’s photos. The t/ha figure is the guide’s indicative Table 9.2, not a measurement.</p>' +
      '<h3>Please know</h3><ul><li><b>This is not an official assessment.</b> It is not a BAL (Bushfire Attack Level, AS 3959) assessment, a bushfire management plan, or a firebreak / asset protection zone inspection, and it is not legal advice.</li>' +
      '<li><b>Local rules differ.</b> Shires and councils set firebreak and fuel rules (in WA, check your shire’s firebreak notice and <a href="https://www.dfes.wa.gov.au/" rel="noopener">DFES</a> advice; many WA notices say an asset protection zone must stay under 2 t/ha). Always check with your local fire authority or council.</li>' +
      '<li>The guide was built for <b>eucalypt forests and woodlands</b> in south-east Australia. It is less suited to grassland, crops, heath, mallee and non-Australian vegetation. In WA, DFES/FESA <i>Visual Fuel Load Guides</i> (e.g. Swan Coastal Plain, Esperance Plains) estimate scrub fuel in t/ha and may suit local shrublands better.</li>' +
      '<li>Ratings are judgement. Two people can pick different answers. Use the same spot, the same season, and take photos so you can compare.</li>' +
      '<li>Grass curing, fuel moisture, weather, slope and the Fire Danger Rating all change fire behaviour a lot. This app ignores them.</li>' +
      '<li><b>Your data stays only on this phone.</b> Export CSV or make a Backup file often. Phone GPS is often 5–15 m out and compasses 10° or more.</li></ul>',
    sources: 'Sources', sourcesText: '<ul><li>Hines F, Tolhurst KG, Wilson AAG, McCarthy GJ (2010) <i>Overall Fuel Hazard Assessment Guide</i>, 4th ed. Fire and Adaptive Management Report 82, DSE Victoria. ISBN 978-1-74242-677-8.</li><li>FESA / DFES WA (2010s) <i>Visual Fuel Load Guide</i> series (Swan Coastal Plain &amp; Darling Scarp; Esperance Plains) — 1 m² quadrats, dried fine fuel &lt;10 mm, g/m² ÷ 100 = t/ha.</li><li>Standards Australia AS 3959 <i>Construction of buildings in bushfire-prone areas</i> (BAL-LOW, 12.5, 19, 29, 40, FZ) — context only, not calculated here.</li><li>WA Planning Commission, <i>Guidelines for Planning in Bushfire Prone Areas</i>; shire firebreak notices (asset protection zone fuel &lt;2 t/ha).</li></ul>',
    howTo: 'How to use', howToText: '<ol><li><b>New place</b>: give it a name, pick the vegetation and save GPS while standing in the middle.</li><li><b>Start a fuel check</b>. For each of the 4 layers, read the short text, look around you (about 10 m radius, 20 m for bark) and tap the picture that fits best. Take a photo if you like.</li><li>See the <b>overall fuel hazard</b>, what it means and common actions.</li><li>Come back to the same spot each year (same season) and do it again to see change.</li><li><b>Share</b> the summary, <b>Export CSV</b>, or make a <b>Backup</b> — data is only on this phone.</li></ol>',
    install: 'Tip: use your browser menu → "Add to Home screen" to install.',
    storageWarn: 'This phone could not save. Storage may be full or in private mode.',
    illus: 'Simple drawing of {r}'
  }
};
