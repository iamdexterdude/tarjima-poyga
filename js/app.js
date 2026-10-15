/* ======================================================================
   APP: screens, the race, saving every session, history and export.
   ====================================================================== */
const $app = document.getElementById('app');
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const KIND = { p: 'Positive', n: 'Negative', i: 'Question' };
const LVCOL = { easy: 'turq', avg: 'saff', hard: 'pom' };
const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
const touch = () => matchMedia('(pointer:coarse)').matches;
const newId = () => Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

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
  keys: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="6" width="19" height="12" rx="1.5"/><path d="M6 10h1M9.5 10h1M13 10h1M16.5 10h1M7 14h10"/></svg>',
  runner: '<svg viewBox="0 0 40 40"><path d="M8 8 L32 20 L8 32 L14 20 Z" fill="#F6C453" stroke="#0C1640" stroke-width="2.5" stroke-linejoin="round"/><path d="M2 14h8M0 20h10M2 26h8" stroke="#2BC9BF" stroke-width="2.5" stroke-linecap="round"/></svg>'
};

const DEF_CFG = { easy: 25, avg: 35, hard: 45, feedback: true, music: true, sfx: true };
const S = {
  screen: 'home',
  cfg: Object.assign({}, DEF_CFG, store.get('trp_cfg', {})),
  board: null, run: null, last: null, level: 'easy', from: null
};
let timerRAF = 0, demoToken = 0, fbTimer = 0, rateTick = 0;
Sound.set('music', S.cfg.music);
Sound.set('sfx', S.cfg.sfx);
const saveCfg = () => store.set('trp_cfg', S.cfg);

