/* App shell, screens and practice logic. Content lives in data.js.
   Security: nothing the user types is ever inserted as HTML; the only free text (the
   first name) goes through esc(). Everything stays in this device's localStorage. */
'use strict';
const $ = s => document.querySelector(s);
const view = $('#view'), dock = $('#dock'), dockin = $('#dockin');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
const TEST_DAY = new Date(2026, 10, 12);
const LETTERS = 'אבגדהוזח';

/* ---------- icons ---------- */
const UI = {
  back:'<path d="M9 5l7 7-7 7"/>',
  chev:'<path d="M15 5l-7 7 7 7"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  book:'<path d="M12 6.5C9.5 5 6 4.6 3 5.5v13c3-.9 6.5-.5 9 1 2.5-1.5 6-1.9 9-1v-13c-3-.9-6.5-.5-9 1zM12 6.5v13"/>',
  practice:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  timer:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M18.5 6.5L20 5"/>',
  hint:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  ok:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>',
  bad:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.4"/>',
  shuffle:'<path d="M4 7h3c5 0 5 10 10 10h3M4 17h3c2 0 3-1.5 4-3.5M13 9.5C14 7.5 15 7 17 7h3M17 4l3 3-3 3M17 14l3 3-3 3"/>',
  redo:'<path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"/>'
};
const ui = (k, cls) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'+(cls?' class="'+cls+'"':'')+'>'+UI[k]+'</svg>';
const TICON = {
  a:'<rect x="7" y="8" width="10" height="10" rx="2"/><rect x="31" y="8" width="10" height="10" rx="2"/><rect x="7" y="20" width="10" height="10" rx="2"/><rect x="19" y="20" width="10" height="10" rx="2"/><rect x="31" y="20" width="10" height="10" rx="2"/><rect x="7" y="32" width="10" height="10" rx="2"/><rect x="19" y="32" width="10" height="10" rx="2" fill="currentColor"/><rect x="31" y="32" width="10" height="10" rx="2"/>',
  b:'<circle cx="24" cy="24" r="11"/><circle cx="24" cy="24" r="19"/><circle cx="24" cy="24" r="5" fill="currentColor"/><g fill="currentColor" stroke="none"><circle cx="24" cy="13" r="2.6"/><circle cx="24" cy="35" r="2.6"/><circle cx="24" cy="5" r="2.6"/><circle cx="43" cy="24" r="2.6"/><circle cx="24" cy="43" r="2.6"/><circle cx="5" cy="24" r="2.6"/></g>',
  c:'<path d="M24 20L12 33M24 20L36 33"/><circle cx="24" cy="18" r="8" fill="currentColor"/><circle cx="11" cy="34" r="5" fill="var(--surface)"/><circle cx="37" cy="34" r="5" fill="var(--surface)"/>',
  d:'<path d="M13.5 31H34.5L38 38Q39.5 41 36 41H12Q8.5 41 10 38Z" fill="currentColor" stroke="none" opacity=".3"/><path d="M18 6H30M21 6V18L9 39Q7 43 12 43H36Q41 43 39 39L27 18V6"/><circle cx="20" cy="36" r="1.6" fill="currentColor" stroke="none"/><circle cx="27" cy="37.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="24" cy="33" r="1.3" fill="currentColor" stroke="none"/>',
  e:'<path d="M8 6V41H42"/><path d="M11 26H42" stroke-dasharray="2 4" stroke-width="1.6"/><path d="M11 26H16C21 26 21 10 26 10C31 10 31 35 36 35H42"/>'
};
const ticon = (t, lg) => '<span class="ticon'+(lg?' lg':'')+'" style="--ts:'+ts(t)+';--tc:'+tc(t)+'"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+TICON[t.id]+'</svg></span>';
const pg = t => t.pages.replace(/(\d+–\d+)/, '<span dir="ltr">$1</span>');
const tc = t => 'var(--t'+t.n+')', ts = t => 'var(--t'+t.n+'s)';

/* ---------- storage (this device only) ---------- */
const KEY = 'chem9-12-11';
const STATUS = new Set(['ok','ok2','fail']);
let store = {p:{}, exams:[]};
(function load(){
  try{
    const s = JSON.parse(localStorage.getItem(KEY));
    if(!s || typeof s !== 'object') return;
    const p = {};
    if(s.p && typeof s.p === 'object') for(const id of Object.keys(s.p)) if(QM[id] && STATUS.has(s.p[id])) p[id] = s.p[id];
    const exams = Array.isArray(s.exams) ? s.exams.filter(e => e && Number.isFinite(e.score) && typeof e.date === 'string').slice(-20).map(e => ({score:Math.max(0,Math.min(100,Math.round(e.score))), date:e.date.slice(0,16)})) : [];
    store = {p, exams};
    if(typeof s.name === 'string') store.name = cleanName(s.name);
  }catch(e){}
})();
function save(){try{localStorage.setItem(KEY, JSON.stringify(store))}catch(e){}}
function cleanName(v){
  return String(v).normalize('NFC').replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩<>]/g,'').replace(/\s+/g,' ').trim().slice(0,20);
}
const solved = id => store.p[id] === 'ok' || store.p[id] === 'ok2';
function tstat(id){const qs = Q.filter(q => q.id[0] === id); return {n:qs.length, d:qs.filter(q => solved(q.id)).length}}

