/* קורס וקטורים · חיבור לשרת שמירת ההתקדמות
   פותח על ידי אמתי צוברי · © כל הזכויות שמורות */
(function(){
  const API_URL = 'https://script.google.com/macros/s/AKfycbzVcIDpz17058Pm1e5Vd42DqXa-ZxtQoO6EtYverGJHDV7a7oVmRAMLJg6-BiNCeUh7/exec'; // ← כתובת אפליקציית האינטרנט של Apps Script
  const SKEY = 'vec-student', QKEY = 'vec-queue';
  const host = location.hostname;
  // תצוגה מקדימה למורה: ‎?preview=1‎ — רק בדפדפן שבו המורה כבר נכנס/ה לדף המורה
  let tkey = null; try { tkey = localStorage.getItem('vec-tkey'); } catch (e) {}
  const PREVIEW = new URLSearchParams(location.search).has('preview') && (!!tkey || !(host.endsWith('pages.dev')));
  // גרסה פתוחה (למורים אחרים ולתלמידים שלהם): ‎?open‎ — בלי קוד, ושום דבר לא נשלח לגיליון.
  // המצב נשמר בדפדפן; ‎?code‎ מחזיר לגרסה הרגילה עם קוד.
  const params = new URLSearchParams(location.search);
  let guestFlag = params.has('open');
  try {
    if (params.has('open')) localStorage.setItem('vec-open', '1');
    if (params.has('code')) localStorage.removeItem('vec-open');
    guestFlag = localStorage.getItem('vec-open') === '1';
  } catch (e) {}
  const GUEST = !PREVIEW && guestFlag;
  const LIVE = !PREVIEW && !GUEST && !!API_URL && (host.endsWith('pages.dev') || host === 'localhost' || host === '127.0.0.1');
  let student = null, lesson = 0, queue = [], sending = false;
  try { student = JSON.parse(localStorage.getItem(SKEY) || 'null'); queue = JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch (e) {}
  if (GUEST) student = { code: 'OPEN', name: '' };
  const saveQ = () => { try { localStorage.setItem(QKEY, JSON.stringify(queue.slice(-300))); } catch (e) {} };

  const css = `
  .cl-ov{position:fixed;inset:0;z-index:100;background:rgba(23,34,48,.55);display:flex;align-items:center;justify-content:center;padding:16px}
  .cl-box{background:#fff;border-radius:16px;max-width:400px;width:100%;padding:24px 22px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.25);font-family:Rubik,system-ui,sans-serif}
  .cl-box h2{margin:0 0 6px;color:#2B44A0;font-size:22px}
  .cl-box p{margin:6px 0;color:#4a5566;font-size:15.5px;line-height:1.7}
  .cl-box input{font:inherit;font-size:22px;text-align:center;letter-spacing:2px;width:100%;padding:10px;border:2px solid #b9c4d6;border-radius:10px;margin:12px 0 8px;direction:ltr}
  .cl-box input:focus{outline:none;border-color:#2B44A0}
  .cl-box button{font:inherit;font-size:17px;width:100%;padding:10px;border:0;border-radius:10px;background:#2B44A0;color:#fff;cursor:pointer}
  .cl-box button:disabled{opacity:.5}
  .cl-err{color:#c92a2a;min-height:24px;font-size:15px}
  .cl-who{font-size:12.5px;color:#5b6575;white-space:nowrap}
  .cl-who a{color:#2B44A0;cursor:pointer;text-decoration:underline}
  .cl-prev{background:#FFF6DC;color:#8a6400;text-align:center;font-size:13.5px;padding:4px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  async function send() {
    if (!LIVE || sending || !queue.length) return;
    sending = true;
    // כל אירוע נשלח עם הקוד של התלמיד שעשה אותו (גם אם בינתיים נכנס תלמיד אחר)
    const c = queue[0].c || (student && student.code), L = queue[0].l || lesson;
    if (!c) { sending = false; return; }
    let k = 0; while (k < queue.length && k < 40 && (queue[k].c || c) === c && (queue[k].l || lesson) === L) k++;
    const batch = queue.slice(0, k);
    try {
      const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ code: c, lesson: L, events: batch }) });
      const j = await r.json();
      if (j.ok) { queue = queue.slice(batch.length); saveQ(); }
    } catch (e) { /* ננסה שוב בהמשך */ }
    sending = false;
    if (queue.length) setTimeout(send, 3000);
  }
  function log(ev) {
    if (!LIVE) return;
    if (!student) return;
    ev.t = new Date().toISOString(); ev.c = student.code; ev.l = lesson; queue.push(ev); saveQ();
    clearTimeout(log._t); log._t = setTimeout(send, 600);
  }
  window.addEventListener('online', send);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') send(); });

  function whoBadge() {
    const slot = document.getElementById('who'); if (!slot) return;
    slot.innerHTML = LIVE ? `<span class="cl-who">שלום ${student.name} · <a id="cl-out">לא אני</a></span>` : '';
    const o = document.getElementById('cl-out');
    if (o) o.onclick = () => { if (queue.length) send(); try { localStorage.removeItem(SKEY); } catch (e) {} location.reload(); };
  }
  async function login(code) {
    const u = `${API_URL}?action=login&lesson=${lesson}&code=${encodeURIComponent(code)}`;
    const r = await fetch(u); return r.json();
  }
  function askCode(done) {
    const ov = document.createElement('div'); ov.className = 'cl-ov';
    ov.innerHTML = `<div class="cl-box"><h2>ברוכים הבאים!</h2><p>כדי לשמור את ההתקדמות שלכם, הקלידו את הקוד האישי שלכם. צריך לעשות את זה רק פעם אחת בכל מכשיר.</p>
      <input id="cl-code" inputmode="text" autocomplete="off" autocapitalize="off" placeholder="הקוד שלי" style="text-transform:uppercase"><div class="cl-err" id="cl-err"></div><button id="cl-go">כניסה</button></div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('#cl-code'), btn = ov.querySelector('#cl-go'), err = ov.querySelector('#cl-err');
    const go = async () => {
      const code = inp.value.trim(); if (!code) { err.textContent = 'הקלידו קוד'; return; }
      btn.disabled = true; err.textContent = 'בודק...';
      try {
        const j = await login(code);
        if (!j.ok) { err.textContent = 'הקוד לא נמצא. בדקו אותו ונסו שוב.'; btn.disabled = false; return; }
        student = { code: j.code, name: j.name }; try { localStorage.setItem(SKEY, JSON.stringify(student)); } catch (e) {}
        ov.remove(); whoBadge(); done(j.prog, j.resetAt);
      } catch (e) { err.textContent = 'אין חיבור לשרת. בדקו את החיבור לאינטרנט ונסו שוב.'; btn.disabled = false; }
    };
    btn.onclick = go; inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    setTimeout(() => inp.focus(), 50);
  }
  function start(lessonNo, cb) {
    lesson = lessonNo;
    if (GUEST) { cb(null); return; }
    if (PREVIEW) {
      const b = document.createElement('div'); b.className = 'cl-prev';
      b.innerHTML = '👁 תצוגה מקדימה למורה — כל המסכים פתוחים ושום דבר לא נשמר · <a href="teacher.html" style="color:#8a6400">חזרה לדף המורה</a>';
      document.body.prepend(b); cb(null); return;
    }
    if (!LIVE) {
      const b = document.createElement('div'); b.className = 'cl-prev'; b.textContent = 'מצב תצוגה מקדימה — התשובות לא נשמרות';
      document.body.prepend(b); cb(null); return;
    }
    if (!student) { askCode(cb); return; }
    whoBadge();
    // סנכרון התקדמות מהשרת (למשל אחרי מעבר מכשיר) — בלי לעכב את התלמיד יותר משלוש שניות
    let finished = false;
    const fin = (p, r) => { if (finished) return; finished = true; cb(p, r); };
    setTimeout(() => fin(null), 3000);
    login(student.code).then(j => { if (j && j.ok === false) { try { localStorage.removeItem(SKEY); } catch (e) {} location.reload(); return; } fin(j && j.prog, j && j.resetAt); }).catch(() => fin(null));
    send();
  }
  // ---- הדמות של התלמיד: נשמרת בדפדפן, ובשרת (אם השרת כבר עודכן לגרסה שתומכת בזה) ----
  let serverV = 0;
  const avKey = () => 'vec-avatar-' + ((student && student.code) || 'OPEN');
  function getAvatar() { try { return JSON.parse(localStorage.getItem(avKey()) || 'null'); } catch (e) { return null; } }
  async function pushAvatar() {
    let a = null; try { a = localStorage.getItem(avKey()); } catch (e) {}
    if (!LIVE || !student || !a || serverV < 2) return;
    try {
      const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'avatar', code: student.code, avatar: a }) });
      const j = await r.json(); if (j.ok) { try { localStorage.removeItem(avKey() + '-pending'); } catch (e) {} }
    } catch (e) { /* ננסה שוב בכניסה הבאה */ }
  }
  function saveAvatar(av) {
    try { localStorage.setItem(avKey(), JSON.stringify(av)); localStorage.setItem(avKey() + '-pending', '1'); } catch (e) {}
    return pushAvatar();
  }
  // ---- נעילות ועצירות שהמורה קבע (רק בגרסה של הכיתה) ----
  async function getLocks() {
    if (!LIVE) return null;
    try { const r = await fetch(`${API_URL}?action=locks`); const j = await r.json(); return j && j.ok && j.locks ? j.locks : null; } catch (e) { return null; }
  }
  // קורא ל־cb עם הנעילות עכשיו, ושוב כל כמה שניות (כדי ששחרור יגיע בלי לרענן)
  function watchLocks(cb, ms) {
    if (!LIVE) return;
    const tick = async () => { const l = await getLocks(); if (l) cb(l); };
    tick(); setInterval(() => { if (!document.hidden) tick(); }, ms || 12000);
  }
  async function loginFull(code) {
    const r = await fetch(`${API_URL}?action=login&code=${encodeURIComponent(code)}`); const j = await r.json();
    if (j && j.ok) {
      serverV = j.v || 1;
      // דמות מהשרת (למשל אחרי מעבר מכשיר) — אלא אם יש שינוי מקומי שעוד לא נשלח
      let pending = false; try { pending = !!localStorage.getItem('vec-avatar-' + j.code + '-pending'); } catch (e) {}
      if (j.avatar && !pending) { try { localStorage.setItem('vec-avatar-' + j.code, j.avatar); } catch (e) {} }
      if (pending && student && student.code === j.code) pushAvatar();
    }
    return j;
  }
  function setStudent(s) { student = s; try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} }
  function logout() { if (queue.length) send(); student = null; try { localStorage.removeItem(SKEY); } catch (e) {} }
  window.CourseAPI = { start, log, url: API_URL, preview: PREVIEW, guest: GUEST, get live() { return LIVE; }, get student() { return student; }, loginFull, setStudent, logout, flush: send, getAvatar, saveAvatar, getLocks, watchLocks, get serverVersion() { return serverV; } };
})();
