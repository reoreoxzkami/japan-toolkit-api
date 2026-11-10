// Japan Toolkit API — free, no key, CORS open. Worker: m-japan-api
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" };
function json(obj, status, cache) {
  const h = Object.assign({}, JSON_HEADERS);
  if (cache) h["cache-control"] = cache;
  return new Response(JSON.stringify(obj, null, 2), { status: status || 200, headers: h });
}
function pad(n) { return String(n).padStart(2, "0"); }
function fmt(d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
function parseDate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return d;
}
function todayJST() {
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function nthMonday(year, month, n) { const d = new Date(Date.UTC(year, month, 1)); const shift = (8 - d.getUTCDay()) % 7; return new Date(Date.UTC(year, month, 1 + shift + (n - 1) * 7)); }
function vernal(year) { const v = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)); return new Date(Date.UTC(year, 2, v)); }
function autumnal(year) { const v = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)); return new Date(Date.UTC(year, 8, v)); }
function holidaysFor(year) {
  const list = [];
  const add = (d, en, ja) => list.push({ date: fmt(d), name: en, name_ja: ja, _d: d.getTime() });
  add(new Date(Date.UTC(year, 0, 1)), "New Year's Day", "元日");
  add(nthMonday(year, 0, 2), "Coming of Age Day", "成人の日");
  add(new Date(Date.UTC(year, 1, 11)), "Foundation Day", "建国記念の日");
  if (year >= 2020) add(new Date(Date.UTC(year, 1, 23)), "The Emperor's Birthday", "天皇誕生日");
  add(vernal(year), "Vernal Equinox Day", "春分の日");
  add(new Date(Date.UTC(year, 3, 29)), "Showa Day", "昭和の日");
  add(new Date(Date.UTC(year, 4, 3)), "Constitution Memorial Day", "憲法記念日");
  add(new Date(Date.UTC(year, 4, 4)), "Greenery Day", "みどりの日");
  add(new Date(Date.UTC(year, 4, 5)), "Children's Day", "こどもの日");
  add(nthMonday(year, 6, 3), "Marine Day", "海の日");
  add(new Date(Date.UTC(year, 7, 11)), "Mountain Day", "山の日");
  add(nthMonday(year, 8, 3), "Respect for the Aged Day", "敬老の日");
  add(autumnal(year), "Autumnal Equinox Day", "秋分の日");
  add(nthMonday(year, 9, 2), "Sports Day", "スポーツの日");
  add(new Date(Date.UTC(year, 10, 3)), "Culture Day", "文化の日");
  add(new Date(Date.UTC(year, 10, 23)), "Labor Thanksgiving Day", "勤労感謝の日");
  list.sort((a, b) => a._d - b._d);
  // Citizen's holiday: a weekday sandwiched between two holidays
  const base = list.slice();
  for (let i = 0; i + 1 < base.length; i++) {
    const gap = (base[i + 1]._d - base[i]._d) / 86400000;
    if (gap === 2) {
      const mid = new Date(base[i]._d + 86400000);
      if (mid.getUTCDay() !== 0) list.push({ date: fmt(mid), name: "Citizen's Holiday", name_ja: "国民の休日", _d: mid.getTime() });
    }
  }
  list.sort((a, b) => a._d - b._d);
  // Substitute holiday: holiday on Sunday -> next non-holiday weekday
  const taken = new Set(list.map(x => x.date));
  const subs = [];
  for (const h of list.slice()) {
    const d = new Date(h._d);
    if (d.getUTCDay() === 0) {
      let nd = new Date(h._d + 86400000);
      while (taken.has(fmt(nd))) nd = new Date(nd.getTime() + 86400000);
      taken.add(fmt(nd));
      subs.push({ date: fmt(nd), name: "Substitute Holiday", name_ja: "振替休日", _d: nd.getTime() });
    }
  }
  const all = list.concat(subs).sort((a, b) => a._d - b._d);
  for (const h of all) delete h._d;
  return all;
}
const holidayCache = {};
function holidayMap(year) {
  if (!holidayCache[year]) { const m = {}; for (const h of holidaysFor(year)) m[h.date] = h; holidayCache[year] = m; }
  return holidayCache[year];
}
const ERAS = [
  { name: "Reiwa", name_ja: "令和", short: "R", start: "2019-05-01" },
  { name: "Heisei", name_ja: "平成", short: "H", start: "1989-01-08" },
  { name: "Showa", name_ja: "昭和", short: "S", start: "1926-12-25" },
  { name: "Taisho", name_ja: "大正", short: "T", start: "1912-07-30" },
  { name: "Meiji", name_ja: "明治", short: "M", start: "1868-01-25" }
];
function eraOf(dateStr) {
  for (const e of ERAS) {
    if (dateStr >= e.start) {
      const y = +dateStr.slice(0, 4) - +e.start.slice(0, 4) + 1;
      return { era: e.name, era_ja: e.name_ja, era_short: e.short, year: y, formatted: e.name + " " + y, formatted_ja: e.name_ja + y + "年" };
    }
  }
  return null;
}
const KANA_ROMAJI = { "あ":"a","い":"i","う":"u","え":"e","お":"o","か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko","さ":"sa","し":"shi","す":"su","せ":"se","そ":"so","た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to","な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no","は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho","ま":"ma","み":"mi","む":"mu","め":"me","も":"mo","や":"ya","ゆ":"yu","よ":"yo","ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro","わ":"wa","を":"wo","ん":"n","が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go","ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo","だ":"da","ぢ":"ji","づ":"zu","で":"de","ど":"do","ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo","ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po","ぁ":"a","ぃ":"i","ぅ":"u","ぇ":"e","ぉ":"o","ゃ":"ya","ゅ":"yu","ょ":"yo","ゎ":"wa" };
const DIGRAPH = { "きゃ":"kya","きゅ":"kyu","きょ":"kyo","しゃ":"sha","しゅ":"shu","しょ":"sho","ちゃ":"cha","ちゅ":"chu","ちょ":"cho","にゃ":"nya","にゅ":"nyu","にょ":"nyo","ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo","みゃ":"mya","みゅ":"myu","みょ":"myo","りゃ":"rya","りゅ":"ryu","りょ":"ryo","ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo","じゃ":"ja","じゅ":"ju","じょ":"jo","ぢゃ":"ja","ぢゅ":"ju","ぢょ":"jo","びゃ":"bya","びゅ":"byu","びょ":"byo","ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo" };
function kataToHira(s) { return s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)); }
function hiraToKata(s) { return s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60)); }
function toRomaji(input) {
  const s = kataToHira(input);
  let out = "", i = 0;
  while (i < s.length) {
    const two = s.substr(i, 2);
    if (s[i] === "っ") { const nxt = DIGRAPH[s.substr(i + 1, 2)] || KANA_ROMAJI[s[i + 1]] || ""; if (nxt) out += nxt[0]; i++; continue; }
    if (s[i] === "ー") { const prev = out.slice(-1); if ("aiueo".includes(prev)) out += prev; i++; continue; }
    if (DIGRAPH[two]) { out += DIGRAPH[two]; i += 2; continue; }
    if (KANA_ROMAJI[s[i]]) { out += KANA_ROMAJI[s[i]]; i++; continue; }
    out += s[i]; i++;
  }
  return out;
}
const FAMILY = [["佐藤","さとう","Sato"],["鈴木","すずき","Suzuki"],["高橋","たかはし","Takahashi"],["田中","たなか","Tanaka"],["伊藤","いとう","Ito"],["渡辺","わたなべ","Watanabe"],["山本","やまもと","Yamamoto"],["中村","なかむら","Nakamura"],["小林","こばやし","Kobayashi"],["加藤","かとう","Kato"],["吉田","よしだ","Yoshida"],["山田","やまだ","Yamada"],["佐々木","ささき","Sasaki"],["山口","やまぐち","Yamaguchi"],["松本","まつもと","Matsumoto"],["井上","いのうえ","Inoue"],["木村","きむら","Kimura"],["林","はやし","Hayashi"],["斎藤","さいとう","Saito"],["清水","しみず","Shimizu"]];
const GIVEN_M = [["翔太","しょうた","Shota"],["蓮","れん","Ren"],["陽翔","はると","Haruto"],["樹","いつき","Itsuki"],["大翔","ひろと","Hiroto"],["悠真","ゆうま","Yuma"],["湊","みなと","Minato"],["健","けん","Ken"],["拓海","たくみ","Takumi"],["蒼","あおい","Aoi"]];
const GIVEN_F = [["結菜","ゆいな","Yuina"],["陽葵","ひまり","Himari"],["莉子","りこ","Riko"],["結愛","ゆあ","Yua"],["紬","つむぎ","Tsumugi"],["美咲","みさき","Misaki"],["葵","あおい","Aoi"],["さくら","さくら","Sakura"],["花","はな","Hana"],["凛","りん","Rin"]];
const PLACES = [["東京都","新宿区"],["大阪府","大阪市"],["愛知県","名古屋市"],["福岡県","福岡市"],["北海道","札幌市"],["神奈川県","横浜市"],["京都府","京都市"],["兵庫県","神戸市"],["宮城県","仙台市"],["広島県","広島市"],["静岡県","静岡市"],["新潟県","新潟市"]];
function rng(seed) { let x = seed >>> 0 || 123456789; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function fakeUsers(count, seed) {
  const r = rng(seed);
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const users = [];
  for (let i = 0; i < count; i++) {
    const fam = pick(FAMILY); const female = r() < 0.5; const giv = pick(female ? GIVEN_F : GIVEN_M); const place = pick(PLACES);
    users.push({ name: fam[0] + " " + giv[0], name_kana: fam[1] + " " + giv[1], name_romaji: fam[2] + " " + giv[2], gender: female ? "female" : "male", email: (giv[2] + "." + fam[2]).toLowerCase() + "@example.com", prefecture: place[0], city: place[1], note: "Fictional test data. Email uses example.com." });
  }
  return users;
}
function dayInfo(dateStr) {
  const d = parseDate(dateStr); if (!d) return null;
  const dow = d.getUTCDay(); const weekend = dow === 0 || dow === 6;
  const hol = holidayMap(d.getUTCFullYear())[dateStr] || null;
  return { date: dateStr, day_of_week: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow], is_weekend: weekend, is_holiday: !!hol, holiday: hol, is_business_day: !weekend && !hol, era: eraOf(dateStr) };
}

