/* كراسة — study app. No server, no accounts: everything stays on the user's device. */
const KEY = "kurrasa-v1";
const VERSION = "1.0";
const INTERVALS = [1, 3, 7, 30];       // topic review spacing (days)
const BOXES = [1, 3, 7, 14, 30];       // flashcard Leitner boxes (days)
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const BREAKS = ["اشرب ماي وامشِ شوية بدون موبايل", "تمدد وحرّك رقبتك وكتفك", "غسّل وجهك وخذ نفس عميق", "طل من الشباك وريّح عينك", "كل تمرة أو حفنة مكسرات"];
const ORD = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 5);
const pad = (n) => String(n).padStart(2, "0");
const dstr = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const today = () => dstr(new Date());
const addDays = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return dstr(d); };
const diffDays = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isUrl = (s) => /^https?:\/\//i.test(s || "");
const str = (v, n) => String(v == null ? "" : v).slice(0, n);
const clamp = (v, a, b, d) => { v = Math.round(+v); return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
const arr = (v) => (Array.isArray(v) ? v : []);
const sid = (x) => String(x == null ? "" : x).replace(/[^\w-]/g, "").slice(0, 40) || uid();
const dateOrNull = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : null);
const isStandalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/* ---------- data model ---------- */
const T0 = (title, notes) => ({ id: uid(), title, studiedOn: null, last: null, rev: 0, notes: notes || "", star: false, cards: [] });
const C0 = (title, topics) => ({ id: uid(), title, topics: topics || [] });

function base() {
  return { v: 3, setup: false, name: "", theme: "light", subjects: [], files: [], exams: [], routine: [], done: {}, sessions: {}, minutes: {}, pomo: { focus: 50, brk: 10 }, updated: 0, habits: [], habitLog: {}, grades: [], formulas: [], errors: [], media: [], badges: {}, goalMin: 120, target: 95, quizCount: 0, planExam: "" };
}

function applyTemplate(S, kind) {
  if (kind === "vocational") {
    const phys1 = [
      T0("محصلة التعجيل في الحركة الدائرية", "التعجيل المماسي: يوازي السرعة الخطية ويأتي من تغير مقدارها.\nالتعجيل المركزي: عمودي على السرعة ويأتي من تغير اتجاهها فقط، ويتجه نحو المركز.\nالتعجيلان متعامدان، فالمحصلة تُحسب بنظرية فيثاغورس.\na = v² / r = ω² r"),
      T0("القوة المركزية", "تعريفها: قوة عمودية على اتجاه السرعة اللحظية، تغيّر اتجاهها وتحوّل المسار المستقيم إلى دائري، وتتجه نحو المركز. وحدتها N.\nFc = m v² / r\nلا تنجز شغلاً لأنها عمودية على الحركة.\nتصميم الطرق السريعة بشكل مائل يزيد القوة المركزية ويمنع الانزلاق."),
      T0("قوانين كبلر وحركة الأقمار", "الأول (المسارات): الأجرام تتحرك بمسارات بيضوية ومركز الجذب بإحدى البؤرتين.\nالثاني (المساحات): الخط الواصل بين مركز الجذب والكوكب يمسح مساحات متساوية بأزمنة متساوية.\nالثالث: مربع الزمن الدوري يتناسب طردياً مع مكعب نصف القطر الكبير. T² ∝ r³\nقانون الجذب العام: F = G m M / r²"),
      T0("الإزاحة الزاوية", "الزاوية المركزية التي يقطعها الجسم المتحرك دورانياً. θ = S / r\nتقاس بالراديان (rad). الدورة الكاملة = 2π rad = 360°"),
      T0("السرعة الزاوية", "المعدل الزمني للإزاحة الزاوية المقطوعة. ω = θ / t\nوحدتها rad/s.\nالعلاقة مع الخطية: v = ω r\nبدلالة التردد: ω = 2π f"),
      T0("التعجيل الزاوي", "معدل تغير السرعة الزاوية بوحدة الزمن. α = Δω / Δt\nوحدته rad/s².\nالعلاقة مع التعجيل المماسي: a_T = α r"),
      T0("عزم القصور الذاتي والعزم المدور", "عزم القصور الذاتي I = m r² (kg.m²): مقاومة الجسم لأي تغيير بسرعته الدورانية.\nالعزم المدور τ = F r (N.m): تأثير القوة بإحداث دوران حول محور.\nقانون نيوتن الثاني للدوران: τ = I α"),
      T0("الطاقة في الحركة الدورانية", "نعوض بالطاقة الحركية الخطية السرعة الخطية بالزاوية والكتلة بعزم القصور الذاتي.\nKE = ½ I ω²")
    ];
    S.subjects = [
      { id: uid(), name: "الرياضيات", chapters: [0, 1, 2, 3, 4].map((n) => C0("الفصل " + ORD[n])) },
      { id: uid(), name: "الطبيعيات", chapters: [C0("الحركة الدائرية والدورانية", phys1), C0("الظواهر الموجية للضوء"), C0("الحث الكهرومغناطيسي"), C0("دوائر التيار المتناوب"), C0("أشباه الموصلات والأجهزة الإلكترونية"), C0("الليزر والبلازما"), C0("النفط الخام"), C0("الفلزات والسبائك")] },
      { id: uid(), name: "العربي", chapters: [] },
      { id: uid(), name: "الإنگليزي", chapters: [] },
      { id: uid(), name: "الإسلامية", chapters: [] },
      { id: uid(), name: "المعالجات الدقيقة", chapters: [] },
      { id: uid(), name: "الشبكات", chapters: [] },
      { id: uid(), name: "صيانة وتجميع الحاسوب", chapters: [] }
    ];
    S.routine = [
      { id: uid(), time: "13:30", text: "قيلولة قصيرة (30-40 دقيقة)", days: [0, 1, 2] },
      { id: uid(), time: "16:00", text: "جلسة 1: مراجعة مادة اليوم", days: [0, 1, 2] },
      { id: uid(), time: "17:00", text: "جلسة 2: واجب وتحضير مادة باچر", days: [0, 1, 2] },
      { id: uid(), time: "19:00", text: "جلسة 3: رياضيات أو طبيعيات", days: [0, 1, 2] },
      { id: uid(), time: "20:00", text: "استرجاع 15 دقيقة من الذاكرة", days: [0, 1, 2] },
      { id: uid(), time: "22:15", text: "نوم", days: [0, 1, 2] },
      { id: uid(), time: "08:30", text: "جلسة 1: رياضيات مسائل", days: [3, 4] },
      { id: uid(), time: "09:30", text: "جلسة 2: طبيعيات", days: [3, 4] },
      { id: uid(), time: "17:30", text: "جلسة 3: مراجعة اليوم وتحضير باچر", days: [3, 4] },
      { id: uid(), time: "22:30", text: "نوم", days: [3, 4] },
      { id: uid(), time: "09:00", text: "جلسة 1: مسائل", days: [5, 6] },
      { id: uid(), time: "10:15", text: "جلسة 2: مواد حفظية واختصاص", days: [5, 6] },
      { id: uid(), time: "11:30", text: "جلسة 3: مراجعة الأسبوع / اختبار ذاتي", days: [5, 6] },
      { id: uid(), time: "22:30", text: "نوم", days: [5, 6] }
    ];
    S.exams = [{ id: uid(), name: "امتحانات نصف السنة (تقريبي، عدّل التاريخ)", date: "2027-01-15", subject: "" }];
  } else {
    S.subjects = [];
    S.routine = [
      { id: uid(), time: "16:00", text: "جلسة دراسة 1", days: [0, 1, 2, 3, 4, 5, 6] },
      { id: uid(), time: "18:00", text: "جلسة دراسة 2", days: [0, 1, 2, 3, 4, 5, 6] },
      { id: uid(), time: "21:30", text: "مراجعة 15 دقيقة قبل النوم", days: [0, 1, 2, 3, 4, 5, 6] }
    ];
    S.exams = [];
  }
  seedExtras(S, kind);
  return S;
}

/* validate + sanitize anything that comes from storage or an imported backup */
function cleanDone(o) {
  const out = {};
  if (o && typeof o === "object") for (const k of Object.keys(o)) {
    if (!dateOrNull(k) || !o[k] || typeof o[k] !== "object") continue;
    out[k] = {};
    for (const id of Object.keys(o[k])) if (o[k][id]) out[k][sid(id)] = true;
  }
  return out;
}
function cleanNums(o) {
  const out = {};
  if (o && typeof o === "object") for (const k of Object.keys(o)) if (dateOrNull(k)) out[k] = clamp(o[k], 0, 100000, 0);
  return out;
}
function normalize(o) {
  const b = base();
  if (!o || typeof o !== "object") return b;
  b.setup = !!o.setup;
  b.name = str(o.name, 40);
  b.theme = o.theme === "dark" ? "dark" : "light";
  b.updated = +o.updated || 0;
  b.pomo = { focus: clamp(o.pomo && o.pomo.focus, 5, 180, 50), brk: clamp(o.pomo && o.pomo.brk, 1, 60, 10) };
  b.done = cleanDone(o.done);
  b.sessions = cleanNums(o.sessions);
  b.minutes = cleanNums(o.minutes);
  b.subjects = arr(o.subjects).slice(0, 60).map((s) => ({
    id: sid(s && s.id), name: str(s && s.name, 80) || "مادة",
    chapters: arr(s && s.chapters).slice(0, 200).map((c) => ({
      id: sid(c && c.id), title: str(c && c.title, 120) || "فصل",
      topics: arr(c && c.topics).slice(0, 500).map((t) => ({
        id: sid(t && t.id), title: str(t && t.title, 160) || "موضوع",
        studiedOn: dateOrNull(t && t.studiedOn), last: dateOrNull(t && t.last), rev: clamp(t && t.rev, 0, 4, 0),
        notes: str(t && t.notes, 30000), star: !!(t && t.star),
        cards: arr(t && t.cards).slice(0, 500).map((k) => ({ id: sid(k && k.id), q: str(k && k.q, 1000), a: str(k && k.a, 2000), box: clamp(k && k.box, 0, 4, 0), due: dateOrNull(k && k.due) || today(), alts: arr(k && k.alts).slice(0, 10).map((x) => str(x, 1000)).filter(Boolean), miss: !!(k && k.miss), right: clamp(k && k.right, 0, 100000, 0), wrong: clamp(k && k.wrong, 0, 100000, 0) }))
      }))
    }))
  }));
  b.files = arr(o.files).slice(0, 1000).map((f) => ({
    id: sid(f && f.id), kind: ["pdf", "video", "link"].includes(f && f.kind) ? f.kind : "link",
    title: str(f && f.title, 160) || "ملف", desc: str(f && f.desc, 300),
    link: isUrl(f && f.link) ? str(f.link, 600) : "", blob: !!(f && f.blob), size: clamp(f && f.size, 0, 1e10, 0),
    subject: f && f.subject ? sid(f.subject) : "", topic: f && f.topic ? sid(f.topic) : "", lastPage: clamp(f && f.lastPage, 1, 100000, 1)
  }));
  b.exams = arr(o.exams).slice(0, 200).map((e) => ({ id: sid(e && e.id), name: str(e && e.name, 160) || "اختبار", date: dateOrNull(e && e.date) || today(), subject: e && e.subject ? sid(e.subject) : "" }));
  b.routine = arr(o.routine).slice(0, 300).map((r) => ({
    id: sid(r && r.id), time: /^\d{2}:\d{2}$/.test(r && r.time) ? r.time : "00:00", text: str(r && r.text, 160),
    days: arr(r && r.days).map((d) => clamp(d, 0, 6, 0))
  }));
  normalizeExtras(o, b);
  return b;
}

let S;
function load() {
  try { const r = localStorage.getItem(KEY); if (r) return normalize(JSON.parse(r)); } catch (e) { /* corrupted: start clean */ }
  return base();
}
S = load();
function save() {
  try { checkBadges(); } catch (e) { /* ignore */ }
  S.updated = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("المساحة ممتلئة. خذ نسخة احتياطية وامسح شي."); }
}
let toastT = null;
function toast(m) {
  const el = $("toast"); el.textContent = m; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3500);
}

/* ---------- IndexedDB for PDFs (stays on the device) ---------- */
function idb() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) { rej(new Error("no-idb")); return; }
    const r = indexedDB.open("kurrasa", 2);
    r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains("pdfs")) db.createObjectStore("pdfs"); if (!db.objectStoreNames.contains("media")) db.createObjectStore("media"); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbRun(mode, fn, store = "pdfs") {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, mode);
    let out;
    try { out = fn(tx.objectStore(store)); } catch (e) { rej(e); return; }
    tx.oncomplete = () => res(out && "result" in out ? out.result : undefined);
    tx.onerror = tx.onabort = () => rej(tx.error);
  });
}
const idbPut = (k, v) => idbRun("readwrite", (s) => s.put(v, k));
const idbGet = (k) => idbRun("readonly", (s) => s.get(k));
const idbDel = (k) => idbRun("readwrite", (s) => s.delete(k));

/* ---------- ui state + navigation ---------- */
const V = { tab: "today", subj: null, chap: null, topic: null, more: null, manage: false, del: null, edit: null, libF: "all", libS: "", q: "", ov: false, importCand: null };
const snap = () => ({ tab: V.tab, subj: V.subj, chap: V.chap, topic: V.topic, more: V.more, ov: V.ov });
function go(p) {
  Object.assign(V, { manage: false, edit: null, del: null, importCand: null }, p);
  history.pushState(snap(), "");
  render(); window.scrollTo(0, 0);
}
history.replaceState(snap(), "");
window.addEventListener("popstate", (e) => {
  const st = e.state; if (!st) return;
  V.tab = st.tab; V.subj = st.subj; V.chap = st.chap; V.topic = st.topic; V.more = st.more;
  V.manage = false; V.edit = null; V.del = null;
  if (!st.ov && V.ov) hideOverlay();
  render();
});

/* ---------- finders ---------- */
const getS = (id) => S.subjects.find((x) => x.id === id);
const getC = (s, id) => (s ? s.chapters.find((x) => x.id === id) : null);
const getT = (c, id) => (c ? c.topics.find((x) => x.id === id) : null);
const findT = (d) => getT(getC(getS(d.s), d.c), d.t);
function eachTopic(fn) { S.subjects.forEach((s) => s.chapters.forEach((c) => c.topics.forEach((t) => fn(s, c, t)))); }
function topicPath(tid) { let out = ""; eachTopic((s, c, t) => { if (t.id === tid) out = s.name + " › " + c.title + " › " + t.title; }); return out; }
const subjName = (id) => { const s = getS(id); return s ? s.name : ""; };
function subjectOfFile(f) { let sid2 = f.subject; if (f.topic) eachTopic((s, c, t) => { if (t.id === f.topic) sid2 = s.id; }); return sid2; }
function detach(ids) { S.files.forEach((f) => { if (ids.includes(f.topic)) f.topic = ""; }); }
function counts(s) { let n = 0, d = 0; s.chapters.forEach((c) => c.topics.forEach((t) => { n++; if (t.studiedOn) d++; })); return { n, d }; }
function dueTopics() {
  const t = today(), out = [];
  eachTopic((s, c, tp) => { if (tp.studiedOn && tp.rev < INTERVALS.length && addDays(tp.last || tp.studiedOn, INTERVALS[tp.rev]) <= t) out.push({ s, c, t: tp }); });
  return out;
}
function dueCards() {
  const t = today(), out = [];
  eachTopic((s, c, tp) => tp.cards.forEach((k) => { if (k.due <= t) out.push({ s, c, t: tp, k }); }));
  return out;
}
function streak() {
  let d = today(); if (!(S.sessions[d] > 0)) d = addDays(d, -1);
  let n = 0; while (S.sessions[d] > 0) { n++; d = addDays(d, -1); }
  return n;
}

/* ---------- icons ---------- */
const NAVI = {
  today: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
  subjects: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
  timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 3h6"/></svg>',
  library: '<svg viewBox="0 0 24 24"><path d="M4 5h4v15H4zM10 5h4v15h-4z"/><path d="M16 7l4 1-3 12-4-1z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>'
};
const TABS = [["today", "اليوم"], ["subjects", "المواد"], ["timer", "المؤقت"], ["library", "المكتبة"], ["more", "المزيد"]];
function subjIcon(name) {
  if (/رياض/.test(name)) return "∑";
  if (/عرب/.test(name)) return "ع";
  if (/انج|إنج|انگ|إنگ|english/i.test(name)) return "Aa";
  if (/طبيع|فيزياء|كيمياء/.test(name)) return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="9" ry="3.8"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)"/></svg>';
  if (/اسلام|إسلام/.test(name)) return '<svg viewBox="0 0 24 24"><path d="M16 4a8 8 0 1 0 4 12 6.5 6.5 0 0 1-4-12z"/></svg>';
  if (/معالج/.test(name)) return '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></svg>';
  if (/شبك/.test(name)) return '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v5M12 12l-6 4.5M12 12l6 4.5"/></svg>';
  if (/صيان|تجميع|حاسوب/.test(name)) return '<svg viewBox="0 0 24 24"><path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2-.5-.5-2z"/></svg>';
  return esc(name.trim().charAt(0));
}

