/* ======================================================================
   UNIT TEST RACE: grading, the race, saving every session, history, CSV.
   ====================================================================== */
const $app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PFX = 'tu12_';
const store = {
  get(k, d) { try { const v = localStorage.getItem(PFX + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(PFX + k); } catch (e) { /* storage blocked */ } }
};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
const touch = () => matchMedia('(pointer:coarse)').matches;
const newId = () => Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const pts = q => (q.l === 'x' ? 2 : 1);
const TYPE_NAME = { mc: 'Choose', fill: 'Fill the gap', ord: 'Word order', tr: 'Translate', fix: 'Fix it', sort: 'Sort' };
const INSTR = {
  mc: 'Choose the best answer.', fill: 'Type the missing word.', ord: 'Tap the words in the right order.',
  tr: 'Translate into English.', fix: 'Rewrite the sentence correctly.', sort: 'Put each word under a or an.'
};

const ICON = {
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 1.8 1 3 2.2 3.4C11 8.5 11 5 12 2z"/></svg>',
  runner: '<svg viewBox="0 0 40 40"><path d="M8 8 L32 20 L8 32 L14 20 Z" fill="#F6C453" stroke="#0C1640" stroke-width="2.5" stroke-linejoin="round"/><path d="M2 14h8M0 20h10M2 26h8" stroke="#2BC9BF" stroke-width="2.5" stroke-linecap="round"/></svg>'
};

/* ======================================================================
   GRADING
   ====================================================================== */
function expandPattern(spec) {
  let pos = 0;
  function seq() {
    let out = [''];
    while (pos < spec.length) {
      const c = spec[pos];
      if (c === ')' || c === ']' || c === '|') break;
      if (c === '(' || c === '[') {
        pos++;
        const alts = [];
        for (;;) { alts.push(...seq()); if (spec[pos] === '|') { pos++; continue; } break; }
        pos++;
        if (c === '[') alts.push('');
        const next = [];
        for (const o of out) for (const a of alts) next.push(o + a);
        out = next;
      } else {
        let j = pos;
        while (j < spec.length && !'()[]|'.includes(spec[j])) j++;
        const lit = spec.slice(pos, j); pos = j;
        out = out.map(o => o + lit);
      }
    }
    return out;
  }
  const seen = new Set(), res = [];
  seq().forEach(s => { const t = s.replace(/\s+/g, ' ').trim(); if (t && !seen.has(t)) { seen.add(t); res.push(t); } });
  return res;
}
function ed(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i].concat(new Array(n).fill(0)));
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[m][n];
}
// Normalise for comparison: lower case, contractions opened, punctuation gone.
// Articles are NOT removed here: a / an is exactly what this test is about.
function nrm(s) {
  s = String(s || '').toLowerCase().replace(/[‘’ʼ`´]/g, "'");
  const nf = { dont: "don't", doesnt: "doesn't", isnt: "isn't", arent: "aren't", im: "i'm", whats: "what's", thats: "that's", theres: "there's" };
  s = s.replace(/\b(dont|doesnt|isnt|arent|im|whats|thats|theres)\b/g, m => nf[m]);
  s = s.replace(/\bo['’ ]?clock\b/g, 'oclock');
  s = s.replace(/\bdon't\b/g, 'do not').replace(/\bdoesn't\b/g, 'does not').replace(/\bisn't\b/g, 'is not').replace(/\baren't\b/g, 'are not')
    .replace(/\bi'm\b/g, 'i am').replace(/\b(you|we|they)'re\b/g, '$1 are').replace(/\b(he|she|it|that|there|here|what)'s\b/g, '$1 is');
  s = s.replace(/-/g, ' ').replace(/[.,!?;:"“”()]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}
function modelOf(q) {
  if (q.t === 'mc') return q.opts[0];
  if (q.t === 'sort') return q.items.map(([w, a]) => `${a} ${w}`).join(', ');
  return expandPattern(q.a)[0];
}
function accMap() { return store.get('acc', {}); }
// -> { status: ok | wrong | spell | empty, fixes?, note? }
function grade(q, ans) {
  if (q.t === 'mc') {
    if (!ans) return { status: 'empty' };
    return { status: ans === q.opts[0] ? 'ok' : 'wrong' };
  }
  if (q.t === 'sort') {
    const given = String(ans || '').split('|');
    if (given.every(x => !x)) return { status: 'empty' };
    return { status: q.items.every(([, a], i) => given[i] === a) ? 'ok' : 'wrong' };
  }
  if (!String(ans || '').trim()) return { status: 'empty' };
  const n = nrm(ans);
  const exps = expandPattern(q.a).map(nrm);
  if (exps.includes(n)) return { status: 'ok' };
  if ((accMap()[q.id] || []).includes(n)) return { status: 'ok', note: 'teacher' };
  const st = n.split(' ');
  for (const e of exps) {
    const et = e.split(' ');
    if (et.length !== st.length) continue;
    const fixes = [];
    let close = true;
    for (let i = 0; i < st.length; i++) {
      if (st[i] === et[i]) continue;
      if (st[i].length >= 4 && et[i].length >= 4 && ed(st[i], et[i]) <= 1) fixes.push([st[i], et[i]]);
      else { close = false; break; }
    }
    if (close && fixes.length) return { status: 'spell', fixes };
  }
  return { status: 'wrong' };
}

/* ======================================================================
   STATE + SETTINGS
   ====================================================================== */
const DEF_CFG = { len: 25, pace: 1, timer: true, feedback: true, music: true, sfx: true };
const S = { screen: 'home', cfg: Object.assign({}, DEF_CFG, store.get('cfg', {})), run: null, last: null, from: null, onlyMiss: false, cur: null };
let timerRAF = 0, fbTimer = 0, rateTick = 0;
const saveCfg = () => store.set('cfg', S.cfg);
Sound.set('music', S.cfg.music); Sound.set('sfx', S.cfg.sfx);

function setTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
setTheme(store.get('theme', null));
document.querySelector('[data-act="theme"]').innerHTML = ICON.theme;
function paintSound() {
  const on = S.cfg.music || S.cfg.sfx, b = document.getElementById('soundBtn');
  b.innerHTML = on ? ICON.soundOn : ICON.soundOff; b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Sound is on' : 'Sound is off';
}
paintSound();
(function makeSpeed() {
  let h = '';
  for (let i = 0; i < 16; i++) {
    h += `<i style="top:${Math.round(Math.random() * 100)}%;width:${80 + Math.round(Math.random() * 220)}px;animation-duration:${(1.4 + Math.random() * 2.4).toFixed(2)}s;animation-delay:${(-Math.random() * 4).toFixed(2)}s;opacity:${(0.25 + Math.random() * 0.6).toFixed(2)}"></i>`;
  }
  document.getElementById('speed').innerHTML = h;
})();
function setSpeed(rate) {
  document.querySelectorAll('#speed i, .fuse .num span').forEach(el => { if (el.getAnimations) el.getAnimations().forEach(a => { a.playbackRate = rate; }); });
}

/* ======================================================================
   BUILDING A RUN
   ====================================================================== */
const WEIGHT = { aan: 6, plus: 3, y: 3, es: 4, ves: 3, irr: 5, mix: 4 };
function quotas(n) {
  const keys = Object.keys(WEIGHT), tot = keys.reduce((s, k) => s + WEIGHT[k], 0);
  const q = {}; let used = 0;
  keys.forEach(k => { q[k] = Math.max(1, Math.floor(n * WEIGHT[k] / tot)); used += q[k]; });
  const order = keys.slice().sort((a, b) => (n * WEIGHT[b] / tot - Math.floor(n * WEIGHT[b] / tot)) - (n * WEIGHT[a] / tot - Math.floor(n * WEIGHT[a] / tot)));
  let i = 0;
  while (used < n) { q[order[i % order.length]]++; used++; i++; }
  while (used > n) { const k = keys.slice().sort((a, b) => q[b] - q[a])[0]; q[k]--; used--; }
  return q;
}
function buildPlan(n) {
  const used = new Set(store.get('used', []));
  const taken = new Set(), pick = [];
  const q = quotas(n);
  const draw = (cat, lvl) => {
    const pool = QS.filter(x => x.cat === cat && x.l === lvl && !taken.has(x.id));
    let fresh = pool.filter(x => !used.has(x.id));
    if (!fresh.length) { pool.forEach(x => used.delete(x.id)); fresh = pool; }
    return fresh.length ? fresh[Math.floor(Math.random() * fresh.length)] : null;
  };
  Object.keys(q).forEach(cat => {
    for (let i = 0; i < q[cat]; i++) {
      const want = Math.random() < 0.3 ? 'x' : 'c';
      const it = draw(cat, want) || draw(cat, want === 'x' ? 'c' : 'x');
      if (it) { taken.add(it.id); pick.push(it); }
    }
  });
  store.set('used', [...used].concat(pick.map(x => x.id)));
  // warm-up first: core questions, then the challenge round
  return shuffle(pick.filter(x => x.l === 'c')).concat(shuffle(pick.filter(x => x.l === 'x')));
}
function limitFor(q) {
  if (!S.run.timer) return 0;
  const base = { mc: 15, fill: 20, ord: 30, tr: 40, fix: 40, sort: 30 }[q.t] + (q.q && q.q.length > 60 ? 5 : 0);
  const secs = base * (q.l === 'x' ? 1.3 : 1) * S.run.pace;
  return Math.max(10, Math.round(secs / 5) * 5);
}

/* ======================================================================
   SCREENS
   ====================================================================== */
function go(screen) {
  cancelAnimationFrame(timerRAF); clearTimeout(fbTimer); clearInterval(rateTick);
  Voice.abort(); Sound.duck(false);
  if (screen !== 'play') { Sound.stopMusic(); document.body.classList.remove('arena'); document.body.style.removeProperty('--danger'); }
  S.screen = screen; window.scrollTo(0, 0);
  ({ home: renderHome, lobby: renderLobby, play: renderPlay, results: renderResults, lb: renderLB, hist: renderHist }[screen])();
}

function renderHome() {
  const cats = Object.keys(CATS).map(k => `<span>${esc(CATS[k].name)}</span>`).join('');
  $app.innerHTML = `
  <section class="home">
    <div class="hero">
      <h1>Unit 1–2 <em>Test Race</em></h1>
      <p class="lede">Pictures, nouns and a ticking fuse. Every question comes from <b>a / an</b> and <b>plurals</b>: regular -s, -ies, -es, -ves and the irregular ones. Near the end a challenge round goes a little beyond the book. Worth double points.</p>
      <div class="actions" style="margin-top:0"><button class="btn big" data-act="go-lobby"><span>Start the test</span></button><button class="btn alt" data-act="go-hist"><span>History</span></button></div>
      <div class="facts"><span><b>${QS.length}</b> questions</span><span>6 question types</span><span>Photos, sorting, fixing, translating</span></div>
      <div class="topics">${cats}</div>
    </div>
    <div class="modes">
      <div class="tile cobalt mode"><div class="in"><h2>How it works</h2>
        <p>Pick 15, 25 or 40 questions. Core questions come first, challenge questions (2 points) come last. Beat the fuse, keep your streak alive, and see your weak topics at the end.</p></div></div>
      <div class="tile saff mode"><div class="in"><h2>Type or say it</h2>
        <p>For translating and fixing sentences you can tap the mic and speak instead of typing.</p></div></div>
    </div>
  </section>`;
}

function renderLobby() {
  const R = savedRun();
  const sw = (key, title, note) => `<label class="sw"><input type="checkbox" data-sw="${key}" ${S.cfg[key] ? 'checked' : ''}><span class="knob"></span><span><b>${title}</b><small>${note}</small></span></label>`;
  const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, t]) => `<button type="button" class="${S.cfg[key] === v ? 'on' : ''}" data-opt="${key}" data-v="${v}" aria-pressed="${S.cfg[key] === v}">${t}</button>`).join('')}</div>`;
  $app.innerHTML = `
  <div class="head"><h2>Test</h2><p class="sub">${store.get('lb', []).length ? store.get('lb', []).length + ' on the leaderboard. ' : ''}Every student gets a different set of questions.</p></div>
  ${R ? `<div class="tile saff resume"><div class="in">
    <div><b style="font-family:var(--f-display);font-size:1.3rem">${esc(R.name)} has an unfinished test</b><div>Question ${Math.min(R.idx + 1, R.plan.length)} of ${R.plan.length} · saved automatically</div></div>
    <div class="actions" style="margin:0"><button class="btn" data-act="resume"><span>Continue</span></button><button class="btn alt" data-act="discard"><span>Discard</span></button></div>
  </div></div>` : ''}
  <div class="lobby">
    <div class="tile"><div class="in lblock">
      <form data-form="start" autocomplete="off">
        <label class="lab" for="nm">Student name</label>
        <input class="field" id="nm" name="nm" maxlength="24" required placeholder="Type your name">
        <div class="actions"><button class="btn big" type="submit"><span>Start the race</span></button></div>
        <p class="hint">Pick, tap or type your answer, then press Lock in (or Enter in a text box). When the fuse runs out, the answer you have is sent.</p>
      </form>
    </div></div>
    <div class="tile"><div class="in rules">
      <h3 style="font-size:1.5rem">Test settings</h3>
      <div><b>Number of questions</b><div style="margin-top:6px">${seg('len', [[15, 'Quick 15'], [25, 'Standard 25'], [40, 'Full 40']])}</div></div>
      <div><b>Pace</b><div style="margin-top:6px">${seg('pace', [[1.5, 'Relaxed'], [1, 'Normal'], [0.75, 'Fast']])}</div></div>
      <div class="sep"></div>
      ${sw('timer', 'Fuse timer', 'Off: no time limit, like a written test.')}
      ${sw('feedback', 'Show right or wrong after each question', 'Off: no feedback until the end.')}
      ${sw('music', 'Heartbeat music', 'It goes quiet while the mic listens.')}
      ${sw('sfx', 'Sound effects', 'Countdown, ticks, right and wrong.')}
    </div></div>
  </div>`;
  if (!touch()) setTimeout(() => { const n = document.getElementById('nm'); if (n) n.focus(); }, 0);
}

/* ---------- the race ---------- */
function savedRun() {
  const r = store.get('run', null);
  if (!r || !Array.isArray(r.plan) || !r.plan.length || !r.plan.every(id => QBY[id])) return null;
  return r;
}
function saveRun() {
  const R = S.run; if (!R) return;
  store.set('run', { id: R.id, name: R.name, plan: R.plan.map(q => q.id), idx: R.idx, answers: R.answers, at: R.at, streak: R.streak, best: R.best, timer: R.timer, pace: R.pace, fb: R.fb });
}
function startRun(name) {
  Sound.init();
  S.run = { id: newId(), name, plan: buildPlan(S.cfg.len), idx: 0, answers: [], at: Date.now(), streak: 0, best: 0, go: false, timer: S.cfg.timer, pace: S.cfg.pace, fb: S.cfg.feedback };
  saveRun(); go('play');
}
function resumeRun() {
  const r = savedRun(); if (!r) { renderLobby(); return; }
  Sound.init();
  S.run = Object.assign({}, r, { plan: r.plan.map(id => QBY[id]), go: false });
  if (S.run.idx >= S.run.plan.length) { finishRun(); return; }
  go('play');
}
function trackHTML(R) {
  const n = R.plan.length;
  const cps = n > 25 ? '' : R.plan.map((_, k) => {
    let c = '';
    if (k < R.idx) { const a = R.answers[k]; c = R.fb ? (a && a.counted ? 'ok' : 'no') : 'done'; } else if (k === R.idx) c = 'cur';
    return `<span class="cp ${c}"></span>`;
  }).join('');
  const frac = n > 1 ? R.idx / (n - 1) : 0;
  return `<div class="track" style="--r:${frac}"><div class="rail"><i style="--p:${frac * 100}%"></i></div><div class="cps">${cps}</div><div class="runner">${ICON.runner}</div></div>`;
}
function hudHTML(R) {
  const sc = R.answers.reduce((s, a) => s + (a.counted ? a.max : 0), 0);
  const mx = R.plan.reduce((s, q) => s + pts(q), 0);
  return `${R.fb ? `<span class="pill">Score <b>${sc}</b></span>` : ''}<span class="pill">${R.idx + 1} / ${R.plan.length}</span>
    <span class="pill streak ${R.streak >= 2 && R.fb ? 'on' : ''}">${ICON.flame}<b>${R.streak}</b> in a row</span>`;
}
function qBody(q) {
  let h = '';
  if (q.passage) h += `<div class="passage">${esc(q.passage)}</div>`;
  if (q.pic) h += `<div class="pic ${q.pic.length > 24 ? 'small' : ''}" aria-hidden="true">${q.pic}</div>`;
  if (q.t === 'fill') h += `<div class="q-text">${esc(q.q).replace(/_{3,}/g, '<span class="gap"></span>')}</div>`;
  else if (q.t === 'tr') h += `<div class="q-text" lang="uz">${esc(q.q)}</div>`;
  else if (q.t === 'fix') h += `<div class="q-text">${esc(q.q)}</div>`;
  else if (q.t === 'sort' || q.t === 'ord') h += '';
  else h += `<div class="q-text">${esc(q.q)}</div>`;
  return h;
}
function answerArea(q) {
  const cur = S.cur;
  if (q.t === 'mc') {
    return `<form class="answer-col" data-form="answer"><div class="opts">${cur.opts.map((o, i) => `<button type="button" class="opt" data-act="opt" data-i="${i}"><span class="k"><b>${'ABCD'[i]}</b></span><span>${esc(o)}</span></button>`).join('')}</div>
      <div class="sub-act"><button class="btn big" type="submit"><span>Lock in</span></button></div></form>`;
  }
  if (q.t === 'ord') {
    return `<form class="answer-col" data-form="answer"><div class="line" id="line" aria-label="Your sentence"></div><div class="pool" id="pool"></div>
      <div class="sub-act"><button class="btn big" type="submit"><span>Lock in</span></button><button class="btn alt" type="button" data-act="clear-ord"><span>Clear</span></button></div></form>`;
  }
  if (q.t === 'sort') {
    return `<form class="answer-col" data-form="answer"><div class="sorts">${q.items.map(([w], i) => `<div class="srow"><b>${esc(w)}</b><div class="sbtns"><button type="button" class="sbtn" data-act="sortpick" data-i="${i}" data-v="a">a</button><button type="button" class="sbtn" data-act="sortpick" data-i="${i}" data-v="an">an</button></div></div>`).join('')}</div>
      <div class="sub-act"><button class="btn big" type="submit"><span>Lock in</span></button></div></form>`;
  }
  const mic = (q.t === 'tr' || q.t === 'fix') && Voice.supported;
  const ph = q.t === 'fill' ? 'Type the missing word' : (mic ? 'Type it, or tap the mic and say it' : 'Type your answer');
  return `<form class="answer" data-form="answer" autocomplete="off">
    <div class="fwrap"><input class="field" id="ans" name="a" placeholder="${ph}" aria-label="Your answer" autocapitalize="off" autocorrect="off" spellcheck="false"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
    ${mic ? `<div class="micw"><button type="button" class="mic" data-act="mic" aria-label="Speak the answer"><span class="go">${ICON.mic}</span><span class="st">${ICON.stop}</span></button></div>` : ''}
    <button class="btn big" type="submit"><span>Lock in</span></button></form>
    ${mic ? `<p class="vmsg" id="vmsg" aria-live="polite">${ICON.mic.replace('<svg', '<svg style="width:18px;height:18px;flex:none"')} Tap the mic, say the sentence, then lock in.</p>` : ''}`;
}
function drawChips() {
  const q = S.run.plan[S.run.idx], cur = S.cur;
  const line = document.getElementById('line'), pool = document.getElementById('pool');
  if (!line || !pool) return;
  line.innerHTML = cur.placed.map(i => `<button type="button" class="wc" data-act="unchip" data-i="${i}">${esc(cur.words[i])}</button>`).join('');
  pool.innerHTML = cur.words.map((w, i) => cur.placed.includes(i) ? '' : `<button type="button" class="wc" data-act="chip" data-i="${i}">${esc(w)}</button>`).join('');
}
function renderPlay() {
  const R = S.run, q = R.plan[R.idx], lim = limitFor(q);
  R.limit = lim; R.done = true;
  S.cur = { sel: null, opts: q.t === 'mc' ? shuffle(q.opts) : null, words: [], placed: [], sort: q.t === 'sort' ? new Array(q.items.length).fill('') : null };
  if (q.t === 'ord') {
    const w = expandPattern(q.a)[0].split(' ');
    let s = shuffle(w.map((_, i) => i));
    for (let t = 0; t < 12 && s.length > 1 && s.every((v, i) => v === i); t++) s = shuffle(s);
    S.cur.words = s.map(i => w[i]);
  }
  document.body.classList.add('arena');
  $app.innerHTML = `
  <section class="race">
    <div class="race-top"><div class="who"><b>${esc(R.name)}</b><span>Question ${R.idx + 1} of ${R.plan.length}</span></div><div class="hud" id="hud">${hudHTML(R)}</div></div>
    ${trackHTML(R)}
    <div class="tile night stage-run card-in" id="card"><div class="in">
      <div class="play ${lim ? '' : 'nofuse'}" ${lim ? '' : 'style="grid-template-columns:1fr"'}>
        ${lim ? `<div class="fuse" id="fuse"><svg viewBox="0 0 120 120" role="img" aria-label="Time left">
            <polygon class="back" points="60,8 112,60 60,112 8,60" stroke-linejoin="miter"/>
            <polygon class="run" id="ring" points="60,8 112,60 60,112 8,60" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0" stroke-linejoin="miter"/>
            <circle class="spark" id="spark" cx="60" cy="8" r="4.5"/></svg><div class="num"><span id="secs">${lim}</span></div></div>` : ''}
        <div class="qa">
          <div class="q-meta"><span class="chiplvl ${q.l}">${q.l === 'x' ? 'Challenge · 2 points' : 'Core'}</span><span class="chiplvl">${esc(CATS[q.cat].name)}</span></div>
          <div class="instr">${q.t === 'fix' ? INSTR.fix : INSTR[q.t]}</div>
          ${qBody(q)}
          ${answerArea(q)}
        </div>
      </div>
    </div></div>
    <div class="fb" id="fb" role="dialog" aria-live="assertive" hidden></div>
  </section>`;
  if (q.t === 'ord') drawChips();
  placeSpark(1);
  if (!R.go) countdown(() => { R.go = true; Sound.startMusic(); beginQuestion(); }); else beginQuestion();
}
function countdown(done) {
  const box = document.createElement('div'); box.className = 'count'; document.body.appendChild(box);
  const seq = ['3', '2', '1', 'GO!']; let k = 0;
  const next = () => {
    if (S.screen !== 'play') { box.remove(); return; }
    if (k >= seq.length) { box.remove(); done(); return; }
    box.innerHTML = `<b class="${k === 3 ? 'go' : ''}">${seq[k]}</b>`;
    Sound.play('count', k === 3 ? 0 : 3 - k); k++;
    setTimeout(next, k === 4 ? 520 : 680);
  };
  next();
}
function beginQuestion() {
  const R = S.run; if (!R || S.screen !== 'play') return;
  R.done = false; R.t0 = performance.now(); R.lastSec = null;
  const inp = document.getElementById('ans'); if (inp && !touch()) inp.focus();
  clearInterval(rateTick); rateTick = setInterval(() => setSpeed(Sound.bpm / 92), 400);
  if (!R.limit) Sound.setTension(0.25);
  tick();
}
function placeSpark(frac) {
  const ring = document.getElementById('ring'), sp = document.getElementById('spark');
  if (!ring || !sp || !ring.getTotalLength) return;
  try { const L = ring.getTotalLength(), p = ring.getPointAtLength(L * (1 - frac)); sp.setAttribute('cx', p.x.toFixed(1)); sp.setAttribute('cy', p.y.toFixed(1)); sp.style.opacity = frac > 0.002 ? '1' : '0'; } catch (e) { /* no spark */ }
}
function tick() {
  const R = S.run;
  if (!R || S.screen !== 'play' || R.done || !R.limit) return;
  const left = Math.max(0, R.limit - (performance.now() - R.t0) / 1000), frac = left / R.limit;
  const ring = document.getElementById('ring'), secs = document.getElementById('secs'), fuse = document.getElementById('fuse');
  if (ring) {
    ring.style.strokeDashoffset = String(-100 * (1 - frac)); ring.style.strokeDasharray = `${100 * frac} 100`;
    fuse.style.color = frac > 0.5 ? 'var(--n-turq)' : frac > 0.25 ? 'var(--n-saff)' : 'var(--n-pom)';
    placeSpark(frac); secs.textContent = Math.ceil(left); fuse.classList.toggle('late', frac <= 0.25);
  }
  Sound.setTension(1 - frac);
  document.body.style.setProperty('--danger', frac < 0.3 ? ((0.3 - frac) / 0.3 * 0.9).toFixed(2) : '0');
  const sec = Math.ceil(left);
  if (sec <= 5 && sec > 0 && sec !== R.lastSec) { R.lastSec = sec; Sound.play('tick'); }
  if (left <= 0) { submitAnswer(); return; }
  timerRAF = requestAnimationFrame(tick);
}
function readAnswer(q) {
  if (q.t === 'mc') return S.cur.sel == null ? '' : S.cur.opts[S.cur.sel];
  if (q.t === 'ord') return S.cur.placed.map(i => S.cur.words[i]).join(' ');
  if (q.t === 'sort') return S.cur.sort.join('|');
  const inp = document.getElementById('ans'); return inp ? inp.value : '';
}
function submitAnswer() {
  const R = S.run; if (!R || R.done) return;
  R.done = true; cancelAnimationFrame(timerRAF);
  Voice.abort(); Sound.duck(false); micUI('idle');
  const q = R.plan[R.idx], text = readAnswer(q);
  const secs = R.limit ? Math.min(R.limit, (performance.now() - R.t0) / 1000) : (performance.now() - R.t0) / 1000;
  const res = grade(q, text), counted = res.status === 'ok';
  R.answers.push({ text, secs, status: res.status, fixes: res.fixes || [], note: res.note || '', counted, max: pts(q) });
  if (counted) { R.streak++; R.best = Math.max(R.best, R.streak); } else R.streak = 0;
  saveRun(); Sound.setTension(0.1); document.body.style.setProperty('--danger', '0');
  if (R.fb) showFeedback(q, R.answers[R.answers.length - 1]); else { Sound.play('lock'); nextQuestion(); }
}
function showFeedback(q, a) {
  const R = S.run, fb = document.getElementById('fb');
  if (!fb) { nextQuestion(); return; }
  const last = R.idx >= R.plan.length - 1;
  let cls, icon, title, body = '';
  const model = esc(modelOf(q));
  const you = !a.text ? '' : q.t === 'sort'
    ? `<div class="you">${esc(q.items.map(([w], i) => `${String(a.text).split('|')[i] || '?'} ${w}`).join(', '))}</div>`
    : `<div class="you">${esc(String(a.text))}</div>`;
  const why = q.tip ? `<div class="why">${esc(q.tip)}</div>` : '';
  if (a.status === 'ok') {
    cls = 'ok'; icon = ICON.check;
    title = R.streak >= 3 ? `${R.streak} in a row!` : (q.l === 'x' ? 'Challenge solved! +2' : ['Correct!', 'Nice one!', 'Spot on!', 'Yes!'][Math.floor(Math.random() * 4)]);
    body = you;
  } else if (a.status === 'spell') {
    cls = 'mid'; icon = ICON.pen; title = 'So close: spelling';
    body = `${you}<div class="why">Check: ${a.fixes.map(([x, y]) => `<b>${esc(x)}</b> → <b>${esc(y)}</b>`).join(', ')}</div><div class="model">${model}</div>${why}`;
  } else if (a.status === 'empty') {
    cls = 'no'; icon = ICON.cross; title = 'Time’s up!'; body = `<div class="model">${model}</div>${why}`;
  } else {
    cls = 'no'; icon = ICON.cross; title = 'Not quite'; body = `${you}<div class="model">${model}</div>${why}`;
  }
  const wait = cls === 'ok' ? 1500 : 8000;
  fb.className = 'fb ' + cls;
  fb.innerHTML = `<div class="fb-card"><div class="stamp">${icon}</div><h3>${title}</h3>${body}
    <div class="actions"><button class="btn big" data-act="next"><span>${last ? 'See results' : 'Next question'}</span></button></div>
    <div class="bar-auto"><i style="animation-duration:${wait}ms"></i></div>${cls === 'ok' ? '<div class="burst" id="burst"></div>' : ''}</div>`;
  fb.hidden = false;
  if (cls === 'ok') { Sound.play(R.streak >= 3 ? 'streak' : 'good'); burst(); } else Sound.play('bad');
  const cps = document.querySelectorAll('.cp'); if (cps[R.idx]) cps[R.idx].className = 'cp ' + (a.counted ? 'ok' : 'no');
  const hud = document.getElementById('hud'); if (hud) hud.innerHTML = hudHTML(R);
  if (!touch()) setTimeout(() => { const b = fb.querySelector('[data-act="next"]'); if (b) b.focus(); }, 60);
  clearTimeout(fbTimer); fbTimer = setTimeout(nextQuestion, wait);
}
function burst() {
  const b = document.getElementById('burst'); if (!b || reduced()) return;
  const cols = ['#2BC9BF', '#F6C453', '#F0607C', '#4A6EF0', '#EAF1F6']; let h = '';
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, d = 90 + Math.random() * 90; h += `<i style="background:${cols[i % 5]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 40}px;animation-delay:${Math.random() * 80}ms"></i>`; }
  b.innerHTML = h;
}
function nextQuestion() {
  clearTimeout(fbTimer);
  const R = S.run; if (!R || S.screen !== 'play' || R.moving) return;
  R.moving = true;
  const card = document.getElementById('card');
  const after = () => {
    R.moving = false;
    if (S.screen !== 'play' || S.run !== R) return;
    R.idx++; saveRun();
    if (R.idx >= R.plan.length) finishRun(); else renderPlay();
  };
  if (card && !reduced()) { card.classList.remove('card-in'); card.classList.add('card-out'); setTimeout(after, 300); } else after();
}

/* ---------- finishing, saving ---------- */
function finishRun() {
  const R = S.run;
  const results = R.plan.map((q, k) => {
    const a = R.answers[k] || { text: '', secs: 0 };
    const g = grade(q, a.text); // re-grade, so answers the teacher accepted earlier count
    const text = q.t === 'sort' ? q.items.map(([w], i) => (String(a.text || '').split('|')[i] ? `${String(a.text).split('|')[i]} ${w}` : `? ${w}`)).join(', ') : a.text;
    return { id: q.id, cat: q.cat, l: q.l, t: q.t, q: q.q, pic: q.pic || '', text, secs: a.secs, status: g.status, fixes: g.fixes || [],
      model: modelOf(q), tip: q.tip || '', max: pts(q), counted: g.status === 'ok' };
  });
  const entry = { id: R.id, name: R.name, at: R.at, end: Date.now(), results, time: results.reduce((s, r) => s + r.secs, 0), best: R.best || 0, timed: R.timer };
  S.last = entry; S.from = 'race';
  saveEntry(entry); saveHist(entry); store.del('run'); S.run = null;
  Sound.stopMusic(); Sound.play('finish'); go('results');
}
const scoreOf = e => e.results.reduce((s, r) => s + (r.counted ? r.max : 0), 0);
const maxOf = e => e.results.reduce((s, r) => s + r.max, 0);
const pctOf = e => Math.round(100 * scoreOf(e) / Math.max(1, maxOf(e)));
function topicStats(e) {
  const o = {};
  e.results.forEach(r => { const t = o[r.cat] = o[r.cat] || { got: 0, max: 0 }; t.max += r.max; if (r.counted) t.got += r.max; });
  return o;
}
function weakTopics(e) {
  const o = topicStats(e);
  return Object.keys(o).filter(k => o[k].got / o[k].max < 0.7).sort((a, b) => o[a].got / o[a].max - o[b].got / o[b].max);
}
function saveEntry(e) {
  const lb = store.get('lb', []).filter(x => x.id !== e.id);
  lb.push({ id: e.id, name: e.name, score: scoreOf(e), max: maxOf(e), pct: pctOf(e), n: e.results.length, time: Math.round(e.time), weak: weakTopics(e).slice(0, 3).map(k => CATS[k] ? CATS[k].name : k), at: e.at });
  store.set('lb', lb);
}
function saveHist(e) {
  let h = store.get('hist', []).filter(x => x.id !== e.id); h.push(e);
  while (h.length && !store.set('hist', h)) h = h.slice(Math.ceil(h.length * 0.1));
}

/* ---------- results ---------- */
function renderResults() {
  const e = S.last; if (!e) { go('home'); return; }
  const sc = scoreOf(e), mx = maxOf(e), pct = pctOf(e), fresh = S.from === 'race';
  const verdict = pct >= 90 ? 'Outstanding.' : pct >= 75 ? 'Very strong.' : pct >= 60 ? 'Good work.' : pct >= 40 ? 'Getting there.' : 'Keep practising.';
  const when = new Date(e.at), T = topicStats(e), W = weakTopics(e);
  const rows = e.results.map((r, k) => ({ r, k })).filter(x => !S.onlyMiss || !x.r.counted);
  $app.innerHTML = `
  <div class="head"><h2>${esc(e.name)}</h2><p class="sub">${when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}${e.best >= 3 ? ` · best streak ${e.best}` : ''}</p></div>
  <div class="tile ${pct >= 70 ? 'turq' : pct >= 40 ? 'saff' : 'pom'}"><div class="in score">
    <div class="num"><span id="scn">${fresh && !reduced() ? 0 : sc}</span><small>/${mx}</small></div>
    <div><h3 style="font-size:2rem">${verdict}</h3>
      <div class="bytype"><span>${pct}%</span><span>${e.results.filter(r => r.counted).length} of ${e.results.length} correct</span><span>${Math.round(e.time)} second${Math.round(e.time) === 1 ? "" : "s"}</span></div></div>
  </div></div>
  <div class="split">
    <div>
      <h3 style="font-size:1.6rem;margin-bottom:12px">Topics</h3>
      <div class="bars">${Object.keys(CATS).filter(k => T[k]).map(k => { const p = Math.round(100 * T[k].got / T[k].max); return `<div class="bar-r ${p < 50 ? 'low' : p < 80 ? 'mid' : ''}"><span>${esc(CATS[k].name)}</span><span class="tr"><i style="--w:${fresh && !reduced() ? 0 : p}%" data-w="${p}"></i></span><b>${p}%</b></div>`; }).join('')}</div>
      <h3 style="font-size:1.6rem;margin:22px 0 12px">Work on</h3>
      ${W.length ? `<ul class="weak">${W.map(k => `<li><b>${esc(CATS[k].name)}</b> <small>${T[k].got}/${T[k].max} points</small><small>${esc(CATS[k].tip)}</small></li>`).join('')}</ul>` : '<div class="tile"><div class="in">No weak topic. Try the Full 40 on Fast pace.</div></div>'}
      <div class="actions">
        ${S.from === 'hist' ? '<button class="btn big" data-act="go-hist"><span>Back to history</span></button>' : '<button class="btn big" data-act="go-lobby"><span>Next student</span></button>'}
        <button class="btn alt" data-act="go-lb"><span>Leaderboard</span></button></div>
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        <h3 style="font-size:1.6rem">Question by question</h3>
        <button class="mini" data-act="only-miss">${S.onlyMiss ? 'Show all' : 'Show mistakes only'}</button></div>
      <div class="review">${rows.length ? rows.map(x => reviewRow(x.r, x.k)).join('') : '<div class="tile"><div class="in">No mistakes. Perfect.</div></div>'}</div>
    </div>
  </div>`;
  if (fresh) {
    countUp(sc);
    document.querySelectorAll('.bar-r .tr i').forEach(i => setTimeout(() => { i.style.setProperty('--w', i.dataset.w + '%'); }, 350));
    if (pct >= 60) confetti(pct >= 90 ? 260 : 150);
    S.from = 'seen';
  }
}
function countUp(sc) {
  const el = document.getElementById('scn'); if (!el || reduced()) return;
  let n = 0; const step = () => { if (!document.body.contains(el)) return; el.textContent = n; if (n < sc) { n += Math.max(1, Math.ceil(sc / 25)); if (n > sc) n = sc; setTimeout(step, 70); } };
  setTimeout(step, 250);
}
function reviewRow(r, k) {
  const cls = r.counted ? (r.status === 'ok' ? 'ok' : 'rev') : 'no';
  const label = r.counted ? (r.status === 'ok' ? `Correct · ${r.max} point${r.max > 1 ? 's' : ''}` : 'Accepted by teacher')
    : r.status === 'empty' ? 'No answer' : r.status === 'spell' ? 'Spelling slip' : 'Not correct';
  const canToggle = ['fill', 'ord', 'tr', 'fix'].includes(r.t) && r.status !== 'empty' && QBY[r.id];
  const btn = canToggle && (r.status !== 'ok' || !r.counted) ? `<button class="mini" data-act="toggle" data-k="${k}">${r.counted ? 'Mark wrong' : 'Accept this answer'}</button>` : '';
  const shown = r.t === 'fill' ? r.q.replace(/_{3,}/g, '____') : r.t === 'mc' || r.t === 'tr' || r.t === 'fix' ? r.q : (r.t === 'sort' ? 'Sort: a or an' : 'Word order');
  return `<div class="rv ${cls}" style="animation-delay:${Math.min(k, 14) * 40}ms">
    ${r.pic ? `<div class="pic">${r.pic}</div>` : ''}
    <div class="u">${k + 1}. ${esc(shown)} ${r.l === 'x' ? '<span class="chiplvl x" style="font-size:.75rem;padding:1px 8px">Challenge</span>' : ''}</div>
    <div class="y">You: ${String(r.text || '').trim() ? esc(r.text) : '<i>no answer</i>'}</div>
    ${r.counted && r.status === 'ok' ? '' : `<div class="m">Answer: ${esc(r.model)}</div>${r.tip ? `<div class="m">${esc(r.tip)}</div>` : ''}`}
    <div class="row"><span class="status">${label}</span>${btn}</div></div>`;
}
function toggleAccept(k) {
  const e = S.last, r = e.results[k], acc = accMap();
  const n = nrm(r.text), list = acc[r.id] || [];
  r.counted = !r.counted;
  if (r.counted && n && !list.includes(n)) list.push(n);
  if (!r.counted) { const j = list.indexOf(n); if (j >= 0) list.splice(j, 1); }
  acc[r.id] = list; store.set('acc', acc);
  saveEntry(e); saveHist(e); renderResults();
}

/* leaderboard + history */
function renderLB() {
  const lb = store.get('lb', []).slice().sort((a, b) => b.pct - a.pct || b.score - a.score || a.time - b.time);
  const col = ['saff', 'turq', 'cobalt'];
  $app.innerHTML = `
  <div class="head"><h2>Leaderboard</h2><p class="sub">Ranked by percentage. Faster total time breaks ties. Tap a name to see the test.</p></div>
  ${lb.length ? `<div class="board-list">${lb.map((p, k) => `
    <button class="tile ${col[k] || ''}" data-act="hist-open" data-id="${esc(p.id)}"><div class="in lbrow">
      <div class="rk">${k + 1}</div><div><div class="nm">${esc(p.name)}</div>${p.weak && p.weak.length ? `<small>Work on: ${esc(p.weak.join(', '))}</small>` : ''}</div>
      <div class="tm">${p.score}/${p.max}</div><div class="sc">${p.pct}%</div></div></button>`).join('')}</div>`
    : '<div class="tile"><div class="in empty"><h3 style="font-size:1.6rem">No scores yet</h3><p class="sub" style="margin:8px auto 18px">Run the first student through the test.</p><button class="btn big" data-act="go-lobby"><span>Open the test</span></button></div></div>'}
  <div class="actions"><button class="btn" data-act="go-lobby"><span>Next student</span></button>
    ${lb.length ? '<button class="btn alt" data-act="clear"><span>Start a new class</span></button>' : ''}</div>`;
}
function renderHist() {
  const h = store.get('hist', []).slice().sort((a, b) => b.at - a.at), R = savedRun(), days = [];
  h.forEach(e => {
    const d = new Date(e.at).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let g = days.find(x => x.d === d); if (!g) { g = { d, list: [] }; days.push(g); } g.list.push(e);
  });
  $app.innerHTML = `
  <div class="head"><h2>History</h2><p class="sub">Every finished test is saved on this device, with every answer. ${h.length ? h.length + ' so far.' : ''}</p></div>
  ${R ? `<div class="tile saff resume"><div class="in"><div><b>${esc(R.name)}</b> has an unfinished test (question ${Math.min(R.idx + 1, R.plan.length)} of ${R.plan.length}).</div><div class="actions" style="margin:0"><button class="btn" data-act="resume"><span>Continue</span></button></div></div></div>` : ''}
  ${h.length ? `<div class="actions" style="margin:0 0 6px"><button class="btn" data-act="hist-csv"><span>Download all (Excel / CSV)</span></button><button class="btn alt" data-act="hist-clear"><span>Clear history</span></button></div>
    ${days.map(g => `<div class="hday">${esc(g.d)}</div><div class="hlist">${g.list.map(e => `<button class="hrow" data-act="hist-open" data-id="${esc(e.id)}"><span class="t">${new Date(e.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span><span class="n">${esc(e.name)}</span><span class="s">${scoreOf(e)}/${maxOf(e)}</span><span class="d">${pctOf(e)}%</span><span class="go">Open</span></button>`).join('')}</div>`).join('')}`
    : '<div class="tile"><div class="in empty"><h3 style="font-size:1.6rem">Nothing saved yet</h3><p class="sub" style="margin:8px auto 18px">Finished tests appear here automatically.</p><button class="btn big" data-act="go-lobby"><span>Open the test</span></button></div></div>'}`;
}
function openHist(id) {
  const e = store.get('hist', []).find(x => x.id === id);
  if (!e) { alert('Only the score was kept for this test.'); return; }
  S.last = e; S.from = 'hist'; S.onlyMiss = false; go('results');
}
const csvCell = v => { const s = String(v == null ? '' : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function exportCSV() {
  const h = store.get('hist', []).slice().sort((a, b) => a.at - b.at);
  const rows = [['Date', 'Time', 'Student', 'Score', 'Max', 'Percent', 'No.', 'Topic', 'Level', 'Type', 'Question', 'Answer', 'Result', 'Correct answer', 'Points', 'Seconds']];
  const RES = { ok: 'Correct', wrong: 'Not correct', spell: 'Spelling slip', empty: 'No answer' };
  h.forEach(e => {
    const d = new Date(e.at), sc = scoreOf(e), mx = maxOf(e);
    e.results.forEach((r, k) => rows.push([`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), e.name, sc, mx, Math.round(100 * sc / mx), k + 1,
      CATS[r.cat] ? CATS[r.cat].name : r.cat, r.l === 'x' ? 'Challenge' : 'Core', TYPE_NAME[r.t] || r.t, (r.pic ? r.pic + ' ' : '') + r.q, r.text,
      r.counted && r.status !== 'ok' ? 'Accepted by teacher' : (!r.counted && r.status === 'ok' ? 'Marked wrong by teacher' : RES[r.status] || r.status), r.model, r.counted ? r.max : 0, Math.round(r.secs)]));
  });
  const csv = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'unit-test-history-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function confetti(n) {
  if (reduced()) return;
  const cv = document.getElementById('confetti'), cx = cv.getContext('2d');
  const W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio; cv.hidden = false;
  const cols = ['#2BC9BF', '#F6C453', '#F0607C', '#4A6EF0', '#0E1A3F'];
  const P = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 26 * devicePixelRatio, vy: (-Math.random() * 22 - 8) * devicePixelRatio, s: (6 + Math.random() * 8) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  const frame = t => {
    cx.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += 0.6 * devicePixelRatio; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); cx.restore(); });
    if (t - t0 < 3200) requestAnimationFrame(frame); else { cx.clearRect(0, 0, W, H); cv.hidden = true; }
  };
  requestAnimationFrame(frame);
}

/* ---------- voice ---------- */
function micUI(state) {
  const w = document.querySelector('.micw'); if (!w) return;
  w.classList.toggle('on', state === 'listening'); w.classList.toggle('wait', state === 'starting');
  const inp = document.getElementById('ans'); if (inp) inp.classList.toggle('listening', state === 'listening');
}
function vmsg(text, cls) { const m = document.getElementById('vmsg'); if (m) { m.className = 'vmsg ' + (cls || ''); m.textContent = text; } }
function toggleMic() {
  const inp = document.getElementById('ans'); if (!inp || !S.run || S.run.done) return;
  if (Voice.busy) { Voice.stop(); return; }
  Sound.init();
  Voice.start({
    onState(s) {
      if (!document.body.contains(inp)) return;
      micUI(s);
      if (s === 'starting') vmsg('Starting the microphone…', 'live');
      if (s === 'listening') { Sound.duck(true); Sound.play('mic'); vmsg('Listening… say the whole sentence in English.', 'live'); }
      if (s === 'idle') { Sound.duck(false); const m = document.getElementById('vmsg'); if (m && m.classList.contains('live')) vmsg(inp.value.trim() ? 'Got it. Fix a word if needed, then lock in.' : '', inp.value.trim() ? 'ok' : ''); }
    },
    onText(t, fin) { if (!document.body.contains(inp)) return; inp.value = t; if (fin) vmsg('Got it. Fix a word if needed, then lock in.', 'ok'); },
    onError(m) { vmsg(m, 'err'); }
  });
}

/* ---------- events ---------- */
document.addEventListener('click', ev => {
  const o = ev.target.closest('[data-opt]');
  if (o) { S.cfg[o.dataset.opt] = +o.dataset.v; saveCfg(); renderLobby(); return; }
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'home') go('home');
  else if (a === 'go-lobby') go('lobby');
  else if (a === 'go-lb') go('lb');
  else if (a === 'go-hist') go('hist');
  else if (a === 'theme') {
    const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme:dark)').matches);
    const t = dark ? 'light' : 'dark'; setTheme(t); store.set('theme', t);
  } else if (a === 'sound') {
    const on = !(S.cfg.music || S.cfg.sfx); S.cfg.music = on; S.cfg.sfx = on; saveCfg();
    Sound.init(); Sound.set('music', on); Sound.set('sfx', on);
    if (on && S.screen === 'play' && S.run && S.run.go) Sound.startMusic();
    paintSound(); document.querySelectorAll('[data-sw="music"],[data-sw="sfx"]').forEach(x => { x.checked = on; });
  }
  else if (a === 'mic') toggleMic();
  else if (a === 'next') nextQuestion();
  else if (a === 'resume') resumeRun();
  else if (a === 'discard') { if (confirm('Discard the unfinished test?')) { store.del('run'); renderLobby(); } }
  else if (a === 'opt') { if (S.run && !S.run.done) { S.cur.sel = +b.dataset.i; document.querySelectorAll('.opt').forEach((x, i) => x.classList.toggle('on', i === S.cur.sel)); Sound.init(); } }
  else if (a === 'chip') { S.cur.placed.push(+b.dataset.i); drawChips(); }
  else if (a === 'unchip') { S.cur.placed = S.cur.placed.filter(i => i !== +b.dataset.i); drawChips(); }
  else if (a === 'clear-ord') { S.cur.placed = []; drawChips(); }
  else if (a === 'sortpick') {
    const i = +b.dataset.i; S.cur.sort[i] = b.dataset.v;
    b.closest('.sbtns').querySelectorAll('.sbtn').forEach(x => x.classList.toggle('on', x.dataset.v === b.dataset.v));
  }
  else if (a === 'only-miss') { S.onlyMiss = !S.onlyMiss; renderResults(); }
  else if (a === 'toggle') toggleAccept(+b.dataset.k);
  else if (a === 'hist-open') openHist(b.dataset.id);
  else if (a === 'hist-csv') exportCSV();
  else if (a === 'hist-clear') { if (confirm('Delete every saved test from this device? Download the CSV first if you want to keep it.')) { store.del('hist'); renderHist(); } }
  else if (a === 'clear') { if (confirm('Clear the leaderboard and start a new class? History is kept.')) { store.set('lb', []); store.set('used', []); renderLB(); } }
});
document.addEventListener('submit', ev => {
  const f = ev.target.closest('[data-form]'); if (!f) return;
  ev.preventDefault();
  if (f.dataset.form === 'start') { const name = f.nm.value.trim(); if (name) startRun(name); }
  else if (f.dataset.form === 'answer') submitAnswer();
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset && t.dataset.sw) {
    const k = t.dataset.sw; S.cfg[k] = t.checked; saveCfg();
    if (k === 'music' || k === 'sfx') { Sound.set(k, t.checked); paintSound(); if (t.checked) { Sound.init(); Sound.play('mic'); } }
  }
});
window.addEventListener('pagehide', () => { if (S.run) saveRun(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) Voice.abort(); });

go('home');