/* ---------- theme + sound buttons ---------- */
function setTheme(t) {
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
setTheme(store.get('trp_theme', null));
document.querySelector('[data-act="theme"]').innerHTML = ICON.theme;
function paintSound() {
  const on = S.cfg.music || S.cfg.sfx;
  const b = document.getElementById('soundBtn');
  b.innerHTML = on ? ICON.soundOn : ICON.soundOff;
  b.setAttribute('aria-pressed', String(on));
  b.title = on ? 'Sound is on' : 'Sound is off';
}
paintSound();

/* ---------- speed lines (generated once) ---------- */
(function makeSpeed() {
  const box = document.getElementById('speed');
  let h = '';
  for (let i = 0; i < 16; i++) {
    const top = Math.round(Math.random() * 100), w = 80 + Math.round(Math.random() * 220);
    const dur = (1.4 + Math.random() * 2.4).toFixed(2), del = (-Math.random() * 4).toFixed(2), op = (0.25 + Math.random() * 0.6).toFixed(2);
    h += `<i style="top:${top}%;width:${w}px;animation-duration:${dur}s;animation-delay:${del}s;opacity:${op}"></i>`;
  }
  box.innerHTML = h;
})();
function setSpeed(rate) {
  document.querySelectorAll('#speed i, .fuse .num span').forEach(el => {
    if (el.getAnimations) el.getAnimations().forEach(a => { a.playbackRate = rate; });
  });
}

/* ---------- picking sentences ---------- */
function pickFrom(level, type, usedRun) {
  const pool = ITEMS.filter(it => it.level === level && it.type === type && !usedRun.has(it.id));
  let used = store.get('trp_used', []);
  let fresh = pool.filter(it => !used.includes(it.id));
  if (!fresh.length) {
    // every sentence of this kind has been used: start a new round for it
    used = used.filter(id => !pool.some(p => p.id === id));
    store.set('trp_used', used);
    fresh = pool;
  }
  return fresh[Math.floor(Math.random() * fresh.length)];
}
function buildRun() {
  const plan = [], run = new Set(), mark = [];
  ['easy', 'avg', 'hard'].forEach(lv => {
    const types = ['p', 'n', 'i'];
    if (LEVELS[lv].n === 4) types.push(['p', 'n', 'i'][Math.floor(Math.random() * 3)]);
    shuffle(types).forEach(t => {
      const it = pickFrom(lv, t, run);
      run.add(it.id); mark.push(it.id); plan.push(it);
    });
  });
  store.set('trp_used', store.get('trp_used', []).concat(mark));
  return plan;
}
function pickAny(level, type, usedRun) {
  const pool = ITEMS.filter(it => it.level === level && it.type === type && !usedRun.has(it.id));
  return pool[Math.floor(Math.random() * pool.length)];
}
function buildBoard(level) {
  const types = shuffle(['p', 'p', 'p', 'p', 'n', 'n', 'n', 'i', 'i', 'i']);
  const run = new Set();
  const items = types.map(t => { const it = pickAny(level, t, run); run.add(it.id); return it; });
  return { level, items, i: 0, shown: false, seen: new Set([0]), tryRes: null };
}

/* ---------- screens ---------- */
function go(screen) {
  cancelAnimationFrame(timerRAF);
  clearTimeout(fbTimer); clearInterval(rateTick);
  demoToken++;
  Voice.abort(); Sound.duck(false);
  if (screen !== 'play') { Sound.stopMusic(); document.body.classList.remove('arena'); document.body.style.removeProperty('--danger'); }
  S.screen = screen;
  window.scrollTo(0, 0);
  ({ home: renderHome, board: renderBoard, lobby: renderLobby, play: renderPlay, results: renderResults, lb: renderLB, hist: renderHist }[screen])();
}

/* home */
const DEMO = [
  ['Onam kiyim do\'konida ishlaydi.', 'My mum works in a clothes store.', 'Accepted. store = shop, mum = mother, no article needed.', 'keys'],
  ['U hech qachon kofe ichmaydi.', 'She never drinks coffee.', 'Accepted. never + verb with -s.', 'mic'],
  ['Opang kitob o\'qiydimi?', 'Does your sister read a book?', 'Accepted. Does + subject + base verb.', 'keys'],
  ['Biz dam olish kunlari plyajga boramiz.', 'At the weekend we go to the beach.', 'Accepted. Time words can go first.', 'mic']
];
function renderHome() {
  const n = ITEMS.length;
  $app.innerHTML = `
  <section class="home">
    <div class="hero">
      <h1>Beat the fuse. <em>Say it right.</em></h1>
      <p class="lede">Uzbek sentences in, English out, against the clock. Type your answer or just say it. Every correct sentence scores, not only one model translation.</p>
      <div class="tile flat demo"><div class="tile" style="width:100%"><div class="in">
        <div class="uz" id="d-uz">&nbsp;</div>
        <div class="en"><span class="how" id="d-how"></span><span id="d-en"></span></div>
        <div class="verdict" id="d-v">&nbsp;</div>
      </div></div></div>
      <div class="facts"><span><b>${n}</b> sentences</span><span>Units 1–4 + 5.1</span><span>Present simple + − ?</span></div>
    </div>
    <div class="modes">
      <button class="tile cobalt mode board" data-act="go-board"><div class="in">
        <h2>Board</h2><p>Teacher-led. Ten sentences per level on the big screen. No timer, reveal the answers together.</p>
      </div></button>
      <button class="tile saff mode arena-t" data-act="go-lobby"><div class="in">
        <h2>Arena</h2><p>Each student races through a different ten: 4 easy, 3 average, 3 hard. Music, a fuse and a heartbeat.</p>
      </div></button>
      <button class="tile mode" data-act="go-hist" style="margin-left:14px"><div class="in" style="padding:16px 22px">
        <b style="font-family:var(--f-display);font-size:1.3rem">History</b> <span class="sub">every finished race, saved</span>
      </div></button>
    </div>
  </section>`;
  runDemo(demoToken, 0);
}
function runDemo(tok, k) {
  const el = document.getElementById('d-uz');
  if (!el || tok !== demoToken) return;
  const [uz, en, note, how] = DEMO[k % DEMO.length];
  const en$ = document.getElementById('d-en'), v$ = document.getElementById('d-v');
  document.getElementById('d-how').innerHTML = how === 'mic' ? ICON.mic : ICON.keys;
  el.textContent = uz; en$.innerHTML = '<span class="caret"></span>'; v$.classList.remove('on'); v$.textContent = note;
  if (reduced()) { en$.textContent = en; v$.classList.add('on'); setTimeout(() => runDemo(tok, k + 1), 4500); return; }
  let i = 0;
  const words = en.split(' ');
  const step = () => {
    if (tok !== demoToken) return;
    if (how === 'mic') {
      i++;
      en$.innerHTML = esc(words.slice(0, i).join(' ')) + (i < words.length ? '<span class="caret"></span>' : '');
      if (i < words.length) setTimeout(step, 230 + Math.random() * 120);
      else { v$.classList.add('on'); setTimeout(() => runDemo(tok, k + 1), 3200); }
    } else {
      i++;
      en$.innerHTML = esc(en.slice(0, i)) + (i < en.length ? '<span class="caret"></span>' : '');
      if (i < en.length) setTimeout(step, 50 + Math.random() * 55);
      else { v$.classList.add('on'); setTimeout(() => runDemo(tok, k + 1), 3200); }
    }
  };
  setTimeout(step, 700);
}

/* board */
function levelTabs(sel, act) {
  return `<div class="levels">${['easy', 'avg', 'hard'].map(k => `
    <button class="tile lv ${LVCOL[k]} ${sel === k ? 'on' : ''}" data-act="${act}" data-level="${k}" aria-pressed="${sel === k}"><div class="in">
      <b>${LEVELS[k].name}</b> <small>${LEVELS[k].uz}. ${LEVELS[k].blurb}</small></div></button>`).join('')}</div>`;
}
function micHTML(forId, msgId, extra) {
  if (!Voice.supported) return '';
  return `<div class="micw ${extra || ''}"><button type="button" class="mic" data-act="mic" data-for="${forId}" data-msg="${msgId}" aria-label="Speak the answer">
    <span class="go">${ICON.mic}</span><span class="st">${ICON.stop}</span></button></div>`;
}
function renderBoard() {
  if (!S.board) S.board = buildBoard(S.level);
  const B = S.board, it = B.items[B.i];
  let ans = '';
  if (B.shown) {
    const alts = alternatives(it, 3);
    ans = `<div class="answers">
      <div class="ans">${esc(canon(it))}</div>
      ${alts.map((a, k) => `<div class="ans alt" style="animation-delay:${(k + 1) * 80}ms">${esc(a)}</div>`).join('')}
      <div class="tip">${esc(TIPS[it.tags[0]] || '')}</div></div>`;
  }
  $app.innerHTML = `
  <div class="head"><h2>Board</h2><p class="sub">Read the Uzbek aloud, translate together, then reveal. Arrow keys move between sentences, Space reveals.</p></div>
  ${levelTabs(B.level, 'board-level')}
  <div class="tile stage"><div class="in">
    <div class="pips">${B.items.map((_, k) => `<button class="pip ${k === B.i ? 'cur' : B.seen.has(k) ? 'seen' : ''}" data-act="board-jump" data-i="${k}" aria-label="Sentence ${k + 1}">${k + 1}</button>`).join('')}</div>
    <span class="kind ${it.type}">${KIND[it.type]}</span>
    <div class="big-uz">${esc(it.uz)}</div>
    ${ans}
    <div class="actions">
      <button class="btn" data-act="board-prev" ${B.i === 0 ? 'disabled' : ''}><span>Previous</span></button>
      <button class="btn big" data-act="board-reveal"><span>${B.shown ? 'Hide answers' : 'Show answers'}</span></button>
      <button class="btn" data-act="board-next" ${B.i === 9 ? 'disabled' : ''}><span>Next</span></button>
      <button class="btn alt" data-act="board-new"><span>New ten</span></button>
    </div>
    <form class="try" data-form="try" autocomplete="off">
      <input class="field" id="tryin" name="a" placeholder="Try a student answer: type it or use the mic" aria-label="Student answer" autocapitalize="off" spellcheck="false">
      ${micHTML('tryin', 'trymsg', 'board-mic')}
      <button class="btn alt" type="submit"><span>Check</span></button>
      <p class="vmsg" id="trymsg" aria-live="polite"></p>
      ${B.tryRes ? `<div class="tryres ${B.tryRes.cls}">${B.tryRes.msg}</div>` : ''}
    </form>
  </div></div>`;
}
function boardGo(i) {
  const B = S.board; B.i = Math.max(0, Math.min(9, i)); B.shown = false; B.tryRes = null; B.seen.add(B.i); renderBoard();
}

/* lobby */
function savedRun() {
  const r = store.get('trp_run', null);
  if (!r || !Array.isArray(r.plan) || !r.plan.every(id => ITEM_BY_ID[id])) return null;
  return r;
}
function renderLobby() {
  const players = store.get('trp_lb', []).length;
  const R = savedRun();
  const sw = (key, title, note) => `<label class="sw"><input type="checkbox" data-sw="${key}" ${S.cfg[key] ? 'checked' : ''}><span class="knob"></span><span><b>${title}</b><small>${note}</small></span></label>`;
  $app.innerHTML = `
  <div class="head"><h2>Arena</h2><p class="sub">${players ? players + ' race' + (players === 1 ? '' : 's') + ' on the leaderboard. ' : ''}Every student gets a different set, with the same mix of levels.</p></div>
  ${R ? `<div class="tile saff resume"><div class="in">
    <div><b style="font-family:var(--f-display);font-size:1.3rem">${esc(R.name)} has an unfinished race</b><div>Sentence ${Math.min(R.idx + 1, 10)} of 10 · saved automatically</div></div>
    <div class="actions" style="margin:0"><button class="btn" data-act="resume"><span>Continue</span></button><button class="btn alt" data-act="discard"><span>Discard</span></button></div>
  </div></div>` : ''}
  <div class="lobby">
    <div class="tile"><div class="in lblock">
      <form data-form="start" autocomplete="off">
        <label class="lab" for="nm">Student name</label>
        <input class="field" id="nm" name="nm" maxlength="24" required placeholder="Type your name">
        <div class="actions"><button class="btn big" type="submit"><span>Start the race</span></button></div>
        <p class="hint">Answer with Enter, the Lock in button, or the mic: tap it and say the sentence in English. When the fuse runs out, what is in the box is sent.</p>
      </form>
    </div></div>
    <div class="tile"><div class="in rules">
      <h3 style="font-size:1.5rem">Time per sentence (seconds)</h3>
      ${['easy', 'avg', 'hard'].map(k => `
        <div class="rule"><span class="tag" style="background:var(--${LVCOL[k]})"></span>
          <div style="flex:1"><b>${LEVELS[k].name}</b><div class="hint" style="margin:0">${LEVELS[k].n} sentences</div></div>
          <input type="number" min="8" max="120" value="${S.cfg[k]}" data-cfg="${k}" aria-label="${LEVELS[k].name} seconds"></div>`).join('')}
      <div class="sep"></div>
      ${sw('feedback', 'Show right or wrong after each sentence', 'Off: no feedback until the end.')}
      ${sw('music', 'Heartbeat music while solving', 'It goes quiet while the mic listens.')}
      ${sw('sfx', 'Sound effects', 'Countdown, ticks, right and wrong.')}
    </div></div>
  </div>`;
  if (!touch()) setTimeout(() => { const n = document.getElementById('nm'); if (n) n.focus(); }, 0);
}

/* ---------- the race ---------- */
function saveRun() {
  const R = S.run;
  if (!R) return;
  store.set('trp_run', { id: R.id, name: R.name, plan: R.plan.map(i => i.id), idx: R.idx, answers: R.answers, at: R.at, streak: R.streak, best: R.best });
}
function startRun(name) {
  Sound.init();
  S.run = { id: newId(), name, plan: buildRun(), idx: 0, answers: [], at: Date.now(), streak: 0, best: 0, go: false };
  saveRun();
  go('play');
}
function resumeRun() {
  const r = savedRun();
  if (!r) { renderLobby(); return; }
  Sound.init();
  S.run = Object.assign({}, r, { plan: r.plan.map(id => ITEM_BY_ID[id]), go: false });
  if (S.run.idx >= S.run.plan.length) { finishRun(); return; }
  go('play');
}
function trackHTML(R) {
  const cps = R.plan.map((_, k) => {
    let c = '';
    if (k < R.idx) { const a = R.answers[k]; c = S.cfg.feedback ? (a && a.counted ? 'ok' : 'no') : 'done'; }
    else if (k === R.idx) c = 'cur';
    return `<span class="cp ${c}"></span>`;
  }).join('');
  const r = R.plan.length > 1 ? R.idx / (R.plan.length - 1) : 0;
  return `<div class="track" style="--r:${r}"><div class="rail"><i style="--p:${(R.idx / (R.plan.length - 1)) * 100}%"></i></div>
    <div class="cps">${cps}</div><div class="runner">${ICON.runner}</div></div>`;
}
function hudHTML(R) {
  const sc = R.answers.filter(a => a.counted).length;
  return `${S.cfg.feedback ? `<span class="pill">Score <b id="hudScore">${sc}</b></span>` : ''}
    <span class="pill streak ${R.streak >= 2 && S.cfg.feedback ? 'on' : ''}" id="hudStreak">${ICON.flame}<b>${R.streak}</b> in a row</span>`;
}
function wordsHTML(uz) {
  return uz.split(' ').map((w, k) => `<span class="w" style="animation-delay:${120 + k * 75}ms">${esc(w)}</span>`).join(' ');
}
function renderPlay() {
  const R = S.run, it = R.plan[R.idx], lim = S.cfg[it.level];
  R.limit = lim; R.done = true;
  document.body.classList.add('arena');
  $app.innerHTML = `
  <section class="race">
    <div class="race-top">
      <div class="who"><b>${esc(R.name)}</b><span>Sentence ${R.idx + 1} of ${R.plan.length}</span></div>
      <div class="hud" id="hud">${hudHTML(R)}</div>
    </div>
    ${trackHTML(R)}
    <div class="tile night stage-run card-in" id="card"><div class="in">
      <div class="play">
        <div class="fuse" id="fuse">
          <svg viewBox="0 0 120 120" role="img" aria-label="Time left">
            <polygon class="back" points="60,8 112,60 60,112 8,60" stroke-linejoin="miter"/>
            <polygon class="run" id="ring" points="60,8 112,60 60,112 8,60" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0" stroke-linejoin="miter"/>
            <circle class="spark" id="spark" cx="60" cy="8" r="4.5"/>
          </svg>
          <div class="num"><span id="secs">${lim}</span></div>
        </div>
        <div class="qa">
          <div class="q-meta"><span class="lvl ${it.level}">${LEVELS[it.level].name}</span></div>
          <div class="q-uz" lang="uz">${wordsHTML(it.uz)}</div>
          <form class="answer" data-form="answer" autocomplete="off">
            <div class="fwrap"><input class="field" id="ans" name="a" placeholder="${Voice.supported ? 'Type it, or tap the mic and say it' : 'Type the English here'}" aria-label="Your English translation" autocapitalize="off" autocorrect="off" spellcheck="false"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
            ${micHTML('ans', 'vmsg')}
            <button class="btn big" type="submit"><span>Lock in</span></button>
          </form>
          <p class="vmsg" id="vmsg" aria-live="polite">${Voice.supported ? ICON.mic.replace('<svg', '<svg style="width:18px;height:18px;flex:none"') + ' Tap the mic, say the whole sentence, then lock in.' : ''}</p>
        </div>
      </div>
    </div></div>
    <div class="fb" id="fb" role="dialog" aria-live="assertive" hidden></div>
  </section>`;
  placeSpark(1);
  if (!R.go) countdown(() => { R.go = true; Sound.startMusic(); beginSentence(); });
  else beginSentence();
}
function countdown(done) {
  const box = document.createElement('div');
  box.className = 'count';
  document.body.appendChild(box);
  const seq = ['3', '2', '1', 'GO!'];
  let k = 0;
  const next = () => {
    if (S.screen !== 'play') { box.remove(); return; }
    if (k >= seq.length) { box.remove(); done(); return; }
    box.innerHTML = `<b class="${k === 3 ? 'go' : ''}">${seq[k]}</b>`;
    Sound.play('count', k === 3 ? 0 : 3 - k);
    k++;
    setTimeout(next, k === 4 ? 520 : 680);
  };
  next();
}
function beginSentence() {
  const R = S.run;
  if (!R || S.screen !== 'play') return;
  R.done = false; R.t0 = performance.now(); R.lastSec = null;
  const inp = document.getElementById('ans');
  if (inp && !touch()) inp.focus();
  clearInterval(rateTick);
  rateTick = setInterval(() => setSpeed(Sound.bpm / 92), 400);
  tick();
}
function placeSpark(frac) {
  const ring = document.getElementById('ring'), sp = document.getElementById('spark');
  if (!ring || !sp || !ring.getTotalLength) return;
  try {
    const L = ring.getTotalLength(), p = ring.getPointAtLength(L * (1 - frac));
    sp.setAttribute('cx', p.x.toFixed(1)); sp.setAttribute('cy', p.y.toFixed(1));
    sp.style.opacity = frac > 0.002 ? '1' : '0';
  } catch (e) { /* older browsers: no spark */ }
}
function tick() {
  const R = S.run;
  if (!R || S.screen !== 'play' || R.done) return;
  const left = Math.max(0, R.limit - (performance.now() - R.t0) / 1000);
  const frac = left / R.limit;
  const ring = document.getElementById('ring'), secs = document.getElementById('secs'), fuse = document.getElementById('fuse');
  if (ring) {
    // the burnt part of the fuse is the dash offset; the spark sits at the burning tip
    ring.style.strokeDashoffset = String(-100 * (1 - frac));
    ring.style.strokeDasharray = `${100 * frac} 100`;
    fuse.style.color = frac > 0.5 ? 'var(--n-turq)' : frac > 0.25 ? 'var(--n-saff)' : 'var(--n-pom)';
    placeSpark(frac);
    secs.textContent = Math.ceil(left);
    fuse.classList.toggle('late', frac <= 0.25);
  }
  Sound.setTension(1 - frac);
  document.body.style.setProperty('--danger', frac < 0.3 ? ((0.3 - frac) / 0.3 * 0.9).toFixed(2) : '0');
  const sec = Math.ceil(left);
  if (sec <= 5 && sec > 0 && sec !== R.lastSec) { R.lastSec = sec; Sound.play('tick'); }
  if (left <= 0) { submitAnswer(true); return; }
  timerRAF = requestAnimationFrame(tick);
}
function submitAnswer() {
  const R = S.run;
  if (!R || R.done) return;
  R.done = true;
  cancelAnimationFrame(timerRAF);
  Voice.abort(); Sound.duck(false); micUI(document.querySelector('.micw'), 'idle');
  const it = R.plan[R.idx];
  const inp = document.getElementById('ans');
  const text = inp ? inp.value : '';
  const secs = Math.min(R.limit, (performance.now() - R.t0) / 1000);
  const res = check(it, text, accMap()[it.id] || []);
  const counted = res.status === 'ok' || res.status === 'review';
  R.answers.push({ text, secs, status: res.status, issues: res.issues || [], fixes: res.fixes || [], note: res.note || '', counted });
  if (counted) { R.streak++; R.best = Math.max(R.best, R.streak); } else R.streak = 0;
  saveRun();
  Sound.setTension(0.1);
  document.body.style.setProperty('--danger', '0');
  if (S.cfg.feedback) showFeedback(it, R.answers[R.answers.length - 1]);
  else { Sound.play('lock'); nextSentence(); }
}
function issueLine(a) {
  const k = (a.issues || []).find(x => ISSUES[x] && x !== 'empty' && x !== 'spelling') || (a.issues || [])[0];
  return k && ISSUES[k] ? `<b>${esc(ISSUES[k].title)}.</b> ${esc(ISSUES[k].fix)}` : '';
}
function fixesLine(a) {
  return (a.fixes || []).map(([x, y]) => `<b>${esc(x)}</b> → <b>${esc(y)}</b>`).join(', ');
}
function showFeedback(it, a) {
  const R = S.run, fb = document.getElementById('fb');
  if (!fb) { nextSentence(); return; }
  const last = R.idx >= R.plan.length - 1;
  let cls, icon, title, body = '';
  if (a.status === 'ok' || a.status === 'review') {
    cls = 'ok'; icon = ICON.check;
    title = R.streak >= 3 ? `${R.streak} in a row!` : ['Correct!', 'Nice one!', 'Spot on!', 'Yes!'][Math.floor(Math.random() * 4)];
    body = `<div class="you">${esc(a.text.trim())}</div>${a.status === 'review' ? '<div class="why">Counted. Your teacher may double-check one word.</div>' : ''}`;
  } else if (a.status === 'spell') {
    cls = 'mid'; icon = ICON.pen; title = 'So close: spelling';
    body = `<div class="you">${esc(a.text.trim())}</div><div class="why">Check: ${fixesLine(a)}</div><div class="model">${esc(canon(it))}</div>`;
  } else if (a.status === 'empty') {
    cls = 'no'; icon = ICON.cross; title = 'Time’s up!';
    body = `<div class="model">${esc(canon(it))}</div>`;
  } else {
    cls = 'no'; icon = ICON.cross; title = 'Not quite';
    body = `<div class="you">${esc(a.text.trim())}</div><div class="model">${esc(canon(it))}</div><div class="why">${issueLine(a)}</div>`;
  }
  const wait = cls === 'ok' ? 1500 : 6500;
  fb.className = 'fb ' + cls;
  fb.innerHTML = `<div class="fb-card">
    <div class="stamp">${icon}</div>
    <h3>${title}</h3>${body}
    <div class="actions"><button class="btn big" data-act="next"><span>${last ? 'See results' : 'Next sentence'}</span></button></div>
    <div class="bar-auto"><i style="animation-duration:${wait}ms"></i></div>
    ${cls === 'ok' ? '<div class="burst" id="burst"></div>' : ''}
  </div>`;
  fb.hidden = false;
  if (cls === 'ok') { Sound.play(R.streak >= 3 ? 'streak' : 'good'); burst(); }
  else Sound.play('bad');
  // update the track and the score straight away
  const cps = document.querySelectorAll('.cp');
  if (cps[R.idx]) cps[R.idx].className = 'cp ' + (a.counted ? 'ok' : 'no');
  const hud = document.getElementById('hud'); if (hud) hud.innerHTML = hudHTML(R);
  if (!touch()) setTimeout(() => { const b = fb.querySelector('[data-act="next"]'); if (b) b.focus(); }, 60);
  clearTimeout(fbTimer);
  fbTimer = setTimeout(nextSentence, wait);
}
function burst() {
  const b = document.getElementById('burst');
  if (!b || reduced()) return;
  const cols = ['#2BC9BF', '#F6C453', '#F0607C', '#4A6EF0', '#EAF1F6'];
  let h = '';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2, d = 90 + Math.random() * 90;
    h += `<i style="background:${cols[i % 5]};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 40}px;animation-delay:${Math.random() * 80}ms"></i>`;
  }
  b.innerHTML = h;
}
function nextSentence() {
  clearTimeout(fbTimer);
  const R = S.run;
  if (!R || S.screen !== 'play' || R.moving) return;
  R.moving = true;
  const card = document.getElementById('card');
  const after = () => {
    R.moving = false;
    if (S.screen !== 'play' || S.run !== R) return;
    R.idx++;
    saveRun();
    if (R.idx >= R.plan.length) finishRun(); else renderPlay();
  };
  if (card && !reduced()) { card.classList.remove('card-in'); card.classList.add('card-out'); setTimeout(after, 300); }
  else after();
}