/* ---------- shared view pieces ---------- */
const header = (title, sub) => '<div class="top"><div><h1>' + esc(title) + '</h1><div class="sub">' + esc(sub || "") + '</div></div><div class="tools"><button class="ghost" data-act="theme" aria-label="تغيير المظهر">' + (S.theme === "dark" ? "نهاري" : "ليلي") + '</button></div></div>';
function delBtn(key, act, attrs) {
  if (V.del === key) return '<button class="btn sm danger" data-act="' + act + '" ' + attrs + '>تأكيد الحذف</button>';
  return '<button class="btn sm alt" data-act="askdel" data-key="' + esc(key) + '">حذف</button>';
}
const renameForm = (kind, attrs, val) => '<form class="add plain" data-form="rename" data-kind="' + kind + '" ' + attrs + ' style="margin-bottom:10px"><div class="row"><input type="text" name="title" value="' + esc(val) + '" required maxlength="160" aria-label="الاسم"><button class="btn sm" type="submit">حفظ</button><button class="btn sm alt" type="button" data-act="editoff">إلغاء</button></div></form>';
const crumbs = (parts) => '<div class="crumbs">' + parts.map((p, i) => (i ? '<span aria-hidden="true">‹</span>' : "") + (p.act ? '<button data-act="' + p.act + '">' + esc(p.t) + "</button>" : "<span>" + esc(p.t) + "</span>")).join("") + "</div>";
const subjOptions = (sel) => '<option value="">بدون مادة</option>' + S.subjects.map((s) => '<option value="' + esc(s.id) + '" ' + (sel === s.id ? "selected" : "") + ">" + esc(s.name) + "</option>").join("");
function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }

function fileRow(f, showPath) {
  const kindLabel = f.kind === "video" ? "فيديو" : f.kind === "link" ? "رابط" : "PDF";
  const path = showPath ? (f.topic ? topicPath(f.topic) : f.subject ? subjName(f.subject) : "") : "";
  let acts = "";
  if (f.blob) acts += '<button class="btn sm gold" data-act="read" data-f="' + esc(f.id) + '">' + (f.lastPage > 1 ? "كمّل ص" + f.lastPage : "قراءة") + "</button>";
  else if (isUrl(f.link)) acts += '<a class="btn sm" href="' + esc(f.link) + '" target="_blank" rel="noopener noreferrer">فتح</a>';
  return '<div class="item"><div class="row"><div class="grow"><div class="t">' + esc(f.title) + '</div><div class="m"><span class="tag ' + (f.kind === "pdf" ? "gold" : "") + '">' + kindLabel + "</span> " + (f.blob ? fmtSize(f.size) + " " : "") + esc(path) + "</div>" + (f.desc ? '<div class="hint">' + esc(f.desc) + "</div>" : "") + "</div>" + acts + '</div><div style="margin-top:6px;text-align:end">' + delBtn("f" + f.id, "fdel", 'data-f="' + esc(f.id) + '"') + "</div></div>";
}
const uploadForm = (subjId, topicId, withSel) => '<form class="add" data-form="upload" data-subj="' + esc(subjId || "") + '" data-topic="' + esc(topicId || "") + '"><div class="t">رفع ملف PDF (يبقى على جهازك)</div><input type="file" name="file" accept="application/pdf,.pdf" aria-label="ملف PDF"><input type="text" name="title" placeholder="اسم الملف (اختياري)" maxlength="160" aria-label="اسم الملف">' + (withSel ? '<select name="subject" aria-label="المادة">' + subjOptions("") + "</select>" : "") + '<button class="btn gold" type="submit">ارفع الملف</button><div class="status" id="upstatus" role="status"></div></form>';
const linkForm = (subjId, topicId, withSel) => '<form class="add" data-form="link" data-subj="' + esc(subjId || "") + '" data-topic="' + esc(topicId || "") + '"><div class="t">إضافة فيديو أو رابط</div><select name="kind" aria-label="النوع"><option value="video">فيديو أو محاضرة</option><option value="link">رابط عادي</option><option value="pdf">رابط ملف PDF</option></select><input type="text" name="title" placeholder="العنوان" required maxlength="160" aria-label="العنوان"><input type="text" name="desc" placeholder="وصف قصير (اختياري)" maxlength="300" aria-label="الوصف"><input type="url" name="link" placeholder="https://..." aria-label="الرابط">' + (withSel ? '<select name="subject" aria-label="المادة">' + subjOptions("") + "</select>" : "") + '<button class="btn" type="submit">أضف</button></form>';

/* ---------- install prompt ---------- */
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; if (S.setup && V.tab === "today") render(); });
window.addEventListener("appinstalled", () => { deferredPrompt = null; toast("تم تثبيت التطبيق"); if (S.setup) render(); });
function installBanner() {
  if (isStandalone()) return "";
  if (deferredPrompt) return '<div class="banner"><div class="grow">ثبّت كراسة على هاتفك حتى تشتغل بدون إنترنت</div><button class="btn sm" data-act="install">تثبيت</button></div>';
  if (isIOS()) return '<div class="banner"><div class="grow">للتثبيت على الآيفون: زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"</div></div>';
  return "";
}

/* ---------- views ---------- */
function viewOnboard() {
  return '<div class="hello"><img class="logo" src="icon-192.png" alt=""><div><h1>كراسة</h1><p class="hint" style="font-size:16px">رفيقك بالدراسة: مواضيعك وملفاتك ومراجعاتك بمكان واحد، مجاني وبدون حساب، وكل بياناتك تبقى على جهازك.</p></div>' +
    '<form class="add plain" data-form="onboard" style="gap:12px"><label class="hint">شنو اسمك؟ (اختياري)<input type="text" name="name" maxlength="40" autocomplete="given-name"></label>' +
    '<label class="hint">ابدأ بـ<select name="tpl"><option value="blank">كراسة فارغة (أضيف موادي بنفسي)</option><option value="vocational">السادس المهني الصناعي: فرع الحاسوب (العراق)</option></select></label>' +
    '<button class="btn gold block-btn" type="submit">ابدأ</button></form></div>';
}

function viewToday() {
  const now = new Date(), t = today(), wd = now.getDay(), dd = S.done[t] || {};
  const rv = dueTopics(), dc = dueCards();
  const up = S.exams.filter((e) => e.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  let h = header(S.name ? "أهلاً " + S.name : "كراسة", DAYS[wd] + " · " + t) + installBanner();
  if (up) h += '<section class="block"><div class="row between"><div class="grow"><div class="hint" style="margin:0">أقرب اختبار</div><div class="t">' + esc(up.name) + '</div></div><div style="text-align:center"><div class="count">' + diffDays(t, up.date) + '</div><div class="hint" style="margin:0">يوم</div></div></div></section>';
  h += todayExtras();
  h += '<section class="block"><div class="row between"><div><h2><span class="mark">بطاقات المراجعة</span></h2><div class="hint">' + (dc.length ? dc.length + " بطاقة مستحقة اليوم" : "ما أكو بطاقات مستحقة. أضف بطاقات من صفحة أي موضوع.") + "</div></div>" + (dc.length ? '<button class="btn gold" data-act="study">ابدأ</button>' : "") + "</div></section>";
  h += '<section class="block"><h2><span class="mark">مراجعات اليوم</span></h2>';
  h += rv.length ? '<div class="list">' + rv.map((r) => '<div class="item row between"><div class="grow"><div class="t">' + esc(r.t.title) + '</div><div class="m">' + esc(r.s.name) + " › " + esc(r.c.title) + " · المراجعة " + (r.t.rev + 1) + " من " + INTERVALS.length + '</div></div><button class="btn sm" data-act="review" data-s="' + esc(r.s.id) + '" data-c="' + esc(r.c.id) + '" data-t="' + esc(r.t.id) + '">راجعته</button></div>').join("") + "</div>" : '<div class="empty">ما عندك مراجعات اليوم. علّم المواضيع اللي درستها بقسم المواد وتظهر هنا بمواعيدها.</div>';
  h += "</section>";
  const items = S.routine.filter((r) => r.days.includes(wd)).sort((a, b) => (a.time < b.time ? -1 : 1));
  h += '<section class="block"><div class="row between" style="margin-bottom:6px"><h2>روتين اليوم</h2><span class="tag gold">جلسات التركيز: ' + (S.sessions[t] || 0) + "</span></div>";
  h += items.length ? '<div class="list">' + items.map((r) => '<div class="item row"><input type="checkbox" id="r' + esc(r.id) + '" data-act="rtoggle" data-r="' + esc(r.id) + '" ' + (dd[r.id] ? "checked" : "") + '><label class="grow" for="r' + esc(r.id) + '"><span class="t" ' + (dd[r.id] ? 'style="text-decoration:line-through;color:var(--muted)"' : "") + ">" + esc(r.text) + '</span><div class="m" style="direction:ltr;text-align:start">' + esc(r.time) + '</div></label><button class="x" data-act="rdel" data-r="' + esc(r.id) + '" aria-label="حذف">×</button></div>').join("") + "</div>" : '<div class="empty">ما أكو بنود لهذا اليوم. أضف أول بند.</div>';
  h += '<form class="add" data-form="routine"><div class="two"><input type="time" name="time" required aria-label="الوقت"><input type="text" name="text" placeholder="شنو تسوي؟" required maxlength="160" aria-label="البند"></div><div class="days" role="group" aria-label="الأيام">' + DAYS.map((d, i) => '<label><input type="checkbox" name="d" value="' + i + '" ' + 'checked' + ">" + d + "</label>").join("") + '</div><button class="btn" type="submit">أضف للروتين</button></form></section>';
  return h;
}

function resultsHtml() {
  const q = V.q.trim().toLowerCase();
  if (!q) return "";
  const out = [];
  eachTopic((s, c, t) => { if (t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)) out.push({ s, c, t }); });
  if (!out.length) return '<div class="empty">ما لقيت شي.</div>';
  return out.slice(0, 40).map((r) => '<button class="crow" data-act="openT" data-s="' + esc(r.s.id) + '" data-c="' + esc(r.c.id) + '" data-t="' + esc(r.t.id) + '"><span class="grow"><span class="t">' + (r.t.star ? '<span class="star">★</span> ' : "") + esc(r.t.title) + '</span><span class="m" style="display:block">' + esc(r.s.name) + " › " + esc(r.c.title) + '</span></span><span class="chev">‹</span></button>').join("");
}

function viewSubjects() {
  if (V.subj && V.chap && V.topic) {
    const s = getS(V.subj), c = getC(s, V.chap), tp = getT(c, V.topic);
    if (!tp) { V.topic = null; return viewSubjects(); }
    let h = crumbs([{ t: "المواد", act: "toSubjects" }, { t: s.name, act: "toSubject" }, { t: c.title, act: "toChapter" }, { t: tp.title }]) + header(tp.title, s.name + " › " + c.title);
    let meta = "";
    if (tp.studiedOn) {
      if (tp.rev < INTERVALS.length) { const due = addDays(tp.last || tp.studiedOn, INTERVALS[tp.rev]); meta = due <= today() ? '<span class="due">مراجعتك مستحقة اليوم</span>' : "المراجعة الجاية: " + due; } else meta = '<span style="color:var(--ok)">خلصت كل المراجعات</span>';
    }
    const a = 'data-s="' + esc(s.id) + '" data-c="' + esc(c.id) + '" data-t="' + esc(tp.id) + '"';
    h += '<section class="block"><div class="row between"><div class="grow"><div class="t">' + (tp.studiedOn ? "مدروس" : "لم يُدرس بعد") + '</div><div class="m">' + (meta || "علّمه مدروس حتى تبدأ مراجعاته") + '</div></div><button class="btn alt sm" data-act="tstar" ' + a + ' aria-pressed="' + tp.star + '">' + (tp.star ? "★ مهم" : "☆ مهم") + '</button><button class="btn ' + (tp.studiedOn ? "alt" : "gold") + '" data-act="tstudy" ' + a + ">" + (tp.studiedOn ? "إلغاء" : "درسته") + "</button></div></section>";
    h += '<section class="block"><h2>الملخص والملاحظات</h2><textarea data-note ' + a + ' maxlength="30000" placeholder="اكتب التعاريف والقوانين والأسئلة المهمة بكلماتك..." aria-label="ملاحظات الموضوع">' + esc(tp.notes) + '</textarea><div class="hint">تنحفظ تلقائياً على جهازك.</div></section>';
    h += '<section class="block"><h2>بطاقات المراجعة</h2><div class="hint" style="margin-bottom:6px">سؤال وجواب قصير. تظهر لك بمواعيد ذكية حتى ما تنسى.</div>';
    h += tp.cards.length ? '<div class="list">' + tp.cards.map((k) => '<div class="item row"><div class="grow"><div class="t">' + esc(k.q) + (k.alts && k.alts.length ? ' <span class="tag">+' + k.alts.length + ' صيغ</span>' : "") + (k.miss ? ' <span class="tag due">غلطت فيه</span>' : "") + '</div><div class="m">' + esc(k.a) + '</div></div><button class="x" data-act="kdel" ' + a + ' data-k="' + esc(k.id) + '" aria-label="حذف البطاقة">×</button></div>').join("") + "</div>" : '<div class="empty">ما أكو بطاقات لهذا الموضوع.</div>';
    h += '<form class="add" data-form="card" ' + a + '><input type="text" name="q" placeholder="السؤال (مثلاً: عرّف التعجيل المركزي)" required maxlength="1000" aria-label="السؤال"><textarea name="a" style="min-height:70px" placeholder="الجواب" required maxlength="2000" aria-label="الجواب"></textarea><textarea name="alts" style="min-height:70px" placeholder="صيغ أخرى لنفس السؤال (اختياري): سطر لكل صيغة، حتى تتعود عليه بأكثر من صيغة" maxlength="3000" aria-label="صيغ أخرى للسؤال"></textarea><button class="btn" type="submit">أضف بطاقة</button></form></section>';
    const files = S.files.filter((f) => f.topic === tp.id);
    h += '<section class="block"><h2>الملفات والفيديوهات</h2>' + (files.length ? '<div class="list">' + files.map((f) => fileRow(f, false)).join("") + "</div>" : '<div class="empty">ما أكو ملفات لهذا الموضوع.</div>') + uploadForm(s.id, tp.id, false) + linkForm(s.id, tp.id, false) + "</section>";
    h += mediaPanel({ subject: s.id, topic: tp.id });
    return h;
  }
  if (V.subj && V.chap) {
    const s = getS(V.subj), c = getC(s, V.chap);
    if (!c) { V.chap = null; return viewSubjects(); }
    let h = crumbs([{ t: "المواد", act: "toSubjects" }, { t: s.name, act: "toSubject" }, { t: c.title }]) + header(c.title, "اختر الموضوع");
    h += '<div class="mgmt"><button class="btn sm alt" data-act="manage">' + (V.manage ? "إنهاء الإدارة" : "إدارة المواضيع") + "</button></div>";
    h += c.topics.length ? c.topics.map((t) => {
      const a = 'data-s="' + esc(s.id) + '" data-c="' + esc(c.id) + '" data-t="' + esc(t.id) + '"';
      if (V.manage) return '<div class="block" style="padding:12px">' + (V.edit === "t" + t.id ? renameForm("t", a, t.title) : '<div class="t" style="margin-bottom:8px">' + esc(t.title) + '</div><div class="row"><button class="btn sm alt" data-act="edit" data-key="t' + esc(t.id) + '">تعديل الاسم</button>' + delBtn("t" + t.id, "tdel", a) + "</div>") + "</div>";
      const nf = S.files.filter((f) => f.topic === t.id).length;
      return '<button class="crow" data-act="openT" data-t="' + esc(t.id) + '"><span class="grow"><span class="t">' + (t.star ? '<span class="star">★</span> ' : "") + esc(t.title) + '</span><span class="m" style="display:block">' + (t.studiedOn ? "مدروس" : "جديد") + (nf ? " · " + nf + " ملف" : "") + (t.cards.length ? " · " + t.cards.length + " بطاقة" : "") + (t.notes ? " · فيه ملاحظات" : "") + '</span></span><span class="chev">‹</span></button>';
    }).join("") : '<div class="empty">ما أكو مواضيع بهذا الفصل. أضف أول موضوع تحت.</div>';
    h += '<section class="block"><form class="add plain" data-form="topic" data-s="' + esc(s.id) + '" data-c="' + esc(c.id) + '"><div class="row"><input type="text" name="title" placeholder="موضوع جديد بهذا الفصل" required maxlength="160" aria-label="عنوان الموضوع"><button class="btn" type="submit">أضف</button></div></form></section>';
    return h;
  }
  if (V.subj) {
    const s = getS(V.subj);
    if (!s) { V.subj = null; return viewSubjects(); }
    const cn = counts(s);
    let h = crumbs([{ t: "المواد", act: "toSubjects" }, { t: s.name }]) + header(s.name, cn.d + " من " + cn.n + " مواضيع مدروسة");
    h += '<div class="mgmt"><button class="btn sm alt" data-act="manage">' + (V.manage ? "إنهاء الإدارة" : "إدارة الفصول") + "</button></div>";
    if (V.manage) h += V.edit === "s" + s.id ? renameForm("s", 'data-s="' + esc(s.id) + '"', s.name) : '<div class="row" style="margin-bottom:10px"><button class="btn sm alt" data-act="edit" data-key="s' + esc(s.id) + '">تعديل اسم المادة</button>' + delBtn("s" + s.id, "sdel", 'data-s="' + esc(s.id) + '"') + "</div>";
    h += s.chapters.length ? s.chapters.map((c, i) => {
      const n = c.topics.length, d = c.topics.filter((t) => t.studiedOn).length, a = 'data-s="' + esc(s.id) + '" data-c="' + esc(c.id) + '"';
      if (V.manage) return '<div class="block" style="padding:12px">' + (V.edit === "c" + c.id ? renameForm("c", a, c.title) : '<div class="t" style="margin-bottom:8px">' + esc(c.title) + '</div><div class="row"><button class="btn sm alt" data-act="edit" data-key="c' + esc(c.id) + '">تعديل الاسم</button>' + delBtn("c" + c.id, "cdel", a) + "</div>") + "</div>";
      return '<button class="crow" data-act="openC" data-c="' + esc(c.id) + '"><span class="num">' + (i + 1) + '</span><span class="grow"><span class="t">' + esc(c.title) + '</span><span class="m" style="display:block">' + n + " مواضيع · " + d + ' مدروسة</span><span class="bar" style="margin-top:6px"><i style="width:' + (n ? Math.round((d * 100) / n) : 0) + '%"></i></span></span><span class="chev">‹</span></button>';
    }).join("") : '<div class="empty">ما أكو فصول بهذه المادة. أضف أول فصل تحت.</div>';
    h += '<section class="block"><form class="add plain" data-form="chapter" data-s="' + esc(s.id) + '"><div class="row"><input type="text" name="title" placeholder="فصل جديد" required maxlength="120" aria-label="عنوان الفصل"><button class="btn" type="submit">أضف</button></div></form></section>';
    return h;
  }
  let h = header("المواد", "اختر مادة لفتح فصولها");
  h += '<input type="search" data-q placeholder="ابحث بكل المواضيع والملاحظات..." value="' + esc(V.q) + '" aria-label="بحث" style="margin-bottom:14px"><div id="results">' + resultsHtml() + "</div>";
  if (!V.q.trim()) {
    h += S.subjects.length ? '<div class="grid">' + S.subjects.map((s) => {
      const cn = counts(s), p = cn.n ? Math.round((cn.d * 100) / cn.n) : 0;
      return '<button class="tile" data-act="openS" data-s="' + esc(s.id) + '"><span class="ic" aria-hidden="true">' + subjIcon(s.name) + '</span><span class="nm">' + esc(s.name) + '</span><span class="m">' + s.chapters.length + " فصول · " + cn.n + ' مواضيع</span><span class="bar" role="progressbar" aria-valuenow="' + p + '" aria-valuemin="0" aria-valuemax="100" aria-label="تقدم ' + esc(s.name) + '"><i style="width:' + p + '%"></i></span></button>';
    }).join("") + "</div>" : '<div class="empty">ما أكو مواد بعد. أضف أول مادة.</div>';
    h += '<section class="block" style="margin-top:16px"><form class="add plain" data-form="subject"><div class="row"><input type="text" name="name" placeholder="مادة جديدة" required maxlength="80" aria-label="اسم المادة"><button class="btn" type="submit">أضف</button></div></form></section>';
  }
  return h;
}

