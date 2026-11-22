{
const C = window.CFG, CATS = C.CATS, CRIM = C.CRIM, INST = C.INST;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pad = n => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const MOISAR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
const MOIS = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'];
const ST = { fl: 'متلبس', prl: 'PR local', prn: 'PR national' };
const DRUG = 31, ARME = 34;

/* ---------- saisies & route field definitions ---------- */
const SZ = [
  ['المخدرات', [['chira', 'الشيرا', 'غ'], ['kif', 'الكيف', 'غ'], ['tabac', 'الطابا', 'غ'], ['maajoun', 'المعجون', 'غ'], ['coc', 'الكوكايين', 'غ'], ['hero', 'الهيروين', 'غ'], ['psy', 'الأقراص المهلوسة', 'وحدة'], ['diss', 'مواد الدوليا (السيليسيون)', 'وحدة']]],
  ['الأسلحة', [['ab', 'السلاح الأبيض', 'وحدة'], ['bomb', 'القنابل المسيلة للدموع', 'وحدة'], ['gourd', 'الهراوات', 'وحدة']]],
  ['الخمور والتهريب', [['alc_sans', 'قرعات بلا طابع جمركي', 'قرعة'], ['alc_avec', 'قرعات بالطابع الجمركي', 'قرعة'], ['alc96', 'الكحول 96°', 'لتر'], ['edv_l', 'ماء الحياة (سائل)', 'لتر'], ['edv_s', 'ماء الحياة (أكياس)', 'لتر'], ['cig', 'السجائر', 'علبة'], ['med', 'الأدوية', 'علبة'], ['carb', 'الكاربورون', 'لتر']]],
  ['المركبات (حدد واش مرتبطة بترويج المخدرات ولا بجريمة أخرى)', [['veh_drug', 'السيارات — مرتبطة بترويج المخدرات', 'وحدة'], ['veh_oth', 'السيارات — جريمة أخرى', 'وحدة'], ['veh_val', 'الثمن التقريبي ديال السيارات', 'درهم'], ['moto_drug', 'الدراجات النارية (حتى ثلاثية العجلات) — مرتبطة بترويج المخدرات', 'وحدة'], ['moto_oth', 'الدراجات النارية (حتى ثلاثية العجلات) — جريمة أخرى', 'وحدة'], ['moto_val', 'الثمن التقريبي ديال الدراجات النارية', 'درهم']]],
  ['أخرى', [['tel', 'التليفونات', 'وحدة'], ['narg', 'النرجيلات', 'وحدة'], ['mont', 'المبالغ المالية', 'درهم']]]
];
const CU1 = [['inf', 'Nombre infractions relevées', 'C'], ['veh_pv', "Véhicules faisant l'objet de procès d'infraction", 'D'], ['veh_atf', "Véhicules acquittés d'amendes forfaitaires", 'E'], ['acc_mort', 'Accidents mortels', 'F'], ['acc_corp', 'Accidents avec dommages corporels', 'G'], ['vic_morts', 'Victimes : morts', 'H'], ['vic_graves', 'Victimes : blessés graves', 'I'], ['vic_legers', 'Victimes : blessés légers', 'J'], ['auteurs', 'Nombre des auteurs interpellés', 'K'], ['atf_dh', 'Montant global des ATF encaissé (DH)', 'L']];
const CU2 = [['four_v', 'Fourrière : véhicules', 'C'], ['four_m', 'Fourrière : motos', 'D'], ['four_t', 'Fourrière : tricycles', 'E'], ['taxis', 'Taxis pointés au niveau du B.taxis', 'F'], ['bus', 'Bus contrôlés', 'G'], ['permis', 'Permis saisis', 'H'], ['radar_j', 'Infractions radars mobiles : JOUR', 'I'], ['radar_n', 'Infractions radars mobiles : NUIT', 'J'], ['ivresse', "Conducteurs interpellés en état d'ivresse", 'K']];
const RT = CU1.concat(CU2).concat([['sanscin', 'الأشخاص بلا بطاقة وطنية'], ['vag', 'المتشردون والمتسولون'], ['alien', 'ذوو العاهات العقلية (المستشفى)'], ['autres', 'محجوزات أخرى كأدلة جنائية'], ['parquet', 'ملفات النيابة العامة'], ['direct', 'القضايا المباشرة']]);

/* ---------- state ---------- */
const S = { date: todayStr(), tab: 'aff', db: null, dl: null, ents: [], secs: {}, hist: [], cfg: { init: {}, from: '' }, form: null, bform: null, iform: null, pform: null, ready: false, err: '' };
const month = d => d.slice(0, 7);
const nextDay = d => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + 1); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const fr = d => d.split('-').reverse().join('/');
const span = d => { const n = nextDay(d); return '\u2066' + d.slice(8) + '-' + n.slice(8) + '/' + n.slice(5, 7) + '/' + n.slice(0, 4) + '\u2069'; };
const spanFile = d => { const n = nextDay(d); return d.slice(8) + '-' + n.slice(8) + '.' + n.slice(5, 7) + '.' + n.slice(0, 4); };
const isClosed = d => !!(S.secs[d] || {}).closed;
const canReopen = d => S.own || (Date.now() - num((S.secs[d] || {}).closedAt)) < 24 * 3600 * 1000;
const reopenBox = d => '<section class="card"><h2>✏️ التعديل</h2>' + (canReopen(d) ? '<p class="muted">' + (S.own ? 'أنت المسؤول: تقدر تعدل فأي وقت.' : 'عندك الحق تعدل خلال 24 ساعة من المصادقة.') + '</p><div class="actions"><button type="button" class="ghost" data-reopen>✏️ عاود فتح النهار باش تعدل</button></div>' : '<p class="need-msg">فاتت 24 ساعة على المصادقة. التعديل غير عند المسؤول.</p>') + '</section>';
const prMissing = d => S.ents.filter(e => e.k === 'pr' && e.d === d && (!String(e.nom || '').trim() || (e.idt === 'cnie' && !String(e.cnie || '').trim()) || !String(e.svcn || '').trim() || (e.sd === 'Message' && !String(e.ref || '').trim()) || XM(e).some(x => !String(x.ref || '').trim() || !String(x.svcn || '').trim()))).length;
function lockMsg(d) { if (isClosed(d)) { toast('حصيلة ' + span(d) + ' مسدودة. عاود فتحها من "الحصيلة اليومية" باش تبدل.'); return true; } return false; }
const sec = d => S.secs[d] || {};
const dayEnts = (d, k) => S.ents.filter(e => e.d === d && e.k === k);

/* ---------- db ---------- */
let unsubs = [], curMonth = '';
function subscribeMonth(m) {
  if (!S.db || m === curMonth) return;
  unsubs.forEach(u => u()); unsubs = []; curMonth = m; S.ents = []; S.secs = {};
  const t = setTimeout(() => { if (!S.ready) { S.err = 'المعلومات ما وصلاتش بعد. تأكد من الأنترنيت.'; render(); } }, 10000);
  unsubs.push(S.db.collection('m/' + m + '/e').onSnapshot(q => { clearTimeout(t); S.ready = true; S.err = ''; S.ents = q.docs.map(x => Object.assign({ id: x.id }, x.data())); render(); }, e => { S.err = 'خطأ فالقراءة: ' + e.code; render(); }));
  unsubs.push(S.db.collection('m/' + m + '/s').onSnapshot(q => { const o = {}; q.docs.forEach(x => o[x.id] = x.data()); S.secs = o; render(); }, () => {}));
  loadHist();
}
async function loadHist() {
  S.hist = [];
  if (!S.db || !S.cfg.from) return;
  const out = []; let m = S.cfg.from;
  while (m < curMonth) {
    try { const q = await S.db.collection('m/' + m + '/e').where('k', '==', 'inst').get(); q.docs.forEach(x => out.push(x.data())); } catch (e) {}
    const [y, mo] = m.split('-').map(Number); m = mo === 12 ? (y + 1) + '-01' : y + '-' + pad(mo + 1);
  }
  S.hist = out; render();
}
async function saveSec(d, patch, force) {
  if (!S.db) return;
  if (!force && lockMsg(d)) return;
  const ref = S.db.doc('m/' + month(d) + '/s/' + d);
  try { await ref.update(patch); } catch (e) { if (e && e.code === 'invalid_argument') { try { await ref.set(patch); } catch (e2) { toast('ما تسجلش: ' + (e2.code || '')); } } else toast('ما تسجلش: ' + (e.code || '')); }
}
async function saveEnt(ent) {
  if (!S.db) { toast('التسجيل ما خدامش هنا'); return false; }
  if (lockMsg(ent.d)) return false;
  const col = S.db.collection('m/' + month(ent.d) + '/e');
  const id = ent.id; const body = Object.assign({}, ent); delete body.id; body.at = Date.now();
  try { if (id) { await col.doc(id).set(body); return id; } const r = col.doc(); await r.set(body); return r.id || r.path.split('/').pop(); }
  catch (e) { toast(e.code === 'invalid_argument' ? 'ما عندكش الحق تكتب فهاد التطبيق' : 'ما تسجلش: ' + e.code); return false; }
}
const newPr = (o) => Object.assign({ k: 'pr', d: S.date, u: 'PJ', prt: '', nom: '', idt: 'cnie', cnie: '', mi: -1, lieu: 'Tiflet', sd: 'Message', nb: 1, ref: '', svc: 'Police', mont: '' }, o || {});
async function syncPr(aff, affId) {
  const want = []; (aff.p || []).forEach(p => { if (p.st === 'prl' || p.st === 'prn') for (let i = 0; i < (num(p.n) || 0); i++) want.push({ prt: p.st, a: p.a }); });
  const have = S.ents.filter(e => e.k === 'pr' && e.aff === affId);
  for (const t of ['prn', 'prl']) {
    const w = want.filter(x => x.prt === t), h = have.filter(x => x.prt === t);
    for (let i = h.length; i < w.length; i++) await saveEnt(newPr({ d: aff.d, u: aff.u, mi: aff.mi, mont: aff.mont || '', prt: t, aff: affId, idt: w[i].a === 'm' ? 'mineur' : 'cnie' }));
    for (const x of h.slice(w.length).filter(x => !x.nom)) await delEnt(x);
    for (const x of h.slice(0, w.length)) if (x.mi !== aff.mi || x.u !== aff.u || num(x.mont) !== num(aff.mont)) await saveEnt(Object.assign({}, x, { mi: aff.mi, u: aff.u, mont: aff.mont || '' }));
  }
  return want.length;
}
const prOrder = l => l.slice().sort((a, b) => (a.prt === 'prn' ? 0 : a.prt === 'prl' ? 1 : 2) - (b.prt === 'prn' ? 0 : b.prt === 'prl' ? 1 : 2) || (a.at || 0) - (b.at || 0));
const montOk = f => { const m = CRIM[f.mi]; return !!m && (m.r === 106 || m.r === 63); };
const refTxt = e => (e.ref || '') + (e.rd && e.rm && e.ry ? '\ndu ' + e.rd + '/' + e.rm + '/' + e.ry : '');
const XM = e => (e.prt === 'prn' && Array.isArray(e.xm)) ? e.xm : [];
const prMotifs = e => { const L = [(CRIM[e.mi] || {}).l || '']; XM(e).forEach(x => { const l = (CRIM[x.mi] || {}).l || ''; if (l && !L.includes(l)) L.push(l); }); return L.filter(Boolean).join(' / '); };
const prRefs = e => [refTxt(e)].concat(XM(e).map(x => refTxt(x))).filter(Boolean).join('\n');
const prSvc = (e, k) => { const L = []; [e].concat(XM(e)).forEach(x => { if ((x.svc || 'Police') === k && x.svcn && !L.includes(x.svcn)) L.push(x.svcn); }); return L.length ? L.join(' / ') : (e.svc === k ? 'X' : null); };
const prNb = e => e.sd === 'Message' ? 1 + XM(e).length : null;
const nmSplit = e => { if (e.nm != null || e.pn != null) return [e.nm || '', e.pn || '']; const t = String(e.nom || '').trim().split(/\s+/); return [t[0] || '', t.slice(1).join(' ')]; };
const idTxt = e => e.idt === 'mineur' ? 'Mineur' : e.idt === 'dep' ? 'Dépourvu de CNIE' : (e.cnie || '');
async function delEnt(e) { try { await S.db.doc('m/' + month(e.d) + '/e/' + e.id).delete(); if (e.k === 'aff' || e.k === 'bar') for (const x of S.ents.filter(y => y.k === 'pr' && y.aff === e.id)) await S.db.doc('m/' + month(x.d) + '/e/' + x.id).delete(); } catch (x) { toast('ما تحيدش'); } }

/* ---------- aggregation ---------- */
function pers(e) {
  const o = { fl: 0, prl: 0, prn: 0, am: 0, af: 0, mm: 0, mf: 0, tot: 0 };
  (e.p || []).forEach(p => { const n = num(p.n) || 0; o[p.st] += n; o[(p.a === 'm' ? 'm' : 'a') + p.s] += n; o.tot += n; });
  o.rech = o.prl + o.prn; return o;
}
const EXJ = 82;
function agg(list) {
  const z = () => ({ aff: 0, cnt: 0, res: 0, fl: 0, rech: 0, prn: 0, prl: 0, tot: 0, am: 0, af: 0, mm: 0, mf: 0, vam: 0, vaf: 0, vmm: 0, vmf: 0, cons: 0, traf: 0, affMin: 0 });
  const r = { all: z(), PJ: z(), SP: z(), cat: {}, crim: {} };
  list.forEach(e => {
    const p = pers(e), m = CRIM[e.mi] || CRIM[CRIM.length - 1];
    [r.all, r[e.u] || r.all, (r.cat[m.c] = r.cat[m.c] || z()), (r.crim[m.r] = r.crim[m.r] || z())].forEach((t, i) => {
      if (i === 1 && !r[e.u]) return;
      t.aff += (e.rg === 'o' || e.mi === EXJ) ? 0 : num(e.n); t.cnt += num(e.n); t.res += (e.res == null ? num(e.n) : num(e.res)); t.fl += p.fl; t.rech += p.rech; t.prn += p.prn; t.prl += p.prl; t.tot += p.tot;
      t.am += p.am; t.af += p.af; t.mm += p.mm; t.mf += p.mf;
      const v = e.v || {}; t.vam += num(v.am); t.vaf += num(v.af); t.vmm += num(v.mm); t.vmf += num(v.mf);
      if (m.c === DRUG) { if (e.dn === 't') t.traf += p.tot; else t.cons += p.tot; }
      if (p.mm + p.mf > 0) t.affMin += num(e.n);
    });
  });
  return r;
}
function sumSec(days, path) { let t = 0; days.forEach(d => { let o = sec(d); path.split('.').forEach(k => o = o ? o[k] : 0); t += num(o); }); return t; }
function instCum(upTo) {
  const st = {}, add = (mi, t, u, i, o) => { st[mi] = st[mi] || { ins: { PJ: { i: 0, o: 0 }, SP: { i: 0, o: 0 } }, ren: { PJ: { i: 0, o: 0 }, SP: { i: 0, o: 0 } } }; st[mi][t][u].i += i; st[mi][t][u].o += o; };
  Object.keys(S.cfg.init || {}).forEach(mi => { const o = S.cfg.init[mi]; ['ins', 'ren'].forEach(t => ['PJ', 'SP'].forEach(u => add(mi, t, u, num(o[t + '_' + u + '_in']) + num(o[t + '_' + u]), num(o[t + '_' + u + '_out'])))); });
  S.hist.concat(S.ents.filter(e => e.k === 'inst')).forEach(e => { if (e.d <= upTo) add(e.mi, e.t, e.u, num(e.in), num(e.out)); });
  return st;
}
function instStock(upTo) {
  const c = instCum(upTo), st = {};
  Object.keys(c).forEach(mi => { st[mi] = {}; ['ins', 'ren'].forEach(t => { st[mi][t] = {}; ['PJ', 'SP'].forEach(u => st[mi][t][u] = c[mi][t][u].i - c[mi][t][u].o); }); });
  return st;
}