/* ---------- scoring + saving ---------- */
function accMap() { return store.get('trp_acc', {}); }
function finishRun() {
  const R = S.run, acc = accMap();
  const results = R.plan.map((it, k) => {
    const a = R.answers[k] || { text: '', secs: 0 };
    const res = check(it, a.text, acc[it.id] || []);
    return { id: it.id, level: it.level, type: it.type, uz: it.uz, model: canon(it), text: a.text, secs: a.secs,
      res: { status: res.status, issues: res.issues || [], fixes: res.fixes || [], note: res.note || '' },
      counted: res.status === 'ok' || res.status === 'review' };
  });
  const entry = { id: R.id, name: R.name, at: R.at, end: Date.now(), results, time: results.reduce((s, r) => s + r.secs, 0), best: R.best || 0 };
  S.last = entry; S.from = 'race';
  saveEntry(entry);
  saveHist(entry);
  store.del('trp_run');
  S.run = null;
  Sound.stopMusic(); Sound.play('finish');
  go('results');
}
const scoreOf = e => e.results.filter(r => r.counted).length;
function saveEntry(e) {
  const lb = store.get('trp_lb', []).filter(x => x.id !== e.id);
  lb.push({ id: e.id, name: e.name, score: scoreOf(e), time: Math.round(e.time), by: summary(e), weak: topWeak(e, 3), at: e.at });
  store.set('trp_lb', lb);
}
function saveHist(e) {
  let h = store.get('trp_hist', []).filter(x => x.id !== e.id);
  h.push(e);
  // localStorage holds about 5 MB; keep the newest races if it ever fills up
  while (h.length && !store.set('trp_hist', h)) h = h.slice(Math.ceil(h.length * 0.1));
}
function summary(e) {
  const o = { p: [0, 0], n: [0, 0], i: [0, 0] };
  e.results.forEach(r => { o[r.type][1]++; if (r.counted) o[r.type][0]++; });
  return o;
}
function weakList(e) {
  const c = {};
  e.results.forEach(r => {
    if (r.counted) return;
    (r.res.issues || []).forEach(k => { if (ISSUES[k]) c[k] = (c[k] || 0) + 1; });
  });
  return Object.entries(c).sort((a, b) => b[1] - a[1] || ISSUE_ORDER.indexOf(a[0]) - ISSUE_ORDER.indexOf(b[0]));
}
const topWeak = (e, n) => weakList(e).slice(0, n).map(([k]) => ISSUES[k].title);

