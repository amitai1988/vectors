/**
 * קורס וקטורים · יב׳ 5 יח״ל — שרת שמירת התקדמות
 * פותח על ידי אמתי צוברי · © כל הזכויות שמורות
 *
 * לשונית "תלמידים" באותו מבנה כמו במערכת השאלונים: כיתה | שם | קוד
 * (אפשר להעתיק אליה את שורות יב5 כמו שהן מגיליון השאלונים).
 * הלשוניות "תשובות" ו"התקדמות" נוצרות אוטומטית.
 */
// ↓↓↓ סיסמת המורה לדף המורה — שנו למשהו משלכם ↓↓↓
const TEACHER_KEY = 'כתבו-כאן-את-הסיסמה';

const SH_STUDENTS = 'תלמידים';
const SH_LOG = 'תשובות';
const SH_PROG = 'התקדמות';
const LOG_HEAD = ['תאריך ושעה', 'קוד', 'שם', 'שיעור', 'סוג', 'מסך', 'שאלה', 'נכון?', 'ניסיון', 'ניקוד בחלק'];
const PROG_HEAD = ['קוד', 'שם', 'שיעור', 'מסך אחרון', 'מסך מקסימלי', 'בדיקות הבנה שעברו',
  'ניקוד תרגול בסיסי', 'שאלות בסיסי שנענו', 'ניקוד תרגול מתקדם', 'שאלות מתקדם שנענו', 'סיים את השיעור', 'עדכון אחרון'];

function setup() {
  const ss = SpreadsheetApp.getActive();
  let st = ss.getSheetByName(SH_STUDENTS);
  if (!st) { st = ss.insertSheet(SH_STUDENTS); st.appendRow(['כיתה', 'שם', 'קוד', 'דמות']); st.setRightToLeft(true); }
  else if (String(st.getRange(1, 1).getValue()) === 'קוד') { st.getRange(1, 1, 1, 3).setValues([['כיתה', 'שם', 'קוד']]); }
  if (!String(st.getRange(1, 4).getValue())) st.getRange(1, 4).setValue('דמות');
  [[SH_LOG, LOG_HEAD], [SH_PROG, PROG_HEAD]].forEach(([name, head]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.appendRow(head);
      sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#EEF2F8');
      sh.setFrozenRows(1);
      sh.setRightToLeft(true);
    }
  });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function findStudent_(code) {
  code = String(code || '').trim().toUpperCase();
  if (!code) return null;
  const sh = SpreadsheetApp.getActive().getSheetByName(SH_STUDENTS);
  if (!sh) return null;
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][1] && String(vals[i][2]).trim().toUpperCase() === code)
      return { code: code, name: String(vals[i][1]).trim(), row: i + 1, avatar: String(vals[i][3] || '') };
  }
  return null;
}

/* תפריט בגיליון */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('קורס וקטורים')
    .addItem('יצירת קודים לתלמידים חדשים', 'generateCodes')
    .addToUi();
}

/* יוצר קוד בן 4 תווים לכל תלמיד שרשום בלשונית "תלמידים" ועדיין אין לו קוד */
function generateCodes() {
  setup();
  const sh = SpreadsheetApp.getActive().getSheetByName(SH_STUDENTS);
  const v = sh.getDataRange().getValues();
  const used = new Set(v.slice(1).map(r => String(r[2]).trim().toUpperCase()).filter(Boolean));
  const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // בלי O,0,I,1,L שמתבלבלים
  let made = 0;
  for (let i = 1; i < v.length; i++) {
    if (!v[i][1] || String(v[i][2]).trim()) continue;
    let code;
    do { code = Array.from({ length: 4 }, () => ABC[Math.floor(Math.random() * ABC.length)]).join(''); } while (used.has(code));
    used.add(code);
    sh.getRange(i + 1, 3).setValue(code);
    made++;
  }
  try { SpreadsheetApp.getUi().alert('נוצרו ' + made + ' קודים חדשים'); } catch (e) {}
}

function progRow_(sh, code, lesson) {
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === code && String(vals[i][2]) === String(lesson)) return { row: i + 1, vals: vals[i] };
  }
  return null;
}

// ---- נעילת שיעורים ועצירות בתוך שיעור (נשמר ב"מאפייני הסקריפט") ----
// lessons: {"3": true} = שיעור 3 נעול · stops: {"2": 5} = בשיעור 2 עוצרים לפני מסך מספר 5 (ספירה מ־0)
function locks_() {
  try { const o = JSON.parse(PropertiesService.getScriptProperties().getProperty('LOCKS') || '{}'); o.lessons = o.lessons || {}; o.stops = o.stops || {}; return o; }
  catch (err) { return { lessons: {}, stops: {} }; }
}
function setLock_(p) {
  if (String(p.key || '') !== TEACHER_KEY) return out_({ ok: false, error: 'סיסמה שגויה' });
  const o = locks_(), L = String(p.lesson || '');
  if (!L) return out_({ ok: false, error: 'no lesson' });
  if (p.type === 'lesson') { if (p.value === '1') o.lessons[L] = true; else delete o.lessons[L]; }
  if (p.type === 'stop') { if (p.value === '' || p.value === undefined) delete o.stops[L]; else o.stops[L] = Number(p.value); }
  PropertiesService.getScriptProperties().setProperty('LOCKS', JSON.stringify(o));
  return out_({ ok: true, locks: o });
}