/* ---------- UI helpers ---------- */
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3200); }
const seg = (name, val, opts) => '<div class="seg" data-seg="' + name + '">' + opts.map(o => '<button type="button" class="' + (o[0] === val ? 'on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
const sel = (name, val, opts, cls) => '<select class="' + (cls || '') + '" data-f="' + name + '">' + opts.map(o => '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => [a + i, a + i]);
function motifPicker(list, mi, key, req) {
  const cur = list[mi], groups = [];
  list.forEach((m, i) => { let g = groups.find(x => x[0] === m.g); if (!g) groups.push(g = [m.g, []]); g[1].push([m, i]); });
  const all = '<select class="msel" aria-label="لائحة الموتيفات"><option value="">— ولا ختار من اللائحة كاملة —</option>' + groups.map(([g, ms]) => '<optgroup label="' + esc(g) + '">' + ms.map(([m, i]) => '<option value="' + i + '"' + (i === mi ? ' selected' : '') + '>' + esc(m.l) + (m.a ? ' — ' + esc(m.a) : '') + '</option>').join('') + '</optgroup>').join('') + '</select>';
  return '<div class="picker' + (cur || !req ? '' : ' need') + '" data-pick="' + key + '"><input class="search" type="search" placeholder="قلب بسرعة… (vol، سرقة، chira، شيك…)" value="">' + all + '<div class="cur">' + (cur ? esc(cur.l) + (cur.a ? ' <span class="ar">' + esc(cur.a) + '</span>' : '') + (cur.c != null ? ' <small>← ' + esc(CATS[cur.c]) + '</small>' : '') : (req ? '<i>الموتيف إجباري: قلب عليه ولا ختارو من اللائحة</i>' : '<i>ما مختار حتى موتيف (اختياري)</i>')) + '</div><div class="opts"></div></div>';
}
function bindPicker(root, list, onPick) {
  root.querySelectorAll('.picker').forEach(pk => {
    const inp = pk.querySelector('.search'), box = pk.querySelector('.opts');
    const show = () => {
      const q = norm(inp.value.trim()); if (!q) { box.innerHTML = ''; return; }
      const words = q.split(/\s+/);
      const hits = list.map((m, i) => [m, i]).filter(([m]) => words.every(w => norm(m.l + ' ' + m.g + ' ' + (m.a || '') + ' ' + (m.c != null ? CATS[m.c] : '')).includes(w))).slice(0, 12);
      box.innerHTML = hits.length ? hits.map(([m, i]) => '<button type="button" data-i="' + i + '"><span>' + esc(m.l) + (m.a ? '<em>' + esc(m.a) + '</em>' : '') + '</span><small>' + esc(m.g) + '</small></button>').join('') : '<p class="muted">ما كاين حتى نتيجة</p>';
    };
    inp.addEventListener('input', show);
    box.addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) onPick(+b.dataset.i); });
    const ms = pk.querySelector('.msel'); if (ms) ms.addEventListener('change', () => { if (ms.value !== '') { ms.blur(); onPick(+ms.value); } });
  });
}

