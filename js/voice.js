/* ======================================================================
   VOICE: speak the answer instead of typing it (Web Speech API).
   Works in Chrome, Edge and Safari (iPhone/iPad and Mac), on the https site.
   The words appear in the answer box while the student speaks, so they can
   see what was heard and fix a word by typing before they lock in.
   ====================================================================== */
const Voice = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const MSG = {
    'not-allowed': 'The microphone is blocked. Allow it (the lock or camera icon next to the web address), then tap the mic again.',
    'service-not-allowed': 'Voice typing is switched off in this browser. Use Chrome, Edge or Safari, or type the answer.',
    'audio-capture': 'No microphone was found. Connect one, or type the answer.',
    'network': 'Voice needs the internet. Check the connection, or type the answer.',
    'no-speech': 'I did not hear anything. Tap the mic and speak a little louder.',
    'language-not-supported': 'English voice is not available in this browser. Please type the answer.',
    'start': 'The microphone did not start. Tap the mic again.'
  };
  let rec = null, session = 0;

  function start(cb) {
    // cb: { onState(state), onText(text, isFinal), onError(message) }
    abort();
    if (!SR) { cb.onError('Voice answers work in Chrome, Edge and Safari. Please type the answer here.'); return false; }
    const my = ++session;
    let r;
    try { r = new SR(); } catch (e) { cb.onError(MSG.start); return false; }
    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    let heard = false, failed = false, started = false;
    const live = () => my === session;

    r.onstart = () => { if (!live()) return; started = true; cb.onState('listening'); };
    r.onresult = e => {
      if (!live()) return;
      let fin = '', tmp = '';
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) fin += ' ' + res[0].transcript; else tmp += ' ' + res[0].transcript;
      }
      const text = (fin + ' ' + tmp).replace(/\s+/g, ' ').trim();
      if (text) heard = true;
      cb.onText(text, !tmp.trim());
    };
    r.onerror = e => {
      if (!live() || e.error === 'aborted') return;
      if (e.error === 'no-speech' && heard) return;
      failed = true;
      cb.onError(MSG[e.error] || 'Voice stopped. Tap the mic to try again.');
    };
    r.onend = () => {
      if (!live()) return;
      clearTimeout(guard); clearTimeout(cap);
      rec = null;
      if (!heard && !failed) cb.onError(MSG['no-speech']);
      cb.onState('idle');
    };
    rec = r;
    try { r.start(); } catch (e) { rec = null; cb.onError(MSG.start); cb.onState('idle'); return false; }
    cb.onState('starting');
    // first use: the browser asks for permission; give the student time to press Allow
    const guard = setTimeout(() => {
      if (live() && !started) { abort(); cb.onError(MSG.start); cb.onState('idle'); }
    }, 12000);
    // never keep the mic open for long
    const cap = setTimeout(() => { if (live() && rec) { try { rec.stop(); } catch (e) { /* ignore */ } } }, 15000);
    return true;
  }
  function stop() { if (rec) { try { rec.stop(); } catch (e) { /* ignore */ } } }
  function abort() {
    session++;
    if (rec) { try { rec.abort(); } catch (e) { /* ignore */ } rec = null; }
  }
  return { start, stop, abort, get busy() { return !!rec; }, get supported() { return !!SR; } };
})();