/* results */
function renderResults() {
  const e = S.last;
  if (!e) { go('home'); return; }
  const sc = scoreOf(e), W = weakList(e).slice(0, 4), by = summary(e);
  const verdict = sc === 10 ? 'Flawless.' : sc >= 8 ? 'Strong race.' : sc >= 6 ? 'Solid, with a few slips.' : sc >= 4 ? 'Getting there.' : 'Good practice round.';
  const when = new Date(e.at);
  const fresh = S.from === 'race';
  $app.innerHTML = `
  <div class="head"><h2>${esc(e.name)}</h2><p class="sub">${when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}${e.best >= 3 ? ` · best streak ${e.best}` : ''}</p></div>
  <div class="tile ${sc >= 7 ? 'turq' : sc >= 4 ? 'saff' : 'pom'}"><div class="in score">
    <div class="num"><span id="scn">${fresh && !reduced() ? 0 : sc}</span><small>/10</small></div>
    <div><h3 style="font-size:2rem">${verdict}</h3>
      <div class="bytype"><span>Positive ${by.p[0]}/${by.p[1]}</span><span>Negative ${by.n[0]}/${by.n[1]}</span><span>Questions ${by.i[0]}/${by.i[1]}</span></div>
      <p style="margin-top:10px">Total time ${Math.round(e.time)} seconds.</p></div>
  </div></div>
  <div class="split">
    <div>
      <h3 style="font-size:1.6rem;margin-bottom:12px">Weak spots</h3>
      ${W.length ? `<ul class="weak">${W.map(([k, n]) => `<li><b>${esc(ISSUES[k].title)}</b> <small>${n} sentence${n > 1 ? 's' : ''}</small>
        <small>${esc(ISSUES[k].fix)}</small>${ISSUES[k].ex ? `<em>${esc(ISSUES[k].ex)}</em>` : ''}</li>`).join('')}</ul>`
        : `<div class="tile"><div class="in">No grammar slips found. Keep the pace up on the hard level.</div></div>`}
      <div class="actions">
        ${S.from === 'hist' ? '<button class="btn big" data-act="go-hist"><span>Back to history</span></button>' : '<button class="btn big" data-act="go-lobby"><span>Next student</span></button>'}
        <button class="btn alt" data-act="go-lb"><span>Leaderboard</span></button></div>
    </div>
    <div>
      <h3 style="font-size:1.6rem;margin-bottom:12px">Sentence by sentence</h3>
      <div class="review">${e.results.map((r, k) => reviewRow(r, k)).join('')}</div>
    </div>
  </div>`;
  if (fresh) {
    countUp(sc);
    if (sc >= 6) confetti(sc === 10 ? 260 : 150);
    S.from = 'seen';
  }
}
function countUp(sc) {
  const el = document.getElementById('scn');
  if (!el || reduced()) return;
  let n = 0;
  const step = () => { if (!document.body.contains(el)) return; el.textContent = n; if (n < sc) { n++; setTimeout(step, 90); } };
  setTimeout(step, 250);
}
function reviewRow(r, k) {
  const st = r.res.status;
  const cls = r.counted ? (st === 'ok' ? 'ok' : 'rev') : 'no';
  const label = st === 'ok' ? (r.res.note === 'teacher' ? 'Correct (teacher accepted before)' : 'Correct')
    : st === 'empty' ? (r.counted ? 'Accepted by teacher' : 'No answer')
    : st === 'review' ? (r.counted ? 'Probably fine. Teacher check' : 'Marked wrong by teacher')
    : st === 'spell' ? (r.counted ? 'Accepted by teacher' : 'Spelling slip')
    : (r.counted ? 'Accepted by teacher' : 'Not correct');
  let issues = '';
  if (st === 'spell') issues = 'Spelling: ' + (r.res.fixes || []).map(([x, y]) => `${x} → ${y}`).join(', ');
  else if (st !== 'ok') issues = (r.res.issues || []).filter(x => x !== 'empty' && ISSUES[x]).map(x => ISSUES[x].title).join(', ');
  const can = ITEM_BY_ID[r.id] && st !== 'ok';
  const btn = can ? `<button class="mini" data-act="toggle" data-k="${k}">${r.counted ? 'Mark wrong' : 'Accept this answer'}</button>` : '';
  return `<div class="rv ${cls}" style="animation-delay:${k * 45}ms">
    <div class="u">${k + 1}. ${esc(r.uz)}</div>
    <div class="y">You: ${String(r.text || '').trim() ? esc(r.text) : '<i>no answer</i>'}</div>
    ${st === 'ok' ? '' : `<div class="m">Model: ${esc(r.model)}</div>`}
    ${issues ? `<div class="m">${esc(issues)}</div>` : ''}
    <div class="row"><span class="status">${label}</span>${btn}</div></div>`;
}
function toggleAccept(k) {
  const e = S.last, r = e.results[k], acc = accMap();
  const key = answerKey(r.text), list = acc[r.id] || [];
  r.counted = !r.counted;
  if (r.counted && key && !list.includes(key)) list.push(key);
  if (!r.counted) { const j = list.indexOf(key); if (j >= 0) list.splice(j, 1); }
  acc[r.id] = list; store.set('trp_acc', acc);
  saveEntry(e); saveHist(e); renderResults();
}