/* ---------- routing ---------- */
let sess = null, depth = 0;
const scrolls = Object.create(null); // keyed by location.hash
function route(){
  const h = location.hash.replace(/^#\/?/, '').split('/');
  const tab = ['learn','practice','exam','q'].includes(h[0]) ? h[0] : 'learn';
  return {tab, topic: tab === 'learn' && TM[h[1]] ? h[1] : null, hash: location.hash || '#/learn'};
}
function go(hash, replace){
  scrolls[location.hash] = scrollY;
  if(replace) history.replaceState({d:depth}, '', hash);
  else history.pushState({d:++depth}, '', hash);
  render('fwd', true);
}
function goBack(fallback){
  if(depth > 0) history.back(); else go(fallback, true);
}
addEventListener('popstate', e => {
  const d = (e.state && e.state.d) || 0;
  const dir = d < depth ? 'back' : 'fwd';
  if(sess && sess.mode === 'exam' && !sess.finished && Object.keys(sess.res).length && route().tab !== 'q'){
    // system back in the middle of a mock exam: stay, and ask first (same as the X button)
    history.pushState({d:d+1}, '', '#/q'); depth = d+1; askQuitExam(); return;
  }
  depth = d; render(dir, false);
});

function render(dir, toTop){
  const paint = () => {
    draw();
    const y = dir === 'back' ? (scrolls[location.hash] || 0) : 0;
    if(toTop || dir === 'back') scrollTo(0, y);
  };
  if(dir && document.startViewTransition && !reduceMotion.matches){
    document.documentElement.dataset.nav = dir;
    document.startViewTransition(paint).ready.catch(() => {}); // a skipped transition is fine; paint still runs
  } else paint();
}

/* ---------- shell ---------- */
function countdown(){
  const n = new Date(), t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const d = Math.round((TEST_DAY - t0) / 864e5);
  return d > 1 ? 'עוד '+d+' ימים' : d === 1 ? 'המבחן מחר' : d === 0 ? 'המבחן היום' : '';
}
function shell({title, back, close, tab}){
  $('#title').textContent = title;
  const b = $('#back'), c = $('#close'), cd = $('#cd');
  b.hidden = !back; c.hidden = !close;
  const t = countdown(); cd.textContent = t; cd.hidden = !!close || !t;
  document.querySelectorAll('.tab').forEach(x => x.dataset.tab === tab ? x.setAttribute('aria-current','page') : x.removeAttribute('aria-current'));
  document.title = title === 'חזרה לכימיה ט׳' ? title : title + ' | חזרה לכימיה ט׳';
}
function setDock(html, cls){
  dock.hidden = false; dock.className = 'dock' + (cls ? ' '+cls : ''); dockin.innerHTML = html; padDock();
}
function clearDock(){dock.hidden = true; dockin.innerHTML = ''; padDock()}
function padDock(){
  const session = document.body.classList.contains('session');
  const h = dock.hidden ? 0 : dock.offsetHeight;
  view.style.paddingBottom = h ? 'calc('+h+'px + 24px'+(session ? '' : ' + var(--tabbar) + env(safe-area-inset-bottom, 0px)')+')' : '';
}
if('ResizeObserver' in window) new ResizeObserver(padDock).observe(dock);

function draw(){
  const r = route();
  document.body.classList.remove('session','onboard','hasdock');
  clearDock();
  if(store.name === undefined) return drawWelcome();
  if(r.tab === 'q'){
    if(!sess) return go('#/learn', true);
    document.body.classList.add('session');
    return sess.finished ? drawSummary() : drawQ();
  }
  if(sess) sess = null; // left a session with the system back button
  if(r.tab === 'learn') return r.topic ? drawTopic(r.topic) : drawHome();
  if(r.tab === 'practice') return drawPractice();
  drawExamHome();
}

/* ---------- atom gauge ---------- */
function gauge(full){
  const st = TOPICS.map(t => tstat(t.id));
  const done = st.reduce((a,s) => a + s.d, 0), pct = Math.round(100 * done / Q.length);
  let s = '<svg class="gauge" viewBox="0 0 176 176" role="img" aria-label="'+(full ? 'אטום עם חמש רמות, אחת לכל נושא' : 'התקדמות: '+pct+' אחוז מהשאלות נפתרו')+'">';
  TOPICS.forEach((t,i) => {
    const r = 32 + i*12, C = 2*Math.PI*r, p = full ? 1 : st[i].d / st[i].n;
    const delay = 'transition-delay:'+(i*60)+'ms';
    s += '<circle class="orb" cx="88" cy="88" r="'+r+'"/>'+
      '<circle class="arc" cx="88" cy="88" r="'+r+'" transform="rotate(-90 88 88)" style="stroke:'+tc(t)+';'+delay+'" stroke-dasharray="'+C.toFixed(2)+'" stroke-dashoffset="'+C.toFixed(2)+'" data-off="'+(C*(1-p)).toFixed(2)+'"/>'+
      (p > 0 ? '<g class="eg" style="'+delay+'" data-rot="'+(full ? 360 + i*72 : p*360).toFixed(1)+'"><circle cx="88" cy="'+(88-r)+'" r="5" style="fill:'+tc(t)+';stroke:var(--bg);stroke-width:2"/></g>' : '');
  });
  s += '<circle class="nucleus" cx="88" cy="88" r="20"/>'+(full ? '' : '<text class="ntext" x="88" y="93" text-anchor="middle" direction="ltr">'+pct+'%</text>')+'</svg>';
  return s;
}
function animateGauge(){
  const run = () => view.querySelectorAll('.gauge').forEach(g => {
    g.querySelectorAll('.arc').forEach(a => a.style.strokeDashoffset = a.dataset.off);
    g.querySelectorAll('.eg').forEach(e => e.style.transform = 'rotate('+e.dataset.rot+'deg)');
  });
  if(reduceMotion.matches) run(); else requestAnimationFrame(() => requestAnimationFrame(run));
}

/* ---------- welcome (first name, device only) ---------- */
function drawWelcome(){
  document.body.classList.add('onboard');
  shell({title:'חזרה לכימיה ט׳'});
  view.innerHTML = '<section class="welcome">'+gauge(true)+
    '<h2>שלום! בואו נתכונן למבחן בכימיה</h2>'+
    '<p>חמישה נושאים, '+Q.length+' שאלות תרגול ומבחן דמה. הכול לפי החומר למבחן של 12.11.</p>'+
    '<label class="field">איך לקרוא לך?<input class="tin" id="nm" maxlength="20" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="go" placeholder="שם פרטי או כינוי"></label>'+
    '<p class="small muted">השם נשמר רק במכשיר הזה. הוא לא נשלח לשום מקום, ואף אחד אחר לא רואה אותו.</p>'+
    '<button class="btn wide" type="button" data-act="hello">מתחילים</button>'+
    '<button class="textrow" type="button" data-act="hello-skip">להמשיך בלי שם</button></section>';
  animateGauge();
}
function setName(v){store.name = cleanName(v); save()}

/* ---------- learn: home ---------- */
const FACTS = [
  "סמל: אות גדולה, ואחריה אולי אות קטנה. {Co} יסוד, {CO} תרכובת.",
  "מספר קטן = אטומים במולקולה. מספר גדול לפני = כמה מולקולות.",
  "דו-אטומיים: {H2}, {N2}, {O2}, {F2}, {Cl2}, {Br2}, {I2}. גז אציל: אטום בודד.",
  "רמות: 2, 8, 8, 2. שורה = כמה רמות. טור = כמה אלקטרונים בחוץ.",
  "יכולת קישור: טור 4 ← 4, טור 5 ← 3, טור 6 ← 2, טור 7 ← 1, מימן ← 1.",
  "מתכת + אל-מתכת = יוני. אל-מתכות בלבד = קוולנטי. מימן הוא אל-מתכת.",
  "בתגובה אטומים לא נעלמים. מאזנים רק במקדמים.",
  "אקסו: חום יוצא, הסביבה מתחממת. אנדו: חום נכנס, הסביבה מתקררת."
];
function nextStep(){
  const tried = Object.keys(store.p).length;
  const fails = Q.filter(q => store.p[q.id] === 'fail').length;
  if(!tried) return {h:'להתחיל מהשפה הכימית', p:'קוראים את ההסבר של הנושא הראשון, ואז עוברים לתרגול שלו.', b:[['open','a','לקריאת ההסבר']]};
  if(fails >= 5) return {h:'לתקן '+fails+' טעויות', p:'אלה שאלות שלא הצלחתם בהן גם בניסיון השני. סבב קצר רק עליהן.', b:[['wrong','','לתרגול הטעויות']]};
  const low = TOPICS.map(t => ({t, ...tstat(t.id)})).filter(s => s.d/s.n < .6).sort((a,b) => a.d/a.n - b.d/b.n)[0];
  if(low) return {h:low.t.name, p:'זה הנושא החלש ביותר כרגע: נפתרו '+low.d+' מתוך '+low.n+' שאלות.', b:[['practice',low.t.id,'לתרגול הנושא'],['open',low.t.id,'להסבר']]};
  const last = store.exams[store.exams.length-1];
  return {h:'זמן למבחן דמה', p: last ? 'הציון האחרון שלכם היה '+last.score+'. בואו ננסה לשפר.' : 'עברתם על כל הנושאים. עכשיו 15 שאלות כמו במבחן.', b:[['exam','','התחלת מבחן דמה']]};
}
function topicRow(t, act){
  const s = tstat(t.id);
  return '<li><button class="row" type="button" data-act="'+act+'" data-id="'+t.id+'" style="--tc:'+tc(t)+'">'+ticon(t)+
    '<span class="rmain"><span class="rname">'+t.name+'</span><span class="rsub">'+pg(t)+'</span><span class="rbar"><i style="width:'+(100*s.d/s.n)+'%"></i></span></span>'+
    '<span class="rcount" dir="ltr">'+s.d+'/'+s.n+'</span><span class="chev">'+ui('chev')+'</span></button></li>';
}
function drawHome(){
  shell({title:'חזרה לכימיה ט׳', tab:'learn'});
  const done = Q.filter(q => solved(q.id)).length;
  const tried = Object.keys(store.p).length;
  const weak = tried ? TOPICS.filter(t => Q.some(q => q.id[0] === t.id && store.p[q.id])).map(t => ({t, ...tstat(t.id)})).sort((a,b) => a.d/a.n - b.d/b.n)[0].t : null;
  const ns = nextStep();
  view.innerHTML =
    '<section class="hero">'+gauge(false)+'<div class="herotext"><p class="hi">'+(store.name ? 'היי <bdi>'+esc(store.name)+'</bdi>!' : 'היי!')+'</p>'+
      '<p><span class="mono">'+done+'</span> מתוך '+Q.length+' שאלות נפתרו</p>'+
      (weak ? '<p class="small muted">הכי חלש: '+weak.name+'</p>' : '<p class="small muted">כל מעגל באטום הוא נושא אחד. הוא מתמלא כשפותרים שאלות.</p>')+'</div></section>'+
    '<section class="now" aria-labelledby="nowh"><span class="nowlbl">מה עכשיו</span><h2 id="nowh">'+ns.h+'</h2><p>'+ns.p+'</p><div class="btnrow">'+
      ns.b.map((b,i) => '<button class="btn'+(i ? ' onsoft' : '')+'" type="button" data-act="'+b[0]+'" data-id="'+b[1]+'">'+b[2]+'</button>').join('')+'</div></section>'+
    '<p class="lbl">חמשת הנושאים למבחן</p><ul class="glist">'+TOPICS.map(t => topicRow(t,'open')).join('')+'</ul>'+
    '<details class="facts"><summary>בוקר המבחן: 8 דברים לבדוק</summary><ol class="keyfacts">'+FACTS.map(x => '<li>'+R(x)+'</li>').join('')+'</ol></details>';
  animateGauge();
}

/* ---------- learn: topic ---------- */
function drawTopic(id){
  const t = TM[id], s = tstat(id), nx = TOPICS[(TOPICS.indexOf(t)+1) % TOPICS.length];
  shell({title:t.name, back:true, tab:'learn'});
  view.innerHTML =
    '<section class="thead">'+ticon(t,true)+'<div class="rmain"><h2 class="display">'+t.name+'</h2><span class="rsub">'+pg(t)+'</span>'+
      '<span class="rsub">נפתרו <span class="mono">'+s.d+'</span> מתוך '+s.n+' שאלות</span></div></section>'+
    '<nav class="toc" id="toc" aria-label="חלקי ההסבר" style="--tc:'+tc(t)+'"></nav>'+
    '<div class="learn" style="--tc:'+tc(t)+'">'+R(t.learn)+'</div>'+
    '<p class="lbl">הנושא הבא</p><ul class="glist">'+topicRow(nx,'open')+'</ul>';
  const toc = $('#toc');
  toc.innerHTML = [...view.querySelectorAll('.lsec > h3')].map((h,i) => {h.id = 'sec'+i; return '<button type="button" data-act="toc" data-id="sec'+i+'">'+esc(h.textContent)+'</button>'}).join('');
  const m = view.querySelector('[data-mount="ptable"]'); if(m){m.innerHTML = ptable(); showEl(17)}
  document.body.classList.add('hasdock');
  setDock('<button class="btn wide" type="button" data-act="practice" data-id="'+id+'">לתרגול הנושא ('+s.n+' שאלות)</button>');
  syncToc();
}
function syncToc(){
  const toc = $('#toc'); if(!toc) return;
  const line = $('.topbar').offsetHeight + toc.offsetHeight + 24;
  let cur = null;
  view.querySelectorAll('.lsec > h3').forEach(h => {if(h.getBoundingClientRect().top <= line) cur = h.id});
  cur = cur || 'sec0';
  toc.querySelectorAll('button').forEach(b => {
    const on = b.dataset.id === cur;
    if(on && b.getAttribute('aria-current') !== 'true') b.scrollIntoView({block:'nearest', inline:'nearest'});
    on ? b.setAttribute('aria-current','true') : b.removeAttribute('aria-current');
  });
}
let tocTick = false;
addEventListener('scroll', () => {scrolls[location.hash] = scrollY; if(!tocTick){tocTick = true; requestAnimationFrame(() => {tocTick = false; syncToc()})}}, {passive:true});

/* ---------- practice tab ---------- */
function drawPractice(){
  shell({title:'תרגול', tab:'practice'});
  const wrong = Q.filter(q => store.p[q.id] === 'fail').length;
  view.innerHTML =
    '<p class="muted">בכל שאלה יש שני ניסיונות. אחרי הניסיון השני מופיעה התשובה המלאה. רמז לא מוריד נקודות.</p>'+
    '<p class="lbl">לפי נושא</p><ul class="glist">'+TOPICS.map(t => topicRow(t,'practice')).join('')+'</ul>'+
    '<p class="lbl">סבב מהיר</p><ul class="glist">'+
      '<li><button class="row" type="button" data-act="mixed"><span class="ticon" style="--ts:var(--primary-soft);--tc:var(--primary)">'+ui('shuffle')+'</span><span class="rmain"><span class="rname">15 שאלות מכל הנושאים</span><span class="rsub">בסדר אקראי</span></span><span class="chev">'+ui('chev')+'</span></button></li>'+
      '<li><button class="row" type="button" data-act="wrong"'+(wrong ? '' : ' disabled')+'><span class="ticon" style="--ts:var(--bad-soft);--tc:var(--bad)">'+ui('redo')+'</span><span class="rmain"><span class="rname">שאלות שטעיתי בהן</span><span class="rsub">'+(wrong ? wrong+' שאלות לחזור עליהן' : 'עוד אין כאלה')+'</span></span><span class="chev">'+ui('chev')+'</span></button></li>'+
    '</ul>'+
    '<div class="btnrow"><button class="textrow" type="button" data-act="rename">'+(store.name ? 'שינוי השם' : 'הוספת שם')+'</button><button class="textrow" type="button" data-act="reset">איפוס ההתקדמות</button></div>'+
    '<div class="confirm" id="namebox" hidden><label class="field">איך לקרוא לך?<input class="tin" id="nm" maxlength="20" autocomplete="off" spellcheck="false" enterkeyhint="done" placeholder="שם פרטי או כינוי"></label><p class="small muted">השם נשמר רק במכשיר הזה.</p><div class="btnrow"><button class="btn" type="button" data-act="name-save">שמירה</button><button class="btn ghost" type="button" data-act="box-no">ביטול</button></div></div>'+
    '<div class="confirm" id="resetbox" hidden><p>למחוק את כל ההתקדמות ואת ציוני מבחני הדמה? אי אפשר לבטל את זה.</p><div class="btnrow"><button class="btn" type="button" data-act="reset-yes">כן, למחוק</button><button class="btn ghost" type="button" data-act="box-no">ביטול</button></div></div>';
}

/* ---------- exam tab ---------- */
function drawExamHome(){
  shell({title:'מבחן דמה', tab:'exam'});
  const last = store.exams.slice(-5).reverse();
  view.innerHTML =
    '<section class="thead"><span class="ticon lg" style="--ts:var(--primary-soft);--tc:var(--primary)">'+ui('timer')+'</span><div class="rmain"><h2 class="display">מבחן דמה</h2><span class="rsub">15 שאלות, 3 מכל נושא</span></div></section>'+
    '<ul class="plain"><li>בלי רמזים, וניסיון אחד לכל שאלה.</li><li>אפשר לדלג על שאלה ולהמשיך.</li><li>בסוף מקבלים ציון, פירוט לפי נושא והסבר לכל טעות.</li></ul>'+
    '<p class="tip">כתבו טיוטה על דף, כמו במבחן אמיתי.</p>'+
    '<button class="btn wide" type="button" data-act="exam">התחלת מבחן דמה</button>'+
    (last.length ? '<p class="lbl">הציונים האחרונים</p><ul class="glist">'+last.map(e => '<li><div class="row"><span class="rmain"><span class="rname">'+esc(e.date)+'</span></span><span class="scoresm mono">'+e.score+'</span></div></li>').join('')+'</ul>' : '');
}

/* ---------- sessions ---------- */
function start(mode, ids, label){
  const inSession = route().tab === 'q';
  sess = {mode, ids, label, i:0, res:{}, ret: inSession && sess ? sess.ret : (location.hash || '#/learn')};
  resetQ();
  go('#/q', inSession);
}
function resetQ(){Object.assign(sess, {att:0, locked:false, sel:null, sort:{}, pick:new Set(), order:null, hint:false})}
function examIds(){let ids = []; TOPICS.forEach(t => {ids = ids.concat(shuffle(Q.filter(q => q.id[0] === t.id && q.t !== 'self')).slice(0,3).map(q => q.id))}); return shuffle(ids)}
function endSession(){const ret = sess ? sess.ret : '#/learn'; sess = null; goBack(ret)}
const curQ = () => QM[sess.ids[sess.i]];

function inputAttrs(n, ph){
  return 'class="inp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" maxlength="40"'+(n === 'num' ? ' inputmode="decimal"' : '')+(ph ? ' placeholder="'+ph+'"' : '');
}
function qbody(q){
  if(q.t === 'mc'){
    if(!sess.order) sess.order = q.fixed ? q.o.map((_,i) => i) : shuffle(q.o.map((_,i) => i));
    return '<div class="opts" role="group" aria-label="תשובות">'+sess.order.map((i,k) => '<button class="opt" type="button" data-act="opt" data-i="'+i+'" aria-pressed="false"><span class="lt" aria-hidden="true">'+LETTERS[k]+'</span><span class="ot">'+R(q.o[i])+'</span></button>').join('')+'</div>';
  }
  if(q.t === 'in') return '<input id="in0" aria-label="התשובה שלכם" '+inputAttrs(q.n, q.ph || (q.n === 'num' ? 'מספר' : q.n === 'cfg' ? '2,8,...' : 'למשל H2O'))+'>';
  if(q.t === 'multi') return '<div class="fields">'+q.f.map((f,i) => '<label>'+f.l+'<input id="f'+i+'" '+inputAttrs(f.n, f.n === 'cfg' ? '2,8,...' : '')+'></label>').join('')+'</div>';
  if(q.t === 'sort') return '<div class="sortl">'+q.items.map((it,r) => '<div class="srow" data-r="'+r+'"><span class="item">'+R(it[0])+'</span><span class="seg" role="group">'+q.bins.map((b,bi) => '<button type="button" data-act="bin" data-r="'+r+'" data-b="'+bi+'" aria-pressed="false">'+b+'</button>').join('')+'</span></div>').join('')+'</div>';
  if(q.t === 'pick') return '<div class="pick" role="group" aria-label="אפשר לסמן כמה">'+q.items.map((it,i) => '<button type="button" data-act="chip" data-i="'+i+'" aria-pressed="false">'+R(it)+'</button>').join('')+'</div>';
  if(q.t === 'self') return '<label class="field">התשובה שלכם<textarea class="tin" id="selfans" maxlength="1000" placeholder="כתבו כאן, או על דף"></textarea></label>';
  return '';
}
function progressBar(){
  const n = sess.ids.length, exam = sess.mode === 'exam';
  if(n > 30) return '<div class="qprog" aria-hidden="true"><i style="width:'+(100*sess.i/n)+'%"></i></div>';
  return '<div class="segs" aria-hidden="true">'+sess.ids.map((id,k) => {
    if(k === sess.i) return '<i class="cur"></i>';
    if(!(id in sess.res)) return '<i></i>';
    if(exam) return '<i class="done"></i>';
    return '<i class="'+(sess.res[id] === 'fail' ? 'bad' : 'ok')+'"></i>';
  }).join('')+'</div>';
}
function drawQ(){
  const q = curQ(), t = topicOf(q), n = sess.ids.length;
  shell({title:'שאלה '+(sess.i+1)+' מתוך '+n, close:true});
  view.innerHTML = progressBar()+
    '<article class="q" id="qcard" style="--tc:'+tc(t)+'" aria-labelledby="qtext"><span class="qtag">'+t.name+'</span>'+
    '<div class="qtext" id="qtext" tabindex="-1">'+R(q.q)+'</div>'+
    (q.pre ? '<pre class="struct">'+esc(q.pre)+'</pre>' : '')+(q.mol ? '<div class="molq">'+mol(q.mol)+'</div>' : '')+(q.svg ? '<figure>'+energySVG(q.svg,false)+'</figure>' : '')+
    qbody(q)+'<div class="hintbox" id="hint" role="note"'+(sess.hint ? '' : ' hidden')+'>'+(sess.hint ? '<b>רמז:</b> '+R(q.hint) : '')+'</div></article>';
  qDock();
  const first = view.querySelector('.inp');
  if(first && finePointer.matches) first.focus({preventScroll:true});
  else if(sess.i > 0) $('#qtext').focus({preventScroll:true});
}
function qDock(note){
  const q = curQ(), exam = sess.mode === 'exam';
  const hint = !exam && q.hint ? '<button class="btn ghost sq" type="button" data-act="hint" aria-label="רמז" title="רמז">'+ui('hint')+'</button>' : '';
  const main = q.t === 'self' ? '<button class="btn wide" type="button" data-act="reveal">הצגת תשובה לדוגמה</button>'
    : '<button class="btn wide" type="button" data-act="check">'+(exam ? 'שמירה והמשך' : 'בדיקה')+'</button>';
  setDock((note ? '<p class="dnote" role="status">'+note+'</p>' : '')+'<div class="dockrow">'+main+(exam ? '<button class="btn ghost" type="button" data-act="skip">דילוג</button>' : hint)+'</div>');
}
function feedback(kind, icon, title, body, actions){
  setDock('<div class="fbhead" role="status">'+ui(icon)+'<span class="fbtitle">'+title+'</span></div>'+(body ? '<div class="fbbody">'+body+'</div>' : '')+actions, kind+' fb');
}
const nextBtn = () => '<button class="btn wide" type="button" data-act="next">'+(sess.i === sess.ids.length-1 ? 'לסיכום' : 'לשאלה הבאה')+'</button>';

function readCheck(q){
  if(q.t === 'mc') return {ready:sess.sel !== null, ok:sess.sel === q.a};
  if(q.t === 'in'){const v = $('#in0').value; const ok = match(v, q.a, q.n); return {ready:v.trim() !== '', ok, parts:[ok]}}
  if(q.t === 'multi'){const vals = q.f.map((f,i) => $('#f'+i).value); const parts = q.f.map((f,i) => match(vals[i], f.a, f.n)); return {ready:vals.some(v => v.trim() !== ''), ok:parts.every(Boolean), parts}}
  if(q.t === 'sort'){const parts = q.items.map((it,r) => sess.sort[r] === it[1]); return {ready:Object.keys(sess.sort).length === q.items.length, ok:parts.every(Boolean), parts}}
  if(q.t === 'pick'){const parts = q.items.map((_,i) => sess.pick.has(i) === q.a.includes(i)); return {ready:sess.pick.size > 0, ok:parts.every(Boolean), parts}}
}
function mark(q, r, final){
  if(q.t === 'mc') view.querySelectorAll('.opt').forEach(b => {const i = +b.dataset.i; b.classList.remove('right','wrong'); if(i === sess.sel) b.classList.add(i === q.a ? 'right' : 'wrong'); if(final && i === q.a) b.classList.add('right')});
  if(q.t === 'in'){const e = $('#in0'); e.classList.toggle('right', r.ok); e.classList.toggle('wrong', !r.ok)}
  if(q.t === 'multi') q.f.forEach((f,i) => {const e = $('#f'+i); e.classList.toggle('right', r.parts[i]); e.classList.toggle('wrong', !r.parts[i])});
  if(q.t === 'sort') view.querySelectorAll('.srow').forEach(row => {const i = +row.dataset.r; row.classList.toggle('right', r.parts[i]); row.classList.toggle('wrong', !r.parts[i])});
  if(q.t === 'pick') view.querySelectorAll('.pick button').forEach(b => {const i = +b.dataset.i; b.classList.remove('right','wrong'); if(!r.parts[i]) b.classList.add('wrong'); else if(q.a.includes(i)) b.classList.add('right')});
}
function lock(){sess.locked = true; view.querySelectorAll('#qcard input, #qcard textarea, #qcard .opt, #qcard .seg button, #qcard .pick button').forEach(e => e.disabled = true)}
function record(id, status){store.p[id] = status; sess.res[id] = status; save()}

function doCheck(){
  const q = curQ(); if(sess.locked) return;
  const r = readCheck(q);
  if(sess.mode === 'exam'){
    if(!r.ready) return qDock('עוד לא עניתם. אפשר לענות או לדלג.');
    sess.res[q.id] = r.ok; if(r.ok && !store.p[q.id]){store.p[q.id] = 'ok'; save()}
    return next();
  }
  if(!r.ready) return qDock(q.t === 'sort' ? 'קודם צריך לבחור תשובה בכל השורות.' : 'קודם צריך לענות.');
  if(r.ok){
    mark(q, r, true); lock(); record(q.id, sess.att === 0 ? 'ok' : 'ok2');
    feedback('ok', 'ok', sess.att ? 'נכון, בניסיון השני' : 'נכון!', q.ex ? '<p>'+R(q.ex)+'</p>' : '', nextBtn());
    return focusDock();
  }
  sess.att++; mark(q, r, false);
  if(sess.att < 2){
    const hint = q.hint ? '<button class="btn ghost sq" type="button" data-act="hint" aria-label="רמז" title="רמז">'+ui('hint')+'</button>' : '';
    feedback('bad', 'bad', 'עוד לא, נסו שוב', '<p>ניסיון 2 מתוך 2.'+(r.parts && r.parts.length > 1 ? ' מה שמסומן באדום לא נכון.' : '')+(q.hint && !sess.hint ? ' אפשר גם לפתוח רמז.' : '')+'</p>',
      '<div class="dockrow"><button class="btn wide" type="button" data-act="check">בדיקה</button>'+hint+'</div>');
    return;
  }
  mark(q, r, true); lock(); record(q.id, 'fail');
  feedback('bad', 'info', 'התשובה הנכונה', '<p>'+solution(q)+'</p>'+(q.ex ? '<p>'+R(q.ex)+'</p>' : ''), nextBtn());
  focusDock();
}
function focusDock(){const b = dock.querySelector('[data-act="next"]'); if(b) b.focus({preventScroll:true})}
function next(){
  sess.i++;
  if(sess.i >= sess.ids.length){sess.finished = true; if(sess.mode === 'exam') saveExam()}
  else resetQ();
  render('fwd', true);
}
function saveExam(){
  const c = sess.ids.filter(id => sess.res[id] === true).length;
  sess.correct = c; sess.score = Math.round(100 * c / sess.ids.length);
  const d = new Date();
  store.exams.push({score:sess.score, date:d.getDate()+'.'+(d.getMonth()+1)+' בשעה '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')});
  store.exams = store.exams.slice(-20); save();
}

/* ---------- summaries ---------- */
function drawSummary(){
  if(sess.mode === 'exam') return drawExamSummary();
  shell({title:'סיכום הסבב', close:true});
  const v = Object.values(sess.res), a = v.filter(x => x === 'ok').length, b = v.filter(x => x === 'ok2').length, c = v.filter(x => x === 'fail').length, n = v.length || 1;
  const failed = sess.ids.filter(id => sess.res[id] === 'fail');
  view.innerHTML = '<section class="score"><h2 class="display">סיימתם את הסבב</h2><p class="muted">'+v.length+' שאלות'+(sess.label ? ' ב'+sess.label : '')+'</p></section>'+
    '<div class="stack" aria-hidden="true">'+(a ? '<i class="s1" style="width:'+(100*a/n)+'%"></i>' : '')+(b ? '<i class="s2" style="width:'+(100*b/n)+'%"></i>' : '')+(c ? '<i class="s3" style="width:'+(100*c/n)+'%"></i>' : '')+'</div>'+
    '<ul class="legend"><li><i class="s1"></i>נכון בניסיון הראשון<b>'+a+'</b></li><li><i class="s2"></i>נכון בניסיון השני<b>'+b+'</b></li><li><i class="s3"></i>לחזור עליהן<b>'+c+'</b></li></ul>'+
    (failed.length ? '<p class="lbl">השאלות לחזרה</p><div class="review">'+failed.map((id,k) => reviewItem(id, false, k)).join('')+'</div>' : '<p class="tip">אין שאלות לחזור עליהן בסבב הזה. כל הכבוד!</p>');
  setDock('<div class="dockrow">'+(failed.length ? '<button class="btn wide" type="button" data-act="redo">שוב רק את '+failed.length+' השאלות</button>' : '')+'<button class="btn '+(failed.length ? 'ghost' : 'wide')+'" type="button" data-act="done">סיום</button></div>');
}
function reviewItem(id, ok, k){
  const q = QM[id];
  return '<details class="ritem'+(ok ? '' : ' no')+'"'+(ok ? '' : ' open')+'><summary>'+ui(ok ? 'ok' : 'bad')+'<span>'+(k+1)+'. '+R(q.q)+'</span></summary>'+
    '<div class="rb">'+(q.t === 'self' ? '<p>'+R(q.model)+'</p>' : '<p><b>התשובה:</b> '+solution(q)+'</p>')+(q.ex ? '<p class="muted">'+R(q.ex)+'</p>' : '')+'</div></details>';
}
function drawExamSummary(){
  shell({title:'תוצאות מבחן הדמה', close:true});
  const per = TOPICS.map(t => {const ids = sess.ids.filter(id => id[0] === t.id); return {t, ids, c:ids.filter(id => sess.res[id] === true).length}});
  const msg = sess.score >= 85 ? 'מצוין. אתם מוכנים למבחן.' : sess.score >= 60 ? 'יפה. חזרו על הנושאים המסומנים, ותצליחו עוד יותר.' : 'שווה לחזור על ההסברים ולתרגל עוד קצת. יש עדיין זמן.';
  view.innerHTML = '<section class="score"><span class="scorenum">'+sess.score+'</span><p><span class="mono">'+sess.correct+'</span> מתוך '+sess.ids.length+' תשובות נכונות</p><p class="muted">'+msg+'</p></section>'+
    '<p class="lbl">לפי נושא</p><ul class="glist">'+per.map(p => {
      const weak = p.c < 2, pips = '<span class="pips" role="img" aria-label="'+p.c+' מתוך '+p.ids.length+'">'+p.ids.map((_,i) => '<i'+(i < p.c ? ' class="on"' : '')+'></i>').join('')+'</span>';
      const inner = ticon(p.t)+'<span class="rmain"><span class="rname">'+p.t.name+'</span>'+(weak ? '<span class="rsub" style="color:'+tc(p.t)+'">לחזור על הנושא</span>' : '')+'</span>'+pips;
      return '<li>'+(weak ? '<button class="row" type="button" data-act="open-from-q" data-id="'+p.t.id+'">'+inner+'<span class="chev">'+ui('chev')+'</span></button>' : '<div class="row">'+inner+'</div>')+'</li>';
    }).join('')+'</ul>'+
    '<p class="lbl">פירוט התשובות</p><div class="review">'+sess.ids.map((id,k) => reviewItem(id, sess.res[id] === true, k)).join('')+'</div>';
  setDock('<div class="dockrow"><button class="btn wide" type="button" data-act="exam">מבחן דמה חדש</button><button class="btn ghost" type="button" data-act="done">סיום</button></div>');
}

/* ---------- events ---------- */
$('#back').innerHTML = ui('back');
$('#close').innerHTML = ui('close');
document.querySelectorAll('[data-icon]').forEach(e => e.innerHTML = ui(e.dataset.icon));
$('#back').addEventListener('click', () => goBack('#/learn'));
function askQuitExam(){
  feedback('info', 'info', 'לצאת מהמבחן?', '<p>התשובות שכבר נתתם במבחן הזה לא ייספרו בציון.</p>', '<div class="dockrow"><button class="btn wide" type="button" data-act="stay">להמשיך במבחן</button><button class="btn ghost" type="button" data-act="quit">יציאה</button></div>');
}
$('#close').addEventListener('click', () => {
  if(sess && sess.mode === 'exam' && !sess.finished && Object.keys(sess.res).length) return askQuitExam();
  endSession();
});
$('#tabbar').addEventListener('click', e => {
  const b = e.target.closest('.tab'); if(!b) return;
  const hash = '#/'+b.dataset.tab;
  if(location.hash === hash){scrollTo({top:0, behavior: reduceMotion.matches ? 'auto' : 'smooth'}); return}
  go(hash, depth > 0 && route().tab !== 'learn');
});

function onAct(e){
  const b = e.target.closest('[data-act]'); if(!b || b.disabled) return;
  const act = b.dataset.act, id = b.dataset.id;
  switch(act){
    case 'hello': {const v = $('#nm').value; if(!cleanName(v)){ $('#nm').focus(); return } setName(v); return render('fwd', true)}
    case 'hello-skip': store.name = ''; save(); return render('fwd', true);
    case 'open': return go('#/learn/'+id);
    case 'open-from-q': sess = null; return go('#/learn/'+id, true);
    case 'toc': {const h = document.getElementById(id); if(h) h.scrollIntoView({behavior: reduceMotion.matches ? 'auto' : 'smooth', block:'start'}); return}
    case 'el': return showEl(+b.dataset.z);
    case 'practice': {const t = TM[id]; return start('practice', Q.filter(q => q.id[0] === t.id).map(q => q.id), 'נושא '+t.name)}
    case 'mixed': return start('practice', shuffle(Q.map(q => q.id)).slice(0,15), 'סבב מעורבב');
    case 'wrong': return start('practice', shuffle(Q.filter(q => store.p[q.id] === 'fail').map(q => q.id)), 'סבב הטעויות');
    case 'redo': return start('practice', sess.ids.filter(x => sess.res[x] === 'fail'), 'סבב הטעויות');
    case 'exam': return start('exam', examIds(), 'מבחן דמה');
    case 'done': case 'quit': return endSession();
    case 'stay': return qDock();
    case 'rename': $('#resetbox').hidden = true; $('#namebox').hidden = false; $('#nm').value = store.name || ''; $('#nm').focus(); return;
    case 'name-save': setName($('#nm').value); return render(null, false);
    case 'reset': $('#namebox').hidden = true; $('#resetbox').hidden = false; return;
    case 'box-no': $('#namebox').hidden = true; $('#resetbox').hidden = true; return;
    case 'reset-yes': store = {p:{}, exams:[], name:store.name}; save(); return render(null, true);
    case 'next': return next();
  }
  if(!sess || sess.locked || sess.finished) return;
  const q = curQ();
  switch(act){
    case 'opt': sess.sel = +b.dataset.i; view.querySelectorAll('.opt').forEach(o => {o.setAttribute('aria-pressed', String(o === b)); o.classList.remove('wrong','right')}); return;
    case 'bin': {const r = +b.dataset.r; sess.sort[r] = +b.dataset.b; b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); b.closest('.srow').classList.remove('wrong','right'); return}
    case 'chip': {const i = +b.dataset.i; sess.pick.has(i) ? sess.pick.delete(i) : sess.pick.add(i); b.setAttribute('aria-pressed', String(sess.pick.has(i))); b.classList.remove('wrong','right'); return}
    case 'check': return doCheck();
    case 'skip': sess.res[q.id] = false; return next();
    case 'hint': {sess.hint = true; const h = $('#hint'); h.hidden = false; h.innerHTML = '<b>רמז:</b> '+R(q.hint); h.scrollIntoView({block:'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth'}); return}
    case 'reveal':
      feedback('info', 'info', 'תשובה לדוגמה', '<p>'+R(q.model)+'</p><p class="muted">השוו לתשובה שלכם. יש בה את הרעיון המרכזי?</p>',
        '<div class="dockrow"><button class="btn wide" type="button" data-act="self-ok">כן, עניתי נכון</button><button class="btn ghost" type="button" data-act="self-bad">פספסתי משהו</button></div>');
      return;
    case 'self-ok': case 'self-bad': record(q.id, act === 'self-ok' ? 'ok' : 'fail'); lock(); return next();
  }
}
view.addEventListener('click', onAct);
dock.addEventListener('click', onAct);
view.addEventListener('keydown', e => {
  if(e.key !== 'Enter') return;
  if(e.target.id === 'nm'){e.preventDefault(); onAct({target: view.querySelector(store.name === undefined ? '[data-act="hello"]' : '[data-act="name-save"]')}); return}
  if(e.target.matches('.inp') && sess && !sess.locked){e.preventDefault(); doCheck()}
});
view.addEventListener('input', e => {if(e.target.matches('.inp')) e.target.classList.remove('right','wrong')});

/* ---------- install prompt (shown right away when the app is opened in a browser) ---------- */
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|GSA|Instagram|FBAN|FBAV/.test(navigator.userAgent);
let installEvt = null;
function laterSaid(){try{return sessionStorage.getItem('chem9-install-later') === '1'}catch(e){return false}}
function showInstall(){
  if(standalone() || laterSaid() || $('#isheet')) return;
  if(!installEvt && !isIOS) return; // Android/desktop: wait for the browser to say the app can be installed
  const steps = isIOS
    ? (isIOSSafari ? '' : '<p class="small">קודם פתחו את הקישור בדפדפן ספארי.</p>')+
      '<ol class="isteps"><li>לוחצים על כפתור השיתוף <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="שיתוף"><path d="M12 15V3M8 7l4-4 4 4M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg> בתחתית המסך.</li><li>בוחרים <b>הוספה למסך הבית</b>.</li><li>לוחצים <b>הוסף</b>.</li></ol>'
    : '<p>מתקינים פעם אחת, ואז האפליקציה נפתחת מהאייקון במסך הבית, גם בלי אינטרנט.</p>';
  const el = document.createElement('div');
  el.id = 'isheet'; el.className = 'iback';
  el.innerHTML = '<div class="isheet" role="dialog" aria-modal="true" aria-labelledby="ititle"><div class="ihead"><img src="icons/icon-192.png" alt="" width="56" height="56"><div><h2 id="ititle" class="title">התקנת האפליקציה</h2><p class="small muted">אייקון במסך הבית, כמו כל אפליקציה</p></div></div>'+steps+
    '<div class="btnrow">'+(isIOS ? '<button class="btn wide" type="button" data-iact="later">הבנתי</button>' : '<button class="btn wide" type="button" data-iact="install">התקנה</button><button class="btn ghost" type="button" data-iact="later">אחר כך</button>')+'</div></div>';
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-iact]');
    if(!b && e.target !== el) return;
    if(b && b.dataset.iact === 'install' && installEvt){
      installEvt.prompt();
      try{await installEvt.userChoice}catch(err){}
      installEvt = null;
    } else {try{sessionStorage.setItem('chem9-install-later','1')}catch(err){}}
    el.remove();
  });
  document.body.appendChild(el);
  const first = el.querySelector('.btn'); if(first) first.focus({preventScroll:true});
}
addEventListener('beforeinstallprompt', e => {e.preventDefault(); installEvt = e; showInstall()});
addEventListener('appinstalled', () => {installEvt = null; const s = $('#isheet'); if(s) s.remove()});
addEventListener('keydown', e => {if(e.key === 'Escape' && $('#isheet')){try{sessionStorage.setItem('chem9-install-later','1')}catch(err){} $('#isheet').remove()}});

/* ---------- boot ---------- */
if('scrollRestoration' in history) history.scrollRestoration = 'manual';
history.replaceState({d:0}, '', route().tab === 'q' ? '#/learn' : (location.hash || '#/learn'));
render(null, false);
if('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
setTimeout(showInstall, 600);