function doGet(e) {
  setup();
  const p = e.parameter || {};
  if (p.action === 'teacher') return teacher_(p);
  if (p.action === 'locks') return out_({ ok: true, v: 3, locks: locks_() });
  if (p.action === 'setlock') return setLock_(p);
  const st = findStudent_(p.code);
  if (p.action === 'login') {
    if (!st) return out_({ ok: false });
    let prog = null;
    if (p.lesson) {
      const r = progRow_(SpreadsheetApp.getActive().getSheetByName(SH_PROG), st.code, p.lesson);
      if (r) prog = { max: Number(r.vals[4]) || 0, passed: String(r.vals[5] || '').split(',').filter(String).map(Number) };
    }
    // התקדמות בכל השיעורים — לדף האישי
    const all = SpreadsheetApp.getActive().getSheetByName(SH_PROG).getDataRange().getValues().slice(1)
      .filter(r => String(r[0]) === st.code)
      .map(r => ({ lesson: Number(r[2]), max: Number(r[4]) || 0, passed: String(r[5] || '').split(',').filter(String).length,
        basic: r[6], basicDone: r[7], adv: r[8], advDone: r[9], done: r[10] === 'כן',
        last: r[11] instanceof Date ? r[11].toISOString() : r[11] }));
    return out_({ ok: true, v: 3, name: st.name, code: st.code, prog: prog, all: all, avatar: st.avatar, locks: locks_() });
  }
  return out_({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  setup();
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  const events = Array.isArray(d.events) ? d.events : [d];
  const st = findStudent_(d.code);
  if (!st) return out_({ ok: false, error: 'bad code' });
  // שמירת הדמות שהתלמיד עיצב (עמודה ד׳ בלשונית "תלמידים")
  if (d.action === 'avatar') {
    const a = String(d.avatar || '');
    if (a.length > 600) return out_({ ok: false, error: 'too long' });
    SpreadsheetApp.getActive().getSheetByName(SH_STUDENTS).getRange(st.row, 4).setValue(a);
    return out_({ ok: true });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    const log = ss.getSheetByName(SH_LOG), prog = ss.getSheetByName(SH_PROG);
    const kinds = { screen: 'מעבר מסך', check: 'בדיקת הבנה', sort: 'מיון', q: 'תרגול', done: 'סיום שיעור' };
    events.forEach(ev => {
      const t = ev.t ? new Date(ev.t) : new Date();
      if (ev.ev !== 'screen') {
        log.appendRow([t, st.code, st.name, d.lesson, kinds[ev.ev] || ev.ev, ev.title || ev.screen || '',
          ev.q ? (ev.sec === 'adv' ? 'מתקדם ' : 'בסיסי ') + ev.q : '',
          ev.ok === undefined ? '' : (ev.ok ? 'כן' : 'לא'), ev.attempt || '', ev.score === undefined ? '' : ev.score]);
      }
      let r = progRow_(prog, st.code, d.lesson);
      if (!r) {
        prog.appendRow([st.code, st.name, d.lesson, '', 0, '', '', '', '', '', '', t]);
        r = progRow_(prog, st.code, d.lesson);
      }
      const v = r.vals.slice();
      if (ev.ev === 'screen') { v[3] = ev.title || ev.screen; v[4] = Math.max(Number(v[4]) || 0, Number(ev.screen) || 0); }
      if ((ev.ev === 'check' || ev.ev === 'sort') && ev.ok) {
        const set = new Set(String(v[5] || '').split(',').filter(String));
        set.add(String(ev.screen));
        v[5] = Array.from(set).sort((a, b) => a - b).join(',');
      }
      if (ev.ev === 'q') {
        if (ev.sec === 'adv') { v[8] = ev.score; v[9] = ev.done + ' מתוך ' + ev.tot; }
        else { v[6] = ev.score; v[7] = ev.done + ' מתוך ' + ev.tot; }
      }
      if (ev.ev === 'done') v[10] = 'כן';
      v[11] = t;
      prog.getRange(r.row, 1, 1, v.length).setValues([v]);
    });
  } finally {
    lock.releaseLock();
  }
  return out_({ ok: true });
}

/* נתונים לדף המורה */
function teacher_(p) {
  if (String(p.key || '') !== TEACHER_KEY) return out_({ ok: false, error: 'סיסמה שגויה' });
  const ss = SpreadsheetApp.getActive();
  const conv = r => r.map(x => x instanceof Date ? x.toISOString() : x);
  const rows = name => { const sh = ss.getSheetByName(name); return sh ? sh.getDataRange().getValues().slice(1).map(conv) : []; };
  const students = rows(SH_STUDENTS).filter(r => r[1] && r[2]).map(r => ({ cls: String(r[0]), name: String(r[1]), code: String(r[2]).trim().toUpperCase(), avatar: String(r[3] || '') }));
  return out_({ ok: true, v: 3, students: students, prog: rows(SH_PROG), log: rows(SH_LOG), locks: locks_(), now: new Date().toISOString() });
}