/* leaderboard */
function renderLB() {
  const lb = store.get('trp_lb', []).slice().sort((a, b) => b.score - a.score || a.time - b.time);
  const col = ['saff', 'turq', 'cobalt'];
  $app.innerHTML = `
  <div class="head"><h2>Leaderboard</h2><p class="sub">Ranked by score. Faster total time breaks ties. Tap a name to see the race.</p></div>
  ${lb.length ? `<div class="board-list">${lb.map((p, k) => `
    <button class="tile ${col[k] || ''}" data-act="hist-open" data-id="${esc(p.id)}" style="animation-delay:${Math.min(k, 12) * 50}ms"><div class="in lbrow">
      <div class="rk">${k + 1}</div>
      <div><div class="nm">${esc(p.name)}</div>${p.weak && p.weak.length ? `<small>Work on: ${esc(p.weak.join(', '))}</small>` : ''}</div>
      <div class="tm">${p.time}s</div><div class="sc">${p.score}/10</div></div></button>`).join('')}</div>`
    : `<div class="tile"><div class="in empty"><h3 style="font-size:1.6rem">No scores yet</h3><p class="sub" style="margin:8px auto 18px">Run the first student through the Arena.</p><button class="btn big" data-act="go-lobby"><span>Open the Arena</span></button></div></div>`}
  <div class="actions"><button class="btn" data-act="go-lobby"><span>Next student</span></button>
    ${lb.length ? '<button class="btn alt" data-act="clear"><span>Start a new class</span></button>' : ''}</div>`;
}