const LANDING = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Japan Toolkit API — Free Japanese Holidays, Era, Kana &amp; Fake Users. No API Key.</title>
<meta name="description" content="A free API for developers worldwide: Japanese national holidays, business days, era (wareki) conversion, kana to romaji, and fictional Japanese test users. No API key, CORS enabled.">
<style>
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;color:#1a1a2e;background:#fff;line-height:1.6}
.wrap{max-width:860px;margin:0 auto;padding:24px}
header{border-bottom:3px solid #e63946;padding:28px 0 8px}
h1{font-size:34px;margin:0 0 6px} h2{margin-top:36px;border-left:5px solid #e63946;padding-left:10px}
.badge{display:inline-block;background:#e63946;color:#fff;border-radius:999px;padding:2px 12px;font-size:13px;margin-right:6px}
code{background:#f1f3f5;padding:2px 6px;border-radius:4px;font-size:14px}
pre{background:#0d1117;color:#c9d1d9;padding:14px;border-radius:8px;overflow:auto;font-size:13px}
.ep{border:1px solid #dee2e6;border-radius:8px;padding:12px 16px;margin:10px 0}
button{background:#1a1a2e;color:#fff;border:0;border-radius:6px;padding:8px 16px;cursor:pointer}
footer{color:#666;font-size:13px;border-top:1px solid #eee;margin-top:40px;padding:16px 0}
a{color:#0b7285}
</style></head><body><div class="wrap">
<header><h1>🇯🇵 Japan Toolkit API</h1>
<p>Free Japan data for developers, everywhere. <span class="badge">No API key</span><span class="badge">CORS enabled</span><span class="badge">Free forever tier</span></p>
<p>Japanese national holidays, business-day checks, era (wareki) conversion, kana → romaji, JST now, and fictional Japanese test users — the fiddly Japan-specific logic you do not want to re-implement, as one simple JSON API.</p></header>
<h2>Try it live</h2>
<p><button id="tryBtn">GET /v1/is-business-day?date=today</button></p>
<pre id="out">Click the button — the response appears here.</pre>
<h2>Endpoints</h2>
<div class="ep"><code>GET /v1/holidays?year=2026</code><br>All Japanese national holidays for a year, with English and Japanese names. Includes substitute and citizen's holidays.</div>
<div class="ep"><code>GET /v1/holidays/next</code><br>The next national holiday from today (JST), or from <code>?from=YYYY-MM-DD</code>.</div>
<div class="ep"><code>GET /v1/is-business-day?date=2026-01-12</code><br>Is it a business day in Japan? Returns weekend, holiday and era info too.</div>
<div class="ep"><code>GET /v1/business-days?from=2026-01-01&amp;to=2026-01-31</code><br>Count business days between two dates (inclusive).</div>
<div class="ep"><code>GET /v1/era?date=2026-11-10</code><br>Gregorian → Japanese era (wareki). Reverse: <code>?era=Reiwa&amp;year=8</code>.</div>
<div class="ep"><code>GET /v1/convert?text=トウキョウ&amp;to=romaji</code><br>Convert kana text. <code>to</code> = romaji | hiragana | katakana.</div>
<div class="ep"><code>GET /v1/fake/users?count=5&amp;seed=42</code><br>Fictional Japanese users for testing and i18n demos. Same seed = same users. Emails always use example.com.</div>
<div class="ep"><code>GET /v1/now</code><br>Current time in Japan (JST), with era, holiday and business-day status.</div>
<h2>Example</h2>
<pre>curl "https://m-japan-api.sannon2026.workers.dev/v1/holidays/next"

{
  "date": "2026-11-23",
  "name": "Labor Thanksgiving Day",
  "name_ja": "勤労感謝の日",
  "days_until": 13
}</pre>
<h2>Rules</h2>
<p>No sign-up, no key. Please keep usage reasonable (cache holiday responses — they never change for a given year). Holiday calculation covers 2020–2030 rules including substitute / citizen's holidays; always verify against official sources for legal use. Fake users are fictional.</p>
<footer>Made by <a href="https://bsky.app/profile/reodesuxz.bsky.social">@reodesuxz</a> — a student programmer in Japan. Feedback welcome on Bluesky.</footer>
</div>
<script>
document.getElementById("tryBtn").addEventListener("click", async () => {
  const out = document.getElementById("out");
  out.textContent = "Loading...";
  try {
    const r = await fetch("/v1/now");
    out.textContent = JSON.stringify(await r.json(), null, 2);
  } catch (e) { out.textContent = "Error: " + e.message; }
});
</script>
</body></html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const p = url.pathname.replace(/\/+$/, "") || "/";
    const q = url.searchParams;
    if (request.method === "OPTIONS") return new Response(null, { headers: JSON_HEADERS });
    if (p === "/") return new Response(LANDING, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (p === "/health") return json({ ok: true, service: "Japan Toolkit API", version: "1.0.0" });
    if (p === "/v1" || p === "/v1/") return json({ name: "Japan Toolkit API", version: "1.0.0", docs: "/", endpoints: ["/v1/holidays?year=2026", "/v1/holidays/next?from=YYYY-MM-DD", "/v1/is-business-day?date=YYYY-MM-DD", "/v1/business-days?from=YYYY-MM-DD&to=YYYY-MM-DD", "/v1/era?date=YYYY-MM-DD", "/v1/era?era=Reiwa&year=8", "/v1/convert?text=トウキョウ&to=romaji", "/v1/fake/users?count=5&seed=42", "/v1/now"] });
    if (p === "/v1/holidays") {
      const year = +(q.get("year") || todayJST().getUTCFullYear());
      if (!(year >= 2020 && year <= 2030)) return json({ error: "year must be between 2020 and 2030" }, 400);
      return json({ year, count: holidaysFor(year).length, holidays: holidaysFor(year) }, 200, "public, max-age=86400");
    }
    if (p === "/v1/holidays/next") {
      const fromStr = q.get("from") || fmt(todayJST());
      if (!parseDate(fromStr)) return json({ error: "from must be YYYY-MM-DD" }, 400);
      let cur = holidaysFor(+fromStr.slice(0, 4)).filter(h => h.date > fromStr);
      if (!cur.length) cur = holidaysFor(+fromStr.slice(0, 4) + 1);
      const nxt = cur[0];
      const days = Math.round((parseDate(nxt.date) - parseDate(fromStr)) / 86400000);
      return json(Object.assign({}, nxt, { days_until: days }));
    }
    if (p === "/v1/is-business-day" || p === "/v1/is-holiday") {
      const dateStr = q.get("date") || fmt(todayJST());
      const info = dayInfo(dateStr);
      if (!info) return json({ error: "date must be YYYY-MM-DD" }, 400);
      return json(info);
    }
    if (p === "/v1/business-days") {
      const from = parseDate(q.get("from") || ""), to = parseDate(q.get("to") || "");
      if (!from || !to || to < from) return json({ error: "Provide from and to as YYYY-MM-DD, from <= to" }, 400);
      let count = 0, total = 0;
      for (let t = from.getTime(); t <= to.getTime(); t += 86400000) { total++; if (dayInfo(fmt(new Date(t))).is_business_day) count++; }
      return json({ from: fmt(from), to: fmt(to), total_days: total, business_days: count });
    }
    if (p === "/v1/era") {
      if (q.get("era")) {
        const e = ERAS.find(x => x.name.toLowerCase() === q.get("era").toLowerCase() || x.name_ja === q.get("era") || x.short.toLowerCase() === q.get("era").toLowerCase());
        const y = +(q.get("year") || 1);
        if (!e || !(y >= 1)) return json({ error: "Unknown era. Use Reiwa, Heisei, Showa, Taisho or Meiji with year >= 1" }, 400);
        const greg = +e.start.slice(0, 4) + y - 1;
        return json({ era: e.name, era_ja: e.name_ja, year: y, gregorian_year: greg });
      }
      const dateStr = q.get("date") || fmt(todayJST());
      if (!parseDate(dateStr)) return json({ error: "date must be YYYY-MM-DD" }, 400);
      const era = eraOf(dateStr);
      if (!era) return json({ error: "date is before Meiji era data" }, 400);
      return json(Object.assign({ date: dateStr }, era));
    }
    if (p === "/v1/convert") {
      let text = q.get("text") || "";
      let to = (q.get("to") || "romaji").toLowerCase();
      if (request.method === "POST") { try { const b = await request.json(); text = b.text || text; to = (b.to || to).toLowerCase(); } catch (e) {} }
      if (!text) return json({ error: "text is required" }, 400);
      if (text.length > 500) return json({ error: "text must be 500 characters or less" }, 400);
      let result;
      if (to === "romaji") result = toRomaji(text);
      else if (to === "hiragana") result = kataToHira(text);
      else if (to === "katakana") result = hiraToKata(text);
      else return json({ error: "to must be romaji, hiragana or katakana" }, 400);
      return json({ input: text, to, result });
    }
    if (p === "/v1/fake/users" || p === "/v1/fake/user") {
      const count = Math.min(50, Math.max(1, +(q.get("count") || 1)));
      const seed = +(q.get("seed") || Math.floor(Math.random() * 1000000));
      return json({ count, seed, users: fakeUsers(count, seed) });
    }
    if (p === "/v1/now") {
      const now = new Date();
      const jst = new Date(now.getTime() + 9 * 3600 * 1000);
      const dateStr = fmt(jst);
      const info = dayInfo(dateStr);
      return json({ timezone: "Asia/Tokyo (JST, UTC+9)", iso: jst.toISOString().replace("Z", "+09:00"), date: dateStr, time: pad(jst.getUTCHours()) + ":" + pad(jst.getUTCMinutes()) + ":" + pad(jst.getUTCSeconds()), unix: Math.floor(now.getTime() / 1000), era: eraOf(dateStr), is_business_day: info.is_business_day, is_holiday: info.is_holiday, holiday: info.holiday });
    }
    return json({ error: "Not found. See / for docs.", docs: "/" }, 404);
  }
};