function viewLibrary() {
  const items = S.files.filter((f) => (V.libF === "all" || f.kind === V.libF) && (!V.libS || subjectOfFile(f) === V.libS));
  let h = header("المكتبة", "كل ملازمك وفيديوهاتك بمكان واحد");
  h += '<div class="chips" role="group" aria-label="النوع">' + [["all", "الكل"], ["pdf", "PDF"], ["video", "فيديو"], ["link", "روابط"]].map((c) => '<button class="chip" data-act="libf" data-f="' + c[0] + '" aria-pressed="' + (V.libF === c[0]) + '">' + c[1] + "</button>").join("") + "</div>";
  h += '<select data-libsubj aria-label="تصفية حسب المادة" style="margin-bottom:12px"><option value="">كل المواد</option>' + S.subjects.map((s) => '<option value="' + esc(s.id) + '" ' + (V.libS === s.id ? "selected" : "") + ">" + esc(s.name) + "</option>").join("") + "</select>";
  h += '<section class="block">' + (items.length ? '<div class="list">' + items.map((f) => fileRow(f, true)).join("") + "</div>" : '<div class="empty">المكتبة فارغة هنا. أضف ملزمة أو فيديو من تحت.</div>') + "</section>";
  h += '<section class="block"><h2>إضافة جديدة</h2>' + uploadForm("", "", true) + linkForm("", "", true) + "</section>";
  return h;
}

function viewExams() {
  const t = today(), list = S.exams.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  let h = crumbs([{ t: "المزيد", act: "toMore" }, { t: "الاختبارات" }]) + header("الاختبارات", "حدد التواريخ وشوف كم يوم باقي");
  h += '<section class="block">' + (list.length ? '<div class="list">' + list.map((e) => {
    const n = diffDays(t, e.date), lab = n > 0 ? "يوم" : n === 0 ? "اليوم" : "انتهى";
    return '<div class="item row"><div style="min-width:64px;text-align:center"><div class="count" ' + (n < 0 ? 'style="color:var(--muted)"' : "") + ">" + (n >= 0 ? n : "–") + '</div><div class="hint" style="margin:0">' + lab + '</div></div><div class="grow"><div class="t">' + esc(e.name) + '</div><div class="m">' + esc(e.date) + (e.subject ? " · " + esc(subjName(e.subject)) : "") + '</div></div><button class="x" data-act="edel" data-e="' + esc(e.id) + '" aria-label="حذف">×</button></div>';
  }).join("") + "</div>" : '<div class="empty">ما أكو اختبارات مسجلة.</div>');
  h += '<form class="add" data-form="exam"><input type="text" name="name" placeholder="اسم الاختبار" required maxlength="160" aria-label="اسم الاختبار"><div class="two"><input type="date" name="date" required aria-label="التاريخ"><select name="subject" aria-label="المادة">' + subjOptions("") + '</select></div><button class="btn" type="submit">أضف اختبار</button></form></section>';
  return h;
}

function viewStats() {
  const t = today(), days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(t, -i));
  const mins = days.map((d) => S.minutes[d] || 0), max = Math.max(30, ...mins);
  let topics = 0, studied = 0, cards = 0;
  eachTopic((s, c, tp) => { topics++; if (tp.studiedOn) studied++; cards += tp.cards.length; });
  let h = crumbs([{ t: "المزيد", act: "toMore" }, { t: "إحصائياتي" }]) + header("إحصائياتي", "آخر 7 أيام");
  h += '<div class="kpis"><div class="kpi"><span class="count">' + streak() + '</span><span class="m">أيام متتالية</span></div><div class="kpi"><span class="count">' + (S.minutes[t] || 0) + '</span><span class="m">دقيقة تركيز اليوم</span></div><div class="kpi"><span class="count">' + studied + "/" + topics + '</span><span class="m">مواضيع مدروسة</span></div><div class="kpi"><span class="count">' + cards + '</span><span class="m">بطاقات مراجعة</span></div></div>';
  h += '<section class="block"><h2>دقائق التركيز</h2><div class="bars">' + days.map((d, i) => '<div class="col"><b>' + (mins[i] || "") + '</b><i style="height:' + Math.round((mins[i] / max) * 90) + 'px"></i>' + DAYS[new Date(d + "T00:00:00").getDay()].slice(0, 4) + "</div>").join("") + "</div></section>";
  return h;
}

function viewBackupOld() {
  let h = crumbs([{ t: "المزيد", act: "toMore" }, { t: "نسخة احتياطية" }]) + header("نسخة احتياطية", "بياناتك على جهازك فقط");
  h += '<section class="block"><h2>تصدير</h2><p class="hint">يحفظ مواضيعك وملاحظاتك وبطاقاتك وجدولك بملف واحد. ملفات الـ PDF تبقى على الجهاز ولا تدخل بالنسخة، فاحتفظ بأصولها.</p><button class="btn gold" data-act="export" style="margin-top:10px">حفظ نسخة احتياطية</button></section>';
  h += '<section class="block"><h2>استرجاع</h2>';
  if (V.importCand) {
    let n = 0; V.importCand.subjects.forEach((s) => s.chapters.forEach((c) => { n += c.topics.length; }));
    h += '<p class="t">ملف صالح: ' + V.importCand.subjects.length + " مواد و" + n + ' موضوع.</p><p class="hint">الاسترجاع يستبدل بياناتك الحالية.</p><div class="row" style="margin-top:10px"><button class="btn danger" data-act="importgo">نعم، استبدل</button><button class="btn alt" data-act="importno">إلغاء</button></div>';
  } else h += '<p class="hint">اختر ملف نسخة احتياطية سابق (.json).</p><input type="file" id="importfile" accept="application/json,.json" aria-label="ملف النسخة الاحتياطية" style="margin-top:8px"><div class="status" id="impstatus" role="status"></div>';
  h += "</section>";
  return h;
}

function viewSettings() {
  let h = crumbs([{ t: "المزيد", act: "toMore" }, { t: "الإعدادات" }]) + header("الإعدادات", "");
  h += '<section class="block"><form class="add plain" data-form="settings"><label class="hint">اسمك<input type="text" name="name" value="' + esc(S.name) + '" maxlength="40"></label><button class="btn" type="submit">حفظ</button></form></section>';
  h += '<section class="block"><h2>حذف كل البيانات</h2><p class="hint">يمسح موادك وملاحظاتك وملفاتك من هذا الجهاز نهائياً. خذ نسخة احتياطية أول.</p><div style="margin-top:10px">' + delBtn("reset", "reset", "") + "</div></section>";
  return h;
}

function viewInstall() {
  let h = crumbs([{ t: "المزيد", act: "toMore" }, { t: "التثبيت" }]) + header("ثبّت كراسة على هاتفك", "تشتغل بدون إنترنت");
  h += '<section class="block"><h2>أندرويد (كروم)</h2><p class="hint">اضغط قائمة المتصفح (النقاط الثلاث) ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".</p></section>';
  h += '<section class="block"><h2>آيفون (سفاري)</h2><p class="hint">اضغط زر المشاركة، ثم "إضافة إلى الشاشة الرئيسية".</p></section>';
  if (deferredPrompt && !isStandalone()) h += '<button class="btn gold block-btn" data-act="install">ثبّت الآن</button>';
  return h;
}

function viewAbout(est) {
  let h = crumbs([{ t: "المزيد", act: "toMore" }, { t: "حول التطبيق" }]) + header("كراسة", "الإصدار " + VERSION);
  h += '<section class="block"><p>كراسة تطبيق دراسة مجاني. ما أكو حساب ولا سيرفر: كل شي (مواضيعك، ملاحظاتك، ملفاتك) يبقى على جهازك فقط. إذا مسحت بيانات المتصفح أو غيّرت الجهاز تضيع، فخذ نسخة احتياطية من وقت لوقت.</p>' + (est ? '<p class="hint">المساحة المستخدمة: ' + esc(est) + "</p>" : "") + '<p class="hint">قارئ الـ PDF يعتمد على مكتبة PDF.js مفتوحة المصدر (Mozilla).</p><p class="hint">تطوير: PDIQS Studios — Programming &amp; Development, Iraq Squad Studios.</p></section>';
  return h;
}

function viewMoreOld() {
  if (V.more === "exams") return viewExams();
  if (V.more === "stats") return viewStats();
  if (V.more === "backup") return viewBackup();
  if (V.more === "settings") return viewSettings();
  if (V.more === "install") return viewInstall();
  if (V.more === "about") return viewAbout(estimateText);
  const rows = [["exams", "الاختبارات", "تواريخ وعداد تنازلي"], ["stats", "إحصائياتي", "تركيزك وأيامك المتتالية"], ["backup", "نسخة احتياطية", "حفظ واسترجاع بياناتك"], ["install", "ثبّت على هاتفك", "تشتغل بدون إنترنت"], ["settings", "الإعدادات", "الاسم وحذف البيانات"], ["about", "حول التطبيق", "الإصدار والخصوصية"]];
  return header("المزيد", "") + rows.map((r) => '<button class="crow" data-act="more" data-m="' + r[0] + '"><span class="grow"><span class="t">' + r[1] + '</span><span class="m" style="display:block">' + r[2] + '</span></span><span class="chev">‹</span></button>').join("");
}

const CIRC = 2 * Math.PI * 54;
const fmt = (sec) => pad(Math.floor(sec / 60)) + ":" + pad(sec % 60);
const T = { mode: "focus", total: 0, remaining: 0, running: false, endAt: 0, tip: "" };
function viewTimer() {
  const cnt = S.sessions[today()] || 0, off = CIRC * (1 - (T.total ? T.remaining / T.total : 0));
  let h = header("المؤقت", "بومودورو: ركّز، استرح، كرر");
  h += '<section class="block"><div class="timer"><div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="bgc" cx="60" cy="60" r="54" fill="none" stroke-width="7"/><circle id="ringfg" class="fg ' + (T.mode === "break" ? "brk" : "") + '" cx="60" cy="60" r="54" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + CIRC.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/></svg><div class="center"><div class="time" id="tm" role="timer">' + fmt(Math.ceil(T.remaining)) + '</div><div class="mode">' + (T.mode === "focus" ? "تركيز" : "استراحة") + "</div></div></div></div>";
  h += '<div class="ctrls"><button class="btn gold" data-act="pstart">' + (T.running ? "إيقاف مؤقت" : "ابدأ") + '</button><button class="btn alt" data-act="preset-reset">إعادة</button><button class="btn alt" data-act="pskip">تخطّي</button></div>';
  if (T.mode === "break" && T.tip) h += '<div class="tip">وقت الاستراحة: ' + esc(T.tip) + "</div>";
  h += '<div class="hint" style="text-align:center;margin-top:10px">جلسات التركيز اليوم: <b>' + cnt + "</b> · الشاشة تبقى شغالة أثناء الجلسة</div></section>";
  h += '<section class="block"><h2>الإعدادات</h2><div class="chips">' + [[25, 5], [50, 10], [90, 15]].map((p) => '<button class="chip" data-act="preset" data-f="' + p[0] + '" data-b="' + p[1] + '" aria-pressed="' + (S.pomo.focus === p[0] && S.pomo.brk === p[1]) + '">' + p[0] + " / " + p[1] + "</button>").join("") + '</div><form class="add" data-form="pomo" style="border-top:0;margin-top:0;padding-top:0"><div class="two"><label class="hint">تركيز (دقيقة)<input type="number" name="focus" min="5" max="180" value="' + S.pomo.focus + '"></label><label class="hint">استراحة (دقيقة)<input type="number" name="brk" min="1" max="60" value="' + S.pomo.brk + '"></label></div><button class="btn alt" type="submit">احفظ</button></form><div class="hint" style="margin-top:10px">ابدأ بـ 25/5 أول أسبوع، وبعدها انتقل لـ 50/10. بالاستراحة: ماي ومشي وبدون موبايل.</div></section>';
  return h;
}

let estimateText = "";
async function loadEstimate() {
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); estimateText = fmtSize(e.usage || 0) + " من " + fmtSize(e.quota || 0); if (S.setup && V.tab === "more" && V.more === "about") render(); } } catch (e) { /* ignore */ }
}

/* ---------- render ---------- */
function renderNav() {
  $("nav").innerHTML = TABS.map((t) => '<button class="tab" data-act="tab" data-tab="' + t[0] + '" ' + (V.tab === t[0] ? 'aria-current="page"' : "") + ">" + NAVI[t[0]] + "<span>" + t[1] + "</span></button>").join("");
}
function render() {
  document.documentElement.setAttribute("lang", "ar");
  if (S.theme === "dark") document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme");
  const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute("content", S.theme === "dark" ? "#1E1E21" : "#FBF6EA");
  $("tabs").hidden = !S.setup;
  if (!S.setup) { $("app").innerHTML = viewOnboard(); return; }
  const v = V.tab === "today" ? viewToday : V.tab === "subjects" ? viewSubjects : V.tab === "timer" ? viewTimer : V.tab === "library" ? viewLibrary : viewMore;
  $("app").innerHTML = v();
  renderNav();
}

