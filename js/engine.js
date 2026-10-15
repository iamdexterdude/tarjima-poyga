/* ======================================================================
   ENGINE: expands answer patterns, checks answers, diagnoses grammar slips.

   How an answer is checked
   1. Both the student's answer and every accepted pattern are normalised:
      lower case, contractions opened (doesn't -> does not), punctuation and
      o'clock / a.m. removed, number words turned into digits.
   2. Synonyms are folded into one word (store -> shop, mum -> mother,
      movie -> film, color -> colour ...).
   3. Articles (a, an, the) are removed: the class has not studied them yet,
      so a missing or extra article never makes an answer wrong.
   4. An exact match scores. So does a match that only differs in singular /
      plural of a noun after the verb (reads a book = reads books).
   5. Spelling slips are found and shown, but they do not score: spelling and
      grammar both have to be right.
   ====================================================================== */

const BE = new Set(['am', 'is', 'are']);
const DOS = new Set(['do', 'does']);
const HAVES = new Set(['have', 'has']);
const ARTS = new Set(['a', 'an', 'the']);
const PREPS = new Set(['at', 'on', 'in', 'to', 'from', 'with', 'of', 'for', 'by', 'after', 'before', 'into', 'as']);
const PRON = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they']);
const FREQ = new Set(['always', 'usually', 'often', 'sometimes', 'never']);
const WH = new Set(['what', 'where', 'when', 'why', 'how', 'who', 'which']);
const DET = new Set(['your', 'my', 'our', 'his', 'her', 'their', 'this', 'these']);
const SING = new Set(['he', 'she', 'it', 'ali', 'lola', 'mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather',
  'teacher', 'friend', 'neighbour', 'son', 'daughter', 'husband', 'wife', 'doctor', 'nurse', 'child', 'family', 'man', 'woman']);
const PLUR = new Set(['i', 'you', 'we', 'they', 'parents', 'children', 'friends', 'students', 'neighbours', 'teachers',
  'people', 'grandparents', 'brothers', 'sisters', 'men', 'women']);
const VERBS = new Set(['live', 'work', 'study', 'learn', 'go', 'play', 'read', 'watch', 'like', 'love', 'teach', 'have', 'want',
  'need', 'help', 'drive', 'walk', 'cycle', 'ride', 'get', 'check', 'start', 'finish', 'wear', 'buy', 'make', 'enjoy', 'cook',
  'listen', 'write', 'call', 'phone', 'send', 'use', 'arrive', 'know', 'visit', 'come', 'take', 'do', 'drink', 'eat', 'travel',
  'sleep', 'spell', 'wake', 'give']);
const NOUNS = new Set(['book', 'apple', 'newspaper', 'comic', 'film', 'email', 'story', 'shoe', 'trainer', 'shirt', 't-shirt',
  'dress', 'hat', 'jacket', 'jumper', 'skirt', 'top', 'car', 'bicycle', 'phone', 'computer', 'laptop', 'tablet', 'pen', 'key',
  'bag', 'umbrella', 'wallet', 'notepad', 'dog', 'cat', 'pet', 'friend', 'neighbour', 'coffee', 'tea', 'sport', 'game', 'flat',
  'house', 'shop', 'office', 'hotel', 'restaurant', 'hospital', 'bank', 'school', 'university', 'museum', 'station', 'airport',
  'beach', 'cinema', 'village', 'city', 'country', 'colour', 'ticket', 'message', 'morning', 'evening', 'meal', 'lesson', 'class',
  'clothe', 'news', 'charity', 'bookshop', 'taxi', 'bus', 'train', 'motorbike', 'ferry', 'guitar', 'family']);
const IRREG_PAST = ['went', 'ate', 'drank', 'saw', 'got', 'had', 'did', 'gave', 'took', 'came', 'spoke', 'ran', 'drove', 'wrote',
  'said', 'knew', 'taught', 'bought', 'made', 'wore', 'woke', 'began', 'was', 'were', 'been', 'will', 'going', 'rode', 'slept'];