/* ---------- panels ---------- */
function gavRows(d) { const s = sec(d); if (s.gavr) return s.gavr; const r = []; const g = s.gav || {}; ['pj', 'sp'].forEach(u => ['am', 'af', 'mm', 'mf'].forEach(k => { const n = num((g[u] || {})[k]); if (n) r.push({ u: u.toUpperCase(), a: k[0], s: k[1], n }); })); return r; }
function gavSum(days, u, k) { let t = 0; days.forEach(d => gavRows(d).forEach(r => { if ((!u || r.u === u) && (!k || (r.a + r.s) === k)) t += num(r.n); })); return t; }
function justRows(d) { return (sec(d).justr) || []; }
function pJustice() {
  const rows = S.just || (S.just = JSON.parse(JSON.stringify(justRows(S.date))));
  const jr = rows.map((r, i) => '<div class="prow j" data-ji="' + i + '">' + sel('st', r.st, [['det', 'حالة اعتقال'], ['lib', 'حالة سراح']]) + sel('ct', r.ct, [['tpi', 'ابتدائية تيفلت'], ['ca', 'استئنافية الرباط']]) + sel('n', r.n, range(1, 30), 'small') + '<button type="button" class="x" data-jdel="' + i + '" aria-label="حيد">×</button></div>').join('');
  const t = f => rows.filter(f).reduce((a, r) => a + num(r.n), 0);
  return '<section class="card"><h2>الأشخاص المقدمون أمام العدالة</h2>' + (rows.length ? jr : '<p class="empty">ما كاين حتى واحد.</p>') + '<button type="button" class="ghost" data-jadd>+ إضافة</button>' +
    '<div class="sum" style="margin-top:12px"><span>المجموع: <b>' + t(() => 1) + '</b></span><span>حالة اعتقال: <b>' + t(r => r.st === 'det') + '</b></span><span>حالة سراح: <b>' + t(r => r.st === 'lib') + '</b></span><span>الابتدائية: <b>' + t(r => r.ct === 'tpi') + '</b></span><span>الاستئنافية: <b>' + t(r => r.ct === 'ca') + '</b></span></div></section>';
}
function sumBox() {
  const A = agg(dayEnts(S.date, 'aff')), rows = S.just || justRows(S.date), t = f => rows.filter(f).reduce((a, r) => a + num(r.n), 0);
  const cell = (u, v) => '<div class="sb ' + u.toLowerCase() + '"><span>' + u + '</span><b>' + v + '</b></div>';
  const col = (h, k) => '<div class="sbc"><h4>' + h + '</h4>' + cell('SP', A.SP[k]) + cell('PJ', A.PJ[k]) + '</div>';
  const cell2 = u => '<div class="sb ' + u.toLowerCase() + '"><span>' + u + '</span><div class="nl"><div><small>وطنيا</small><b>' + A[u].prn + '</b></div><div><small>محليا</small><b>' + A[u].prl + '</b></div></div></div>';
  return '<section class="card sumbox"><h2>ملخص القضايا والموقوفين (كيتحسب بوحدو)</h2><div class="sbg">' + col('القضايا', 'aff') + col('Flagrant Délit', 'fl') + '<div class="sbc"><h4>Recherchées</h4>' + cell2('SP') + cell2('PJ') + '</div>' + '<div class="sbt"><span>المجموع</span><b>' + A.all.tot + '</b><small>موقوف</small></div></div>' +
    '<div class="sbg2"><div class="sb det"><span>المقدمون أمام العدالة — حالة اعتقال</span><b>' + t(r => r.st === 'det') + '</b></div><div class="sb lib"><span>المقدمون أمام العدالة — حالة سراح</span><b>' + t(r => r.st === 'lib') + '</b></div></div></section>';
}
function pExamGav() {
  const s = sec(S.date), ex = s.exam || {}, rows = S.gav || (S.gav = JSON.parse(JSON.stringify(gavRows(S.date))));
  const gr = rows.map((r, i) => '<div class="prow g" data-gi="' + i + '">' + sel('u', r.u, [['PJ', 'PJ'], ['SP', 'SP']]) + sel('a', r.a, [['a', 'راشد'], ['m', 'قاصر']]) + sel('s', r.s, [['m', 'ذكر'], ['f', 'أنثى']]) + sel('n', r.n, range(1, 30), 'small') + '<button type="button" class="x" data-gdel="' + i + '" aria-label="حيد">×</button></div>').join('');
  const t = u => rows.filter(r => !u || r.u === u).reduce((a, r) => a + num(r.n), 0);
  const legacy = ex.a1 == null && ex.a2 == null && num(ex.sp);
  return '<section class="card"><h2>التحقق من الهوية</h2><div class="grid3"><label>PJ<input type="number" inputmode="numeric" min="0" data-sec="exam.pj" value="' + (ex.pj || '') + '"></label><label>SP — الدائرة الأولى<input type="' + (S.exMan ? 'number' : 'text') + '" inputmode="numeric" min="0" data-sec="exam.a1" value="' + (ex.a1 == null ? (S.exMan ? '' : '0') : ex.a1) + '"' + (S.exMan ? '' : ' disabled') + '></label><label>SP — الدائرة الثانية<input type="' + (S.exMan ? 'number' : 'text') + '" inputmode="numeric" min="0" data-sec="exam.a2" value="' + (ex.a2 == null ? (S.exMan ? '' : '0') : ex.a2) + '"' + (S.exMan ? '' : ' disabled') + '></label></div>' +
    (S.own ? '<label class="chkl"><input type="checkbox" data-exman' + (S.exMan ? ' checked' : '') + '> ✍️ نعمر SP بيدي (إلا الدوائر ما عمروش)</label>' : '') +
    (legacy ? '<p class="muted">SP (قبل التفريق): <b>' + num(ex.sp) + '</b></p>' : '') +
    '<p class="total">PJ: <b>' + num(ex.pj) + '</b> · SP: <b>' + num(ex.sp) + '</b> · المجموع: <b>' + (num(ex.pj) + num(ex.sp)) + '</b></p><p class="muted">SP = الدائرة الأولى + الدائرة الثانية. الدوائر كيعمروه فالتطبيق ديالهم، وكيتدوز لهنا.</p></section>' +
    '<section class="card"><h2>الحراسة النظرية (G.A.V)</h2>' + (rows.length ? gr : '<p class="empty">ما كاين حتى واحد فالحراسة النظرية.</p>') + '<button type="button" class="ghost" data-gadd>+ شخص</button><div class="sum" style="margin-top:12px"><span>PJ: <b>' + t('PJ') + '</b></span><span>SP: <b>' + t('SP') + '</b></span><span>المجموع: <b>' + t() + '</b></span><span>نساء: <b>' + rows.filter(r => r.s === 'f').reduce((a, r) => a + num(r.n), 0) + '</b></span><span>قاصرين: <b>' + rows.filter(r => r.a === 'm').reduce((a, r) => a + num(r.n), 0) + '</b></span></div></section>';
}
function pOther() {
  const s = sec(S.date);
  return '<section class="card"><h2>التقارير والبطاقات التقنية</h2><div class="grid2"><label>عدد التقارير<input type="number" inputmode="numeric" min="0" data-sec="act.rap" value="' + ((s.act || {}).rap || '') + '"></label><label>عدد البطاقات التقنية<input type="number" inputmode="numeric" min="0" data-sec="act.fiche" value="' + ((s.act || {}).fiche || '') + '"></label></div></section>' + pJustice();
}
function newAff(k) { return { k, d: S.date, u: 'PJ', mi: -1, n: 1, res: 1, p: [{ st: 'fl', a: 'a', s: 'm', n: 1 }], v: {}, dn: 'c' }; }
function affForm(f, fk) {
  const m = CRIM[f.mi];
  const pr = f.p.map((p, i) => '<div class="prow" data-i="' + i + '">' + sel('st', p.st, [['fl', 'متلبس'], ['prl', 'PR local'], ['prn', 'PR national']]) + sel('a', p.a, [['a', 'راشد'], ['m', 'قاصر']]) + sel('s', p.s, [['m', 'ذكر'], ['f', 'أنثى']]) + sel('n', p.n, range(1, 10), 'small') + '<button type="button" class="x" data-del="' + i + '" aria-label="حيد">×</button></div>').join('');
  const v = f.v || {};
  return '<section class="card form" data-form="' + fk + '"><h2>' + (f.id ? 'تعديل القضية' : 'قضية جديدة') + '</h2>' +
    (f.k === 'bar' ? '' : '<div class="row"><span class="lab">المصلحة</span>' + seg('u', f.u, [['PJ', 'PJ'], ['SP', 'SP']]) + '</div>' + (f.u === 'SP' ? '<div class="row' + (f.arr ? '' : ' needrow') + '"><span class="lab">الدائرة (ضروري)</span>' + seg('arr', f.arr, [['A1', 'الدائرة الأولى'], ['A2', 'الدائرة الثانية']]) + '</div>' : '')) +
    '<div class="row col"><span class="lab">الموتيف</span>' + motifPicker(CRIM, f.mi, fk, true) + '</div>' +
    (montOk(f) ? '<div class="mont"><label>Montant (Dhs) — المبلغ ديال ' + (m.r === 106 ? 'الإكراه البدني' : 'الشيك') + ' (اختياري، إلا كان)<input type="number" inputmode="decimal" min="0" data-am="mont" value="' + esc(f.mont || '') + '" placeholder="0"></label></div>' : '') +
    (m && m.c === DRUG ? '<div class="row"><span class="lab">نوع قضية المخدرات</span>' + seg('dn', f.dn, [['c', 'استهلاك'], ['t', 'اتجار']]) + '</div>' : '') +
    (f.mi === EXJ ? '<p class="muted">Extrait de jugement: كتتحسب غير فـ AFFAIRES RESOLUES، ما كتتحسبش فـ SURVENUES.</p>' : '') + '<div class="grid2"><label>عدد القضايا' + sel('n', f.n, range(1, 10)) + '</label><label>منها محلولة' + sel('res', f.res == null ? f.n : f.res, range(0, 10)) + '</label></div>' +
    '<h3>الأشخاص</h3><div class="plist">' + pr + '</div><button type="button" class="ghost" data-add="p">+ شخص</button>' +
    '<details open><summary>الضحايا (عمّرهم إلا كانوا)</summary><div class="grid4">' + [['am', 'راشد ذكر'], ['af', 'راشد أنثى'], ['mm', 'قاصر ذكر'], ['mf', 'قاصر أنثى']].map(([k, l]) => '<label>' + l + '<input type="number" inputmode="numeric" min="0" data-v="' + k + '" value="' + (v[k] || '') + '"></label>').join('') + '</div></details>' +
    (f.mi < 0 ? '<p class="need-msg">ختار الموتيف باش تبان بوطونة التسجيل.</p>' : '<div class="actions"><button type="button" class="primary" data-save>' + (f.id ? 'حفظ التعديل' : 'سجل القضية') + '</button>' + (f.id ? '<button type="button" class="ghost" data-cancel>إلغاء</button>' : '') + '</div>') + '</section>';
}
function affList(list, fk) {
  if (!list.length) return '<p class="empty">ما كاينة حتى قضية مسجلة فهاد النهار.</p>';
  return '<ul class="list">' + list.map(e => { const p = pers(e), m = CRIM[e.mi] || { l: '?' };
    return '<li><div><b>' + esc(m.l) + '</b>' + (m.a ? ' <span class="ar">' + esc(m.a) + '</span>' : '') + '<div class="chips">' + (e.k === 'bar' ? '' : '<span class="ch u">' + esc(e.u) + '</span>') + '<span class="ch a">Affaires: ' + e.n + '</span>' + '<span class="ch f">FD: ' + p.fl + ' | Rech: ' + p.rech + '</span></div><small>' + p.tot + ' شخص' + (p.fl ? ' · متلبس ' + p.fl : '') + (p.prl ? ' · PR local ' + p.prl : '') + (p.prn ? ' · PR national ' + p.prn : '') + (p.mm + p.mf ? ' · قاصرين ' + (p.mm + p.mf) : '') + (p.af + p.mf ? ' · إناث ' + (p.af + p.mf) : '') + '</small></div><span class="btns"><button type="button" data-edit="' + e.id + '" data-fk="' + fk + '">تعديل</button><button type="button" class="del" data-rm="' + e.id + '">حذف</button></span></li>'; }).join('') + '</ul>';
}
function totalsLine(list) { const a = agg(list); return '<div class="sum"><span>PJ: <b>' + a.PJ.aff + '</b> قضية / <b>' + a.PJ.tot + '</b> شخص</span><span>SP: <b>' + a.SP.aff + '</b> قضية / <b>' + a.SP.tot + '</b> شخص</span><span>المجموع: <b>' + a.all.aff + '</b> / <b>' + a.all.tot + '</b> (متلبس ' + a.all.fl + '، مبحوث ' + a.all.rech + ')</span></div>'; }
function pAff() {
  if (!S.form) S.form = newAff('aff');
  const list = dayEnts(S.date, 'aff');
  const miss = dayEnts(S.date, 'pr').filter(e => !e.nom).length;
  return pExamGav() + (miss ? '<div class="note">' + miss + ' مبحوث عنهم تزادو للائحة ETAT NOMINATIF، خاصهم الاسم والبطاقة. <button type="button" data-goto="pr">كمل المعلومات ديالهم</button></div>' : '') + affForm(S.form, 'form') + '<section class="card"><h2>القضايا ديال النهار</h2>' + totalsLine(list) + affList(list, 'form') + '</section>' + sumBox();
}
function recap(sk, defs, title) {
  const o = sec(S.date)[sk] || {}, items = defs.filter(([k]) => num(o[k]));
  return '<section class="card recap"><h2>' + title + '</h2>' + (items.length ? '<ul class="list">' + items.map(([k, l, u]) => '<li><div><b>' + esc(l) + '</b><div class="chips"><span class="ch a">' + num(o[k]) + (u ? ' ' + esc(u) : '') + '</span></div></div><span class="btns"><button type="button" class="del" data-zdel="' + sk + '.' + k + '">حذف</button></span></li>').join('') + '</ul>' : '<p class="empty">باقي ما تدخل والو.</p>') + '</section>';
}
const SZB = [['sz', 'الشرطة القضائية (PJ)'], ['szA1', 'الدائرة الأولى (SP)'], ['szA2', 'الدائرة الثانية (SP)']];
function szMerged(s) { const o = {}; SZB.forEach(([b]) => Object.entries((s || {})[b] || {}).forEach(([k, v]) => { if (v != null && v !== '') o[k] = num(o[k]) + num(v); })); return o; }
function pSz() {
  const b = S.szb, sx = sec(S.date);
  const head = '<section class="card"><label>المصلحة (ضروري)<select data-szsel><option value="">— ختار المصلحة —</option>' + SZB.map(([k, l]) => '<option value="' + k + '"' + (k === b ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' + (b ? '' : '<p class="need-msg">ختار المصلحة باش تبان الخانات ديال المحجوزات.</p>') + '</section>';
  const z = b ? (sx[b] || {}) : {};
  const forms = b ? SZ.map(([t, fs]) => '<section class="card"><h2>' + t + ' — ' + SZB.find(x => x[0] === b)[1] + '</h2><div class="grid2">' + fs.map(([k, l, u]) => '<label>' + l + ' <small>(' + u + ')</small><input type="number" inputmode="decimal" min="0" step="any" data-sec="' + b + '.' + k + '" value="' + (z[k] || '') + '"></label>').join('') + '</div></section>').join('') : '';
  const defs = SZ.flatMap(([, fs]) => fs).map(([k, l, u]) => [k, l, u]);
  return head + forms + SZB.map(([bb, l]) => recap(bb, defs, 'حصيلة المحجوزات ديال النهار — ' + l)).join('');
}
function pBar() {
  if (!S.bform) S.bform = newAff('bar');
  const b = sec(S.date).bar || {}, list = dayEnts(S.date, 'bar');
  const B = agg(list);
  return '<section class="card"><h2>السدود القضائية</h2><div class="grid2"><label>عدد السدود<input type="number" inputmode="numeric" min="0" data-sec="bar.nb" value="' + (b.nb == null ? 1 : b.nb) + '"></label><label>المركبات اللي تفحصات<input type="number" inputmode="numeric" min="0" data-sec="bar.veh" value="' + (b.veh || '') + '"></label></div>' + (b.nb == null ? '<p class="muted">السدود كتبدا بـ 1. بدل الرقم إلى كانت حملة.</p>' : '') + '</section>' + affForm(S.bform, 'bform') + '<section class="card"><h2>قضايا السد القضائي ديال النهار</h2><div class="sum"><span>القضايا: <b>' + B.all.aff + '</b></span><span>الأشخاص: <b>' + B.all.tot + '</b></span><span>متلبس: <b>' + B.all.fl + '</b></span><span>مبحوث: <b>' + B.all.rech + '</b></span></div>' + affList(list, 'bform') + '</section>';
}
function pRt() {
  const r = sec(S.date).rt || {};
  const AR = {"inf": "عدد المخالفات المضبوطة", "veh_pv": "المركبات موضوع محاضر المخالفات", "veh_atf": "المركبات اللي أدات الغرامات الجزافية", "acc_mort": "الحوادث المميتة", "acc_corp": "الحوادث بأضرار جسمانية", "vic_morts": "الضحايا: القتلى", "vic_graves": "الضحايا: جروح خطيرة", "vic_legers": "الضحايا: جروح خفيفة", "auteurs": "عدد المتسببين الموقوفين", "atf_dh": "المبلغ الإجمالي للغرامات الجزافية (درهم) — كتعمرو الهيئة الحضرية", "four_v": "المحجز: السيارات", "four_m": "المحجز: الدراجات النارية", "four_t": "المحجز: الدراجات ثلاثية العجلات", "taxis": "الطاكسيات المراقبة فالمحطة", "bus": "الحافلات المراقبة", "permis": "رخص السياقة المحجوزة", "radar_j": "مخالفات الرادار المتنقل: بالنهار", "radar_n": "مخالفات الرادار المتنقل: بالليل", "ivresse": "السائقين الموقوفين فحالة سكر — كتعمرو مصلحة حوادث السير"};
  const f = list => '<div class="grid2">' + list.map(([k, l]) => '<label>' + (AR[k] ? AR[k] + ' <small class="frl">' + l + '</small>' : l) + '<input type="number" inputmode="decimal" min="0" step="any" data-sec="rt.' + k + '" value="' + (r[k] || '') + '"></label>').join('') + '</div>';
  return '<p class="muted" style="margin:0 0 10px">الهيئة الحضرية ومصلحة حوادث السير — Annexe n°3</p><section class="card"><h2>مصلحة حوادث السير — الجدول 1 <small class="frl">Tableau N°1 · Bilan des accidents de circulation</small></h2>' + f(CU1) + '</section>' +
    '<section class="card"><h2>الهيئة الحضرية — الجدول 2 <small class="frl">Tableau N°2</small></h2>' + f(CU2) + '</section>' +
    '<details class="card"><summary><b>معلومات أخرى للستاتيستيك مونسييل</b> (اختياري)</summary>' + f(RT.slice(CU1.length + CU2.length)) + '</details>' + recap('rt', RT.map(([k, l]) => [k, AR[k] || l, '']), 'حصيلة الهيئة الحضرية وحوادث السير ديال النهار');
}
function pInst() {
  const T = S.instT || 'ins', TL = T === 'ins' ? 'التعليمات' : 'الإحالات';
  if (!S.iform || S.iform.t !== T && !S.iform.id) S.iform = { k: 'inst', d: S.date, t: T, u: (S.iform || {}).u || 'PJ', mi: -1, in: 0, out: 0 };
  const f = S.iform, list = dayEnts(S.date, 'inst').filter(e => e.t === T), cum = instCum(S.date), init = S.cfg.init || {};
  const tot = { i: 0, o: 0 }, rows = [];
  INST.forEach((m, i) => { const c = cum[i]; if (!c) return; const x = c[T], ii = x.PJ.i + x.SP.i, oo = x.PJ.o + x.SP.o; if (ii || oo) { rows.push([m, ii, oo, x]); tot.i += ii; tot.o += oo; } });
  const today = list.reduce((a, e) => (a.i += num(e.in), a.o += num(e.out), a), { i: 0, o: 0 });
  return pOther() + '<div class="seg big" data-instt>' + [['ins', 'تعليمات النيابة العامة'], ['ren', 'الإحالات']].map(o => '<button type="button" data-it="' + o[0] + '" class="' + (o[0] === T ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div>' +
    '<section class="card"><h2>' + TL + ': فين واصلين (حتى ' + S.date.split('-').reverse().join('/') + ')</h2><div class="kpis k3"><div><b>' + tot.i + '</b><span>دخل</span></div><div><b>' + tot.o + '</b><span>خرج (تعالج)</span></div><div class="hl"><b>' + (tot.i - tot.o) + '</b><span>باقي فالانتظار</span></div></div><p class="muted">اليوم: دخل ' + today.i + ' · خرج ' + today.o + '</p></section>' +
    '<section class="card form" data-form="iform"><h2>' + (f.id ? 'تعديل' : 'تسجيل') + ' ' + TL + ' ديال النهار</h2>' +
    (T === 'ren' ? '<div class="row' + (f.arr ? '' : ' needrow') + '"><span class="lab">الدائرة (ضروري)</span>' + seg('arr', f.arr, [['A1', 'الدائرة الأولى'], ['A2', 'الدائرة الثانية']]) + '</div>' : '<div class="row' + (f.ct ? '' : ' needrow') + '"><span class="lab">المحكمة (ضروري)</span>' + seg('ct', f.ct, [['tpi', 'الابتدائية'], ['ca', 'الاستئناف']]) + '</div>') +
    '<div class="row col"><span class="lab">الموتيف</span>' + motifPicker(INST, f.mi, 'iform') + '</div>' +
    '<div class="grid2"><label>شحال دخل<input type="number" inputmode="numeric" min="0" data-i="in" value="' + (f.in || '') + '"></label><label>شحال خرج (تعالج)<input type="number" inputmode="numeric" min="0" data-i="out" value="' + (f.out || '') + '"></label></div>' +
    '<div class="actions"><button type="button" class="primary" data-isave>' + (f.id ? 'حفظ التعديل' : 'سجل') + '</button>' + (f.id ? '<button type="button" class="ghost" data-icancel>إلغاء</button>' : '') + '</div>' +
    (list.length ? '<ul class="list">' + list.map(e => '<li><div><b>' + esc((INST[e.mi] || {}).l) + '</b><div class="chips"><span class="ch u">' + (e.t === 'ren' ? ({ A1: 'الدائرة الأولى', A2: 'الدائرة الثانية' }[e.arr] || '—') : ({ tpi: 'الابتدائية', ca: 'الاستئناف' }[e.ct] || '—')) + '</span><span class="ch a">دخل: ' + num(e.in) + '</span><span class="ch f">خرج: ' + num(e.out) + '</span></div></div><span class="btns"><button type="button" data-iedit="' + e.id + '">تعديل</button><button type="button" class="del" data-rm="' + e.id + '">حذف</button></span></li>').join('') + '</ul>' : '') + '</section>' +
    '<section class="card"><h2>' + TL + ' حسب الموتيف</h2>' + (rows.length ? '<div class="scroll"><table><thead><tr><th>الموتيف</th><th>دخل</th><th>خرج</th><th>باقي</th></tr></thead><tbody>' + rows.map(([m, i, o]) => '<tr><td>' + esc(m.l) + '</td><td>' + i + '</td><td>' + o + '</td><td><b>' + (i - o) + '</b></td></tr>').join('') + '<tr><td><b>المجموع</b></td><td><b>' + tot.i + '</b></td><td><b>' + tot.o + '</b></td><td><b>' + (tot.i - tot.o) + '</b></td></tr></tbody></table></div>' : '<p class="empty">باقي ما تدخل والو. بدا بالرصيد ديال البداية لتحت.</p>') + '</section>' +
    (!S.own ? '' : '<details class="card initd"' + (S.initOpen || (S.initOpen == null && !rows.length) ? ' open' : '') + '><summary><b>الرصيد ديال البداية — ' + TL + '</b>: شحال دخل وشحال خرج من أول العام حتى قبل ما تبداو بالتطبيق</summary><label class="inline">التطبيق كيبدا الحساب من شهر<input type="month" data-cfg="from" value="' + esc(S.cfg.from || '') + '"></label><p class="muted">عمر غير الموتيفات اللي فيهم شي حاجة. الباقي كيتحسب بوحدو: دخل − خرج.</p><div class="scroll"><table class="init"><thead><tr><th>الموتيف</th><th>دخل PJ</th><th>خرج PJ</th><th>دخل SP</th><th>خرج SP</th></tr></thead><tbody>' +
    INST.map((m, i) => '<tr><td>' + esc(m.l) + '</td>' + [T + '_PJ_in', T + '_PJ_out', T + '_SP_in', T + '_SP_out'].map(k => '<td><input type="number" inputmode="numeric" min="0" data-init="' + i + '.' + k + '" value="' + ((init[i] || {})[k] || '') + '"></td>').join('') + '</tr>').join('') + '</tbody></table></div></details>');
}

/* المبحوث عنهم ديال الشهر حسب الموتيف (نفس ترتيب الطابلو ديالكم): وطنيا / محليا PV / محليا تعليمات */
const PRG = [[0, 8, 'Atteinte à la personne'], [9, 18, 'Atteinte aux biens'], [19, 25, 'Atteinte à la famille et aux mœurs'], [26, 30, 'Infractions économiques et financières'], [31, 36, 'Infractions à la réglementation générale'], [37, 37, 'Autres infractions']];
function prByMotif() {
  const m = month(S.date), z = () => ({ aff: 0, n: 0, pv: 0, ins: 0, u: 0 }), rows = CATS.map(z), T = z();
  S.ents.filter(e => (e.k === 'aff' || e.k === 'bar') && month(e.d) === m).forEach(e => {
    const p = pers(e); if (!p.prn && !p.prl) return;
    const c = (CRIM[e.mi] || CRIM[CRIM.length - 1]).c, r = rows[c] || rows[37];
    const prs = S.ents.filter(x => x.k === 'pr' && x.aff === e.id && x.prt === 'prl');
    const pv = prs.filter(x => x.sd === 'PV').length, ins = prs.filter(x => /^Instruction/.test(x.sd || '')).length;
    const add = (o) => { const ii = Math.min(ins, p.prl); o.aff += num(e.n); o.n += p.prn; o.ins += ii; o.pv += p.prl - ii; };
    add(r); add(T);
  });
  S.ents.filter(x => x.k === 'pr' && month(x.d) === m && XM(x).length).forEach(x => { const c0 = (CRIM[x.mi] || {}).c, seen = [c0]; XM(x).forEach(y => { const c = (CRIM[y.mi] || {}).c; if (c == null || seen.includes(c)) return; seen.push(c); (rows[c] || rows[37]).n += 1; }); });
  return { rows, T };
}
function prMonthBox() {
  const R = prByMotif(), m = month(S.date), T = R.T, U = T.u > 0;
  const tr = o => '<td>' + o.aff + '</td><td>' + o.n + '</td><td>' + o.pv + '</td><td>' + o.ins + '</td>' + (U ? '<td>' + o.u + '</td>' : '') + '<td><b>' + (o.n + o.pv + o.ins + o.u) + '</b></td>';
  const body = PRG.map(([a, b, g]) => { const rs = []; for (let i = a; i <= b; i++) { const o = R.rows[i]; rs.push('<tr><td>' + esc(CATS[i]) + '</td>' + tr(o) + '</tr>'); } return rs.length ? '<tr class="g"><td colspan="' + (U ? 7 : 6) + '">' + g + '</td></tr>' + rs.join('') : ''; }).join('');
  return '<section class="card"><h2>المبحوث عنهم ديال ' + MOISAR[+m.slice(5) - 1] + ' حسب الموتيف</h2>' +
    '<div class="sum"><span>المجموع: <b>' + (T.n + T.pv + T.ins + T.u) + '</b></span><span>وطنيا: <b>' + T.n + '</b></span><span>محليا PV: <b>' + T.pv + '</b></span><span>محليا تعليمات: <b>' + T.ins + '</b></span>' + (U ? '<span>محليا (ما محددش): <b>' + T.u + '</b></span>' : '') + '</div>' +
    (body ? '<table class="rt rc prt" dir="ltr"><tr><th rowspan="2">Infractions</th><th rowspan="2">Nb<br>aff.</th><th rowspan="2">Rech.<br>nat.</th><th colspan="' + (U ? 3 : 2) + '">Rech. local</th><th rowspan="2">Total</th></tr><tr><th>PV</th><th>Instr.<br>parq.</th>' + (U ? '<th>Non<br>préc.</th>' : '') + '</tr>' + body + '<tr class="s"><td>Totaux</td>' + tr(T) + '</tr></table>' : '<p class="empty">ما كاين حتى مبحوث عنه هاد الشهر.</p>') +
     '<p class="muted">Nb aff. = Nombre d\'affaires · Rech. nat. = Recherchés national · Rech. local = Recherchés local · Instr. parq. = Instructions parquet</p>' + (U ? '<p class="muted">"Non préc." = مبحوث عنهم محليين ما تحددش فيهم واش PV ولا Instructions parquet (ناقصين فلائحة ETAT NOMINATIF).</p>' : '') +
    '<div class="actions"><button type="button" class="primary" data-xprmot>⬇ تحميل Excel (حسب الموتيف + لائحة الأسماء)</button></div></section>';
}
/* xlsx بسيط بلا موديل */
function xlsxSheet(rows) {
  const mg = rows.merges ? '<mergeCells count="' + rows.merges.length + '">' + rows.merges.map(r => '<mergeCell ref="' + r + '"/>').join('') + '</mergeCells>' : '';
  const col = i => String.fromCharCode(65 + i), x = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="0"/></sheetViews><cols><col min="1" max="1" width="48" customWidth="1"/><col min="2" max="8" width="18" customWidth="1"/></cols><sheetData>' +
    rows.map((r, i) => '<row r="' + (i + 1) + '">' + r.map((v, j) => typeof v === 'number' ? '<c r="' + col(j) + (i + 1) + '"' + (i === 0 ? ' s="1"' : '') + '><v>' + v + '</v></c>' : '<c r="' + col(j) + (i + 1) + '" t="inlineStr"' + (i === 0 || (rows.merges && i === 1) || r[0] === 'TOTAL' || r.length === 1 ? ' s="1"' : '') + '><is><t xml:space="preserve">' + x(v) + '</t></is></c>').join('') + '</row>').join('') + '</sheetData>' + mg + '</worksheet>';
}
async function simpleXlsx(sheets) {
  const z = new JSZip(), names = Object.keys(sheets);
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + names.map((n, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>');
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  z.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + names.map((n, i) => '<sheet name="' + n + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>');
  z.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + names.map((n, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (names.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  z.file('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>');
  names.forEach((n, i) => z.file('xl/worksheets/sheet' + (i + 1) + '.xml', xlsxSheet(sheets[n])));
  return z;
}
async function exportPrMotif() {
  const R = prByMotif(), m = month(S.date), mi = +m.slice(5) - 1, T = R.T;
  const t1 = [['INFRACTIONS', "NOMBRE D'AFFAIRES", 'RECHERCHES NATIONAL', 'RECHERCHES LOCAL', '', 'TOTAL'], ['', '', '', 'PV', 'INSTRUCTIONS PARQUET', '']];
  t1.merges = ['A1:A2', 'B1:B2', 'C1:C2', 'D1:E1', 'F1:F2'];
  PRG.forEach(([a, b, g]) => { t1.push([g.toUpperCase()]); for (let i = a; i <= b; i++) { const o = R.rows[i]; t1.push([CATS[i], o.aff, o.n, o.pv, o.ins, o.n + o.pv + o.ins]); } });
  t1.push(['TOTAL', T.aff, T.n, T.pv, T.ins, T.n + T.pv + T.ins]);
  const L = prOrder(S.ents.filter(e => e.k === 'pr' && month(e.d) === m));
  const t2 = [['DATE', 'NOM ET PRENOM', 'CNIE', 'MOTIF', 'NATIONAL / LOCAL', 'SOURCE (MESSAGE / PV / INSTRUCTION)', 'SERVICE DEMANDEUR']].concat(L.map(e => [fr(e.d), e.nom || '', idTxt(e), prMotifs(e), e.prt === 'prl' ? 'LOCAL' : 'NATIONAL', e.sd === 'Message' ? (prNb(e) > 1 ? prNb(e) + ' MESSAGES : ' : 'MESSAGE ') + [e].concat(XM(e)).map(x => refTxt(x).replace('\n', ' ')).join(' / ') : (e.sd || ''), [e].concat(XM(e)).map(x => (x.svc === 'GR' ? 'GENDARMERIE ROYALE' : 'POLICE') + (x.svcn ? ' — ' + x.svcn : '')).filter((v, i, A) => A.indexOf(v) === i).join(' / ')]));
  const z = await simpleXlsx({ 'RECHERCHES PAR MOTIF': t1, 'LISTE NOMINATIVE': t2 });
  await save(z, 'RECHERCHES_PAR_MOTIF_' + MOIS[mi] + '_' + m.slice(0, 4) + '.xlsx');
}
function pPr() {
  { const nx = prOrder(dayEnts(S.date, 'pr')).find(e => !e.nom); if (!S.pform || (nx && !S.pform.id && !S.pform.nom && !S.pform.cnie)) S.pform = nx ? JSON.parse(JSON.stringify(nx)) : newPr(); }
  if (S.pform && S.pform.nm == null && S.pform.nom) { const [a, b] = nmSplit(S.pform); S.pform.nm = a; S.pform.pn = b; }
  const f = S.pform, list = prOrder(dayEnts(S.date, 'pr')), miss = list.filter(e => !e.nom).length;
  const txt = (k, l, ph) => '<label>' + l + '<input type="text" data-p="' + k + '" value="' + esc(f[k]) + '" placeholder="' + (ph || '') + '"></label>';
  const prtChip = e => e.prt ? '<span class="ch ' + (e.prt === 'prn' ? 'f' : 'u') + '">' + (e.prt === 'prn' ? 'PR national' : 'PR local') + '</span>' : '';
  const PRREST = pPrList(list, prtChip);
  return (miss && !(f.aff && !f.nom) ? '<div class="note">كاينين <b>' + miss + '</b> مبحوث عنهم تزادو من القضايا، خاصهم الاسم والبطاقة. كليكي على "كمل" حدا كل واحد.</div>' : '') +
    (f.aff && !f.nom ? '<div class="note"><span>📋 عمر المبحوث عنهم اللي صرحتي بيهم فالقضايا، واحد بواحد. باقي <b>' + miss + '</b>. الموتيف والنوع (national/local) جايين من القضية.</span></div>' : '') + '<section class="card form' + (f.id && !f.nom ? ' fill' : '') + '" data-form="pform"><h2>' + (f.id ? (f.nom ? 'تعديل' : 'كمل المعلومات ديال') : 'زيد') + ' شخص مبحوث عنه موقوف ' + prtChip(f) + '</h2>' + (f.id && !f.nom ? '<p class="muted">هاد الشخص تزاد من القضية: ' + esc((CRIM[f.mi] || {}).l || '') + '. عمر غير الاسم والتعريف والميساج، وكيتسجل فنفس السطر.</p>' : '') +
    '<div class="row"><span class="lab">Commandement</span>' + seg('u', f.u, [['PJ', 'PJ'], ['SP', 'SP']]) + '</div>' +
    '<div class="row' + (f.prt ? '' : ' needrow') + '"><span class="lab">1) النوع (ضروري)</span>' + (f.aff && f.prt ? prtChip(f) + ' <small class="muted">(من القضية)</small>' : seg('prt', f.prt || '', [['prn', 'PR national'], ['prl', 'PR local']])) + '</div>' +
    (f.prt === 'prl' ? '<div class="row' + (f.sd === 'PV' || f.sd === 'Instruction parquet' ? '' : ' needrow') + '"><span class="lab">2) PR local: السند (ضروري)</span>' + seg('sd', f.sd === 'PV' || f.sd === 'Instruction parquet' ? f.sd : '', [['PV', 'PV'], ['Instruction parquet', 'Instruction parquet']]) + '</div>' : '') +
    (!(f.prt === 'prn' || (f.prt === 'prl' && (f.sd === 'PV' || f.sd === 'Instruction parquet'))) ? '<p class="need-msg">' + (!f.prt ? 'بدا بالنوع: PR national ولا PR local.' : 'PR local: حدد واش PV ولا Instruction parquet.') + ' من بعد كتبان ليك الخانات الأخرى.</p></section>' + PRREST :
    '<div class="grid2">' + txt('nm', 'Nom', 'ALAMI') + txt('pn', 'Prénom', 'AHMED') + '</div>' +
    '<div class="row" style="margin-top:12px"><span class="lab">التعريف</span>' + seg('idt', f.idt || 'cnie', [['cnie', 'CNIE'], ['mineur', 'Mineur'], ['dep', 'Dépourvu']]) + '</div>' +
    ((f.idt || 'cnie') === 'cnie' ? txt('cnie', 'رقم البطاقة الوطنية (CNIE)', 'X123456') : '<p class="muted">' + (f.idt === 'mineur' ? 'قاصر: ما كتعمرش البطاقة.' : 'Dépourvu: ما كيتوفرش على البطاقة الوطنية.') + '</p>') +
    (f.aff ? '<div class="row col" style="margin-top:12px"><span class="lab">Motif d\'arrestation (من القضية)</span><div class="cur fixed">' + esc((CRIM[f.mi] || {}).l || '') + ((CRIM[f.mi] || {}).a ? ' <span class="ar">' + esc(CRIM[f.mi].a) + '</span>' : '') + '</div></div>' : '<div class="row col" style="margin-top:12px"><span class="lab">Motif d\'arrestation</span>' + motifPicker(CRIM, f.mi, 'pform') + '</div>') +
    (montOk(f) ? '<div class="mont"><label>Montant (Dhs) — اختياري، إلا كان<input type="number" inputmode="decimal" min="0" data-p="mont" value="' + esc(f.mont || '') + '" placeholder="ما كاينش"></label></div>' : '') +
    txt('lieu', 'Lieu d\'arrestation') +
    (f.prt === 'prn' ? '<p class="muted" style="margin-top:12px">PR national: السند = <b>Message de recherches</b></p>' : '') +
    (f.prt === 'prn' ? '<p class="lab" style="margin-top:10px">البرقية 1</p><div class="grid2">' + txt('ref', 'N° du message', '1450') + '<label>Nombre de messages<input type="text" value="' + (1 + XM(f).length) + '" disabled></label></div>' +
      '<div class="row col" style="margin-top:10px"><span class="lab">Date du message</span><div class="grid3">' + sel('rd', f.rd || '', [['', 'النهار']].concat(range(1, 31).map(x => [p2(x[0]), p2(x[0])])), 'psel') + sel('rm', f.rm || '', [['', 'الشهر']].concat(range(1, 12).map(x => [p2(x[0]), p2(x[0])])), 'psel') + sel('ry', f.ry || '', [['', 'العام']].concat(range(1980, 2026).reverse().map(x => [String(x[0]), String(x[0])])), 'psel') + '</div></div>' : '') +
    '<div class="grid2" style="margin-top:10px"><label>الجهة اللي دارت البحث (Service demandeur)' + sel('svc', f.svc, [['Police', 'الشرطة (Police)'], ['GR', 'الدرك الملكي (GR)']], 'psel') + '</label>' + txt('svcn', 'السمية ديال الجهة (ضروري)', f.svc === 'GR' ? 'مثلا: سرية الدرك الملكي بالخميسات' : 'مثلا: المنطقة الإقليمية للأمن بسلا') + '</div>' +

    (f.prt === 'prn' ? XM(f).map((x, i) => '<div class="xm" data-xi="' + i + '"><div class="xmh"><b>البرقية ' + (i + 2) + '</b><button type="button" class="del" data-xrm="' + i + '">حذف</button></div>' +
      '<label>Motif<select data-xk="mi">' + CRIM.map((c, j) => '<option value="' + j + '"' + (j === +x.mi ? ' selected' : '') + '>' + esc(c.l) + (c.a ? ' — ' + esc(c.a) : '') + '</option>').join('') + '</select></label>' +
      '<div class="grid2"><label>N° du message<input type="text" data-xk="ref" value="' + esc(x.ref || '') + '" placeholder="1450"></label><label>Service demandeur<select data-xk="svc"><option value="Police"' + (x.svc !== 'GR' ? ' selected' : '') + '>الشرطة (Police)</option><option value="GR"' + (x.svc === 'GR' ? ' selected' : '') + '>الدرك الملكي (GR)</option></select></label></div>' +
      '<div class="grid3">' + [['rd', 'النهار', range(1, 31)], ['rm', 'الشهر', range(1, 12)], ['ry', 'العام', range(1980, 2026).reverse()]].map(([k, l, R]) => '<select data-xk="' + k + '"><option value="">' + l + '</option>' + R.map(y => { const v = k === 'ry' ? String(y[0]) : p2(y[0]); return '<option' + (v === x[k] ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select>').join('') + '</div>' +
      '<label>السمية ديال الجهة (ضروري)<input type="text" data-xk="svcn" value="' + esc(x.svcn || '') + '"></label></div>').join('') +
      '<button type="button" class="ghost addx" data-xadd>+ زيد برقية أخرى (نفس الموتيف ولا موتيف آخر)</button>' : '') +
    '<div class="actions"><button type="button" class="primary" data-psave>' + (f.id ? 'حفظ' : 'زيد للائحة') + '</button>' + (f.id ? '<button type="button" class="ghost" data-pcancel>إلغاء</button>' : '') + '</div></section>' + PRREST);
}
function pPrList(list, prtChip) {
  return '<section class="card"><h2>ETAT NOMINATIF ديال النهار (' + list.length + ')</h2>' + (list.length ? '<ul class="list">' + list.map(e => '<li' + (e.nom ? '' : ' class="todo"') + '><div><b>' + esc(e.nom || 'ناقص: الاسم') + '</b><div class="chips">' + prtChip(e) + '<span class="ch a">' + esc(e.u) + '</span></div><small>' + esc(idTxt(e)) + ' · ' + esc((CRIM[e.mi] || {}).l || '') + ' · ' + esc(e.sd === 'Message' ? 'Message ' + refTxt(e).replace('\n', ' ') : e.sd) + (XM(e).length ? ' · <b>+' + XM(e).length + ' برقيات أخرى</b> (' + esc(prMotifs(e)) + ')' : '') + '</small></div><span class="btns">' + (e.nom && e.prt === 'prn' ? '<button type="button" data-paddx="' + e.id + '">+ برقية</button>' : '') + '<button type="button" data-pedit="' + e.id + '">' + (e.nom ? 'تعديل' : 'كمل') + '</button><button type="button" class="del" data-rm="' + e.id + '">حذف</button></span></li>').join('') + '</ul>' : '<p class="empty">ما كاين حتى واحد. ملي كتسجل قضية فيها PR local ولا PR national، كيتزاد هنا بوحدو.</p>') + '</section>' + prMonthBox();
}
function dayNumbers(d) {
  const s = sec(d), ex = s.exam || {}, A = agg(dayEnts(d, 'aff'));
  return { ex, A, B: agg(dayEnts(d, 'bar')) };
}
function pDay() {
  const { ex, A, B } = dayNumbers(S.date), b = sec(S.date).bar || {};
  const st = instStock(S.date), I = { PJ: { in: 0, out: 0, st: 0 }, SP: { in: 0, out: 0, st: 0 } };
  dayEnts(S.date, 'inst').forEach(e => { I[e.u].in += num(e.in); I[e.u].out += num(e.out); });
  Object.values(st).forEach(x => ['PJ', 'SP'].forEach(u => I[u].st += x.ins[u] + x.ren[u]));
  const r = (u, e, a) => '<tr><td>' + u + '</td><td>' + (num(e) + a.tot) + '</td><td>' + a.aff + '</td><td>' + a.fl + '</td><td>' + a.rech + '</td><td>' + (a.fl + a.rech) + '</td></tr>';
  return '<section class="card"><h2>ملخص الحصيلة ' + span(S.date) + '</h2><p class="muted">المعلومات ديال نهار ' + fr(S.date) + '، والتقرير كيخرج نهار ' + fr(nextDay(S.date)) + '.</p><p class="big">التحقق من الهوية: <b>' + (num(ex.pj) + num(ex.sp)) + '</b> <small>(PJ ' + num(ex.pj) + ' + SP ' + num(ex.sp) + ')</small></p>' +
    '<div class="scroll"><table><thead><tr><th></th><th>المستوقفين</th><th>القضايا</th><th>متلبس</th><th>مبحوث</th><th>المجموع</th></tr></thead><tbody>' + r('SP', ex.sp, A.SP) + r('PJ', ex.pj, A.PJ) + r('<b>المجموع</b>', num(ex.pj) + num(ex.sp), A.all) + '</tbody></table></div>' +
    '<h3>حسب الجريمة</h3>' + catTable(A) +
    '<h3>السدود</h3><p>' + (b.nb == null ? 1 : num(b.nb)) + ' سد · ' + num(b.veh) + ' مركبة · ' + B.all.aff + ' قضية · ' + B.all.tot + ' شخص</p>' +
    '<h3>التعليمات والإحالات</h3><p>PJ: دخل ' + I.PJ.in + ' · خرج ' + I.PJ.out + ' · باقي ' + I.PJ.st + '<br>SP: دخل ' + I.SP.in + ' · خرج ' + I.SP.out + ' · باقي ' + I.SP.st + '</p>' +
    (isClosed(S.date) ? '<div class="closed">✓ الحصيلة مسدودة ومصنفة فأرشيف ' + MOISAR[+S.date.slice(5, 7) - 1] + '</div><div class="actions"><button type="button" class="primary" data-xday>تحميل الملف (Excel)</button></div>' :
    (prMissing(S.date) ? '<div class="note need-pr">⚠️ باقي <b>' + prMissing(S.date) + '</b> مبحوث عنهم ناقصين المعطيات (الاسم، البطاقة، المذكرة، الجهة). ما يمكنش تصادق حتى تكمل <b>ملء معطيات الأشخاص المبحوث عنهم</b>. <button type="button" class="primary" data-goto="pr">كمل المعطيات</button></div>' : '') +
    '<div class="actions"><button type="button" class="primary green" data-close' + (prMissing(S.date) ? ' disabled' : '') + '>✓ صادق وسد الحصيلة ديال ' + span(S.date) + '</button><button type="button" class="ghost" data-xday>تحميل بلا ما تسد</button></div><p class="muted">ملي كتسد الحصيلة، كتصنف فأرشيف الشهر بالتاريخ ديالها، وكيتحمل الملف، وما بقاش يتبدل حتى تعاود تفتحها.</p>') + '</section>';
}
function catTable(A) {
  const ks = Object.keys(A.cat).map(Number).sort((a, b) => a - b);
  if (!ks.length) return '<p class="empty">والو.</p>';
  return '<div class="scroll"><table><thead><tr><th>الجريمة</th><th>القضايا</th><th>متلبس</th><th>مبحوث</th></tr></thead><tbody>' + ks.map(k => '<tr><td>' + esc(CATS[k]) + '</td><td>' + A.cat[k].aff + '</td><td>' + A.cat[k].fl + '</td><td>' + A.cat[k].rech + '</td></tr>').join('') + '</tbody></table></div>';
}
function monthDays(m) { const [y, mo] = m.split('-').map(Number), n = new Date(y, mo, 0).getDate(); return Array.from({ length: n }, (_, i) => m + '-' + pad(i + 1)); }
function archive(m) {
  const days = monthDays(m).filter(d => S.secs[d] || S.ents.some(e => e.d === d));
  return '<section class="card"><h2>أرشيف ' + MOISAR[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + '</h2>' + (days.length ? '<ul class="list">' + days.map(d => '<li><div><b>حصيلة ' + span(d) + '</b><div class="chips">' + (isClosed(d) ? '<span class="ch a">✓ مسدودة</span>' : '<span class="ch f">مفتوحة</span>') + '</div></div><span class="btns"><button type="button" data-open="' + d + '">فتح</button><button type="button" data-xd="' + d + '">Excel</button></span></li>').join('') + '</ul>' : '<p class="empty">باقي ما كاين حتى نهار مسجل فهاد الشهر.</p>') + '</section>';
}

const GRP = [[15, 32, 'Atteintes à la personne', 'الجرائم المرتبطة بالأشخاص'], [33, 37, 'Atteintes à la famille', 'الجرائم المرتبطة بالأسرة'], [38, 48, 'Atteintes aux mœurs', 'الجرائم المرتبطة بالأخلاق العامة'], [49, 70, 'Atteintes aux biens', 'الجرائم المرتبطة بالممتلكات'], [71, 78, "Atteintes à l'autorité", 'الجرائم المرتبطة بالسلطة'], [79, 86, "Atteintes à l'ordre public", 'الجرائم المرتبطة بالنظام العام'], [87, 91, "Sûreté de l'État", 'الجرائم المرتبطة بأمن الدولة'], [92, 99, 'Trafic de stupéfiants', 'الجرائم المرتبطة بالمخدرات'], [100, 149, 'Autres infractions', 'جرائم أخرى']];
const SZR = [['Cannabis (chira, kif, tabac)', 'غ'], ['Cocaïne', 'غ'], ['Héroïne', 'غ'], ['Comprimés psychotropes', 'وحدة'], ['Armes blanches', 'وحدة'], ['Bombes lacrymogènes', 'وحدة'], ['Gourdins', 'وحدة'], ['Médicaments', 'علبة'], ['Cigarettes', 'علبة'], ['Boissons alcoolisées', 'وحدة'], ['Carburants', 'لتر'], ['Téléphones', 'وحدة'], ['Véhicules', 'وحدة'], ['Motocycles', 'وحدة'], ['Narguilé', 'وحدة'], ['Produits de dissolution', 'وحدة']];
const MOISC = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
function secSum(secs, days, path) { let t = 0; days.forEach(d => { let o = secs[d]; path.split('.').forEach(k => o = o ? o[k] : 0); t += num(o); }); return t; }
function repApp(ents, secs, m) {
  const days = monthDays(m), A = agg(ents.filter(e => (e.k === 'aff' || e.k === 'bar') && days.includes(e.d)));
  const g = GRP.map(([a, b]) => { const t = [0, 0, 0, 0]; Object.keys(A.crim).forEach(r => { r = +r; if (r >= a && r <= b) { const c = A.crim[r]; t[0] += c.aff; t[1] += c.res; t[2] += c.am + c.af + c.mm + c.mf; t[3] += c.vam + c.vaf + c.vmm + c.vmf; } }); return t; });
  g.push(g.reduce((x, y) => x.map((v, i) => v + y[i]), [0, 0, 0, 0]));
  const Z = k => secSum(secs, days, 'sz.' + k) + secSum(secs, days, 'szA1.' + k) + secSum(secs, days, 'szA2.' + k);
  const sz = [Z('chira') + Z('kif') + Z('tabac'), Z('coc'), Z('hero'), Z('psy'), Z('ab'), Z('bomb'), Z('gourd'), Z('med'), Z('cig'), Z('alc_sans') + Z('alc_avec'), Z('carb'), Z('tel'), Z('veh') + Z('veh_oth') + Z('veh_drug'), Z('moto') + Z('moto_oth') + Z('moto_drug'), Z('narg'), Z('diss')];
  const crOf = X => { const o = {}; Object.keys(X.crim).forEach(r => { r = +r; if (r >= 15 && r < 149) o[r] = [X.crim[r].aff, X.crim[r].res]; }); return o; };
  const AF = u => agg(ents.filter(e => e.k === 'aff' && (e.u || 'PJ') === u && days.includes(e.d)));
  const cr = crOf(A), crPJ = crOf(AF('PJ')), crSP = crOf(AF('SP'));
  return { m, g, cr, crPJ, crSP, vic: [A.all.vam, A.all.vaf, A.all.vmm, A.all.vmf], fl: A.all.fl, rech: A.all.rech, prn: A.all.prn, prl: A.all.prl, epj: secSum(secs, days, 'exam.pj'), esp: secSum(secs, days, 'exam.sp'), sz, app: 1 };
}
function repSum(list) {
  const R = { cr: {}, crPJ: {}, crSP: {}, vic: [0, 0, 0, 0], g: GRP.map(() => [0, 0, 0, 0]).concat([[0, 0, 0, 0]]), fl: 0, rech: 0, prn: 0, prl: 0, nd: 0, epj: 0, esp: 0, sz: SZR.map(() => 0) };
  list.forEach(x => { (x.vic || []).forEach((v, i) => R.vic[i] += num(v)); ['cr', 'crPJ', 'crSP'].forEach(k => Object.keys(x[k] || {}).forEach(r => { const t = R[k][r] = R[k][r] || [0, 0]; t[0] += num(x[k][r][0]); t[1] += num(x[k][r][1]); })); x.g.forEach((r, i) => r.forEach((v, j) => R.g[i][j] += num(v))); R.fl += num(x.fl); R.rech += num(x.rech); if (x.app) { R.prn += num(x.prn); R.prl += num(x.prl); } else R.nd += num(x.rech); R.epj += num(x.epj); R.esp += num(x.esp); x.sz.forEach((v, i) => R.sz[i] += num(v)); });
  return R;
}
const nf = v => String(Math.round(num(v) * 100) / 100);
function vicBox(R) {
  const v = R.vic, T = v.reduce((a, b) => a + num(b), 0) || 0;
  const ic = (f, m) => '<svg viewBox="0 0 24 36" width="' + (m ? 13 : 18) + '" height="' + (m ? 18 : 26) + '"><circle cx="12" cy="6" r="5" fill="#000"/>' + (f ? '<path d="M12 12 L3 28 H21 Z" fill="#000"/><rect x="8" y="27" width="3" height="8" fill="#000"/><rect x="13" y="27" width="3" height="8" fill="#000"/>' : '<rect x="5" y="12" width="14" height="13" rx="3" fill="#000"/><rect x="6" y="24" width="5" height="11" fill="#000"/><rect x="13" y="24" width="5" height="11" fill="#000"/>') + '</svg>';
  const C = [['Adultes — Masculin', 'بالغين ذكور', 0, 0], ['Adultes — Féminin', 'بالغات إناث', 1, 0], ['Mineurs — Masculin', 'قاصرين ذكور', 0, 1], ['Mineures — Féminin', 'قاصرات إناث', 1, 1]];
  return '<div class="vb"><h3><span>Victimes<small>Total : ' + nf(T) + '</small></span><span dir="rtl">الضحايا<small>المجموع: ' + nf(T) + '</small></span></h3><div class="vg">' +
    C.map((c, i) => { const p = T ? Math.round(num(v[i]) / T * 100) : 0; return '<div class="vc' + (c[3] ? ' mn' : '') + '"><div class="vi">' + ic(c[2], c[3]) + '</div><b>' + nf(v[i]) + '</b><div class="vl">' + c[0] + '<br><span dir="rtl">' + c[1] + '</span></div><div class="vp"><i style="width:' + p + '%"></i></div><small>' + p + ' %</small></div>'; }).join('') + '</div></div>';
}
function crChart(CR, a, b, fr, ar, per) {
  const lab = r => { const c = CRIM.find(x => x.r === r) || {}; return [c.l || String(r), c.a || '']; };
  const L = []; for (let r = a; r <= b; r++) { const v = CR[r]; if (v && (v[0] || v[1])) L.push([r, v[0], v[1]]); }
  if (L.length <= 3) return '';
  const mx = Math.max(...L.map(x => Math.max(x[1], x[2])), 1), H = 180, W = 46, w = L.length * W + 170;
  const bars = L.map(([r, x, y], i) => { const X = 8 + i * W, h1 = x / mx * H, h2 = y / mx * H;
    return '<rect x="' + X + '" y="' + (H + 18 - h1) + '" width="17" height="' + h1 + '" fill="#000"/><rect x="' + (X + 19) + '" y="' + (H + 18 - h2) + '" width="17" height="' + h2 + '" fill="url(#xh)" stroke="#000" stroke-width="1"/>' +
      '<text x="' + (X + 8) + '" y="' + (H + 14 - h1) + '" font-size="10" text-anchor="middle" fill="#000">' + x + '</text><text x="' + (X + 27) + '" y="' + (H + 14 - h2) + '" font-size="10" text-anchor="middle" fill="#000">' + y + '</text>' +
      '<text transform="translate(' + (X + 22) + ',' + (H + 26) + ') rotate(45)" font-size="10" fill="#333">' + esc(lab(r)[0].slice(0, 34)) + '</text>'; }).join('');
  return '<div class="crc"><h3><span>' + fr + '<small>' + per[0] + '</small></span><span dir="rtl">' + ar + '<small>' + per[1] + '</small></span></h3><div class="lg"><span><svg width="14" height="12"><rect width="14" height="12" fill="#000"/></svg> Aff. (القضايا)</span><span><svg width="14" height="12"><rect width="14" height="12" fill="url(#xh)" stroke="#000"/></svg> Rés. (المحلولة)</span></div><div class="scroll"><svg width="' + w + '" height="' + (H + 190) + '" viewBox="0 0 ' + w + ' ' + (H + 190) + '" style="font-family:inherit"><line x1="4" x2="' + w + '" y1="' + (H + 18) + '" y2="' + (H + 18) + '" stroke="#999"/>' + bars + '</svg></div></div>';
}
function repView(R, rows, title) {
  const T = R.g[GRP.length];
  let h = '<section class="card rpt" dir="ltr" style="text-align:left"><h2>' + title + '</h2>' +
    '<div class="rk"><div><b>' + nf(T[0]) + '</b><span>القضايا</span></div><div><b>' + nf(T[1]) + '</b><span>المحلولة</span></div><div><b>' + nf(T[2]) + '</b><span>الفاعلين</span></div><div><b>' + nf(T[3]) + '</b><span>الضحايا</span></div><div><b>' + nf(R.fl) + '</b><span>التلبس</span></div><div><b>' + nf(R.epj + R.esp) + '</b><span>التحقق من الهوية</span></div></div>' +
    vicBox(R) + '<table class="rt"><tr><th colspan="3">الأشخاص المبحوث عنهم: ' + nf(R.rech) + '</th></tr><tr class="s"><td>National (وطنيا)</td><td>Local (محليا)</td>' + (R.nd ? '<td>قبل التطبيق (غير مفروقين)</td>' : '<td></td>') + '</tr><tr><td><b>' + nf(R.prn) + '</b></td><td><b>' + nf(R.prl) + '</b></td><td>' + (R.nd ? '<b>' + nf(R.nd) + '</b>' : '') + '</td></tr></table>' +
    '<table class="rt"><tr><th colspan="3">التحقق من الهوية</th></tr><tr class="s"><td>PJ</td><td>SP</td><td>المجموع</td></tr><tr><td><b>' + nf(R.epj) + '</b></td><td><b>' + nf(R.esp) + '</b></td><td><b>' + nf(R.epj + R.esp) + '</b></td></tr></table>' +
    '<table class="rt rc"><tr><th>Les grands titres</th><th>Aff.</th><th>Rés.</th><th>Aut.</th><th>Vict.</th></tr>' +
    GRP.map((x, i) => '<tr><td>' + x[2] + '<small>' + x[3] + '</small></td>' + R.g[i].map(v => '<td>' + nf(v) + '</td>').join('') + '</tr>').join('') +
    '<tr class="s"><td>TOTAL GLOBAL</td>' + T.map(v => '<td><b>' + nf(v) + '</b></td>').join('') + '</tr></table>';
  if (rows) h += '<svg width="0" height="0" style="position:absolute"><defs><pattern id="xh" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><path d="M0 0L6 6M6 0L0 6" stroke="#000" stroke-width="1"/></pattern></defs></svg>' + (() => { const y = rows.length ? rows[0].m.slice(0, 4) : '', f = rows.length ? +rows[0].m.slice(5) - 1 : 0, l = rows.length ? +rows[rows.length - 1].m.slice(5) - 1 : 0, MF = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const per = ['Bilan de l\'année ' + y + ' (' + MF[f] + ' – ' + MF[l] + ')', 'حصيلة سنة ' + y + ' (' + MOISC[f] + ' – ' + MOISC[l] + ')'];
    return GRP.map(x => crChart(R.cr, x[0], x[1] - 1, x[2], x[3], per)).join(''); })();
  const zs = SZR.map((x, i) => [x, R.sz[i]]).filter(x => x[1]);
  h += '<table class="rt rc"><tr><th>Saisies (المحجوزات)</th><th>الكمية</th><th>الوحدة</th></tr>' + (zs.length ? zs.map(([x, v]) => '<tr><td>' + x[0] + '</td><td><b>' + nf(v) + '</b></td><td>' + x[1] + '</td></tr>').join('') : '<tr><td colspan="3">والو</td></tr>') + '</table>';
  if (rows) h += '<table class="rt rc rm"><tr><th>الشهر</th><th>Aff.</th><th>FD</th><th>PR</th><th>التحقق</th></tr>' + rows.map(x => '<tr><td>' + MOISC[+x.m.slice(5) - 1] + (x.app ? ' ✱' : '') + '</td><td>' + nf(x.g[GRP.length][0]) + '</td><td>' + nf(x.fl) + '</td><td>' + nf(x.rech) + '</td><td>' + nf(num(x.epj) + num(x.esp)) + '</td></tr>').join('') + '<tr class="s"><td>المجموع</td><td><b>' + nf(T[0]) + '</b></td><td><b>' + nf(R.fl) + '</b></td><td><b>' + nf(R.rech) + '</b></td><td><b>' + nf(R.epj + R.esp) + '</b></td></tr></table><p class="muted">✱ من التطبيق. الشهور الأخرى من ملفات الإكسيل ديالكم.</p>';
  return h + '</section>';
}
async function loadYear() {
  const Y = S.date.slice(0, 4), cur = month(S.date);
  S.yr = { y: Y, loading: true }; render();
  try {
    let base = [];
    try { const r = await fetch('r/base' + Y + '.json', { cache: 'no-store' }); if (r.ok) base = await r.json(); } catch (e) {}
    const have = new Set(base.map(x => x.m)), list = base.slice();
    for (let i = 1; i <= 12; i++) {
      const m = Y + '-' + String(i).padStart(2, '0');
      if (m > cur || have.has(m) || m < '2026-11') continue;
      if (m === cur) { list.push(repApp(S.ents, S.secs, m)); continue; }
      const [qe, qs] = await Promise.all([S.db.collection('m/' + m + '/e').get(), S.db.collection('m/' + m + '/s').get()]);
      const secs = {}; qs.docs.forEach(x => secs[x.id] = x.data());
      list.push(repApp(qe.docs.map(x => x.data()), secs, m));
    }
    list.sort((a, b) => a.m < b.m ? -1 : 1);
    S.yr = { y: Y, list };
  } catch (e) { S.yr = { y: Y, err: String(e.message || e) }; }
  render();
}
const READY = [['التقرير السنوي 2026 (29 فوي)', 'r/annuel.json', 'ANNUEL_TIFLET_2026.xlsx', 'من 01/01 حتى 17/11/2026'], ['المونسويل ديال نونبر 2026: CRIMINALITE وCODE DE LA ROUTE (PJ / SP / TOTAL)', 'r/nov.json', 'MENSUEL_TIFLET_NOV_2026.xlsx', 'من 1 حتى 17 نونبر']];
function pMonth() {
  const m = month(S.date), days = monthDays(m), aff = S.ents.filter(e => e.k === 'aff'), A = agg(aff), B = agg(S.ents.filter(e => e.k === 'bar'));
  const active = days.filter(d => S.secs[d] || S.ents.some(e => e.d === d)).length;
  const exam = sumSec(days, 'exam.pj') + sumSec(days, 'exam.sp');
  const ready = '<section class="card"><h2>📱 النسخة بلا أنترنيت</h2><p class="muted">كيحمّل ملف فيه كل المعطيات ديال البرنامج، باش ترجعو (📂 استرجاع) فالتطبيق ديال التيليفون.</p><div class="actions"><button type="button" class="primary" data-xall>💾 تصدير كل المعطيات</button></div></section>' + '<section class="card"><h2>التقارير الجاهزة</h2><ul class="list">' + READY.map((r, k) => '<li><div><b>' + r[0] + '</b><span class="mut"> · ' + r[3] + '</span></div><button type="button" class="primary" data-ready="' + k + '">⬇ تحميل</button></li>').join('') + '</ul></section>';
  const tog = '<div class="rvt"><button type="button" data-rv="m" class="' + (S.rv !== 'y' ? 'on' : '') + '">التقرير الشهري</button><button type="button" data-rv="y" class="' + (S.rv === 'y' ? 'on' : '') + '">التقرير السنوي ' + S.date.slice(0, 4) + '</button></div>';
  if (S.rv === 'y') {
    if (!S.yr || S.yr.y !== S.date.slice(0, 4)) { setTimeout(loadYear, 0); return tog + '<section class="card"><p class="muted">كيتحمل التقرير السنوي…</p></section>'; }
    if (S.yr.loading) return tog + '<section class="card"><p class="muted">كيتحمل التقرير السنوي…</p></section>';
    if (S.yr.err) return tog + '<section class="card"><p class="muted">ما تحملش: ' + esc(S.yr.err) + '</p></section>';
    const L = S.yr.list; return tog + repView(repSum(L), L, 'التقرير السنوي ' + S.yr.y + (L.length ? ' (' + MOISC[+L[0].m.slice(5) - 1] + ' → ' + MOISC[+L[L.length - 1].m.slice(5) - 1] + ')' : '')) + ready;
  }
  return tog + repView(repSum([repApp(S.ents, S.secs, m)]), null, 'التقرير الشهري: ' + MOISC[+m.slice(5) - 1] + ' ' + m.slice(0, 4)) + ready + '<section class="card"><h2>شهر ' + MOIS[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + '</h2>' +
    '<div class="actions"><button type="button" class="primary" data-xmonth="0">تحميل الستاتيستيك مونسييل (Excel)</button><button type="button" class="ghost" data-xprm>لائحة المبحوث عنهم ديال الشهر كامل (Excel)</button></div>' +
    '<p class="muted">الملف كيتعمر فالموديل الأصلي ديالكم. CRIMINALITE PJ كتعمر غير بقضايا PJ والسد القضائي. الفويات اللي كتعمر بوحدها: CRIMINALITE PJ، TOTAL CODE DE LA ROUTE، bilan d\'activité globale، BARRAGES، SAISIES، INSTANCE، GARDE A VUE، MAHIA، MENDICITE، AVOIRE CRIMINEL (الطوموبيلات والموطورات). الباقي كيبقى خاوي وكتعمروه بيدكم.</p></section>' +
    archive(m);
}

/* ---------- export ---------- */
async function zipOf(k) { return JSZip.loadAsync(window.TPL[k], { base64: true }); }
async function save(zip, name) {
  const blob = await zip.generateAsync({ type: 'blob' });
  if (!S.dl) { toast('التحميل ما متاحش هنا'); return; }
  try { await S.dl.save({ filename: name, data: blob }); toast('تحمل الملف'); } catch (e) { if (e.code !== 'declined') toast('ما تحملش: ' + e.code); }
}
const z0 = v => v ? v : null;
async function exportDay(dd) {
  const d = dd || S.date, s = sec(d), ex = s.exam || {}, A = agg(dayEnts(d, 'aff')), B = agg(dayEnts(d, 'bar')), z = szMerged(s), b = s.bar || {};
  const tg = { D6: num(ex.pj) + num(ex.sp) };
  [['SP', 16, ex.sp], ['PJ', 17, ex.pj]].forEach(([u, r, e]) => { const a = A[u]; Object.assign(tg, { ['D' + r]: num(e) + a.tot, ['E' + r]: a.aff, ['F' + r]: a.fl, ['G' + r]: a.rech }); });
  CATS.forEach((c, k) => { const a = A.cat[k]; if (a) Object.assign(tg, { ['D' + (28 + k)]: a.aff, ['E' + (28 + k)]: z0(a.fl), ['F' + (28 + k)]: z0(a.rech) }); });
  const szc = { D5: num(z.chira), D6: num(z.kif) + num(z.tabac), D7: num(z.coc), D8: num(z.hero), D9: num(z.psy), D10: num(z.ab), D11: num(z.bomb), D12: num(z.gourd), D13: num(z.edv_l) + num(z.edv_s), D14: num(z.cig), D15: num(z.alc_sans) + num(z.alc_avec), D16: num(z.carb), D17: num(z.tel), D18: num(z.veh) + num(z.veh_oth) + num(z.veh_drug), D19: num(z.moto) + num(z.moto_oth) + num(z.moto_drug), D20: num(z.mont), D21: num(z.diss) };
  const motifs = (list, st) => { const o = {}; list.forEach(e => { const p = pers(e); const n = st === 'fl' ? p.fl : p.rech; if (n) { const l = CATS[(CRIM[e.mi] || {}).c]; o[l] = (o[l] || 0) + n; } }); return Object.keys(o).map(k => k + ' (' + o[k] + ')').join(' / '); };
  const bl = dayEnts(d, 'bar');
  const bar = { B10: b.nb == null ? 1 : num(b.nb), C10: num(b.veh), D10: motifs(bl, 'fl'), E10: B.all.fl, F10: motifs(bl, 'rech'), G10: B.all.rech };
  const bb = {}; CATS.forEach((c, k) => { const a = B.cat[k]; if (a) Object.assign(bb, { ['C' + (10 + k)]: a.aff, ['D' + (10 + k)]: z0(a.fl), ['E' + (10 + k)]: z0(a.rech) }); });
  const st = instStock(d), I = { PJ: [0, 0, 0], SP: [0, 0, 0] };
  dayEnts(d, 'inst').forEach(e => { I[e.u][0] += num(e.in); I[e.u][1] += num(e.out); });
  Object.values(st).forEach(x => ['PJ', 'SP'].forEach(u => I[u][2] += x.ins[u] + x.ren[u]));
  const ins = { C10: I.PJ[0], D10: I.PJ[1], E10: I.PJ[2], C11: I.SP[0], D11: I.SP[1], E11: I.SP[2] };
  const pr = {}; prOrder(dayEnts(d, 'pr')).forEach((e, i) => { const r = 6 + i; Object.assign(pr, { ['B' + r]: i === 0 ? 'CC TIFLET' : null, ['C' + r]: e.nom, ['D' + r]: idTxt(e), ['E' + r]: prMotifs(e), ['F' + r]: e.lieu, ['G' + r]: prNb(e), ['H' + r]: e.sd === 'Message' ? prRefs(e) : e.sd, ['I' + r]: prSvc(e, 'Police'), ['J' + r]: prSvc(e, 'GR'), ['K' + r]: num(e.mont) }); });
  const rt = s.rt || {}, cu = {}; CU1.forEach(([k, , c]) => cu[c + '8'] = num(rt[k])); CU2.forEach(([k, , c]) => cu[c + '14'] = num(rt[k]));
  const zip = await XL.fill(await zipOf('j'), { 'TOTAL GLOBAL (entité-infrac)': tg, 'LES SAISIS': szc, 'ETAT NOMINATIF PR': pr, 'BARRAGES': bar, 'BILAN BARRAGES': bb, 'CORPS URBAIN': cu, 'INSTANCES': ins });
  await save(zip, 'bilan_global_operation_policiere_CC_TIFELT_' + spanFile(d) + '.xlsx');
}
async function exportPr(all) {
  const m = month(S.date);
  const list = all ? prOrderByDay(S.ents.filter(e => e.k === 'pr')) : prOrder(dayEnts(S.date, 'pr'));
  if (!list.length) { toast(all ? 'ما كاين حتى مبحوث عنه فهاد الشهر' : 'ما كاين حتى مبحوث عنه فهاد النهار'); return; }
  const c = {};
  list.forEach((e, i) => { const r = 6 + i; Object.assign(c, { ['A' + r]: all ? fr(e.d) : null, ['B' + r]: i === 0 ? 'CC TIFLET' : null, ['C' + r]: e.nom || '', ['D' + r]: idTxt(e), ['E' + r]: prMotifs(e), ['F' + r]: e.lieu, ['G' + r]: prNb(e), ['H' + r]: e.sd === 'Message' ? prRefs(e) : e.sd, ['I' + r]: prSvc(e, 'Police'), ['J' + r]: prSvc(e, 'GR'), ['K' + r]: num(e.mont) }); });
  const zip = await XL.fill(await zipOf('p'), { 'ETAT NOMINATIF PR': c });
  await save(zip, all ? 'ETAT_NOMINATIF_PR_CC_TIFELT_MOIS_' + MOIS[+m.slice(5) - 1] + '_' + m.slice(0, 4) + '.xlsx' : 'ETAT_NOMINATIF_PR_CC_TIFELT_' + spanFile(S.date) + '.xlsx');
}
function prOrderByDay(l) { const days = [...new Set(l.map(e => e.d))].sort(); return days.flatMap(d => prOrder(l.filter(e => e.d === d))); }
async function exportMonth(part) {
  const m = month(S.date), mi = +m.slice(5) - 1, allD = monthDays(m);
  let days = allD; if (part) { const f = Math.max(1, Math.min(+S.pf || 1, allD.length)), t = Math.max(f, Math.min(+S.pt || allD.length, allD.length)); days = allD.slice(f - 1, t); if (days.length === allD.length) part = 0; }
  const EN = S.ents.filter(e => days.includes(e.d));
  const PER = part ? 'DU ' + days[0].slice(8) + ' AU ' + days[days.length - 1].slice(8) + ' ' : '';
  const affL = EN.filter(e => e.k === 'aff'), barL = EN.filter(e => e.k === 'bar');
  const A = agg(affL.concat(barL)), AA = agg(affL), B = agg(barL);
  const Z = k => sumSec(days, 'sz.' + k) + sumSec(days, 'szA1.' + k) + sumSec(days, 'szA2.' + k), R = k => sumSec(days, 'rt.' + k);
  const exam = sumSec(days, 'exam.pj') + sumSec(days, 'exam.sp');
  const APJ = agg(affL.filter(e => e.u === 'PJ').concat(barL));
  const crim = {}; Object.keys(APJ.crim).forEach(r => { if (+r <= 0) return; const a = APJ.crim[r]; ['D', a.aff, 'E', a.res, 'F', a.vam, 'G', a.vaf, 'H', a.vmm, 'I', a.vmf, 'J', a.am, 'K', a.af, 'L', a.mm, 'M', a.mf].forEach((v, i, arr) => { if (i % 2 === 0) crim[v + r] = z0(arr[i + 1]); }); });
  const drugAff = A.cat[DRUG] || { aff: 0, tot: 0, cons: 0, traf: 0 }, arme = A.cat[ARME] || { tot: 0, aff: 0 };
  const route = { B6: AA.all.fl, B7: AA.all.rech, B8: arme.tot, B9: exam, B10: R('sanscin'), B11: R('vag'), B12: R('alien'), B13: R('inf'), B14: R('veh_atf'), B15: R('four_v'), B16: R('four_m'), B17: R('permis'), B18: R('atf_dh'), B19: Z('narg'), B21: drugAff.aff, B22: drugAff.tot, B23: Z('coc'), B24: Z('chira'), B25: Z('kif'), B26: Z('tabac'), B27: Z('psy'), B28: Z('maajoun'), B29: Z('veh_drug'), B30: Z('moto_drug'), B32: Z('alc_sans'), B33: Z('alc_avec'), B34: Z('alc96'), B35: Z('edv_l'), B36: Z('edv_s'), B37: Z('ab'), B38: Z('mont'), B39: Z('tel'), B40: Z('trip') + Z('trip_oth') + Z('moto') + Z('moto_oth'), B41: Z('veh') + Z('veh_oth'), B42: R('autres'), B44: EN.filter(e => e.k === 'inst' && e.t === 'ins').reduce((a, e) => a + num(e.in), 0) || R('parquet'), B45: EN.filter(e => e.k === 'inst' && e.t === 'ren').reduce((a, e) => a + num(e.in), 0) || R('direct'), B46: R('justice') + days.reduce((a, d) => a + justRows(d).reduce((x, r) => x + num(r.n), 0), 0), B20: 0, B31: 0, B43: 0 };
  Object.keys(route).forEach(k => route[k] = route[k] || 0);
  const active = days.filter(d => S.secs[d] || EN.some(e => e.d === d)).length;
  const barNb = days.reduce((t, d) => t + ((sec(d).bar || {}).nb == null ? (S.secs[d] || EN.some(e => e.d === d) ? 1 : 0) : num(sec(d).bar.nb)), 0), barVeh = sumSec(days, 'bar.veh');
  const gav = k => gavSum(days, null, k);
  const st = instStock(days[days.length - 1]), I = {};
  const instAdd = (mi, t, f, v) => { I[mi] = I[mi] || { ins: [0, 0, 0], ren: [0, 0, 0] }; I[mi][t][f] += v; };
  EN.filter(e => e.k === 'inst').forEach(e => { instAdd(e.mi, e.t, 0, num(e.in)); instAdd(e.mi, e.t, 1, num(e.out)); });
  Object.keys(st).forEach(mi => ['ins', 'ren'].forEach(t => instAdd(mi, t, 2, st[mi][t].PJ + st[mi][t].SP)));
  const inst = { C4: (PER || 'MOIS DE ') + MOIS[mi] + ' ' + m.slice(0, 4) }, IT = { ins: [0, 0, 0], ren: [0, 0, 0] };
  Object.keys(I).forEach(k => { const row = (INST[k] || {}).r; ['ren', 'ins'].forEach((t, ti) => [0, 1, 2].forEach(f => { IT[t][f] += I[k][t][f]; if (row) inst[String.fromCharCode(68 + ti * 3 + f) + row] = z0(I[k][t][f]); })); });
  ['ren', 'ins'].forEach((t, ti) => [0, 1, 2].forEach(f => inst[String.fromCharCode(68 + ti * 3 + f) + 12] = IT[t][f]));
  const bil = { C6: active, C7: exam, C8: exam + AA.all.tot, C9: AA.all.fl, C10: AA.all.rech, C12: barNb, C13: barVeh, C14: B.all.tot, C15: B.all.fl, C16: B.all.rech, C18: A.all.aff, C19: A.all.res, C20: A.all.res, C22: Math.max(0, A.all.aff - A.all.res), C23: A.all.vam + A.all.vaf + A.all.vmm + A.all.vmf, C24: A.all.vam + A.all.vaf, C25: A.all.vmm + A.all.vmf, C31: sumSec(days, 'act.rap'), C32: sumSec(days, 'act.fiche'), C27: IT.ins[0], C28: IT.ins[1], C29: IT.ins[2], C34: A.all.tot, C35: A.all.am + A.all.af, C36: A.all.mm + A.all.mf, C38: arme.tot, C39: arme.tot, C40: Z('ab'), C42: gav('am') + gav('af'), C43: gav('mm') + gav('mf'), C51: Z('ab'), C52: Z('bomb'), C53: Z('gourd'), C54: Z('med'), C55: Z('cig'), C56: Z('alc_sans') + Z('alc_avec'), C57: Z('carb'), C58: Z('diss'), C60: Z('tel'), C61: Z('veh'), C62: Z('moto'), C84: drugAff.aff, C85: drugAff.tot, C86: drugAff.cons, C87: drugAff.traf, C90: Z('chira') + Z('kif') + Z('tabac'), C91: Z('coc'), C92: Z('hero'), C93: Z('psy'), C95: Z('veh_drug'), C96: Z('moto_drug'), C99: A.all.affMin, C101: A.all.mm + A.all.mf, C102: A.all.mm, C103: A.all.mf };
  const bars = { B10: barNb, C10: barVeh, D10: B.all.fl, E10: B.all.rech, J25: barVeh, K25: B.all.fl, L25: B.all.rech };
  CATS.forEach((c, k) => { const a = B.cat[k]; if (a) Object.assign(bars, { ['D' + (16 + k)]: a.aff, ['E' + (16 + k)]: z0(a.fl), ['F' + (16 + k)]: z0(a.rech) }); });
  const sz = { N5: Z('chira') + Z('kif') + Z('tabac'), N6: Z('coc'), N7: Z('hero'), N8: Z('psy'), N9: Z('ab'), N10: Z('bomb'), N11: Z('gourd'), N12: Z('med'), N13: Z('cig'), N14: Z('alc_sans') + Z('alc_avec'), N15: Z('carb'), N16: Z('tel'), N17: Z('veh') + Z('veh_oth') + Z('veh_drug'), N18: Z('moto') + Z('moto_oth') + Z('moto_drug'), N19: Z('narg'), N20: Z('diss') };
  const gv = { E21: gav('am'), F21: gav('af'), G21: gav('mm'), H21: gav('mf') };
  const mah = A.crim[108] || { aff: 0, tot: 0 }, men = A.crim[100] || { aff: 0, tot: 0, am: 0, af: 0, mm: 0, mf: 0 };
  const split = (n, d, v) => { const o = Math.max(0, n - d); return { o, d, vo: n ? v * o / n : 0, vd: n ? v * d / n : 0 }; };
  const V = split(Z('veh') + Z('veh_oth') + Z('veh_drug'), Z('veh_drug'), Z('veh_val')), M2 = split(Z('moto') + Z('moto_oth') + Z('moto_drug'), Z('moto_drug'), Z('moto_val'));
  const avoir = { E24: Math.round(V.vo), F24: V.o, O24: Math.round(V.vd), P24: V.d, E26: Math.round(M2.vo), F26: M2.o, O26: Math.round(M2.vd), P26: M2.d };
  const plan = { 'AVOIRE CRIMINEL': avoir, 'CRIMINALITE PJ': crim, 'TOTAL CODE DE LA ROUTE': route, "bilan d'activité globale": bil, 'BARRAGES': bars, 'SAISIES OPEREES MENSUELLES': sz, 'INSTANCE': inst, 'GARDE  A VUE': gv,
    'MAHIA': { C16: mah.aff, D16: mah.tot, E16: Z('edv_l') + Z('edv_s') }, 'MENDICITE': { B77: men.aff, C77: men.tot, D77: men.am, E77: men.af, F77: men.mm, G77: men.mf } };
  const zip = await XL.fill(await zipOf('m'), plan);
  await save(zip, 'MENSUEL_TIFLET_' + (part ? days[0].slice(8) + '-' + days[days.length - 1].slice(8) + '_' : 'MOIS_') + MOIS[mi] + '_' + m.slice(0, 4) + '.xlsx');
}

/* ---------- render & events ---------- */
const JOURS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const SZFR = { chira: 'grs chira', kif: 'grs kif', tabac: 'grs tabac', maajoun: 'grs maajoun', coc: 'grs cocaïne', hero: 'grs héroïne', psy: 'comprimés psychotropes', diss: 'tubes de dissolution', ab: 'arme(s) blanche(s)', bomb: 'bombe(s) lacrymogène(s)', gourd: 'gourdin(s)', alc_sans: 'bouteilles sans vignette', alc_avec: 'bouteilles avec vignette', alc96: 'L alcool 96°', edv_l: "L eau de vie", edv_s: "L eau de vie (sachets)", cig: 'paquets de cigarettes', med: 'boîtes de médicaments', carb: 'L carburant', tel: 'téléphone(s)', veh: 'véhicule(s)', veh_drug: 'véhicule(s) (trafic de drogue)', veh_oth: 'véhicule(s)', moto: 'moto(s)', moto_drug: 'moto(s) (trafic de drogue)', moto_oth: 'moto(s)', trip: 'triporteur(s)', trip_drug: 'triporteur(s) (trafic de drogue)', trip_oth: 'triporteur(s)', narg: 'narguilé(s)', mont: 'Dhs' };
const p2 = n => String(n).padStart(2, '0');
function reportText(d) {
  const s = sec(d), ex = s.exam || {}, z = szMerged(s), g = gavRows(d);
  const dt = new Date(d + 'T12:00:00');
  const DRN = { 92: 'chira', 93: 'kif', 94: 'huile de cannabis', 95: 'cocaïne', 96: 'héroïne', 97: 'psychotropes', 98: 'drogues' };
  const motifTxt = e => { const m = CRIM[e.mi] || { l: '?' }; if (m.c === DRUG) return 'détention et ' + (e.dn === 't' ? 'trafic' : 'consommation') + ' de ' + (DRN[m.r] || m.l.toLowerCase()); return m.l; };
  const line = e => { const n = num(e.n), parts = {}; (e.p || []).forEach(p => parts[p.st] = (parts[p.st] || 0) + num(p.n));
    const pp = ['prn', 'prl', 'fl'].filter(k => parts[k]).map((k, i) => p2(parts[k]) + ' personne' + (parts[k] > 1 ? 's' : '') + (k === 'prn' ? ' PR national' : k === 'prl' ? ' PR local' : '') + (i === 0 ? ' pour ' + motifTxt(e) : ' pour même motif')).join(' + ');
    const prs = prOrder(S.ents.filter(x => x.k === 'pr' && x.aff === e.id && x.nom));
    const onlyPr = !parts.fl && prs.length === 1 && (parts.prn || 0) + (parts.prl || 0) === 1;
    const head = onlyPr ? p2(n) + ' affaire' + (n > 1 ? 's' : '') + '  => 01 personne ' + (prs[0].prt === 'prn' ? 'PR national' : 'PR local') + ' pour ' + prMotifs(prs[0]).split(' / ').join(' et ') : p2(n) + ' affaire' + (n > 1 ? 's' : '') + '  => ' + (pp || '00 personne pour ' + motifTxt(e));
    return head + prs.map((x, i) => (i ? '\n' : '') + prBlock(x)).join(''); };
  const prBlock = x => { const [nm, pn] = nmSplit(x), sv = [x].concat(XM(x)).map(y => y.svcn).filter((v, i, A) => v && A.indexOf(v) === i);
    return '\nNom : ' + nm + '\nPrenom : ' + pn + '\nCINE : ' + idTxt(x) + '\nService demandeur : ' + (sv.join(' / ') || '-') +
      (x.sd === 'Message' ? [x].concat(XM(x)).map(y => '\nMessg nr : ' + (y.ref || '-') + (y.rd && y.rm && y.ry ? ' du ' + y.rd + '.' + y.rm + '.' + y.ry : '')).join('') : '\nSource : ' + (x.sd || '-')); };
  const blk = (t, l) => l.length ? '*' + t + ' :*\n' + (L => L.map((x, i) => i && (/\nNom : /.test(x) || /\nNom : /.test(L[i - 1])) ? '\n' + x : x).join('\n'))(l.map(line)) + '\n' : '*' + t + ' :* néant\n';
  const aff = dayEnts(d, 'aff'), bl = dayEnts(d, 'bar');
  const gs = u => g.filter(r => r.u === u).reduce((a, r) => a + num(r.n), 0), gf = g.filter(r => r.s === 'f').reduce((a, r) => a + num(r.n), 0), gm = g.filter(r => r.a === 'm').reduce((a, r) => a + num(r.n), 0);
  const zs = []; SZ.forEach(([, fs]) => fs.forEach(([k]) => { if (num(z[k]) && !/_val$/.test(k)) zs.push((k === 'mont' ? num(z[k]) : p2(num(z[k]))) + ' ' + SZFR[k]); }));
  const all = aff.concat(bl), A = agg(all);
  return '*حصيلة العمليات الأمنية ليوم ' + JOURS[dt.getDay()] + ' بتيفلت بتاريخ ' + fr(d) + '*\n\n' +
    blk('PJ', aff.filter(e => e.u === 'PJ')) + '\n' + blk('SP', aff.filter(e => e.u === 'SP')) + (bl.length ? '\n' + blk('Barrage judiciaire', bl) : '') +
    '\n*Total :* ' + p2(A.all.cnt) + ' affaires => ' + p2(A.all.tot) + ' personnes (FD ' + p2(A.all.fl) + ' ; PR national ' + p2(A.all.prn) + ' ; PR local ' + p2(A.all.prl) + ')\n' +
    '\n*Autres :*\nG.A.V = ' + p2(gs('PJ')) + ' pj + ' + p2(gs('SP')) + ' sp .\n(femme => ' + p2(gf) + ' ; mineur => ' + p2(gm) + ' )\n' +
    'Exam = ' + num(ex.pj) + ' pj + ' + num(ex.sp) + ' sp .\n' + 'Saisis = ' + (zs.length ? zs.join(' + ') : 'néant') + ' .';
}
function preview() {
  const t = reportText(S.date);
  return '<section class="card preview"><h2>الحصيلة اليومية</h2><pre class="rep" dir="auto">' + esc(t) + '</pre>' + (isClosed(S.date) ? '<div class="actions"><button type="button" class="primary green" data-copy>نسخ النص</button><a class="wa" href="https://wa.me/?text=' + encodeURIComponent(t) + '" target="_blank" rel="noopener">صيفط فواتساب</a></div>' : '<div class="actions"><button type="button" class="primary" disabled>نسخ النص 🔒</button><button type="button" class="wa" disabled>صيفط فواتساب 🔒</button></div><p class="need-msg">باش تنسخ ولا تصيفط فواتساب، خاصك تصادق قبل: ورك على «✓ صادق وسد الحصيلة» اللي الفوق.</p>') + '<p class="muted">"نسخ النص" ومن بعد لصقو فأي محادثة فواتساب، ولا كليكي "صيفط فواتساب" وختار الشخص ولا المجموعة.</p></section>';
}
const TABS = [['aff', 'القضايا'], ['sz', 'المحجوزات'], ['bar', 'السدود'], ['rt', 'الهيئة الحضرية ومصلحة حوادث السير'], ['inst', 'التعليمات وملفات أخرى'], ['pr', 'المبحوث عنهم'], ['day', 'الحصيلة اليومية'], ['month', 'الشهر']];
const PANELS = { aff: pAff, sz: pSz, bar: pBar, rt: pRt, inst: pInst, pr: pPr, day: pDay, month: pMonth };
function render() {
  const a = document.activeElement; if (a && a.matches && a.matches('input,select') && a.closest('#main')) { S.dirty = true; return; }
  if (!S.own && S.tab === 'month') S.tab = 'day';
  $('#tabs').innerHTML = TABS.filter(([k]) => S.own || k !== 'month').map(([k, l]) => '<button type="button" class="' + (S.tab === k ? 'on' : '') + '" data-tab="' + k + '">' + l + '</button>').join('');
  $('#status').textContent = !S.db ? (S.dbTried ? 'ما قدرتش نحل الذاكرة ديال التيليفون. سد التطبيق وعاود حلو.' : 'كنتصل…') : (S.err || (S.ready ? '' : 'كنجيب المعلومات…'));
  $('#span').textContent = 'v82 · الحصيلة: ' + span(S.date) + (isClosed(S.date) ? ' · مسدودة ✓' : '');
  const emptied = isClosed(S.date) && !['day', 'month'].includes(S.tab);
  let html;
  if (emptied) {
    /* بعد المصادقة: نفس الخانات، ولكن كلشي كيرجع زيرو (المعطيات محفوظة فالحصيلة اليومية) */
    const keepS = S.secs, keepE = S.ents, keepG = S.gav, keepJ = S.just, d = S.date;
    S.secs = Object.assign({}, keepS, { [d]: { closed: true } }); S.ents = keepE.filter(e => e.d !== d); S.gav = []; S.just = [];
    try { html = PANELS[S.tab](); } finally { S.secs = keepS; S.ents = keepE; S.gav = keepG; S.just = keepJ; }
  } else html = PANELS[S.tab]() + (S.tab === 'day' ? preview() + (isClosed(S.date) ? reopenBox(S.date) : '') : '');
  $('#main').innerHTML = html;
  if (emptied) $('#main').querySelectorAll('input[type=number]').forEach(x => { if (x.value === '') x.value = '0'; x.disabled = true; });
  const f = $('#main .form'); if (f) { const fk = f.dataset.form; bindPicker(f, fk === 'iform' ? INST : CRIM, i => { readForm(fk); S[fk].mi = i; if (document.activeElement) document.activeElement.blur(); render(); }); }
}
function readForm(fk) {
  const f = S[fk], root = $('[data-form="' + fk + '"]'); if (!root) return f;
  root.querySelectorAll('.prow').forEach(r => { const p = f.p[+r.dataset.i]; r.querySelectorAll('select').forEach(s => p[s.dataset.f] = s.dataset.f === 'n' ? +s.value : s.value); });
  root.querySelectorAll(':scope > .grid2 select[data-f], :scope .grid2 > label > select[data-f], :scope .grid3 select[data-f]').forEach(s => { if (s.closest('.prow')) return; f[s.dataset.f] = ['n', 'res'].includes(s.dataset.f) ? +s.value : s.value; });
  root.querySelectorAll('[data-v]').forEach(i => { if (i.tagName === 'INPUT') { f.v = f.v || {}; f.v[i.dataset.v] = num(i.value); } });
  root.querySelectorAll('[data-i]').forEach(i => { if (i.tagName === 'INPUT') f[i.dataset.i] = num(i.value); });
  root.querySelectorAll('[data-am]').forEach(i => f.mont = i.value === '' ? '' : num(i.value));
  root.querySelectorAll('[data-p]').forEach(i => f[i.dataset.p] = i.type === 'number' ? (i.value === '' ? '' : num(i.value)) : i.value.trim().toUpperCase());
  if (fk === 'pform') root.querySelectorAll('.xm').forEach(d => { const x = (f.xm = f.xm || [])[+d.dataset.xi]; if (!x) return; d.querySelectorAll('[data-xk]').forEach(i => x[i.dataset.xk] = i.dataset.xk === 'mi' ? +i.value : i.value.trim().toUpperCase()); });
  return f;
}
const rmArm = {};
document.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('details.initd')) S.initOpen = e.target.open; }, true);
function readJust() { document.querySelectorAll('.prow.j').forEach(r => { const g = S.just[+r.dataset.ji]; r.querySelectorAll('select').forEach(x => g[x.dataset.f] = x.dataset.f === 'n' ? +x.value : x.value); }); }
function saveJust() { const rows = JSON.parse(JSON.stringify(S.just)); S.secs[S.date] = S.secs[S.date] || {}; S.secs[S.date].justr = rows; saveSec(S.date, { justr: rows }); }
function readGav() { document.querySelectorAll('.prow.g').forEach(r => { const g = S.gav[+r.dataset.gi]; r.querySelectorAll('select').forEach(x => g[x.dataset.f] = x.dataset.f === 'n' ? +x.value : x.value); }); }
function saveGav() { const rows = JSON.parse(JSON.stringify(S.gav)); S.secs[S.date] = S.secs[S.date] || {}; S.secs[S.date].gavr = rows; saveSec(S.date, { gavr: rows }); }
document.addEventListener('click', async ev => {
  const t = ev.target.closest('button'); if (!t) return;
  const form = t.closest('[data-form]'), fk = form && form.dataset.form;
  if (t.dataset.tab) { if (fk) readForm(fk); S.tab = t.dataset.tab; S.dirty = false; render(); window.scrollTo(0, 0); return; }
  if (t.dataset.zdel) { if (lockMsg(S.date)) return; const id = 'z' + t.dataset.zdel; if (!rmArm[id]) { rmArm[id] = 1; t.textContent = 'أكيد؟'; setTimeout(() => { delete rmArm[id]; }, 4000); return; } delete rmArm[id]; const [a, b] = t.dataset.zdel.split('.'); S.secs[S.date] = S.secs[S.date] || {}; S.secs[S.date][a] = Object.assign({}, S.secs[S.date][a] || {}, { [b]: null }); await saveSec(S.date, { [a]: { [b]: null } }); render(); toast('تحذف'); return; }
  if (t.hasAttribute('data-copy') && !isClosed(S.date)) { toast('صادق على الحصيلة قبل'); return; }
  if (t.hasAttribute('data-copy')) { const txt = reportText(S.date); try { await navigator.clipboard.writeText(txt); toast('تنسخ النص، لصقو فواتساب'); } catch (e) { const r = document.createRange(); r.selectNodeContents($('.rep')); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); toast('النص محدد، نسخو يدويا'); } return; }
  if (t.hasAttribute('data-close') && prMissing(S.date)) { toast('كمل ملء معطيات الأشخاص المبحوث عنهم قبل المصادقة'); return; }
  if (t.hasAttribute('data-close')) { t.disabled = true; await saveSec(S.date, { closed: true, closedAt: Date.now() }, true); S.secs[S.date] = Object.assign(S.secs[S.date] || {}, { closed: true }); render(); try { await exportDay(); } catch (e) { toast('مشكل فالملف: ' + e.message); } return; }
  if (t.hasAttribute('data-reopen') && !canReopen(S.date)) { toast('فاتت 24 ساعة: التعديل غير عند المسؤول'); return; }
  if (t.hasAttribute('data-reopen')) { await saveSec(S.date, { closed: false }, true); S.secs[S.date].closed = false; render(); toast('النهار تحل: بدل اللي بغيتي، ومن بعد صادق مرة أخرى'); return; }
  if (t.dataset.open) { S.date = t.dataset.open; $('#date').value = S.date; S.form = S.bform = S.iform = S.pform = S.gav = S.just = null; S.tab = 'day'; render(); window.scrollTo(0, 0); return; }
  if (t.dataset.xd) { t.disabled = true; try { await exportDay(t.dataset.xd); } catch (e) { toast('مشكل فالملف: ' + e.message); } t.disabled = false; return; }
  if ((t.hasAttribute('data-gadd') || t.dataset.gdel != null || t.hasAttribute('data-jadd') || t.dataset.jdel != null) && lockMsg(S.date)) return;
  if (t.hasAttribute('data-jadd')) { readJust(); const l = S.just[S.just.length - 1] || { st: 'det', ct: 'tpi', s: 'm', a: 'a' }; S.just.push({ st: l.st, ct: l.ct, s: l.s, a: l.a, n: 1 }); saveJust(); render(); return; }
  if (t.dataset.jdel != null) { readJust(); S.just.splice(+t.dataset.jdel, 1); saveJust(); render(); return; }
  if (t.hasAttribute('data-gadd')) { readGav(); const l = S.gav[S.gav.length - 1] || { u: 'PJ', a: 'a', s: 'm' }; S.gav.push({ u: l.u, a: l.a, s: l.s, n: 1 }); saveGav(); render(); return; }
  if (t.dataset.gdel != null) { readGav(); S.gav.splice(+t.dataset.gdel, 1); saveGav(); render(); return; }
  if (t.hasAttribute('data-dock')) { $('#sheet').classList.toggle('on'); return; }
  if (t.dataset.it) { if (fk) readForm(fk); S.instT = t.dataset.it; if (!S.iform || !S.iform.id) S.iform = null; render(); return; }
  if (t.dataset.goto) { S.tab = t.dataset.goto; const nx = prOrder(dayEnts(S.date, 'pr')).find(e => !e.nom); if (nx && S.tab === 'pr') S.pform = JSON.parse(JSON.stringify(nx)); render(); window.scrollTo(0, 0); return; }
  if (t.closest('.seg') && fk) { readForm(fk); S[fk][t.closest('.seg').dataset.seg] = t.dataset.v; render(); return; }
  if (t.dataset.add === 'p') { readForm(fk); const l = S[fk].p[S[fk].p.length - 1] || { st: 'fl', a: 'a', s: 'm' }; S[fk].p.push({ st: l.st, a: l.a, s: l.s, n: 1 }); render(); return; }
  if (t.dataset.del != null) { readForm(fk); S[fk].p.splice(+t.dataset.del, 1); render(); return; }
  if (t.hasAttribute('data-cancel')) { S[fk] = newAff(S[fk].k); render(); return; }
  if (t.hasAttribute('data-save')) {
    const f = readForm(fk); f.d = S.date;
    if (f.mi < 0) { toast('ختار الموتيف'); return; }
    if (f.k === 'aff' && f.u === 'SP' && !f.arr) { toast('ختار الدائرة: الأولى ولا الثانية'); return; }
    if (f.u !== 'SP') delete f.arr;
    if (!f.p.length) { toast('زيد على الأقل شخص واحد'); return; }
    if (f.res > f.n) f.res = f.n;
    const p = pers(f);
    if (p.tot < f.n) toast('تنبيه: عدد الأشخاص (' + p.tot + ') قل من عدد القضايا (' + f.n + ')');
    t.disabled = true;
    const sid = await saveEnt(f); if (sid) { const k = await syncPr(f, sid); S[fk] = newAff(f.k); toast(k ? 'تسجلات، وتزادو ' + k + ' للائحة المبحوث عنهم' : 'تسجلات'); }
    t.disabled = false; S.dirty = false; render(); return;
  }
  if (t.dataset.edit) { const e = S.ents.find(x => x.id === t.dataset.edit); S[t.dataset.fk] = JSON.parse(JSON.stringify(e)); render(); window.scrollTo(0, 0); return; }
  if (t.dataset.rm) { const id = t.dataset.rm; if (!rmArm[id]) { rmArm[id] = 1; t.textContent = 'أكيد؟'; setTimeout(() => { delete rmArm[id]; }, 4000); return; } const e = S.ents.find(x => x.id === id); if (e) await delEnt(e); return; }
  if (t.hasAttribute('data-isave')) {
    const f = readForm('iform'); f.d = S.date; f.u = 'PJ';
    if (f.t === 'ren' && !f.arr) { toast('ختار الدائرة: الأولى ولا الثانية'); return; }
    if (f.t === 'ins' && !f.ct) { toast('ختار المحكمة: الابتدائية ولا الاستئناف'); return; }
    if (f.t === 'ren') delete f.ct; else delete f.arr;
    if (f.mi < 0) f.mi = INST.findIndex(m => /^Autres m/i.test(m.l)); if (!f.in && !f.out) { toast('دخل شحال دخل ولا شحال خرج'); return; }
    if (await saveEnt(f)) { S.iform = { k: 'inst', d: S.date, t: f.t, u: 'PJ', arr: f.arr, ct: f.ct, mi: -1, in: 0, out: 0 }; toast('تسجلات'); } render(); return;
  }
  if (t.hasAttribute('data-icancel')) { S.iform = null; render(); return; }
  if (t.dataset.iedit) { S.iform = JSON.parse(JSON.stringify(S.ents.find(x => x.id === t.dataset.iedit))); S.instT = S.iform.t; render(); window.scrollTo(0, 0); return; }
  if (t.dataset.paddx) { const e = S.ents.find(x => x.id === t.dataset.paddx); if (e) { const f = S.pform = JSON.parse(JSON.stringify(e)); f.xm = (f.xm || []).concat([{ mi: f.mi, ref: '', rd: '', rm: '', ry: '', svc: f.svc || 'Police', svcn: '' }]); render(); const xs = document.querySelectorAll('.xm'); if (xs.length) xs[xs.length - 1].scrollIntoView({ block: 'center' }); } return; }
  if (t.hasAttribute('data-xadd')) { const f = readForm('pform'); f.xm = (f.xm || []).concat([{ mi: f.mi, ref: '', rd: '', rm: '', ry: '', svc: f.svc || 'Police', svcn: '' }]); render(); return; }
  if (t.dataset.xrm != null) { const f = readForm('pform'); f.xm.splice(+t.dataset.xrm, 1); render(); return; }
  if (t.hasAttribute('data-xall') && S.own) { t.disabled = true; try { const data = {}, now = new Date().toISOString().slice(0, 7); for (let y = 2026, mo = 1; ; ) { const m = y + '-' + p2(mo); for (const c of ['e', 's']) { const q = await S.db.collection('m/' + m + '/' + c).get(); q.docs.forEach(x => data['m/' + m + '/' + c + '/' + x.id] = x.data()); } if (m >= now) break; mo++; if (mo > 12) { mo = 1; y++; } }
      for (const p of ['cfg/main', 'cfg/date']) { const d = await S.db.doc(p).get(); if (d.exists) data[p] = d.data(); }
      const blob = new Blob([JSON.stringify({ app: 'statistique-mensuelle', v: 1, at: new Date().toISOString(), name: 'PJ TIFLET (EN LIGNE)', data })], { type: 'application/json' });
      await S.dl.save({ filename: 'SAUVEGARDE_EN_LIGNE_' + todayStr() + '.json', data: blob }); toast('تحمل الملف: ' + Object.keys(data).length + ' وثيقة'); } catch (e) { toast('ما تحملش: ' + (e.code || e.message)); } t.disabled = false; return; }
  if (t.hasAttribute('data-psave')) {
    const f = readForm('pform'); f.d = S.date;
    if (!f.prt) { toast('حدد النوع: PR national ولا PR local'); return; }
    if (f.prt === 'prl' && f.sd !== 'PV' && f.sd !== 'Instruction parquet') { toast('PR local: حدد واش PV ولا Instruction parquet'); return; }
    if (f.prt === 'prn') f.sd = 'Message';
    f.nm = String(f.nm || '').trim(); f.pn = String(f.pn || '').trim(); f.nom = (f.nm + ' ' + f.pn).trim();
    if (!f.nm) { toast('كتب النسب (Nom)'); return; }
    if (!f.pn) { toast('كتب الاسم الشخصي (Prénom)'); return; }
    if (!String(f.svcn || '').trim()) { toast('كتب السمية ديال الجهة اللي دارت البحث (الشرطة ولا الدرك الملكي)'); return; } if (f.idt !== 'cnie') f.cnie = ''; if (!montOk(f)) f.mont = ''; else if (f.aff && (f.mont === '' || f.mont == null)) { const a = S.ents.find(x => x.id === f.aff); if (a && a.mont) f.mont = a.mont; } if (f.sd !== 'Message') { f.nb = ''; f.ref = ''; f.rd = f.rm = f.ry = ''; } else if ((f.rd || f.rm || f.ry) && !(f.rd && f.rm && f.ry)) { toast('كمل التاريخ ديال الميساج: النهار والشهر والعام'); return; }
    if (f.idt === 'cnie' && !f.cnie) { toast('كتب رقم البطاقة، ولا ختار Mineur / Dépourvu'); return; }
    if (f.prt !== 'prn') f.xm = []; else { f.xm = f.xm || []; const bx = f.xm.findIndex(x => !x.ref || !x.svcn || ((x.rd || x.rm || x.ry) && !(x.rd && x.rm && x.ry))); if (bx >= 0) { toast('البرقية ' + (bx + 2) + ': كمل الرقم والسمية ديال الجهة والتاريخ كامل'); return; } f.nb = 1 + f.xm.length; }
    if (await saveEnt(f)) { if (f.id) { const ix = S.ents.findIndex(x => x.id === f.id); if (ix >= 0) S.ents[ix] = Object.assign({}, f); } S.pform = null; toast('تسجل'); } render(); return;
  }
  if (t.hasAttribute('data-pcancel')) { S.pform = null; render(); return; }
  if (t.dataset.pedit) { S.pform = JSON.parse(JSON.stringify(S.ents.find(x => x.id === t.dataset.pedit))); render(); window.scrollTo(0, 0); return; }
  try {
    if (t.hasAttribute('data-xday')) { t.disabled = true; await exportDay(); }
    if (t.hasAttribute('data-xpr')) { t.disabled = true; await exportPr(); }
    if (t.hasAttribute('data-xprm') && S.own) { t.disabled = true; await exportPr(true); }
    if (t.dataset.rv) { S.rv = t.dataset.rv; if (S.rv === 'y') S.yr = null; render(); return; }
  if (t.hasAttribute('data-xprmot')) { t.disabled = true; try { await exportPrMotif(); } catch (e) { toast('مشكل فالملف: ' + e.message); } t.disabled = false; return; }
  if (t.hasAttribute('data-ready') && S.own) { const r = READY[+t.getAttribute('data-ready')]; if (!S.dl) { toast('التحميل ما متاحش هنا'); return; } t.disabled = true; try { const res = await fetch(r[1], { cache: 'no-store' }); if (!res.ok) throw { code: res.status }; const j = await res.json(), bin = atob(j.b64), u8 = new Uint8Array(bin.length); for (let q = 0; q < bin.length; q++) u8[q] = bin.charCodeAt(q); const blob = new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); await S.dl.save({ filename: r[2], data: blob }); toast('تحمل الملف'); } catch (e) { if (e.code !== 'declined') toast('ما تحملش: ' + (e.code || e.message)); } t.disabled = false; return; }
  if (t.hasAttribute('data-xmonth') && S.own) { t.disabled = true; S.pf = +($('[data-pf]') || {}).value || 1; S.pt = +($('[data-pt]') || {}).value || 31; await exportMonth(+t.getAttribute('data-xmonth') || 0); t.disabled = false; }
  } catch (e) { toast('مشكل فالملف: ' + e.message); }
  if (t.closest('#sheet')) $('#sheet').classList.remove('on');
  t.disabled = false;
});
document.addEventListener('input', ev => { const t = ev.target; if (t.hasAttribute && t.hasAttribute('data-pf')) S.pf = +t.value || 1; if (t.hasAttribute && t.hasAttribute('data-pt')) S.pt = +t.value || 31; });
document.addEventListener('change', ev => {
  const i = ev.target;
  if (i.closest('.prow.j')) { if (lockMsg(S.date)) { S.just = null; i.blur(); render(); return; } readJust(); saveJust(); render(); return; }
  if (i.closest('.prow.g')) { if (lockMsg(S.date)) { S.gav = null; i.blur(); render(); return; } readGav(); saveGav(); return; }
  if (i.dataset.f === 'n' && !i.closest('.prow')) { const r = i.closest('.form').querySelector('select[data-f="res"]'); if (r) r.value = i.value; return; }
  if (i.hasAttribute('data-exman')) { S.exMan = i.checked; i.blur(); render(); return; }
  if (i.hasAttribute('data-szsel')) { S.szb = i.value || null; i.blur(); render(); return; }
  if (i.id === 'date') { if (!i.value) return; if (!S.own && !S.dateFree) { i.value = S.date; return; } S.date = i.value; S.form = S.bform = S.iform = S.pform = S.gav = S.just = null; subscribeMonth(month(S.date)); render(); return; }
  if (i.dataset.sec) {
    if (lockMsg(S.date)) { S.dirty = false; i.blur(); render(); return; }
    const path = i.dataset.sec.split('.'), v = i.value === '' ? null : num(i.value), patch = {}; let o = patch;
    path.forEach((k, j) => { if (j === path.length - 1) o[k] = v; else o = o[k] = {}; });
    const cur = S.secs[S.date] = S.secs[S.date] || {}; let c = cur; path.forEach((k, j) => { if (j === path.length - 1) c[k] = v; else c = c[k] = c[k] || {}; });
    if (path[0] === 'exam' && (path[1] === 'a1' || path[1] === 'a2')) { const ex = cur.exam || {}; const sp = (ex.a1 == null && ex.a2 == null) ? null : num(ex.a1) + num(ex.a2); ex.sp = sp; patch.exam.sp = sp; }
    saveSec(S.date, patch); return;
  }
  if (i.dataset.init) { const [mi, k] = i.dataset.init.split('.'); S.cfg.init[mi] = S.cfg.init[mi] || {}; S.cfg.init[mi][k] = num(i.value); saveCfg(); return; }
  if (i.dataset.cfg === 'from') { S.cfg.from = i.value; saveCfg(); loadHist(); return; }
});
document.addEventListener('focusout', () => setTimeout(() => { if (S.dirty && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#main input:not([type=search]),#main select'))) { S.dirty = false; const fk = ($('#main .form') || {}).dataset; if (fk && fk.form) readForm(fk.form); render(); } }, 0));
let cfgT; function saveCfg() { clearTimeout(cfgT); cfgT = setTimeout(async () => { if (!S.db) return; try { await S.db.doc('cfg/main').set({ init: S.cfg.init, from: S.cfg.from || '' }); toast('الرصيد تسجل'); } catch (e) { toast('ما تسجلش'); } }, 800); }

/* ---------- boot ---------- */
$('#date').value = S.date;
render();
(async () => {
  try { S.dl = await window.claude.use('downloads'); } catch (e) {}
  try { S.db = await window.claude.use('db'); } catch (e) { S.db = null; }
  try { const u = await window.claude.use('user'); S.own = u ? !!(await u.isOwner()) : true; } catch (e) { S.own = true; }
  dateLock();
  S.dbTried = true;
  if (S.db) {
    S.db.doc('cfg/main').onSnapshot(s => { if (s.exists) { const d = s.data(); S.cfg = { init: JSON.parse(JSON.stringify(d.init || {})), from: d.from || '' }; loadHist(); } }, () => {});
    S.db.doc('cfg/date').onSnapshot(s => { S.dateFree = !!(s.exists && s.data().free); dateLock(); render(); }, () => {});
    subscribeMonth(month(S.date));
  }
  render();
})();
function dateLock() {
  const inp = $('#date'); let b = $('#dlock');
  if (S.own) {
    inp.disabled = false;
    if (!b) { b = document.createElement('button'); b.id = 'dlock'; b.type = 'button'; inp.parentNode.appendChild(b); b.addEventListener('click', async () => { if (!S.db) return; try { await S.db.doc('cfg/date').set({ free: !S.dateFree, at: Date.now() }); toast(!S.dateFree ? 'المساعدين يقدرو يبدلو النهار دابا' : 'النهار تقفل على المساعدين'); } catch (e) { toast('ما تسجلش'); } }); }
    b.textContent = S.dateFree ? '🔓 المساعدين يقدرو يبدلو النهار (ورك باش تقفل)' : '🔒 النهار مقفول على المساعدين (ورك باش تحل)';
    b.className = 'dlock' + (S.dateFree ? ' on' : '');
    return;
  }
  if (b) b.remove();
  if (S.dateFree) { inp.disabled = false; return; }
  inp.disabled = true;
  const y = todayStr();
  if (S.date !== y) { S.date = y; inp.value = y; S.form = S.bform = S.iform = S.pform = S.gav = S.just = null; subscribeMonth(month(y)); }
}
}