/* ---------- overlay (PDF reader + flashcards) ---------- */
let R = null, pdfLibP = null, study = null;
function showOverlay(html) {
  const el = $("overlay"); el.innerHTML = html; el.hidden = false;
  if (!V.ov) { V.ov = true; history.pushState(snap(), ""); }
}
function hideOverlay() {
  featCleanup();
  if (R) { try { R.observer && R.observer.disconnect(); R.doc.destroy(); } catch (e) { /* ignore */ } R = null; }
  study = null; V.ov = false;
  const el = $("overlay"); el.hidden = true; el.innerHTML = "";
}
function closeOverlay() { if (history.state && history.state.ov) history.back(); else hideOverlay(); }
const loadPdfLib = () => (pdfLibP = pdfLibP || import("./pdf.min.mjs").then((m) => { m.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker.min.mjs", import.meta.url).href; return m; }));

function setPdfMsg(m) { const sc = $("pdfscroll"); if (sc) sc.innerHTML = '<div class="pdfmsg">' + esc(m) + "</div>"; }
async function openPdf(fid) {
  const f = S.files.find((x) => x.id === fid); if (!f) return;
  showOverlay('<div class="ohead"><button class="btn sm alt" data-act="oclose">إغلاق</button><div class="grow otitle">' + esc(f.title) + '</div></div><div class="pdfscroll" id="pdfscroll"><div class="pdfmsg">جاري فتح الملف...</div></div>');
  try {
    const blob = await idbGet(fid);
    if (!blob) { setPdfMsg("الملف غير موجود على هذا الجهاز. ارفعه من جديد."); return; }
    const lib = await loadPdfLib();
    const doc = await lib.getDocument({ data: await blob.arrayBuffer(), isEvalSupported: false }).promise;
    if (!V.ov) { doc.destroy(); return; }
    const p1 = await doc.getPage(1);
    R = { doc, fid, zoom: 1, observer: null, pages: [], cur: Math.min(Math.max(1, f.lastPage || 1), doc.numPages), first: p1.getViewport({ scale: 1 }), cw: 0 };
    $("overlay").innerHTML = '<div class="ohead"><button class="btn sm alt" data-act="oclose">إغلاق</button><div class="grow otitle">' + esc(f.title) + '</div><span class="pgind" id="pgind"></span><button class="btn sm alt" data-act="zout" aria-label="تصغير">−</button><button class="btn sm alt" data-act="zin" aria-label="تكبير">+</button></div><div class="pdfscroll" id="pdfscroll"></div>';
    const sc = $("pdfscroll"); sc.style.direction = "ltr";
    let tick = null;
    sc.addEventListener("scroll", () => { if (tick) return; tick = setTimeout(() => { tick = null; trackPage(); }, 120); });
    buildPages(true);
  } catch (err) { setPdfMsg("تعذر فتح الملف. تأكد أنه PDF سليم وغير محمي بكلمة سر."); }
}
function buildPages(restore) {
  const sc = $("pdfscroll"); if (!sc || !R) return;
  if (R.observer) R.observer.disconnect();
  sc.innerHTML = ""; R.cw = Math.max(200, sc.clientWidth - 16);
  const w = R.cw * R.zoom, h = w * (R.first.height / R.first.width);
  R.pages = [];
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= R.doc.numPages; i++) { const d = document.createElement("div"); d.className = "pdfpage"; d.dataset.n = i; d.style.width = w + "px"; d.style.height = h + "px"; frag.appendChild(d); R.pages.push(d); }
  sc.appendChild(frag);
  R.observer = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) renderPage(en.target); else unrenderPage(en.target); }), { root: sc, rootMargin: "800px 0px" });
  R.pages.forEach((p) => R.observer.observe(p));
  if (restore) { const t = R.pages[R.cur - 1]; if (t) sc.scrollTop = t.offsetTop - 8; }
  updatePg();
}
async function renderPage(el) {
  if (!R || el._busy || el._done) return;
  el._busy = true; const doc = R.doc, key = R.zoom + ":" + R.cw;
  try {
    const page = await doc.getPage(+el.dataset.n), vp0 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: (R.cw * R.zoom) / vp0.width });
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    while (vp.width * dpr * vp.height * dpr > 14e6 && dpr > 1) dpr -= 0.5;
    const c = document.createElement("canvas");
    c.width = Math.floor(vp.width * dpr); c.height = Math.floor(vp.height * dpr);
    c.style.width = vp.width + "px"; c.style.height = vp.height + "px";
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined }).promise;
    if (!R || R.doc !== doc || !el.isConnected) return;
    el.style.width = vp.width + "px"; el.style.height = vp.height + "px"; el.replaceChildren(c); el._done = key;
  } catch (e) { /* page failed to render */ } finally { el._busy = false; }
}
function unrenderPage(el) { if (el._done) { el.replaceChildren(); el._done = null; } }
function updatePg() { const el = $("pgind"); if (el && R) el.textContent = R.cur + " / " + R.doc.numPages; }
let lpT = null;
function trackPage() {
  const sc = $("pdfscroll"); if (!sc || !R) return;
  const line = sc.scrollTop + sc.clientHeight * 0.3; let cur = 1;
  for (let i = 0; i < R.pages.length; i++) { if (R.pages[i].offsetTop + R.pages[i].offsetHeight > line) { cur = i + 1; break; } cur = i + 1; }
  if (cur === R.cur) return;
  R.cur = cur; updatePg();
  clearTimeout(lpT); lpT = setTimeout(() => { const f = S.files.find((x) => x.id === (R && R.fid)); if (f) { f.lastPage = R.cur; save(); } }, 800);
}
function zoom(d) { if (!R) return; R.zoom = Math.min(3, Math.max(0.5, Math.round((R.zoom + d) * 100) / 100)); buildPages(true); }
let rsT = null;
window.addEventListener("resize", () => { clearTimeout(rsT); rsT = setTimeout(() => { if (R) buildPages(true); }, 250); });

/* flashcards */
function startStudy() {
  const q = dueCards().map((x) => ({ s: x.s.id, c: x.c.id, t: x.t.id, k: x.k.id }));
  if (!q.length) { toast("ما أكو بطاقات مستحقة"); return; }
  for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
  study = { q, i: 0, show: false, ok: 0, no: 0 };
  paintStudy();
}
function paintStudy() {
  let body;
  if (study.i >= study.q.length) {
    body = '<div class="study"><div class="fc"><div><div class="count">' + study.ok + "/" + study.q.length + '</div><p>خلصت مراجعة اليوم. عرفت ' + study.ok + " وما عرفت " + study.no + ".</p></div></div><div class=\"fcbtns\"><button class=\"btn gold\" data-act=\"oclose\">تمام</button></div></div>";
  } else {
    const it = study.q[study.i], k = getT(getC(getS(it.s), it.c), it.t);
    const card = k && k.cards.find((x) => x.id === it.k);
    if (!card) { study.i++; paintStudy(); return; }
    body = '<div class="study"><div class="m" style="text-align:center;margin-bottom:8px">' + (study.i + 1) + " / " + study.q.length + " · " + esc(k.title) + '</div><div class="fc"><div><small>' + (study.show ? "الجواب" : "السؤال") + "</small>" + esc(study.show ? card.a : pickQ(card)) + "</div></div>" +
      (study.show ? '<div class="fcbtns"><button class="btn alt" data-act="cno">ما عرفتها</button><button class="btn gold" data-act="cyes">عرفتها</button></div>' : '<div class="fcbtns"><button class="btn" data-act="cshow">أظهر الجواب</button></div>') + "</div>";
  }
  showOverlay('<div class="ohead"><button class="btn sm alt" data-act="oclose">إغلاق</button><div class="grow otitle">مراجعة البطاقات</div></div>' + body);
}
function gradeCard(ok) {
  const it = study.q[study.i], t = getT(getC(getS(it.s), it.c), it.t), card = t && t.cards.find((x) => x.id === it.k);
  if (card) {
    if (ok) { card.box = Math.min(BOXES.length - 1, card.box + 1); card.due = addDays(today(), BOXES[card.box]); card.right = (card.right || 0) + 1; card.miss = false; study.ok++; }
    else { card.box = 0; card.due = addDays(today(), 1); card.wrong = (card.wrong || 0) + 1; card.miss = true; study.no++; }
    save();
  }
  study.i++; study.show = false; paintStudy();
}

/* ---------- timer logic ---------- */
let wl = null;
function setMode(m) { T.mode = m; T.running = false; T.total = (m === "focus" ? S.pomo.focus : S.pomo.brk) * 60; T.remaining = T.total; T.tip = m === "break" ? BREAKS[Math.floor(Math.random() * BREAKS.length)] : ""; unlock(); }
setMode("focus");
async function lock() { try { if (navigator.wakeLock) wl = await navigator.wakeLock.request("screen"); } catch (e) { /* ignore */ } }
function unlock() { try { if (wl) wl.release(); } catch (e) { /* ignore */ } wl = null; }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && T.running) lock(); });
function beep() {
  try { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) { const c = new Ctx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.15; o.start(); setTimeout(() => { o.stop(); c.close(); }, 450); } } catch (e) { /* ignore */ }
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* ignore */ }
}
function finishTimer() {
  beep();
  if (T.mode === "focus") { const d = today(); S.sessions[d] = (S.sessions[d] || 0) + 1; S.minutes[d] = (S.minutes[d] || 0) + S.pomo.focus; save(); setMode("break"); } else setMode("focus");
  document.title = "كراسة — رفيقك بالدراسة";
  if (S.setup && (V.tab === "timer" || V.tab === "today")) render();
}
setInterval(() => {
  if (!T.running) return;
  T.remaining = Math.max(0, Math.ceil((T.endAt - Date.now()) / 1000));
  if (T.remaining <= 0) { finishTimer(); return; }
  document.title = fmt(T.remaining) + " · " + (T.mode === "focus" ? "تركيز" : "استراحة");
  const tm = $("tm"); if (tm) { tm.textContent = fmt(T.remaining); const fg = $("ringfg"); if (fg) fg.setAttribute("stroke-dashoffset", (CIRC * (1 - T.remaining / T.total)).toFixed(2)); }
}, 250);

/* ---------- upload / backup ---------- */
function setStatus(id, m) { const el = $(id); if (el) el.textContent = m; }
async function doUpload(form) {
  const fd = new FormData(form), f = fd.get("file"), title = String(fd.get("title") || "").trim();
  if (!f || !f.size) { setStatus("upstatus", "اختر ملف PDF أول"); return; }
  if (f.size > 150 * 1024 * 1024) { setStatus("upstatus", "الملف أكبر من 150 ميغابايت"); return; }
  setStatus("upstatus", "جاري الرفع...");
  try {
    if ((await f.slice(0, 5).text()) !== "%PDF-") { setStatus("upstatus", "الملف مو PDF صحيح"); return; }
    const id = uid();
    await idbPut(id, f);
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }
    S.files.unshift({ id, kind: "pdf", title: (title || f.name.replace(/\.pdf$/i, "")).slice(0, 160), desc: "", link: "", blob: true, size: f.size, subject: form.dataset.subj || String(fd.get("subject") || ""), topic: form.dataset.topic || "", lastPage: 1 });
    save(); render(); toast("تم رفع الملف");
  } catch (err) { setStatus("upstatus", "ما كدرت أحفظ الملف (ممكن المساحة ممتلئة)"); }
}
function doExport() {
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "kurrasa-backup-" + today() + ".json";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function readImport(file) {
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) { setStatus("impstatus", "الملف كبير جداً"); return; }
  try {
    const o = JSON.parse(await file.text());
    if (!o || !Array.isArray(o.subjects)) throw new Error("bad");
    const n = normalize(o); n.setup = true; V.importCand = n; render();
  } catch (e) { setStatus("impstatus", "هذا مو ملف نسخة احتياطية صالح"); }
}

/* ---------- events ---------- */
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  if (a !== "askdel") V.del = null;
  switch (a) {
    case "tab": return go({ tab: d.tab, subj: null, chap: null, topic: null, more: null });
    case "theme": S.theme = S.theme === "dark" ? "light" : "dark"; save(); return render();
    case "openS": return go({ subj: d.s, chap: null, topic: null });
    case "openC": return go({ chap: d.c, topic: null });
    case "openT": return go({ subj: d.s || V.subj, chap: d.c || V.chap, topic: d.t });
    case "toSubjects": return go({ subj: null, chap: null, topic: null });
    case "toSubject": return go({ chap: null, topic: null });
    case "toChapter": return go({ topic: null });
    case "more": return go({ more: d.m });
    case "toMore": return go({ more: null });
    case "manage": V.manage = !V.manage; V.edit = null; return render();
    case "askdel": V.del = d.key; return render();
    case "edit": V.edit = d.key; return render();
    case "editoff": V.edit = null; return render();
    case "libf": V.libF = d.f; return render();
    case "install": if (deferredPrompt) { deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (err) { /* ignore */ } deferredPrompt = null; render(); } return;
    case "read": return openPdf(d.f);
    case "oclose": return closeOverlay();
    case "zin": return zoom(0.25);
    case "zout": return zoom(-0.25);
    case "study": return startStudy();
    case "cshow": study.show = true; return paintStudy();
    case "cyes": return gradeCard(true);
    case "cno": return gradeCard(false);
    case "tstudy": { const t = findT(d); if (t) { if (t.studiedOn) { t.studiedOn = null; t.last = null; t.rev = 0; } else { t.studiedOn = today(); t.last = today(); t.rev = 0; } save(); render(); } return; }
    case "tstar": { const t = findT(d); if (t) { t.star = !t.star; save(); render(); } return; }
    case "review": { const t = findT(d); if (t) { t.rev += 1; t.last = today(); save(); render(); } return; }
    case "kdel": { const t = findT(d); if (t) { t.cards = t.cards.filter((k) => k.id !== d.k); save(); render(); } return; }
    case "rtoggle": { const k = today(); S.done[k] = S.done[k] || {}; if (el.checked) S.done[k][d.r] = true; else delete S.done[k][d.r]; save(); return render(); }
    case "rdel": S.routine = S.routine.filter((r) => r.id !== d.r); save(); return render();
    case "tdel": { const c = getC(getS(d.s), d.c); if (c) { c.topics = c.topics.filter((x) => x.id !== d.t); detach([d.t]); save(); render(); } return; }
    case "cdel": { const s = getS(d.s); if (s) { const gone = []; s.chapters.forEach((c) => { if (c.id === d.c) c.topics.forEach((t) => gone.push(t.id)); }); s.chapters = s.chapters.filter((c) => c.id !== d.c); detach(gone); save(); render(); } return; }
    case "sdel": { const s = getS(d.s); if (s) { const gone = []; s.chapters.forEach((c) => c.topics.forEach((t) => gone.push(t.id))); S.subjects = S.subjects.filter((x) => x.id !== d.s); detach(gone); S.files.forEach((f) => { if (f.subject === d.s) f.subject = ""; }); V.subj = V.chap = V.topic = null; V.manage = false; save(); render(); } return; }
    case "fdel": { const f = S.files.find((x) => x.id === d.f); S.files = S.files.filter((x) => x.id !== d.f); save(); render(); if (f && f.blob) idbDel(f.id).catch(() => {}); return; }
    case "edel": S.exams = S.exams.filter((x) => x.id !== d.e); save(); return render();
    case "export": return doExport();
    case "importno": V.importCand = null; return render();
    case "importgo": if (V.importCand) { S = V.importCand; V.importCand = null; V.subj = V.chap = V.topic = null; setMode("focus"); save(); render(); toast("تم الاسترجاع"); } return;
    case "reset": try { localStorage.removeItem(KEY); if (window.indexedDB) indexedDB.deleteDatabase("kurrasa"); } catch (err) { /* ignore */ } S = base(); V.tab = "today"; V.subj = V.chap = V.topic = V.more = null; setMode("focus"); return render();
    case "pstart":
      if (T.running) { T.running = false; T.remaining = Math.max(0, Math.ceil((T.endAt - Date.now()) / 1000)); unlock(); }
      else { if (T.remaining <= 0) T.remaining = T.total; T.endAt = Date.now() + T.remaining * 1000; T.running = true; lock(); }
      return render();
    case "preset-reset": setMode(T.mode); return render();
    case "pskip": setMode(T.mode === "focus" ? "break" : "focus"); return render();
    case "preset": S.pomo.focus = +d.f; S.pomo.brk = +d.b; save(); setMode("focus"); return render();
    default: return featClick(a, d, el);
  }
});