function sForm(v) {
  if (v === 'have') return 'has';
  if (v === 'do') return 'does';
  if (v === 'go') return 'goes';
  if (/(s|sh|ch|x|z|o)$/.test(v)) return v + 'es';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
  return v + 's';
}
const VERB_S = new Map();
VERBS.forEach(v => VERB_S.set(sForm(v), v));
const PAST = new Set(IRREG_PAST);
VERBS.forEach(v => PAST.add(/e$/.test(v) ? v + 'd' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ied' : v + 'ed'));

const PROPER = {
  i: 'I', ali: 'Ali', lola: 'Lola', english: 'English', tashkent: 'Tashkent', samarkand: 'Samarkand', bukhara: 'Bukhara',
  russia: 'Russia', turkey: 'Turkey', tv: 'TV', 't-shirt': 'T-shirt', monday: 'Monday', mondays: 'Mondays',
  tuesday: 'Tuesday', tuesdays: 'Tuesdays', wednesday: 'Wednesday', wednesdays: 'Wednesdays', thursday: 'Thursday',
  thursdays: 'Thursdays', friday: 'Friday', fridays: 'Fridays', saturday: 'Saturday', saturdays: 'Saturdays',
  sunday: 'Sunday', sundays: 'Sundays'
};

/* ---------- pattern expansion ----------
   (a|b|c) = one of these      [a|b] = optional, one of these
   The first full option is the model answer. */
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
        for (;;) {
          alts.push(...seq());
          if (spec[pos] === '|') { pos++; continue; }
          break;
        }
        pos++;
        if (c === '[') alts.push('');
        const next = [];
        for (const o of out) for (const a of alts) next.push(o + a);
        out = next;
      } else {
        let j = pos;
        while (j < spec.length && !'()[]|'.includes(spec[j])) j++;
        const lit = spec.slice(pos, j);
        pos = j;
        out = out.map(o => o + lit);
      }
    }
    return out;
  }
  const seen = new Set();
  const res = [];
  seq().forEach(s => {
    const t = s.replace(/\s+/g, ' ').trim();
    if (t && !seen.has(t)) { seen.add(t); res.push(t); }
  });
  return res;
}

/* ---------- normalising ---------- */
const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50 };
const NUMRE = new RegExp('\\b(' + Object.keys(NUMW).join('|') + ')\\b', 'g');