/* history */
function renderHist() {
  const h = store.get('trp_hist', []).slice().sort((a, b) => b.at - a.at);
  const R = savedRun();
  const days = [];
  h.forEach(e => {
    const d = new Date(e.at).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let g = days.find(x => x.d === d);
    if (!g) { g = { d, list: [] }; days.push(g); }
    g.list.push(e);
  });
  $app.innerHTML = `
  <div class="head"><h2>History</h2><p class="sub">Every finished race is saved on this device, with every answer. ${h.length ? h.length + ' race' + (h.length === 1 ? '' : 's') + ' so far.' : ''}</p></div>
  ${R ? `<div class="tile saff resume"><div class="in"><div><b>${esc(R.name)}</b> has an unfinished race (sentence ${Math.min(R.idx + 1, 10)} of 10).</div>
    <div class="actions" style="margin:0"><button class="btn" data-act="resume"><span>Continue</span></button></div></div></div>` : ''}
  ${h.length ? `<div class="actions" style="margin:0 0 6px">
      <button class="btn" data-act="hist-csv"><span>Download all (Excel / CSV)</span></button>
      <button class="btn alt" data-act="hist-clear"><span>Clear history</span></button></div>
    ${days.map(g => `<div class="hday">${esc(g.d)}</div><div class="hlist">${g.list.map(e => {
      const t = new Date(e.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `<button class="hrow" data-act="hist-open" data-id="${esc(e.id)}"><span class="t">${t}</span><span class="n">${esc(e.name)}</span>
        <span class="s">${scoreOf(e)}/10</span><span class="d">${Math.round(e.time)}s</span><span class="go">Open</span></button>`;
    }).join('')}</div>`).join('')}`
    : `<div class="tile"><div class="in empty"><h3 style="font-size:1.6rem">Nothing saved yet</h3><p class="sub" style="margin:8px auto 18px">Finished races appear here automatically.</p><button class="btn big" data-act="go-lobby"><span>Open the Arena</span></button></div></div>`}`;
}
function openHist(id) {
  const e = store.get('trp_hist', []).find(x => x.id === id);
  if (!e) { alert('This race was played before history was saved, so only the score is kept.'); return; }
  S.last = e; S.from = 'hist';
  go('results');
}
function csvCell(v) { const s = String(v == null ? '' : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function exportCSV() {
  const h = store.get('trp_hist', []).slice().sort((a, b) => a.at - b.at);
  const rows = [['Date', 'Time', 'Student', 'Race score', 'Race seconds', 'No.', 'Level', 'Type', 'Uzbek', 'Answer', 'Result', 'Model answer', 'Seconds']];
  const RES = { ok: 'Correct', review: 'Correct (check)', spell: 'Spelling slip', wrong: 'Not correct', empty: 'No answer' };
  h.forEach(e => {
    const d = new Date(e.at), sc = scoreOf(e);
    e.results.forEach((r, k) => rows.push([d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), e.name, sc,
      Math.round(e.time), k + 1, LEVELS[r.level] ? LEVELS[r.level].name : r.level, KIND[r.type], r.uz, r.text,
      (r.counted && r.res.status !== 'ok' && r.res.status !== 'review') ? 'Accepted by teacher' : (!r.counted && (r.res.status === 'ok' || r.res.status === 'review') ? 'Marked wrong by teacher' : RES[r.res.status] || r.res.status),
      r.model, Math.round(r.secs)]));
  });
  const csv = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'tarjima-poyga-history-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* confetti */
function confetti(n) {
  if (reduced()) return;
  const cv = document.getElementById('confetti');
  const cx = cv.getContext('2d');
  const W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio;
  cv.hidden = false;
  const cols = ['#2BC9BF', '#F6C453', '#F0607C', '#4A6EF0', '#0E1A3F'];
  const P = Array.from({ length: n }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 26 * devicePixelRatio,
    vy: (-Math.random() * 22 - 8) * devicePixelRatio, s: (6 + Math.random() * 8) * devicePixelRatio, r: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.4, c: cols[Math.floor(Math.random() * cols.length)]
  }));
  const t0 = performance.now();
  const frame = t => {
    cx.clearRect(0, 0, W, H);
    P.forEach(p => {
      p.vy += 0.6 * devicePixelRatio; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); cx.restore();
    });
    if (t - t0 < 3200) requestAnimationFrame(frame); else { cx.clearRect(0, 0, W, H); cv.hidden = true; }
  };
  requestAnimationFrame(frame);
}