let noteT = null;
document.addEventListener("input", (e) => {
  const el = e.target;
  featInput(el);
  if (el.matches && el.matches("textarea[data-note]")) { const t = findT(el.dataset); if (t) { t.notes = el.value.slice(0, 30000); clearTimeout(noteT); noteT = setTimeout(save, 600); } }
  if (el.matches && el.matches("input[data-q]")) {
    V.q = el.value; const pos = el.selectionStart; render();
    const n = $("app").querySelector("input[data-q]"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (err) { /* ignore */ } }
  }
});
document.addEventListener("change", (e) => {
  const el = e.target;
  featChange(el);
  if (el.matches && el.matches("textarea[data-note]")) { const t = findT(el.dataset); if (t) { t.notes = el.value.slice(0, 30000); clearTimeout(noteT); save(); } }
  if (el.matches && el.matches("select[data-libsubj]")) { V.libS = el.value; render(); }
  if (el.id === "importfile") readImport(el.files[0]);
});
document.addEventListener("submit", (e) => {
  const f = e.target.closest("form[data-form]"); if (!f) return;
  e.preventDefault();
  const k = f.dataset.form, fd = new FormData(f), g = (n) => String(fd.get(n) || "").trim();
  if (k === "upload") { doUpload(f); return; }
  const fr = featSubmit(k, f, fd, g);
  if (fr) { if (fr === true) { save(); render(); } return; }
  if (k === "onboard") { S.name = g("name").slice(0, 40); applyTemplate(S, g("tpl")); S.setup = true; save(); history.replaceState(snap(), ""); return render(); }
  if (k === "routine") { const days = fd.getAll("d").map((x) => clamp(x, 0, 6, 0)); S.routine.push({ id: uid(), time: g("time"), text: g("text").slice(0, 160), days: days.length ? days : [0, 1, 2, 3, 4, 5, 6] }); }
  else if (k === "subject") { if (g("name")) S.subjects.push({ id: uid(), name: g("name").slice(0, 80), chapters: [] }); }
  else if (k === "chapter") { const s = getS(f.dataset.s); if (s && g("title")) s.chapters.push(C0(g("title").slice(0, 120))); }
  else if (k === "topic") { const c = getC(getS(f.dataset.s), f.dataset.c); if (c && g("title")) c.topics.push(T0(g("title").slice(0, 160))); }
  else if (k === "card") { const t = findT(f.dataset); if (t && g("q") && g("a")) t.cards.push({ id: uid(), q: g("q").slice(0, 1000), a: g("a").slice(0, 2000), box: 0, due: today(), alts: g("alts").split("\n").map((x) => x.trim().slice(0, 1000)).filter(Boolean).slice(0, 10), miss: false, right: 0, wrong: 0 }); }
  else if (k === "rename") {
    const v = g("title").slice(0, 160), s = getS(f.dataset.s);
    if (v) { if (f.dataset.kind === "s" && s) s.name = v; else if (f.dataset.kind === "c") { const c = getC(s, f.dataset.c); if (c) c.title = v; } else if (f.dataset.kind === "t") { const t = getT(getC(s, f.dataset.c), f.dataset.t); if (t) t.title = v; } }
    V.edit = null;
  }
  else if (k === "link") {
    let link = g("link");
    if (link && !isUrl(link)) { if (/^[a-z][a-z0-9+.-]*:/i.test(link)) { toast("الرابط لازم يبدأ بـ http أو https"); return; } link = "https://" + link; }
    S.files.unshift({ id: uid(), kind: ["video", "link", "pdf"].includes(g("kind")) ? g("kind") : "link", title: g("title").slice(0, 160), desc: g("desc").slice(0, 300), link: link.slice(0, 600), blob: false, size: 0, subject: f.dataset.subj || g("subject"), topic: f.dataset.topic || "", lastPage: 1 });
  }
  else if (k === "exam") { if (g("date")) S.exams.push({ id: uid(), name: g("name").slice(0, 160), date: g("date"), subject: g("subject") }); }
  else if (k === "settings") { S.name = g("name").slice(0, 40); toast("تم الحفظ"); }
  else if (k === "pomo") { S.pomo.focus = clamp(g("focus"), 5, 180, 50); S.pomo.brk = clamp(g("brk"), 1, 60, 10); save(); setMode("focus"); return render(); }
  save(); render();
});

/* ===================== المميزات الإضافية (v2) ===================== */
Object.assign(V, { fsub: "", fq: "", fhide: false, freveal: {}, code: "", chcode: "", qsub: "" });
const sub = (title, s) => crumbs([{ t: "المزيد", act: "toMore" }, { t: title }]) + header(title, s || "");
const subjOpts = (sel, ph) => '<option value="">' + ph + "</option>" + S.subjects.map((s) => '<option value="' + esc(s.id) + '" ' + (sel === s.id ? "selected" : "") + ">" + esc(s.name) + "</option>").join("");
const pctOf = (g) => (g.max ? Math.round((g.score * 1000) / g.max) / 10 : 0);
const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
async function copyText(txt) { try { await navigator.clipboard.writeText(txt); toast("تم النسخ"); return true; } catch (e) { toast("ما كدرت أنسخ تلقائياً. انسخ الرمز يدوياً."); return false; } }
async function shareFile(blob, name, title) {
  try {
    const f = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
async function shareText(text) { try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === "AbortError") return; } copyText(text); }