function norm(s) {
  s = String(s || '').toLowerCase().replace(/[‘’ʼ`´]/g, "'");
  // contractions typed without the apostrophe
  s = s.replace(/\bdoesnt\b/g, "doesn't").replace(/\bdont\b/g, "don't").replace(/\bisnt\b/g, "isn't")
    .replace(/\barent\b/g, "aren't").replace(/\bhavent\b/g, "haven't").replace(/\bhasnt\b/g, "hasn't")
    .replace(/\bim\b/g, "i'm");
  s = s.replace(/\b(he|she|it)'s got\b/g, '$1 has got');
  s = s.replace(/\bdon't\b/g, 'do not').replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bisn't\b/g, 'is not').replace(/\baren't\b/g, 'are not')
    .replace(/\bhaven't\b/g, 'have not').replace(/\bhasn't\b/g, 'has not')
    .replace(/\bi'm\b/g, 'i am').replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b(he|she|it|that|there|here|what|where|who|how|when|why)'s\b/g, '$1 is')
    .replace(/\b(i|you|we|they)'ve\b/g, '$1 have');
  // clock times 7:30 / 7.30 -> 7 30, 7:00 -> 7
  s = s.replace(/\b(\d{1,2})[:.](\d{2})\b/g, (m, h, mm) => (mm === '00' ? h : h + ' ' + mm));
  s = s.replace(/[.,!?;:"“”()]/g, ' ');
  // number words -> digits
  s = s.replace(/\b(twenty|thirty|forty|fifty)[- ](one|two|three|four|five|six|seven|eight|nine)\b/g, (m, a, b) => String(NUMW[a] + NUMW[b]));
  s = s.replace(NUMRE, w => String(NUMW[w]));
  s = s.replace(/\bhalf past (\d+)\b/g, '$1 30');
  s = s.replace(/\b(\d+) ?o ?'? ?clock\b/g, '$1');
  s = s.replace(/\b(\d+) ?(a ?m|p ?m)\b/g, '$1');
  s = s.replace(/\b(\d+)(am|pm)\b/g, '$1');
  return s.replace(/\s+/g, ' ').trim();
}

/* ---------- synonyms ---------- */
const PHRASES = [
  [/\bto the (movies|movie theat(?:er|re)s?)\b/g, 'to the cinema'],
  [/\bmovie theat(?:er|re)s?\b/g, 'cinema'],
  [/\b(?:cell ?phone|mobile phone|smartphone)(s?)\b/g, 'phone$1'],
  [/\bmobile\b/g, 'phone'],
  [/\b(?:at|on) (?:the )?weekends?\b/g, 'at weekend'],
  [/\bon saturdays? and sundays?\b/g, 'at weekend'],
  [/\beveryday\b/g, 'every day'],
  [/\b(?:each day|daily)\b/g, 'every day'],
  [/\beach (morning|evening|day|week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g, 'every $1'],
  [/\b(?:big|elder) (brothers?|sisters?)\b/g, 'older $1'],
  [/\b(?:little|small|baby) (brothers?|sisters?)\b/g, 'younger $1'],
  [/\b(?:t shirt|tee shirt|tshirt|tee-shirt)(s?)\b/g, 't-shirt$1'],
  [/\be-mail(s?)\b/g, 'email$1'],
  [/\bsport clothes\b/g, 'sports clothes'],
  [/\b(?:very much|so much)\b/g, 'a lot'],
  [/\bgo to the movies\b/g, 'go to the cinema']
];
const SYN = {
  store: 'shop', stores: 'shops', movie: 'film', movies: 'films', mom: 'mother', mum: 'mother', mommy: 'mother',
  mummy: 'mother', mama: 'mother', dad: 'father', daddy: 'father', papa: 'father', grandma: 'grandmother',
  granny: 'grandmother', grandpa: 'grandfather', granddad: 'grandfather', grandad: 'grandfather', kids: 'children',
  kid: 'child', soccer: 'football', television: 'tv', telly: 'tv', begin: 'start', begins: 'starts', apartment: 'flat',
  apartments: 'flats', pants: 'trousers', sweater: 'jumper', sweaters: 'jumpers', pullover: 'jumper', pullovers: 'jumpers',
  sneakers: 'trainers', vacation: 'holiday', cab: 'taxi', bike: 'bicycle', bikes: 'bicycles', motorcycle: 'motorbike',
  motorcycles: 'motorbikes', center: 'centre', theater: 'theatre', color: 'colour', colors: 'colours', favorite: 'favourite',
  gray: 'grey', neighbor: 'neighbour', neighbors: 'neighbours', waitress: 'waiter', okay: 'ok', supper: 'dinner',
  uni: 'university', elder: 'older', large: 'big', telephone: 'phone', telephones: 'phones', emails: 'emails',
  toshkent: 'tashkent', samarqand: 'samarkand', buxoro: 'bukhara', bokhara: 'bukhara', tv: 'tv'
};

function canonTokens(n) {
  let s = n;
  PHRASES.forEach(([re, to]) => { s = s.replace(re, to); });
  return s.split(' ').filter(Boolean).map(t => SYN[t] || t).filter(t => !ARTS.has(t));
}

function expansions(item) {
  if (item._E) return item._E;
  const list = [];
  const set = new Set();
  expandPattern(item.pat).forEach(raw => {
    const toks = canonTokens(norm(raw));
    const key = toks.join(' ');
    if (!set.has(key)) { set.add(key); list.push({ raw, norm: key, toks }); }
  });
  item._E = { list, set };
  return item._E;
}

/* ---------- display helpers ---------- */
function pretty(raw, type) {
  let s = raw.replace(/\bdoes not\b/gi, "doesn't").replace(/\bdo not\b/gi, "don't")
    .replace(/\bis not\b/gi, "isn't").replace(/\bare not\b/gi, "aren't")
    .replace(/\bhave not\b/gi, "haven't").replace(/\bhas not\b/gi, "hasn't");
  const toks = s.split(' ').map(w => {
    const l = w.toLowerCase();
    return PROPER[l] || l;
  });
  toks[0] = toks[0].charAt(0).toUpperCase() + toks[0].slice(1);
  return toks.join(' ') + (type === 'i' ? '?' : '.');
}
function canon(item) { return pretty(expansions(item).list[0].raw, item.type); }

function alternatives(item, k) {
  const L = expansions(item).list;
  if (L.length < 2) return [];
  const chosen = [L[0]];
  const out = [];
  for (let n = 0; n < k; n++) {
    let best = null, bd = -1;
    for (let i = 1; i < L.length; i++) {
      if (chosen.includes(L[i])) continue;
      let md = 1e9;
      chosen.forEach(c => { md = Math.min(md, align(L[i].toks, c.toks).d); });
      if (md > bd) { bd = md; best = L[i]; }
    }
    if (!best || bd < 1) break;
    chosen.push(best);
    out.push(pretty(best.raw, item.type));
  }
  return out;
}

/* ---------- distance helpers ---------- */
function ed(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
function isSV(a, b) {
  if (a === b || Math.min(a.length, b.length) < 2) return false;
  return a === sForm(b) || b === sForm(a);
}
function tcost(a, b) {
  if (a === b) return 0;
  if (isSV(a, b)) return 0.45;
  if ((BE.has(a) && BE.has(b)) || (DOS.has(a) && DOS.has(b)) || (HAVES.has(a) && HAVES.has(b))) return 0.45;
  if (a.length > 3 && b.length > 3 && ed(a, b) <= 2) return 0.6;
  return 1;
}
function align(a, b) {
  const n = a.length, m = b.length;
  const D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const P = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(''));
  for (let i = 1; i <= n; i++) { D[i][0] = i; P[i][0] = 'e'; }
  for (let j = 1; j <= m; j++) { D[0][j] = j; P[0][j] = 'm'; }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      let best = D[i - 1][j - 1] + tcost(a[i - 1], b[j - 1]), p = 's';
      if (D[i - 1][j] + 1 < best) { best = D[i - 1][j] + 1; p = 'e'; }
      if (D[i][j - 1] + 1 < best) { best = D[i][j - 1] + 1; p = 'm'; }
      D[i][j] = best; P[i][j] = p;
    }
  }
  const ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const p = P[i][j];
    if (p === 's') { if (a[i - 1] !== b[j - 1]) ops.push({ t: 'sub', a: a[i - 1], b: b[j - 1], i: i - 1, j: j - 1 }); i--; j--; }
    else if (p === 'e') { ops.push({ t: 'ext', a: a[i - 1], i: i - 1 }); i--; }
    else { ops.push({ t: 'mis', b: b[j - 1], j: j - 1 }); j--; }
  }
  return { d: D[n][m], ops: ops.reverse() };
}

/* ---------- singular / plural nouns after the verb ---------- */
function mainVerbIdx(t) {
  for (let i = 0; i < t.length; i++) {
    const w = t[i];
    if (DOS.has(w) || w === 'not' || PRON.has(w)) continue;
    if (VERBS.has(w) || VERB_S.has(w) || HAVES.has(w)) return i;
  }
  return -1;
}
function isNounNum(a, b) {
  if (!isSV(a, b)) return false;
  const base = a.length < b.length ? a : b;
  return NOUNS.has(base) || NOUNS.has(base.replace(/s$/, ''));
}
function numberLenient(st, E) {
  for (const v of E.list) {
    if (v.toks.length !== st.length) continue;
    const mv = mainVerbIdx(v.toks);
    if (mv < 0) continue;
    let ok = true, diff = 0;
    for (let i = 0; i < st.length; i++) {
      const a = st[i], b = v.toks[i];
      if (a === b) continue;
      if (i > mv && isNounNum(a, b) && !/^\d+$/.test(v.toks[i - 1] || '')) { diff++; continue; }
      ok = false; break;
    }
    if (ok && diff) return true;
  }
  return false;
}

/* ---------- vocabulary (for spelling slips) ---------- */
let _vocab = null, _vocabArr = null;
function VOCAB() {
  if (_vocab) return _vocab;
  _vocab = new Set(['do', 'does', 'not', 'is', 'are', 'am', 'have', 'has', 'got']);
  ITEMS.forEach(it => expansions(it).list.forEach(v => v.toks.forEach(t => {
    _vocab.add(t);
    if (t.length > 2) {
      _vocab.add(sForm(t));
      if (t.endsWith('ies')) _vocab.add(t.slice(0, -3) + 'y');
      else if (t.endsWith('es')) _vocab.add(t.slice(0, -2));
      if (t.endsWith('s')) _vocab.add(t.slice(0, -1));
    }
  })));
  Object.keys(SYN).forEach(k => _vocab.add(k));
  _vocabArr = [..._vocab];
  return _vocab;
}
// edit distance where swapping two neighbouring letters (wroks / works) is one slip
function osa(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i].concat(new Array(n).fill(0)));
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}
function repairTypos(toks) {
  const V = VOCAB();
  const fixes = [];
  const out = toks.map(t => {
    if (V.has(t) || /^\d+$/.test(t) || t.length < 4) return t;
    const lim = t.length >= 8 ? 2 : 1;
    let best = null, bd = 9;
    for (const w of _vocabArr) {
      if (Math.abs(w.length - t.length) > lim) continue;
      const d = osa(t, w);
      if (d <= lim && d < bd) { bd = d; best = w; }
    }
    if (best) { fixes.push([t, best]); return SYN[best] || best; }
    return t;
  });
  return { toks: out, fixes };
}

/* ---------- issue catalogue ---------- */
const ISSUES = {
  empty: { title: 'Blank or timed-out answers', fix: 'Type or say something even if you are not sure. Start with the subject and the verb, then add the rest.' },
  type_mismatch: { title: 'Positive, negative or question?', fix: 'Look at the Uzbek ending first: -ma- is a negative, -mi is a question, otherwise it is a positive sentence.', ex: 'Men choy ichmayman = I don’t drink tea.' },
  q_aux: { title: 'Making questions', fix: 'Start with Do or Does: Do you like tea? Does he like tea? With a question word: Where does he work?', ex: 'You like tea? → Do you like tea?' },
  q_order: { title: 'Question word order', fix: 'Order: (question word) + do/does + subject + base verb.', ex: 'Do like you tea? → Do you like tea?' },
  neg_aux: { title: 'Making negatives', fix: 'Put don’t or doesn’t before the base verb.', ex: 'He not like tea → He doesn’t like tea.' },
  do_does: { title: 'do or does', fix: 'I, you, we, they take do. He, she, it (and one person) take does.', ex: 'She don’t work → She doesn’t work.' },
  s_after_aux: { title: 'No -s after do / does', fix: 'After do, does, don’t and doesn’t the verb stays in its base form.', ex: 'Does he works? → Does he work?' },
  s3: { title: 'The -s with he / she / it', fix: 'In positive sentences add -s or -es to the verb with he, she, it and one person.', ex: 'He work in a bank → He works in a bank.' },
  s_extra: { title: 'No -s with I / you / we / they', fix: 'With I, you, we, they and plural nouns the verb keeps its base form.', ex: 'They plays football → They play football.' },
  have_has: { title: 'have or has', fix: 'Use has with he, she, it. Use have with I, you, we, they.', ex: 'She have a car → She has a car.' },
  be_agree: { title: 'am / is / are', fix: 'I am, he/she/it is, you/we/they are.', ex: 'They is late → They are late.' },
  be_misuse: { title: 'am / is / are with other verbs', fix: 'Do not mix am/is/are with another verb: I work, not I am work.', ex: 'She is works in a bank → She works in a bank.' },
  be_missing: { title: 'Forgetting am / is / are', fix: 'English needs am, is or are before a noun or adjective.', ex: 'He journalist → He is a journalist.' },
  tense: { title: 'Present simple only', fix: 'Use the present simple: no -ing, no past forms, no will.', ex: 'He is drinking tea → He drinks tea.' },
  prep: { title: 'at / on / in / to / by', fix: 'at + clock time, on + days, in + the morning, go to + place, by + bus/train/car.', ex: 'We go on school → We go to school.' },
  pronoun: { title: 'Pronouns', fix: 'I, you, he, she, we, they: check who is doing the action in the Uzbek sentence.' },
  word_order: { title: 'Word order', fix: 'Statements follow subject + verb + object + place + time. Always, usually, often, sometimes, never go before the main verb.', ex: 'She goes usually by bus → She usually goes by bus.' },
  plural: { title: 'One or many?', fix: 'Check singular and plural nouns: a friend, two friends.' },
  aux_extra: { title: 'Extra do / does', fix: 'Positive statements do not need do or does.', ex: 'I do drink tea → I drink tea.' },
  spelling: { title: 'Spelling', fix: 'The grammar is fine, but a word is misspelt. Spelling has to be right to score.' },
  vocab: { title: 'Word choice', fix: 'A word does not match the Uzbek sentence. Check the verb and the nouns.' },
  missing: { title: 'Missing details', fix: 'Translate every part of the Uzbek sentence: time words, places and objects too.' },
  extra: { title: 'Extra words', fix: 'Only translate what is in the Uzbek sentence.' }
};
const ISSUE_ORDER = ['empty', 'type_mismatch', 'q_aux', 'neg_aux', 'be_missing', 'be_misuse', 'be_agree', 'do_does', 's_after_aux', 's3', 's_extra',
  'have_has', 'q_order', 'tense', 'aux_extra', 'prep', 'pronoun', 'word_order', 'plural', 'spelling', 'vocab', 'missing', 'extra'];
const SOFT = new Set(['vocab', 'missing', 'extra']);

/* ---------- sentence type + generic grammar rules ---------- */
function typeOf(st) {
  if (WH.has(st[0]) || DOS.has(st[0]) || BE.has(st[0])) return 'i';
  if (HAVES.has(st[0]) && st.includes('got')) return 'i';
  if (st.includes('not') || st.includes('never') || st.includes('no')) return 'n';
  return 'p';
}

function generic(st, item) {
  const out = new Set();
  const n = st.length;
  const auxBefore = i => st.slice(0, i).some(w => DOS.has(w));
  // subject + verb agreement (statements)
  for (let i = 0; i < n - 1; i++) {
    if (auxBefore(i)) continue;
    const w = st[i];
    if (st[i - 1] === 'and' && (SING.has(st[i - 2]) || PLUR.has(st[i - 2]))) continue; // "Ali and Lola play"
    let j = i + 1;
    while (j < n && FREQ.has(st[j])) j++;
    const v = st[j];
    if (!v) continue;
    const sing = SING.has(w);
    const plur = PLUR.has(w) || (st[i + 1] === 'and' && (SING.has(st[i + 2]) || PLUR.has(st[i + 2])));
    if (plur && st[i + 1] === 'and') continue;
    if (sing) {
      if (v === 'have') out.add('have_has');
      else if (v === 'do') out.add('do_does');
      else if (VERBS.has(v) && !VERB_S.has(v)) out.add('s3');
    } else if (plur) {
      if (v === 'has') out.add('have_has');
      else if (v === 'does') out.add('do_does');
      else if (VERB_S.has(v)) out.add('s_extra');
    }
  }
  // do / does
  for (let i = 0; i < n; i++) {
    if (!DOS.has(st[i])) continue;
    if (st[i] === 'do' && WH.has(st[0]) && st[i - 1] && PRON.has(st[i - 1])) continue; // "what do you do"
    for (let j = i + 1; j < n; j++) {
      if (st[j] === 'and' || st[j] === 'but' || st[j] === 'because') break;
      if (VERB_S.has(st[j]) || st[j] === 'has') { out.add('s_after_aux'); break; }
    }
    const prev = st[i - 1];
    let m = i + 1;
    while (DET.has(st[m])) m++;
    while (st[m] === 'older' || st[m] === 'younger') m++;
    const subj = st[m];
    const plural = st[m + 1] === 'and';
    if (st[i] === 'does') {
      if (prev && PLUR.has(prev)) out.add('do_does');
      else if (subj && PLUR.has(subj) && !plural && !(prev && SING.has(prev))) out.add('do_does');
    } else if (!(i > 0 && WH.has(st[0]) && i > 2)) {
      if (prev && SING.has(prev)) out.add('do_does');
      else if (subj && SING.has(subj) && !plural && !(prev && PLUR.has(prev))) out.add('do_does');
    }
    for (let j = i + 1; j < Math.min(n, i + 4); j++) if (BE.has(st[j])) { out.add('be_misuse'); break; }
  }
  // am / is / are
  const want = w => (w === 'i' ? 'am' : (SING.has(w) ? 'is' : (PLUR.has(w) ? 'are' : null)));
  for (let i = 0; i < n; i++) {
    if (!BE.has(st[i])) continue;
    let subj = null;
    if (i > 0 && !WH.has(st[i - 1])) subj = st[i - 1];
    else {
      let m = i + 1;
      while (DET.has(st[m])) m++;
      subj = st[m];
    }
    const w = subj && want(subj);
    if (w && w !== st[i]) out.add('be_agree');
    let k = i + 1;
    if (st[k] === 'not') k++;
    while (FREQ.has(st[k])) k++;
    const nx = st[k];
    if (nx && (VERBS.has(nx) || VERB_S.has(nx)) && nx !== 'late') out.add('be_misuse');
    if (nx && /ing$/.test(nx) && nx.length > 4 && nx !== 'shopping' && nx !== 'morning' && nx !== 'evening') out.add('tense');
  }
  // negatives without an auxiliary
  for (let i = 1; i < n; i++) {
    if (st[i] === 'not' && !DOS.has(st[i - 1]) && !BE.has(st[i - 1]) && !HAVES.has(st[i - 1])) out.add('neg_aux');
    if (st[i] === 'no' && (VERBS.has(st[i + 1]) || VERB_S.has(st[i + 1]))) out.add('neg_aux');
  }
  // questions
  if (item.type === 'i') {
    const f = st[0];
    if (WH.has(f)) {
      if (f !== 'who') {
        let k = -1;
        for (let i = 1; i < Math.min(n, 6); i++) if (DOS.has(st[i]) || BE.has(st[i])) { k = i; break; }
        if (k < 0) out.add('q_aux');
        else if (VERBS.has(st[k + 1]) || VERB_S.has(st[k + 1])) {
          if (!(st[k + 1] === 'do' || PRON.has(st[k + 1]))) out.add('q_order');
        }
      }
    } else if ((DOS.has(f) || BE.has(f)) && (VERBS.has(st[1]) || VERB_S.has(st[1]))) out.add('q_order');
  }
  // tense
  for (let i = 0; i < n; i++) {
    if (PAST.has(st[i]) && !(st[i] === 'got' && HAVES.has(st[i - 1] === 'not' ? st[i - 2] : st[i - 1]))
      && !(st[i] === 'got' && HAVES.has(st[0]))) { out.add('tense'); break; }
    if (/ing$/.test(st[i]) && VERBS.has(st[i].replace(/ing$/, '')) && BE.has(st[i - 1])) { out.add('tense'); break; }
  }
  return [...out];
}

/* ---------- classification of differences ---------- */
function sameBag(a, b) {
  if (a.length !== b.length) return false;
  return a.slice().sort().join(' ') === b.slice().sort().join(' ') && a.join(' ') !== b.join(' ');
}

function classify(ops, st, tt, item) {
  const codes = [];
  let unk = 0, known = 0;
  const ttBe = tt.some(w => BE.has(w));
  const V = VOCAB();
  ops.forEach(o => {
    if (o.t === 'sub') {
      const a = o.a, b = o.b;
      if (DOS.has(a) && DOS.has(b)) codes.push('do_does');
      else if (BE.has(a) && BE.has(b)) codes.push('be_agree');
      else if (HAVES.has(a) && HAVES.has(b)) codes.push('have_has');
      else if (isSV(a, b)) {
        if (VERB_S.has(a) || VERB_S.has(b)) {
          if (VERB_S.has(a)) {
            const sAux = st.slice(0, o.i).some(w => DOS.has(w)), tAux = tt.slice(0, o.j).some(w => DOS.has(w));
            if (sAux) codes.push('s_after_aux');
            else if (!tAux) codes.push('s_extra'); // missing do/does is reported as the question/negative slip
          } else codes.push('s3');
        } else codes.push('plural');
      }
      else if (PREPS.has(a) && PREPS.has(b)) codes.push('prep');
      else if (PRON.has(a) && PRON.has(b)) codes.push('pronoun');
      else if (a.length > 3 && b.length > 3 && ed(a, b) <= 2) codes.push('spelling');
      else { codes.push('vocab'); if (V.has(a)) known++; else unk++; }
    } else if (o.t === 'mis') {
      const b = o.b;
      if (DOS.has(b)) codes.push(item.type === 'n' ? 'neg_aux' : item.type === 'i' ? 'q_aux' : 'missing');
      else if (b === 'not' || b === 'never') codes.push('type_mismatch');
      else if (BE.has(b)) codes.push('be_missing');
      else if (PREPS.has(b)) codes.push('prep');
      else codes.push('missing');
    } else {
      const a = o.a;
      if (DOS.has(a)) codes.push(ttBe ? 'be_misuse' : 'aux_extra');
      else if (a === 'not' || a === 'no' || a === 'never') codes.push('type_mismatch');
      else if (BE.has(a)) codes.push('be_misuse');
      else if (PREPS.has(a)) codes.push('prep');
      else codes.push('extra');
    }
  });
  return { codes, unk, known };
}

function diagnose(item, st, E, rep) {
  let best = E.list[0], bd = 1e9;
  E.list.forEach(v => { const d = align(st, v.toks).d; if (d < bd) { bd = d; best = v; } });
  let codes = [], unk = 0, known = 0;
  if (sameBag(st, best.toks)) codes.push('word_order');
  else {
    const r = classify(align(st, best.toks).ops, st, best.toks, item);
    codes = r.codes; unk = r.unk; known = r.known;
  }
  if (typeOf(st) !== item.type) codes.push(item.type === 'i' ? 'q_aux' : 'type_mismatch');
  generic(st, item).forEach(c => codes.push(c));
  if (rep && rep.fixes.length) codes.push('spelling');
  codes = [...new Set(codes)].sort((a, b) => ISSUE_ORDER.indexOf(a) - ISSUE_ORDER.indexOf(b));
  let status;
  if (codes.some(c => !SOFT.has(c))) status = 'wrong';
  else if (codes.includes('missing')) status = 'wrong';
  else if (codes.includes('vocab') && known > 0) status = 'wrong';
  else status = 'review';
  return { status, issues: codes, fixes: rep ? rep.fixes : [] };
}

/* ---------- public: check one answer ----------
   status: ok | review (no grammar slip, unusual words: teacher decides, counts) |
           spell (right apart from spelling, does not count) | wrong | empty */
function check(item, answer, accepted) {
  const n = norm(answer);
  if (!n) return { status: 'empty', issues: ['empty'] };
  const st = canonTokens(n);
  if (!st.length) return { status: 'empty', issues: ['empty'] };
  const key = st.join(' ');
  const E = expansions(item);
  if (E.set.has(key)) return { status: 'ok' };
  if (accepted && accepted.includes(key)) return { status: 'ok', note: 'teacher' };
  if (numberLenient(st, E)) return { status: 'ok', note: 'number' };
  const rep = repairTypos(st);
  if (rep.fixes.length) {
    const rk = rep.toks.join(' ');
    if (E.set.has(rk) || numberLenient(rep.toks, E)) return { status: 'spell', issues: ['spelling'], fixes: rep.fixes };
  }
  return diagnose(item, rep.toks, E, rep);
}
function answerKey(answer) { return canonTokens(norm(answer)).join(' '); }

if (typeof module !== 'undefined') module.exports = { check, expansions, canon, alternatives, norm, canonTokens, answerKey, ISSUES };