/* ---------- voice ---------- */
function micUI(w, state) {
  if (!w) return;
  w.classList.toggle('on', state === 'listening');
  w.classList.toggle('wait', state === 'starting');
  const b = w.querySelector('.mic');
  if (b) b.setAttribute('aria-label', state === 'idle' ? 'Speak the answer' : 'Stop listening');
  const inp = b && document.getElementById(b.dataset.for);
  if (inp) inp.classList.toggle('listening', state === 'listening');
}
function vmsg(id, text, cls) {
  const m = document.getElementById(id);
  if (!m) return;
  m.className = 'vmsg ' + (cls || '');
  m.textContent = text;
}
function toggleMic(btn) {
  const w = btn.closest('.micw'), inp = document.getElementById(btn.dataset.for), msg = btn.dataset.msg;
  if (!inp) return;
  const gotIt = S.screen === 'play' ? 'Got it. Fix a word if needed, then lock in.' : 'Got it. Fix a word if needed, then press Check.';
  if (S.screen === 'play' && (!S.run || S.run.done)) return;
  if (Voice.busy) { Voice.stop(); return; }
  Sound.init();
  Voice.start({
    onState(s) {
      if (!document.body.contains(btn)) return;
      micUI(w, s);
      if (s === 'starting') vmsg(msg, 'Starting the microphone…', 'live');
      if (s === 'listening') { Sound.duck(true); Sound.play('mic'); vmsg(msg, 'Listening… say the whole sentence in English.', 'live'); }
      if (s === 'idle') {
        Sound.duck(false);
        const m = document.getElementById(msg);
        if (m && m.classList.contains('live')) vmsg(msg, inp.value.trim() ? gotIt : '', inp.value.trim() ? 'ok' : '');
      }
    },
    onText(t, fin) {
      if (!document.body.contains(inp)) return;
      inp.value = t;
      if (fin) vmsg(msg, gotIt, 'ok');
    },
    onError(m) { vmsg(msg, m, 'err'); }
  });
}