/* compact codes (for moving data / challenges without any server) */
const b64e = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const b64d = (t) => { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
async function packText(txt, pre) {
  const enc = new TextEncoder().encode(txt);
  if (window.CompressionStream) { const cs = new Blob([enc]).stream().pipeThrough(new CompressionStream("gzip")); return pre + "G" + b64e(new Uint8Array(await new Response(cs).arrayBuffer())); }
  return pre + "P" + b64e(enc);
}
async function unpackText(code, pre) {
  code = String(code || "").trim().replace(/\s+/g, "");
  if (code.length > 4000000 || !code.startsWith(pre)) throw new Error("bad");
  const kind = code[pre.length], u = b64d(code.slice(pre.length + 1));
  if (kind === "G") { if (!window.DecompressionStream) throw new Error("nogz"); const ds = new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip")); const t = await new Response(ds).text(); if (t.length > 25e6) throw new Error("big"); return t; }
  return new TextDecoder().decode(u);
}

/* ---- media store (sketches + voice notes) ---- */
const mediaPut = (k, v) => idbRun("readwrite", (s) => s.put(v, k), "media");
const mediaGet = (k) => idbRun("readonly", (s) => s.get(k), "media");
const mediaDel = (k) => idbRun("readwrite", (s) => s.delete(k), "media");

/* ---- extras: seeding + validation ---- */
function seedExtras(S0, kind) {
  S0.habits = [
    { id: uid(), name: "ماي (أكواب)", type: "count", target: 8 },
    { id: uid(), name: "نمت 7 ساعات أو أكثر", type: "check", target: 1 },
    { id: uid(), name: "مشي أو رياضة", type: "check", target: 1 },
    { id: uid(), name: "دراسة بدون موبايل", type: "check", target: 1 },
    { id: uid(), name: "فطور صحي", type: "check", target: 1 }
  ];
  if (kind === "vocational" && S0.subjects[1]) {
    const p = S0.subjects[1].id;
    [["التعجيل المركزي", "a = v² / r = ω² r\nيتجه نحو المركز وعمودي على السرعة"], ["القوة المركزية", "Fc = m v² / r  (N)\nلا تنجز شغلاً لأنها عمودية على الحركة"], ["قانون كبلر الثالث", "T² ∝ r³"], ["قانون الجذب العام", "F = G m M / r²"], ["الإزاحة الزاوية", "θ = S / r  (rad)\n2π rad = 360°"], ["السرعة الزاوية", "ω = θ / t = 2π f\nv = ω r"], ["التعجيل الزاوي", "α = Δω / Δt\na_T = α r"], ["عزم القصور الذاتي", "I = m r²  (kg.m²)"], ["العزم المدور", "τ = F r = I α  (N.m)"], ["الطاقة الحركية الدورانية", "KE = ½ I ω²"]]
      .forEach((x) => S0.formulas.push({ id: uid(), subject: p, title: x[0], body: x[1], kind: "formula" }));
  }
}
function normalizeExtras(o, b) {
  const refId = (v) => (v ? sid(v) : "");
  b.goalMin = clamp(o.goalMin, 10, 600, 120); b.target = clamp(o.target, 50, 100, 95); b.quizCount = clamp(o.quizCount, 0, 100000, 0); b.planExam = refId(o.planExam);
  b.habits = arr(o.habits).slice(0, 30).map((h) => ({ id: sid(h && h.id), name: str(h && h.name, 60) || "عادة", type: h && h.type === "count" ? "count" : "check", target: clamp(h && h.target, 1, 50, 1) }));
  b.habitLog = {};
  if (o.habitLog && typeof o.habitLog === "object") for (const k of Object.keys(o.habitLog)) {
    if (!dateOrNull(k) || !o.habitLog[k] || typeof o.habitLog[k] !== "object") continue;
    b.habitLog[k] = {}; for (const id of Object.keys(o.habitLog[k])) b.habitLog[k][sid(id)] = clamp(o.habitLog[k][id], 0, 1000, 0);
  }
  b.grades = arr(o.grades).slice(0, 1000).map((g) => ({ id: sid(g && g.id), subject: refId(g && g.subject), name: str(g && g.name, 100) || "اختبار", score: Math.max(0, Number(g && g.score) || 0), max: Math.max(1, Number(g && g.max) || 100), date: dateOrNull(g && g.date) || today() }));
  b.formulas = arr(o.formulas).slice(0, 1000).map((f) => ({ id: sid(f && f.id), subject: refId(f && f.subject), title: str(f && f.title, 120) || "قانون", body: str(f && f.body, 3000), kind: f && f.kind === "def" ? "def" : "formula" }));
  b.errors = arr(o.errors).slice(0, 1000).map((e) => ({ id: sid(e && e.id), subject: refId(e && e.subject), problem: str(e && e.problem, 2000), mistake: str(e && e.mistake, 1000), fix: str(e && e.fix, 2000), date: dateOrNull(e && e.date) || today(), rev: clamp(e && e.rev, 0, 4, 0), last: dateOrNull(e && e.last) || today() }));
  b.media = arr(o.media).slice(0, 500).map((m) => ({ id: sid(m && m.id), type: m && m.type === "voice" ? "voice" : "sketch", title: str(m && m.title, 100) || "بدون اسم", subject: refId(m && m.subject), topic: refId(m && m.topic), date: dateOrNull(m && m.date) || today(), size: clamp(m && m.size, 0, 1e10, 0), dur: clamp(m && m.dur, 0, 86400, 0) }));
  b.badges = {};
  if (o.badges && typeof o.badges === "object") for (const k of Object.keys(o.badges)) if (dateOrNull(o.badges[k])) b.badges[sid(k)] = o.badges[k];
}

/* ---- badges ---- */
function statsNow() {
  let studied = 0, cards = 0, rights = 0, qs = 0;
  eachTopic((s, c, t) => { if (t.studiedOn) studied++; cards += t.cards.length; t.cards.forEach((k) => { rights += k.right || 0; }); });
  qs = S.quizCount;
  return {
    studied, cards, rights, qs, streak: streak(),
    sess: Object.values(S.sessions).reduce((a, b) => a + b, 0), min: Object.values(S.minutes).reduce((a, b) => a + b, 0),
    pdfs: S.files.filter((f) => f.blob).length, media: S.media.length, best: Math.max(0, ...S.grades.map(pctOf)), grades: S.grades.length
  };
}
const BADGES = [
  ["first", "البداية", "درست أول موضوع", (s) => s.studied >= 1],
  ["t10", "عشرة مواضيع", "درست 10 مواضيع", (s) => s.studied >= 10],
  ["t30", "المثابر", "درست 30 موضوعاً", (s) => s.studied >= 30],
  ["st3", "3 أيام", "3 أيام تركيز متتالية", (s) => s.streak >= 3],
  ["st7", "أسبوع كامل", "7 أيام تركيز متتالية", (s) => s.streak >= 7],
  ["st14", "أسبوعان", "14 يوماً متتالياً", (s) => s.streak >= 14],
  ["st30", "شهر من الالتزام", "30 يوماً متتالياً", (s) => s.streak >= 30],
  ["se10", "10 جلسات", "أكملت 10 جلسات تركيز", (s) => s.sess >= 10],
  ["mi600", "10 ساعات", "600 دقيقة تركيز", (s) => s.min >= 600],
  ["c20", "صانع البطاقات", "أضفت 20 بطاقة", (s) => s.cards >= 20],
  ["r50", "الذاكرة القوية", "50 إجابة صحيحة بالبطاقات", (s) => s.rights >= 50],
  ["q1", "أول اختبار", "أنهيت اختباراً ذاتياً", (s) => s.qs >= 1],
  ["q10", "عشر اختبارات", "أنهيت 10 اختبارات ذاتية", (s) => s.qs >= 10],
  ["pdf", "القارئ", "رفعت أول ملزمة PDF", (s) => s.pdfs >= 1],
  ["art", "الفنان", "حفظت أول رسم أو تسجيل", (s) => s.media >= 1],
  ["g90", "فوق التسعين", "سجلت درجة 90% أو أكثر", (s) => s.best >= 90]
];
function checkBadges() {
  const st = statsNow(), fresh = [];
  BADGES.forEach((b) => { if (!S.badges[b[0]] && b[3](st)) { S.badges[b[0]] = today(); fresh.push(b[1]); } });
  if (fresh.length) setTimeout(() => toast("إنجاز جديد: " + fresh.join("، ")), 300);
}

/* ---- today extras ---- */
function planScope() {
  const t = today(), exams = S.exams.filter((e) => e.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1));
  const ex = exams.find((e) => e.id === S.planExam) || exams[0];
  if (!ex) return null;
  const subs = ex.subject ? S.subjects.filter((s) => s.id === ex.subject) : S.subjects, un = [];
  let doneToday = 0;
  subs.forEach((s) => s.chapters.forEach((c) => c.topics.forEach((tp) => { if (!tp.studiedOn) un.push({ s, c, t: tp }); else if (tp.studiedOn === t) doneToday++; })));
  const left = diffDays(t, ex.date), days = Math.max(1, left - 7), per = un.length ? Math.ceil(un.length / days) : 0;
  return { ex, un, left, days, per, doneToday };
}
const hDone = (h, v) => (h.type === "count" ? v >= h.target : v >= 1);
function errDue(e) { return e.rev < 4 && addDays(e.last, [2, 5, 10, 21][e.rev]) <= today(); }
function missedCards() { const out = []; eachTopic((s, c, t) => t.cards.forEach((k) => { if (k.miss) out.push({ s, c, t, k }); })); return out; }
function todayExtras() {
  const t = today(), mins = S.minutes[t] || 0, goal = S.goalMin, p = Math.min(100, Math.round((mins * 100) / goal));
  let h = '<section class="block"><div class="row between"><div class="grow"><div class="t">هدف اليوم: ' + goal + ' دقيقة تركيز</div><div class="m">' + mins + " دقيقة · " + (p >= 100 ? "حققت هدفك" : "باقي " + (goal - mins) + " دقيقة") + '</div></div></div><span class="bar" style="margin-top:8px"><i style="width:' + p + '%"></i></span></section>';
  const pl = planScope();
  if (pl && pl.per) h += '<section class="block"><div class="row between"><div class="grow"><div class="t">مواضيع اليوم: ' + pl.per + '</div><div class="m">درست ' + pl.doneToday + " اليوم · باقي " + pl.left + ' يوم للاختبار</div></div><button class="btn sm alt" data-act="gomore" data-m="plan">الخطة</button></div></section>';
  const ed = S.errors.filter(errDue).length + missedCards().length;
  if (ed) h += '<section class="block"><div class="row between"><div class="grow"><div class="t">أخطاء للمراجعة: ' + ed + '</div><div class="m">ارجع لها قبل لا تنساها</div></div><button class="btn sm alt" data-act="gomore" data-m="errors">افتح</button></div></section>';
  const log = S.habitLog[t] || {};
  if (S.habits.length) { const n = S.habits.filter((x) => hDone(x, log[x.id] || 0)).length; h += '<section class="block"><div class="row between"><div class="grow"><div class="t">عاداتك اليوم: ' + n + " / " + S.habits.length + '</div><div class="m">ماي، نوم، رياضة...</div></div><button class="btn sm alt" data-act="gomore" data-m="habits">سجّل</button></div></section>'; }
  return h;
}

/* ---- More menu ---- */
function viewMore() {
  const map = { exams: viewExams, stats: viewStats, install: viewInstall, settings: viewSettings, about: () => viewAbout(estimateText), backup: viewBackup, quiz: viewQuizSetup, errors: viewErrors, formulas: viewFormulas, plan: viewPlan, challenge: viewChallenge, grades: viewGrades, habits: viewHabits, badges: viewBadges, media: viewMedia, cal: viewCal };
  if (V.more && map[V.more]) return map[V.more]();
  const groups = [
    ["للدراسة", [["quiz", "اختبار ذاتي", "أسئلة من بطاقاتك بزمن محدد"], ["errors", "دفتر الأخطاء", "أسئلة ومسائل غلطت فيها"], ["formulas", "ورقة القوانين", "قوانينك وتعاريفك بسرعة"], ["plan", "خطتي حتى الامتحان", "كم موضوع باليوم"], ["challenge", "تحدي الأصدقاء", "رمز تشاركه بدون سيرفر"]]],
    ["متابعتي", [["grades", "درجاتي", "رسم بياني ومعدلك"], ["habits", "عاداتي", "ماي ونوم ورياضة"], ["badges", "إنجازاتي", "شارات تحفيزية"], ["stats", "إحصائياتي", "تركيزك وأيامك المتتالية"], ["exams", "تواريخ الاختبارات", "عدّاد تنازلي"]]],
    ["أدوات", [["media", "السبورة والتسجيل الصوتي", "ارسم حل المسائل وسجّل شرحك"], ["cal", "تذكيرات التقويم", "منبهات حتى والتطبيق مسكّر"]]],
    ["التطبيق", [["backup", "نقل بياناتي ونسخة احتياطية", "بين الهاتف والآيباد"], ["install", "ثبّت على هاتفك", "تشتغل بدون إنترنت"], ["settings", "الإعدادات", "الاسم وحذف البيانات"], ["about", "حول التطبيق", "الإصدار والخصوصية"]]]
  ];
  return header("المزيد", "") + groups.map((g) => '<h3 style="margin:18px 0 8px;color:var(--gold-ink)">' + g[0] + "</h3>" + g[1].map((r) => '<button class="crow" data-act="more" data-m="' + r[0] + '"><span class="grow"><span class="t">' + r[1] + '</span><span class="m" style="display:block">' + r[2] + '</span></span><span class="chev">‹</span></button>').join("")).join("");
}

/* ---- quiz (self-test) ---- */
let quiz = null, qTimer = null;
function poolFor(subId) { const out = []; eachTopic((s, c, t) => { if (subId && s.id !== subId) return; t.cards.forEach((k) => out.push({ s, c, t, k })); }); return out; }
function viewQuizSetup() {
  const total = poolFor("").length;
  let h = sub("اختبار ذاتي", "أسئلتك بصيغ مختلفة وبزمن محدد");
  if (!total) return h + '<section class="block"><div class="empty">ما عندك أسئلة بعد. افتح أي موضوع وأضف بطاقات (سؤال وجواب مع صيغ أخرى للسؤال)، وبعدها ترجع هنا وتختبر نفسك.</div></section>';
  h += '<section class="block"><form class="add plain" data-form="quizsetup"><label class="hint">المادة<select name="sub">' + S.subjects.map((s) => ({ s, n: poolFor(s.id).length })).filter((x) => x.n).reduce((a, x) => a + '<option value="' + esc(x.s.id) + '" ' + (V.qsub === x.s.id ? "selected" : "") + ">" + esc(x.s.name) + " (" + x.n + ")</option>", '<option value="">كل المواد (' + total + ")</option>") + "</select></label>" +
    '<label class="hint">عدد الأسئلة<select name="n"><option value="5">5</option><option value="10" selected>10</option><option value="20">20</option><option value="0">كلها</option></select></label>' +
    '<label class="hint">الزمن<select name="t"><option value="0">بدون زمن</option><option value="5">5 دقائق</option><option value="10">10 دقائق</option><option value="20">20 دقيقة</option><option value="30">30 دقيقة</option></select></label>' +
    '<button class="btn gold block-btn" type="submit">ابدأ الاختبار</button></form><div class="hint" style="margin-top:10px">تقيّم نفسك بنفسك: اقرأ السؤال وجاوب بذهنك ثم اضغط "أظهر الجواب". الأسئلة اللي تغلط فيها تروح لدفتر الأخطاء.</div></section>';
  return h;
}
function startQuiz(o) {
  let q = o.items;
  if (!q) {
    const pool = shuffle(poolFor(o.sub));
    q = pool.slice(0, o.n || pool.length).map((x) => { const qs = [x.k.q].concat(x.k.alts || []); return { ref: { s: x.s.id, c: x.c.id, t: x.t.id, k: x.k.id }, q: qs[Math.floor(Math.random() * qs.length)], a: x.k.a }; });
  }
  if (!q.length) { toast("ما أكو أسئلة. أضف بطاقات أول."); return; }
  clearInterval(qTimer);
  quiz = { q, i: 0, show: false, ok: 0, no: 0, miss: [], t0: Date.now(), limit: (o.minutes || 0) * 60, ext: !!o.ext, from: o.from || "", sub: o.sub || "", done: false, secs: 0 };
  if (quiz.limit) qTimer = setInterval(quizTick, 1000);
  paintQuiz();
}
function quizTick() {
  if (!quiz || quiz.done) { clearInterval(qTimer); return; }
  const left = quiz.limit - Math.floor((Date.now() - quiz.t0) / 1000), el = $("qt");
  if (el) el.textContent = fmt(Math.max(0, left));
  if (left <= 0) finishQuiz();
}
function paintQuiz() {
  if (quiz.done) { paintQuizResult(); return; }
  const it = quiz.q[quiz.i], left = quiz.limit ? Math.max(0, quiz.limit - Math.floor((Date.now() - quiz.t0) / 1000)) : 0;
  showOverlay('<div class="ohead"><button class="btn sm alt" data-act="oclose">إنهاء</button><div class="grow otitle">اختبار ذاتي · ' + (quiz.i + 1) + " / " + quiz.q.length + "</div>" + (quiz.limit ? '<span class="pgind" id="qt">' + fmt(left) + "</span>" : "") + '</div><div class="study"><div class="fc"><div><small>' + (quiz.show ? "الجواب" : "السؤال") + "</small>" + esc(quiz.show ? it.a : it.q) + "</div></div>" + (quiz.show ? '<div class="fcbtns"><button class="btn alt" data-act="qno">غلطت</button><button class="btn gold" data-act="qyes">صح</button></div>' : '<div class="fcbtns"><button class="btn" data-act="qshow">أظهر الجواب</button></div>') + "</div>");
}
function gradeQuiz(ok) {
  const it = quiz.q[quiz.i];
  if (ok) quiz.ok++; else { quiz.no++; quiz.miss.push(it); }
  if (!quiz.ext && it.ref) {
    const t = getT(getC(getS(it.ref.s), it.ref.c), it.ref.t), k = t && t.cards.find((x) => x.id === it.ref.k);
    if (k) { if (ok) { k.right = (k.right || 0) + 1; k.miss = false; } else { k.wrong = (k.wrong || 0) + 1; k.miss = true; k.box = 0; k.due = addDays(today(), 1); } }
  }
  quiz.i++; quiz.show = false;
  if (quiz.i >= quiz.q.length) finishQuiz(); else paintQuiz();
}
function finishQuiz() {
  if (!quiz || quiz.done) return;
  quiz.done = true; quiz.secs = Math.floor((Date.now() - quiz.t0) / 1000); clearInterval(qTimer);
  if (!quiz.ext) S.quizCount++;
  save(); paintQuizResult();
}
function quizResultText() {
  const n = quiz.q.length, who = S.name || "طالب";
  return who + ": " + quiz.ok + "/" + n + " بزمن " + fmt(quiz.secs) + (quiz.from ? " (تحدي من " + quiz.from + ")" : "") + " — كراسة";
}
function paintQuizResult() {
  const n = quiz.q.length, p = Math.round((quiz.ok * 100) / n);
  showOverlay('<div class="ohead"><button class="btn sm alt" data-act="oclose">إغلاق</button><div class="grow otitle">نتيجة الاختبار</div></div><div class="study" style="overflow:auto"><div class="block" style="text-align:center"><div class="count">' + quiz.ok + "/" + n + '</div><div class="hint">' + p + "% · الزمن " + fmt(quiz.secs) + "</div></div>" +
    (quiz.miss.length ? '<div class="block"><h2>اللي غلطت فيها</h2><div class="list">' + quiz.miss.map((m) => '<div class="item"><div class="t">' + esc(m.q) + '</div><div class="m">' + esc(m.a) + "</div></div>").join("") + "</div></div>" : '<div class="block"><div class="t">ما غلطت بأي سؤال. ممتاز!</div></div>') +
    '<div class="fcbtns">' + (quiz.ext ? '<button class="btn gold" data-act="qshare">شارك نتيجتك</button>' : '<button class="btn gold" data-act="qsave">سجّلها بدرجاتي</button>') + '<button class="btn alt" data-act="oclose">تمام</button></div></div>');
}

/* ---- error notebook ---- */
function viewErrors() {
  const missed = missedCards();
  let h = sub("دفتر الأخطاء", "ارجع لأخطائك قبل لا تنساها");
  h += '<section class="block"><h2>أسئلة غلطت فيها</h2>' + (missed.length ? '<div class="list">' + missed.map((m) => '<div class="item"><div class="t">' + esc(m.k.q) + '</div><div class="m">' + esc(m.k.a) + '</div><div class="m">' + esc(m.s.name) + " › " + esc(m.t.title) + '</div><div style="margin-top:6px"><button class="btn sm gold" data-act="kfix" data-s="' + esc(m.s.id) + '" data-c="' + esc(m.c.id) + '" data-t="' + esc(m.t.id) + '" data-k="' + esc(m.k.id) + '">صرت أعرفها</button></div></div>').join("") + "</div>" : '<div class="empty">ما أكو أسئلة غلط حالياً. تظهر هنا من الاختبار الذاتي ومراجعة البطاقات.</div>') + "</section>";
  h += '<section class="block"><h2>مسائلي الغلط</h2>' + (S.errors.length ? '<div class="list">' + S.errors.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((e) => {
    const due = e.rev < 4 ? addDays(e.last, [2, 5, 10, 21][e.rev]) : "";
    return '<div class="item"><div class="t">' + esc(e.problem) + "</div>" + (e.mistake ? '<div class="m due">غلطتي: ' + esc(e.mistake) + "</div>" : "") + (e.fix ? '<div class="m">الحل الصحيح: ' + esc(e.fix) + "</div>" : "") + '<div class="m">' + (e.subject ? esc(subjName(e.subject)) + " · " : "") + (e.rev >= 4 ? "أتقنتها" : errDue(e) ? '<span class="due">حلها اليوم</span>' : "راجعها " + due) + '</div><div class="row" style="margin-top:6px">' + (e.rev < 4 ? '<button class="btn sm gold" data-act="efix" data-e="' + esc(e.id) + '">حليتها صح</button>' : "") + delBtn("e" + e.id, "edelerr", 'data-e="' + esc(e.id) + '"') + "</div></div>";
  }).join("") + "</div>" : '<div class="empty">سجّل أي مسألة غلطت فيها، وراح تظهر لك بمواعيد (بعد 2، 5، 10، 21 يوم) حتى تحلها من جديد.</div>');
  h += '<form class="add" data-form="errorform"><select name="subject" aria-label="المادة">' + subjOpts("", "بدون مادة") + '</select><textarea name="problem" style="min-height:80px" placeholder="نص المسألة أو السؤال" required maxlength="2000" aria-label="المسألة"></textarea><input type="text" name="mistake" placeholder="شنو غلطتي؟ (اختياري)" maxlength="1000" aria-label="غلطتي"><textarea name="fix" style="min-height:80px" placeholder="الحل الصحيح (اختياري)" maxlength="2000" aria-label="الحل الصحيح"></textarea><button class="btn" type="submit">سجّل الغلطة</button></form></section>';
  return h;
}

/* ---- formulas sheet ---- */
function viewFormulas() {
  const q = V.fq.trim().toLowerCase();
  const items = S.formulas.filter((f) => (!V.fsub || f.subject === V.fsub) && (!q || f.title.toLowerCase().includes(q) || f.body.toLowerCase().includes(q)));
  let h = sub("ورقة القوانين", "قوانينك وتعاريفك بمكان واحد");
  h += '<select data-fsub aria-label="المادة" style="margin-bottom:10px">' + subjOpts(V.fsub, "كل المواد") + '</select><input type="search" data-fq placeholder="ابحث..." value="' + esc(V.fq) + '" aria-label="بحث" style="margin-bottom:10px"><div class="chips"><button class="chip" data-act="fhide" aria-pressed="' + V.fhide + '">وضع الحفظ: أخفِ الشرح</button></div>';
  h += '<section class="block">' + (items.length ? '<div class="list">' + items.map((f) => {
    const hidden = V.fhide && !V.freveal[f.id];
    return '<div class="item"><div class="row between"><div class="t" style="color:var(--gold-ink)">' + esc(f.title) + '</div><button class="x" data-act="fdelitem" data-i="' + esc(f.id) + '" aria-label="حذف">×</button></div><div class="m">' + (f.subject ? esc(subjName(f.subject)) : "") + "</div>" + (hidden ? '<button class="btn sm alt" data-act="freveal" data-i="' + esc(f.id) + '" style="margin-top:6px">أظهر</button>' : '<div style="white-space:pre-wrap;direction:ltr;text-align:start;font-size:17px;margin-top:4px;unicode-bidi:plaintext">' + esc(f.body) + "</div>") + "</div>";
  }).join("") + "</div>" : '<div class="empty">ما أكو عناصر. أضف أول قانون أو تعريف.</div>') + "</section>";
  h += '<section class="block"><h2>إضافة</h2><form class="add plain" data-form="formula"><select name="subject" aria-label="المادة">' + subjOpts(V.fsub, "بدون مادة") + '</select><select name="kind" aria-label="النوع"><option value="formula">قانون</option><option value="def">تعريف</option></select><input type="text" name="title" placeholder="الاسم (مثلاً: التعجيل المركزي)" required maxlength="120" aria-label="الاسم"><textarea name="body" style="min-height:90px" placeholder="القانون أو التعريف" required maxlength="3000" aria-label="المحتوى"></textarea><button class="btn" type="submit">أضف</button></form></section>';
  return h;
}

/* ---- plan ---- */
function viewPlan() {
  let h = sub("خطتي حتى الامتحان", "المواضيع الباقية موزعة على الأيام");
  const pl = planScope();
  if (!pl) return h + '<section class="block"><div class="empty">أضف تاريخ اختبار حتى أحسب لك الخطة.</div><button class="btn" data-act="gomore" data-m="exams" style="margin-top:8px">تواريخ الاختبارات</button></section>';
  const exams = S.exams.filter((e) => e.date >= today()).sort((a, b) => (a.date < b.date ? -1 : 1));
  h += '<section class="block"><label class="hint">الاختبار<select data-planexam>' + exams.map((e) => '<option value="' + esc(e.id) + '" ' + (pl.ex.id === e.id ? "selected" : "") + ">" + esc(e.name) + " (" + esc(e.date) + ")</option>").join("") + "</select></label></section>";
  h += '<div class="kpis"><div class="kpi"><span class="count">' + pl.left + '</span><span class="m">يوم للاختبار</span></div><div class="kpi"><span class="count">' + pl.un.length + '</span><span class="m">موضوع باقي</span></div><div class="kpi"><span class="count">' + pl.per + '</span><span class="m">موضوع باليوم</span></div><div class="kpi"><span class="count">' + pl.doneToday + '</span><span class="m">درست اليوم</span></div></div>';
  h += '<section class="block"><div class="t">' + (pl.left <= 7 ? "باقي أسبوع أو أقل: خصصه للمراجعة والاختبارات الذاتية." : "خصصت آخر 7 أيام للمراجعة، والباقي لدراسة المواضيع الجديدة.") + "</div></section>";
  h += '<section class="block"><h2>مواضيع اليوم المقترحة</h2>' + (pl.un.length ? pl.un.slice(0, Math.max(1, pl.per)).map((r) => '<button class="crow" data-act="gotopic" data-s="' + esc(r.s.id) + '" data-c="' + esc(r.c.id) + '" data-t="' + esc(r.t.id) + '"><span class="grow"><span class="t">' + esc(r.t.title) + '</span><span class="m" style="display:block">' + esc(r.s.name) + " › " + esc(r.c.title) + '</span></span><span class="chev">‹</span></button>').join("") : '<div class="empty">خلصت كل المواضيع. ركّز على المراجعة والاختبار الذاتي.</div>') + "</section>";
  h += '<section class="block"><h2>هدفي اليومي</h2><form class="add plain" data-form="goal"><label class="hint">دقائق التركيز باليوم<input type="number" name="goal" min="10" max="600" value="' + S.goalMin + '"></label><button class="btn alt" type="submit">احفظ</button></form></section>';
  return h;
}

/* ---- grades ---- */
function gradesChart(list) {
  if (list.length < 2) return '<div class="empty">سجّل درجتين على الأقل حتى يظهر الرسم.</div>';
  const pts = list.slice(-15), W = 300, H = 130, P = 14, x = (i) => P + i * ((W - 2 * P) / (pts.length - 1)), y = (v) => H - P - (v / 100) * (H - 2 * P), ty = y(S.target).toFixed(1);
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart" role="img" aria-label="رسم درجاتك"><line x1="' + P + '" x2="' + (W - P) + '" y1="' + ty + '" y2="' + ty + '" style="stroke:var(--gold);stroke-dasharray:4 3"/><polyline points="' + pts.map((g, i) => x(i).toFixed(1) + "," + y(pctOf(g)).toFixed(1)).join(" ") + '" style="fill:none;stroke:var(--ink);stroke-width:2"/>' + pts.map((g, i) => '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(pctOf(g)).toFixed(1) + '" r="3.5" style="fill:var(--gold)"/>').join("") + "</svg>";
}
function viewGrades() {
  const list = S.grades.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const avg = list.length ? Math.round((list.reduce((a, g) => a + pctOf(g), 0) / list.length) * 10) / 10 : 0;
  let h = sub("درجاتي", "تابع مستواك وهدفك");
  h += '<div class="kpis"><div class="kpi"><span class="count">' + (list.length ? avg + "%" : "–") + '</span><span class="m">معدلي الحالي</span></div><div class="kpi"><span class="count">' + S.target + '%</span><span class="m">هدفي</span></div></div>';
  if (list.length) h += '<div class="hint" style="margin:-4px 0 12px;text-align:center">' + (avg >= S.target ? "أنت فوق هدفك. حافظ عليه." : "باقي " + Math.round((S.target - avg) * 10) / 10 + " نقطة لهدفك.") + "</div>";
  h += '<section class="block"><h2>تطور درجاتي</h2>' + gradesChart(list) + "</section>";
  const per = S.subjects.map((s) => { const g = list.filter((x) => x.subject === s.id); return g.length ? { s, v: Math.round((g.reduce((a, x) => a + pctOf(x), 0) / g.length) * 10) / 10 } : null; }).filter(Boolean);
  if (per.length) h += '<section class="block"><h2>حسب المادة</h2><div class="list">' + per.map((r) => '<div class="item"><div class="row between"><span class="t">' + esc(r.s.name) + '</span><span>' + r.v + '%</span></div><span class="bar" style="margin-top:6px"><i style="width:' + Math.min(100, r.v) + '%"></i></span></div>').join("") + "</div></section>";
  h += '<section class="block"><h2>السجل</h2>' + (list.length ? '<div class="list">' + list.slice().reverse().map((g) => '<div class="item row"><div class="grow"><div class="t">' + esc(g.name) + '</div><div class="m">' + esc(g.date) + (g.subject ? " · " + esc(subjName(g.subject)) : "") + '</div></div><span class="tag gold">' + g.score + "/" + g.max + " · " + pctOf(g) + '%</span><button class="x" data-act="gdel" data-g="' + esc(g.id) + '" aria-label="حذف">×</button></div>').join("") + "</div>" : '<div class="empty">ما سجلت درجات بعد.</div>');
  h += '<form class="add" data-form="grade"><input type="text" name="name" placeholder="اسم الاختبار" required maxlength="100" aria-label="اسم الاختبار"><select name="subject" aria-label="المادة">' + subjOpts("", "بدون مادة") + '</select><div class="two"><input type="number" name="score" step="any" min="0" placeholder="درجتي" required aria-label="درجتي"><input type="number" name="max" step="any" min="1" value="100" required aria-label="الدرجة الكاملة"></div><input type="date" name="date" value="' + today() + '" required aria-label="التاريخ"><button class="btn" type="submit">سجّل الدرجة</button></form></section>';
  h += '<section class="block"><form class="add plain" data-form="target"><label class="hint">هدفي (%)<input type="number" name="target" min="50" max="100" value="' + S.target + '"></label><button class="btn alt" type="submit">احفظ الهدف</button></form></section>';
  return h;
}

/* ---- habits ---- */
function viewHabits() {
  const t = today(), log = S.habitLog[t] || {}, days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(t, -i));
  let h = sub("عاداتي", "عادات صغيرة تقوّي حفظك");
  h += '<section class="block">' + (S.habits.length ? '<div class="list">' + S.habits.map((x) => {
    const v = log[x.id] || 0, dots = days.map((d) => '<i style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-inline-end:4px;background:' + (hDone(x, (S.habitLog[d] || {})[x.id] || 0) ? "var(--gold)" : "var(--bg2)") + '"></i>').join("");
    return '<div class="item"><div class="row"><div class="grow"><div class="t">' + esc(x.name) + '</div><div class="m" style="margin-top:4px">' + dots + "</div></div>" + (x.type === "count" ? '<button class="btn sm alt" data-act="hdec" data-h="' + esc(x.id) + '" aria-label="إنقاص">−</button><span class="t" style="min-width:48px;text-align:center">' + v + "/" + x.target + '</span><button class="btn sm gold" data-act="hinc" data-h="' + esc(x.id) + '" aria-label="زيادة">+</button>' : '<input type="checkbox" data-act="hcheck" data-h="' + esc(x.id) + '" ' + (v >= 1 ? "checked" : "") + ' aria-label="' + esc(x.name) + '">') + '<button class="x" data-act="hdel" data-h="' + esc(x.id) + '" aria-label="حذف العادة">×</button></div></div>';
  }).join("") + "</div>" : '<div class="empty">ما أكو عادات. أضف أول عادة.</div>');
  h += '<form class="add" data-form="habit"><input type="text" name="name" placeholder="عادة جديدة" required maxlength="60" aria-label="اسم العادة"><div class="two"><select name="type" aria-label="النوع"><option value="check">مرة باليوم (تأشير)</option><option value="count">عدّاد</option></select><input type="number" name="target" min="1" max="50" value="1" aria-label="الهدف"></div><button class="btn" type="submit">أضف</button></form></section>';
  return h;
}

/* ---- badges ---- */
function viewBadges() {
  const got = BADGES.filter((b) => S.badges[b[0]]).length;
  return sub("إنجازاتي", got + " من " + BADGES.length) + '<div class="badges">' + BADGES.map((b) => '<div class="bdg ' + (S.badges[b[0]] ? "" : "off") + '"><div class="ic" aria-hidden="true">' + (S.badges[b[0]] ? "★" : "☆") + '</div><div class="t">' + b[1] + '</div><div class="m">' + b[2] + "</div>" + (S.badges[b[0]] ? '<div class="m" style="color:var(--gold-ink)">' + S.badges[b[0]] + "</div>" : "") + "</div>").join("") + "</div>";
}

/* ---- media: sketches + voice notes ---- */
let rec = null, mediaUrl = null, sk = null;
function mediaRow(m, showPath) {
  const path = showPath && m.topic ? topicPath(m.topic) : "";
  return '<div class="item"><div class="row"><div class="grow"><div class="t">' + esc(m.title) + '</div><div class="m"><span class="tag ' + (m.type === "sketch" ? "gold" : "") + '">' + (m.type === "sketch" ? "رسم" : "صوت") + "</span> " + esc(m.date) + " · " + fmtSize(m.size) + (m.type === "voice" && m.dur ? " · " + fmt(m.dur) : "") + (path ? " · " + esc(path) : "") + '</div></div><button class="btn sm gold" data-act="mopen" data-m="' + esc(m.id) + '">' + (m.type === "sketch" ? "فتح" : "تشغيل") + '</button></div><div id="mp-' + esc(m.id) + '"></div><div style="text-align:end;margin-top:6px">' + delBtn("m" + m.id, "mdel", 'data-m="' + esc(m.id) + '"') + "</div></div>";
}
function mediaPanel(ctx) {
  const list = S.media.filter((m) => (ctx.topic ? m.topic === ctx.topic : true)), a = 'data-s="' + esc(ctx.subject || "") + '" data-t="' + esc(ctx.topic || "") + '"';
  return '<section class="block"><h2>السبورة والتسجيل الصوتي</h2>' + (list.length ? '<div class="list">' + list.map((m) => mediaRow(m, !ctx.topic)).join("") + "</div>" : '<div class="empty">ما أكو رسومات أو تسجيلات.</div>') +
    (rec ? "" : '<input type="text" id="rectitle" placeholder="اسم التسجيل (اختياري)" maxlength="100" aria-label="اسم التسجيل" style="margin-top:12px">') +
    '<div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="btn gold" data-act="padnew" ' + a + ">سبورة جديدة</button>" + (rec ? '<button class="btn danger" data-act="recstop">إيقاف التسجيل <span id="rectime">00:00</span></button>' : '<button class="btn" data-act="recstart" ' + a + ">تسجيل صوتي</button>") + "</div></section>";
}
function viewMedia() { return sub("السبورة والتسجيل", "ارسم حل المسائل وسجّل شرحك") + mediaPanel({ subject: "", topic: "" }); }
setInterval(() => { if (rec) { const el = $("rectime"); if (el) el.textContent = fmt(Math.floor((Date.now() - rec.start) / 1000)); } }, 500);
async function startRec(d) {
  try {
    if (!(navigator.mediaDevices && window.MediaRecorder)) { toast("المتصفح ما يدعم التسجيل الصوتي"); return; }
    const title = ($("rectitle") && $("rectitle").value.trim()) || "";
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }), mr = new MediaRecorder(stream);
    rec = { mr, stream, chunks: [], start: Date.now(), title, subject: d.s || "", topic: d.t || "" };
    mr.ondataavailable = (e) => { if (e.data && e.data.size) rec.chunks.push(e.data); };
    mr.onstop = finishRec; mr.start(); render();
  } catch (e) { rec = null; toast("ما كدرت أفتح المايكروفون. تأكد من السماح بالصلاحية."); }
}
function stopRec() { if (rec && rec.mr.state !== "inactive") rec.mr.stop(); }
async function finishRec() {
  const r = rec; rec = null;
  try { r.stream.getTracks().forEach((t) => t.stop()); } catch (e) { /* ignore */ }
  const blob = new Blob(r.chunks, { type: r.mr.mimeType || "audio/webm" });
  if (!blob.size) { render(); return; }
  try {
    const id = uid(); await mediaPut(id, blob);
    S.media.unshift({ id, type: "voice", title: (r.title || "تسجيل " + today()).slice(0, 100), subject: r.subject, topic: r.topic, date: today(), size: blob.size, dur: Math.round((Date.now() - r.start) / 1000) });
    save(); toast("تم حفظ التسجيل");
  } catch (e) { toast("ما كدرت أحفظ التسجيل (المساحة؟)"); }
  render();
}
async function openMedia(id) {
  const m = S.media.find((x) => x.id === id); if (!m) return;
  const blob = await mediaGet(id); if (!blob) { toast("الملف غير موجود على هذا الجهاز"); return; }
  if (m.type === "voice") {
    const box = $("mp-" + id); if (!box) return;
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    mediaUrl = URL.createObjectURL(blob);
    box.innerHTML = '<audio controls autoplay src="' + mediaUrl + '" style="width:100%;margin-top:8px"></audio>';
    return;
  }
  if (mediaUrl) URL.revokeObjectURL(mediaUrl);
  mediaUrl = URL.createObjectURL(blob);
  showOverlay('<div class="ohead"><button class="btn sm alt" data-act="oclose">إغلاق</button><div class="grow otitle">' + esc(m.title) + '</div><button class="btn sm alt" data-act="padedit" data-m="' + esc(id) + '">تعديل</button><button class="btn sm gold" data-act="mshare" data-m="' + esc(id) + '">مشاركة</button></div><div class="pdfscroll" style="display:grid;place-items:center;background:var(--bg2)"><img alt="' + esc(m.title) + '" src="' + mediaUrl + '" style="max-width:100%;height:auto;background:#fff"></div>');
}
const PAPER = "#FFFDF6";
function loadImg(blob) { return new Promise((res) => { const u = URL.createObjectURL(blob), im = new Image(); im.onload = () => { res(im); URL.revokeObjectURL(u); }; im.onerror = () => res(null); im.src = u; }); }
async function openPad(ctx, editId) {
  let bg = null, title = "";
  if (editId) { const blob = await mediaGet(editId); if (blob) bg = await loadImg(blob); const m = S.media.find((x) => x.id === editId); title = m ? m.title : ""; }
  sk = { strokes: [], color: "#2A2A2D", w: 3, eraser: false, bg, ctx, editId: editId || "", cur: null, cv: null, g: null };
  const colors = [["#2A2A2D", "فحمي"], ["#B58A2E", "ذهبي"], ["#C0392B", "أحمر"], ["#2F5BEA", "أزرق"]];
  showOverlay('<div class="ohead"><button class="btn sm alt" data-act="oclose">إغلاق</button><input type="text" id="padtitle" class="grow" placeholder="اسم الرسم" maxlength="100" value="' + esc(title) + '" aria-label="اسم الرسم" style="min-height:36px"><button class="btn sm gold" data-act="padsave">حفظ</button></div><div class="padwrap" id="padwrap"><canvas id="padcv" style="touch-action:none"></canvas></div><div class="padbar">' +
    colors.map((c, i) => '<button class="sw" data-act="padcolor" data-c="' + c[0] + '" aria-label="' + c[1] + '" style="background:' + c[0] + '"' + (i === 0 ? ' aria-pressed="true"' : "") + "></button>").join("") +
    '<button class="chip" data-act="padw" data-w="2">رفيع</button><button class="chip" data-act="padw" data-w="4" aria-pressed="true">وسط</button><button class="chip" data-act="padw" data-w="8">سميك</button><button class="chip" data-act="paderaser" aria-pressed="false">ممحاة</button><button class="chip" data-act="padundo">تراجع</button><button class="chip" data-act="padclear">مسح</button></div>');
  initPad();
}
function initPad() {
  const wrap = $("padwrap"), cv = $("padcv"); if (!wrap || !cv || !sk) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.floor(wrap.clientWidth), h = Math.floor(wrap.clientHeight);
  cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px";
  const g = cv.getContext("2d"); g.scale(dpr, dpr); g.lineCap = "round"; g.lineJoin = "round";
  sk.cv = cv; sk.g = g; sk.w0 = w; sk.h0 = h; padRedraw();
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const seg = (a, b) => { g.strokeStyle = sk.cur.color; g.lineWidth = sk.cur.w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } const p = pos(e); sk.cur = { color: sk.eraser ? PAPER : sk.color, w: sk.eraser ? sk.w * 4 : sk.w, pts: [p] }; seg(p, [p[0] + 0.01, p[1]]); });
  cv.addEventListener("pointermove", (e) => { if (!sk || !sk.cur) return; const p = pos(e), last = sk.cur.pts[sk.cur.pts.length - 1]; seg(last, p); sk.cur.pts.push(p); });
  const end = () => { if (sk && sk.cur) { sk.strokes.push(sk.cur); sk.cur = null; } };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
}
function padRedraw() {
  const g = sk.g; g.fillStyle = PAPER; g.fillRect(0, 0, sk.w0, sk.h0);
  if (sk.bg) { const r = Math.min(sk.w0 / sk.bg.width, sk.h0 / sk.bg.height); g.drawImage(sk.bg, 0, 0, sk.bg.width * r, sk.bg.height * r); }
  sk.strokes.forEach((s) => { g.strokeStyle = s.color; g.lineWidth = s.w; g.beginPath(); s.pts.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); if (s.pts.length === 1) g.lineTo(s.pts[0][0] + 0.01, s.pts[0][1]); g.stroke(); });
}
function padSave() {
  if (!sk || !sk.cv) return;
  const title = (($("padtitle") && $("padtitle").value.trim()) || "رسم " + today()).slice(0, 100), p = sk;
  p.cv.toBlob(async (blob) => {
    if (!blob) { toast("ما كدرت أحفظ الرسم"); return; }
    try {
      if (p.editId) { await mediaPut(p.editId, blob); const m = S.media.find((x) => x.id === p.editId); if (m) { m.title = title; m.size = blob.size; m.date = today(); } }
      else { const id = uid(); await mediaPut(id, blob); S.media.unshift({ id, type: "sketch", title, subject: p.ctx.s || "", topic: p.ctx.t || "", date: today(), size: blob.size, dur: 0 }); }
      save(); toast("تم حفظ الرسم"); closeOverlay(); render();
    } catch (e) { toast("ما كدرت أحفظ الرسم (المساحة؟)"); }
  }, "image/png");
}