/* ---------- events ---------- */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act;
  if (a === 'home') go('home');
  else if (a === 'go-board') { if (!S.board) S.board = buildBoard(S.level); go('board'); }
  else if (a === 'go-lobby') go('lobby');
  else if (a === 'go-lb') go('lb');
  else if (a === 'go-hist') go('hist');
  else if (a === 'theme') {
    const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme:dark)').matches);
    const t = dark ? 'light' : 'dark'; setTheme(t); store.set('trp_theme', t);
  }
  else if (a === 'sound') {
    const on = !(S.cfg.music || S.cfg.sfx);
    S.cfg.music = on; S.cfg.sfx = on; saveCfg();
    Sound.init(); Sound.set('music', on); Sound.set('sfx', on);
    if (on && S.screen === 'play' && S.run && S.run.go) Sound.startMusic();
    paintSound();
    document.querySelectorAll('[data-sw="music"],[data-sw="sfx"]').forEach(x => { x.checked = on; });
  }
  else if (a === 'mic') toggleMic(b);
  else if (a === 'next') nextSentence();
  else if (a === 'resume') resumeRun();
  else if (a === 'discard') { if (confirm('Discard the unfinished race?')) { store.del('trp_run'); renderLobby(); } }
  else if (a === 'board-level') { S.level = b.dataset.level; S.board = buildBoard(S.level); renderBoard(); }
  else if (a === 'board-jump') boardGo(+b.dataset.i);
  else if (a === 'board-prev') boardGo(S.board.i - 1);
  else if (a === 'board-next') boardGo(S.board.i + 1);
  else if (a === 'board-reveal') { S.board.shown = !S.board.shown; renderBoard(); }
  else if (a === 'board-new') { S.board = buildBoard(S.board.level); renderBoard(); }
  else if (a === 'toggle') toggleAccept(+b.dataset.k);
  else if (a === 'hist-open') openHist(b.dataset.id);
  else if (a === 'hist-csv') exportCSV();
  else if (a === 'hist-clear') {
    if (confirm('Delete every saved race from this device? Download the CSV first if you want to keep it.')) { store.del('trp_hist'); renderHist(); }
  }
  else if (a === 'clear') {
    if (confirm('Clear the leaderboard and start a new class? Sentences will be shared out afresh. History is kept.')) {
      store.set('trp_lb', []); store.set('trp_used', []); renderLB();
    }
  }
});
document.addEventListener('submit', ev => {
  const f = ev.target.closest('[data-form]');
  if (!f) return;
  ev.preventDefault();
  const kind = f.dataset.form;
  if (kind === 'start') {
    const name = f.nm.value.trim();
    if (name) startRun(name);
  } else if (kind === 'answer') submitAnswer();
  else if (kind === 'try') {
    Voice.abort();
    const B = S.board, it = B.items[B.i], val = f.a.value;
    const r = check(it, val, accMap()[it.id] || []);
    if (r.status === 'ok') B.tryRes = { cls: 'ok', msg: 'Accepted. That is a correct translation.' };
    else if (r.status === 'empty') B.tryRes = { cls: 'no', msg: 'Type or say an answer first.' };
    else if (r.status === 'review') B.tryRes = { cls: 'rev', msg: 'No grammar slips found, but it differs from the model. It counts; the teacher can check.' };
    else if (r.status === 'spell') B.tryRes = { cls: 'rev', msg: 'Right grammar, but check the spelling: ' + (r.fixes || []).map(([x, y]) => esc(x) + ' → ' + esc(y)).join(', ') + '.' };
    else B.tryRes = { cls: 'no', msg: 'Not quite: ' + esc(r.issues.filter(x => ISSUES[x]).map(x => ISSUES[x].title).join(', ')) + '.' };
    renderBoard();
    const inp = document.getElementById('tryin'); inp.value = val; if (!touch()) inp.focus();
  }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset && t.dataset.cfg) {
    const c = t.dataset.cfg;
    S.cfg[c] = Math.max(8, Math.min(120, +t.value || S.cfg[c]));
    t.value = S.cfg[c]; saveCfg();
  } else if (t.dataset && t.dataset.sw) {
    const k = t.dataset.sw;
    S.cfg[k] = t.checked; saveCfg();
    if (k === 'music' || k === 'sfx') { Sound.set(k, t.checked); paintSound(); if (t.checked) { Sound.init(); Sound.play('mic'); } }
  }
});
document.addEventListener('keydown', ev => {
  if (S.screen !== 'board' || /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
  if (ev.key === 'ArrowRight') boardGo(S.board.i + 1);
  else if (ev.key === 'ArrowLeft') boardGo(S.board.i - 1);
  else if (ev.key === ' ' && ev.target.tagName !== 'BUTTON') { ev.preventDefault(); S.board.shown = !S.board.shown; renderBoard(); }
});
// leaving the page mid-race keeps the answers so far; the race can be continued from the Arena
window.addEventListener('pagehide', () => { if (S.run) saveRun(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) Voice.abort(); });

go('home');