/* ---- calendar reminders (.ics) ---- */
const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const icsFold = (l) => { if (l.length <= 24) return l; const out = [l.slice(0, 24)]; for (let i = 24; i < l.length; i += 23) out.push(" " + l.slice(i, i + 23)); return out.join("\r\n"); };
const ymd = (s) => s.replace(/-/g, "");
const hm = (t) => t.replace(":", "") + "00";
function plusMin(t, m) { const [h, mi] = t.split(":").map(Number), tot = Math.min(23 * 60 + 59, h * 60 + mi + m); return pad(Math.floor(tot / 60)) + ":" + pad(tot % 60); }
function buildIcs(o) {
  const n = new Date(), stamp = n.getUTCFullYear() + pad(n.getUTCMonth() + 1) + pad(n.getUTCDate()) + "T" + pad(n.getUTCHours()) + pad(n.getUTCMinutes()) + pad(n.getUTCSeconds()) + "Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kurrasa//AR//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:كراسة"];
  const ev = (title, lines, alarms) => { L.push("BEGIN:VEVENT", "UID:" + uid() + "@kurrasa", "DTSTAMP:" + stamp, ...lines, "SUMMARY:" + icsEsc(title)); (alarms || []).forEach((a) => L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(title), "TRIGGER:" + a, "END:VALARM")); L.push("END:VEVENT"); };
  const t = today(); let count = 0;
  if (o.routine) S.routine.forEach((r) => {
    if (!r.days.length) return;
    let d0 = t; for (let i = 0; i < 7; i++) { if (r.days.includes(new Date(addDays(t, i) + "T00:00:00").getDay())) { d0 = addDays(t, i); break; } }
    ev(r.text, ["DTSTART:" + ymd(d0) + "T" + hm(r.time), "DTEND:" + ymd(d0) + "T" + hm(plusMin(r.time, 30)), "RRULE:FREQ=WEEKLY;BYDAY=" + r.days.map((d) => BYDAY[d]).join(",")], ["-PT5M"]); count++;
  });
  if (o.exams) S.exams.filter((e) => e.date >= t).forEach((e) => { ev("اختبار: " + e.name, ["DTSTART;VALUE=DATE:" + ymd(e.date), "DTEND;VALUE=DATE:" + ymd(addDays(e.date, 1))], ["-P7D", "-P1D"]); count++; });
  if (o.reviews) eachTopic((s, c, tp) => {
    if (!tp.studiedOn || tp.rev >= INTERVALS.length) return;
    let due = addDays(tp.last || tp.studiedOn, INTERVALS[tp.rev]); if (due < t) due = t;
    ev("مراجعة: " + tp.title, ["DTSTART:" + ymd(due) + "T170000", "DTEND:" + ymd(due) + "T172000"], ["PT0M"]); count++;
  });
  if (o.cards) { ev("مراجعة بطاقات كراسة", ["DTSTART:" + ymd(t) + "T" + hm(o.time), "DTEND:" + ymd(t) + "T" + hm(plusMin(o.time, 15)), "RRULE:FREQ=DAILY"], ["PT0M"]); count++; }
  L.push("END:VCALENDAR");
  return { text: L.map(icsFold).join("\r\n") + "\r\n", count };
}
function viewCal() {
  return sub("تذكيرات التقويم", "منبهات تدق حتى والتطبيق مسكّر") + '<section class="block"><p class="hint">اختر شنو تريد، وأسوي لك ملف تفتحه وتضيفه لتقويم هاتفك. التنبيهات تشتغل من التقويم نفسه.</p><form class="add plain" data-form="calform" style="gap:12px;margin-top:10px"><label class="row"><input type="checkbox" name="routine" checked> روتيني الأسبوعي (يتكرر)</label><label class="row"><input type="checkbox" name="exams" checked> تواريخ الاختبارات (تنبيه قبل أسبوع ويوم)</label><label class="row"><input type="checkbox" name="reviews" checked> مراجعات المواضيع القادمة</label><label class="row"><input type="checkbox" name="cards" checked> تذكير يومي بالبطاقات</label><label class="hint">وقت تذكير البطاقات<input type="time" name="time" value="20:30"></label><button class="btn gold block-btn" type="submit">أنشئ ملف التذكيرات</button></form><div class="hint" style="margin-top:10px">إذا طلع لك ملف: افتحه واختر "إضافة إلى التقويم". كل ما تغيّر جدولك أعد إنشاءه.</div></section>';
}

/* ---- data transfer + backup ---- */
function viewBackup() {
  let h = sub("نقل بياناتي ونسخة احتياطية", "بين الهاتف والآيباد بدون سيرفر");
  h += '<section class="block"><h2>إرسال بياناتي</h2><p class="hint">تحفظ مواضيعك وملاحظاتك وبطاقاتك ودرجاتك وجدولك. ملفات الـ PDF والرسومات والتسجيلات تبقى على جهازها ولا تنتقل.</p><div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="btn gold" data-act="bshare">مشاركة النسخة</button><button class="btn alt" data-act="export">حفظ كملف</button><button class="btn alt" data-act="bcode">رمز نصي</button></div>';
  if (V.code) h += '<textarea readonly style="direction:ltr;margin-top:10px;min-height:90px;font-size:12px" aria-label="رمز النقل">' + esc(V.code) + '</textarea><div class="row" style="margin-top:8px"><button class="btn sm" data-act="bcopy">نسخ الرمز</button><span class="hint">' + V.code.length + " حرف</span></div>";
  h += "</section>";
  h += '<section class="block"><h2>استقبال بيانات</h2>';
  if (V.importCand) {
    let n = 0; V.importCand.subjects.forEach((s) => s.chapters.forEach((c) => { n += c.topics.length; }));
    h += '<p class="t">ملف صالح: ' + V.importCand.subjects.length + " مواد و" + n + ' موضوع.</p><p class="hint">الاسترجاع يستبدل بياناتك الحالية.</p><div class="row" style="margin-top:10px"><button class="btn danger" data-act="importgo">نعم، استبدل</button><button class="btn alt" data-act="importno">إلغاء</button></div>';
  } else h += '<p class="hint">اختر ملف نسخة احتياطية (.json):</p><input type="file" id="importfile" accept="application/json,.json" aria-label="ملف النسخة الاحتياطية" style="margin:8px 0"><form class="add plain" data-form="bpaste" style="margin-top:8px"><textarea name="code" style="direction:ltr;min-height:80px;font-size:12px" placeholder="أو الصق الرمز النصي هنا" aria-label="الصق الرمز"></textarea><button class="btn alt" type="submit">استقبل الرمز</button></form><div class="status" id="impstatus" role="status"></div>';
  return h + "</section>";
}

/* ---- challenge ---- */
function viewChallenge() {
  const total = poolFor("").length;
  let h = sub("تحدي الأصدقاء", "بدون سيرفر: رمز تشاركه وتقارنون النتائج");
  h += '<section class="block"><h2>أنشئ تحدياً</h2>' + (total ? '<form class="add plain" data-form="chcreate"><label class="hint">المادة<select name="sub">' + subjOpts("", "كل المواد") + '</select></label><label class="hint">عدد الأسئلة<select name="n"><option value="5">5</option><option value="10" selected>10</option><option value="15">15</option></select></label><button class="btn gold" type="submit">أنشئ الرمز</button></form>' : '<div class="empty">أضف بطاقات (أسئلة) أول حتى تقدر تسوي تحدي.</div>');
  if (V.chcode) h += '<textarea readonly style="direction:ltr;margin-top:10px;min-height:90px;font-size:12px" aria-label="رمز التحدي">' + esc(V.chcode) + '</textarea><div class="row" style="margin-top:8px"><button class="btn sm" data-act="chcopy">نسخ</button><button class="btn sm gold" data-act="chshare">مشاركة</button></div>';
  h += '</section><section class="block"><h2>حل تحدي من صديق</h2><form class="add plain" data-form="chtake"><textarea name="code" style="direction:ltr;min-height:80px;font-size:12px" placeholder="الصق رمز التحدي هنا" required aria-label="رمز التحدي"></textarea><button class="btn" type="submit">ابدأ التحدي</button></form><div class="hint" style="margin-top:8px">بعد ما تخلص تشارك نتيجتك (درجتك والزمن) مع صديقك، والأفضل يفوز.</div></section>';
  return h;
}

/* ---- hooks into the main app ---- */
function featCleanup() {
  clearInterval(qTimer); quiz = null; sk = null;
  if (mediaUrl) { URL.revokeObjectURL(mediaUrl); mediaUrl = null; }
}
function featInput(el) {
  if (el.matches && el.matches("input[data-fq]")) {
    V.fq = el.value; const pos = el.selectionStart; render();
    const n = $("app").querySelector("input[data-fq]"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (err) { /* ignore */ } }
  }
}
function featChange(el) {
  if (!el.matches) return;
  if (el.matches("select[data-planexam]")) { S.planExam = el.value; save(); render(); }
  if (el.matches("select[data-fsub]")) { V.fsub = el.value; render(); }
}
async function importFromText(txt) {
  const o = JSON.parse(txt);
  if (!o || !Array.isArray(o.subjects)) throw new Error("bad");
  const n = normalize(o); n.setup = true; V.importCand = n; render();
}
async function featClick(a, d, el) {
  switch (a) {
    case "gomore": return go({ tab: "more", subj: null, chap: null, topic: null, more: d.m });
    case "gotopic": return go({ tab: "subjects", subj: d.s, chap: d.c, topic: d.t });
    case "qshow": quiz.show = true; return paintQuiz();
    case "qyes": return gradeQuiz(true);
    case "qno": return gradeQuiz(false);
    case "qsave": S.grades.push({ id: uid(), subject: quiz.sub || "", name: "اختبار ذاتي", score: quiz.ok, max: quiz.q.length, date: today() }); save(); toast("تم تسجيلها بدرجاتك"); return;
    case "qshare": return shareText(quizResultText());
    case "kfix": { const t = findT(d), k = t && t.cards.find((x) => x.id === d.k); if (k) { k.miss = false; save(); render(); } return; }
    case "efix": { const e = S.errors.find((x) => x.id === d.e); if (e) { e.rev = Math.min(4, e.rev + 1); e.last = today(); save(); render(); } return; }
    case "edelerr": S.errors = S.errors.filter((x) => x.id !== d.e); save(); return render();
    case "fhide": V.fhide = !V.fhide; V.freveal = {}; return render();
    case "freveal": V.freveal[d.i] = true; return render();
    case "fdelitem": S.formulas = S.formulas.filter((x) => x.id !== d.i); save(); return render();
    case "gdel": S.grades = S.grades.filter((x) => x.id !== d.g); save(); return render();
    case "hcheck": { const t = today(); S.habitLog[t] = S.habitLog[t] || {}; S.habitLog[t][d.h] = el.checked ? 1 : 0; save(); return render(); }
    case "hinc": case "hdec": { const t = today(), h = S.habits.find((x) => x.id === d.h); if (!h) return; S.habitLog[t] = S.habitLog[t] || {}; const v = S.habitLog[t][d.h] || 0; S.habitLog[t][d.h] = Math.max(0, Math.min(1000, v + (a === "hinc" ? 1 : -1))); save(); return render(); }
    case "hdel": S.habits = S.habits.filter((x) => x.id !== d.h); save(); return render();
    case "padnew": return openPad({ s: d.s, t: d.t }, "");
    case "padedit": { const m = S.media.find((x) => x.id === d.m); if (m) { hideOverlay(); history.replaceState(snap(), ""); return openPad({ s: m.subject, t: m.topic }, m.id); } return; }
    case "padcolor": sk.color = d.c; sk.eraser = false; document.querySelectorAll(".padbar .sw").forEach((b) => b.setAttribute("aria-pressed", String(b === el))); document.querySelectorAll('[data-act="paderaser"]').forEach((b) => b.setAttribute("aria-pressed", "false")); return;
    case "padw": sk.w = +d.w; document.querySelectorAll('[data-act="padw"]').forEach((b) => b.setAttribute("aria-pressed", String(b === el))); return;
    case "paderaser": sk.eraser = !sk.eraser; el.setAttribute("aria-pressed", String(sk.eraser)); return;
    case "padundo": sk.strokes.pop(); return padRedraw();
    case "padclear": sk.strokes = []; return padRedraw();
    case "padsave": return padSave();
    case "recstart": return startRec(d);
    case "recstop": return stopRec();
    case "mopen": return openMedia(d.m);
    case "mshare": { const m = S.media.find((x) => x.id === d.m), blob = m && (await mediaGet(m.id)); if (blob) shareFile(blob, "kurrasa-" + m.id + ".png", m.title); return; }
    case "mdel": { const m = S.media.find((x) => x.id === d.m); S.media = S.media.filter((x) => x.id !== d.m); save(); render(); if (m) mediaDel(m.id).catch(() => {}); return; }
    case "bshare": return shareFile(new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }), "kurrasa-backup-" + today() + ".json", "نسخة كراسة");
    case "bcode": V.code = await packText(JSON.stringify(S), "KUR1:"); return render();
    case "bcopy": return copyText(V.code);
    case "chcopy": return copyText(V.chcode);
    case "chshare": return shareText(V.chcode);
  }
}
function featSubmit(k, f, fd, g) {
  if (k === "quizsetup") { V.qsub = g("sub"); startQuiz({ sub: g("sub"), n: clamp(g("n"), 0, 100, 10), minutes: clamp(g("t"), 0, 120, 0) }); return "skip"; }
  if (k === "errorform") { if (g("problem")) S.errors.push({ id: uid(), subject: g("subject"), problem: g("problem").slice(0, 2000), mistake: g("mistake").slice(0, 1000), fix: g("fix").slice(0, 2000), date: today(), rev: 0, last: today() }); return true; }
  if (k === "formula") { if (g("title") && g("body")) S.formulas.push({ id: uid(), subject: g("subject"), title: g("title").slice(0, 120), body: g("body").slice(0, 3000), kind: g("kind") === "def" ? "def" : "formula" }); return true; }
  if (k === "grade") { const score = Number(g("score")), max = Number(g("max")); if (isFinite(score) && isFinite(max) && max > 0 && g("name")) S.grades.push({ id: uid(), subject: g("subject"), name: g("name").slice(0, 100), score: Math.max(0, score), max, date: dateOrNull(g("date")) || today() }); return true; }
  if (k === "target") { S.target = clamp(g("target"), 50, 100, 95); toast("تم حفظ الهدف"); return true; }
  if (k === "goal") { S.goalMin = clamp(g("goal"), 10, 600, 120); toast("تم حفظ الهدف"); return true; }
  if (k === "habit") { if (g("name")) S.habits.push({ id: uid(), name: g("name").slice(0, 60), type: g("type") === "count" ? "count" : "check", target: g("type") === "count" ? clamp(g("target"), 1, 50, 1) : 1 }); return true; }
  if (k === "calform") {
    const r = buildIcs({ routine: !!fd.get("routine"), exams: !!fd.get("exams"), reviews: !!fd.get("reviews"), cards: !!fd.get("cards"), time: /^\d{2}:\d{2}$/.test(g("time")) ? g("time") : "20:30" });
    if (!r.count) { toast("ما أكو شي لتضيفه. اختر خيار أو أضف بيانات أول."); return "skip"; }
    shareFile(new Blob([r.text], { type: "text/calendar" }), "kurrasa-reminders.ics", "تذكيرات كراسة"); toast("تم إنشاء " + r.count + " تذكير"); return "skip";
  }
  if (k === "bpaste") { unpackText(g("code"), "KUR1:").then(importFromText).catch(() => setStatus("impstatus", "الرمز غير صالح أو ناقص")); return "skip"; }
  if (k === "chcreate") {
    const pool = shuffle(poolFor(g("sub"))).slice(0, clamp(g("n"), 1, 30, 10));
    if (!pool.length) { toast("ما أكو أسئلة بهذه المادة"); return "skip"; }
    const q = pool.map((x) => { const qs = [x.k.q].concat(x.k.alts || []); return { q: qs[Math.floor(Math.random() * qs.length)], a: x.k.a }; });
    packText(JSON.stringify({ v: 1, from: S.name || "صديقك", q }), "KURC1:").then((c) => { V.chcode = c; render(); });
    return "skip";
  }
  if (k === "chtake") {
    unpackText(g("code"), "KURC1:").then((t) => {
      const o = JSON.parse(t), q = arr(o.q).slice(0, 30).map((x) => ({ q: str(x && x.q, 1000), a: str(x && x.a, 2000) })).filter((x) => x.q && x.a);
      if (!q.length) throw new Error("empty");
      startQuiz({ items: q, ext: true, from: str(o.from, 40) });
    }).catch(() => toast("رمز التحدي غير صالح"));
    return "skip";
  }
  return false;
}
function pickQ(card) {
  if (study.curId !== card.id) { study.curId = card.id; const qs = [card.q].concat(card.alts || []); study.curQ = qs[Math.floor(Math.random() * qs.length)]; }
  return study.curQ;
}


/* ---------- start ---------- */
(function splash() {
  let el = $("splash");
  if (!el) { el = document.createElement("div"); el.id = "splash"; el.setAttribute("role", "presentation"); el.innerHTML = '<img src="pdiqs-logo.png" alt="PDIQS Studios">'; document.body.appendChild(el); }
  let closed = false;
  const done = () => { if (closed) return; closed = true; el.classList.add("out"); setTimeout(() => el.remove(), 600); };
  el.addEventListener("click", done); setTimeout(done, 3800);
})();
render();
loadEstimate();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController) toast("تم تحديث التطبيق. أعد فتحه لتحصل على آخر نسخة."); });
}
