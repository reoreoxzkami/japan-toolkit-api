# 🇯🇵 Japan Toolkit API

**Free Japan data for developers, everywhere. No API key. CORS enabled.**

Base URL: `https://m-japan-api.sannon2026.workers.dev`

The fiddly Japan-specific logic you don't want to re-implement — national holidays (including substitute & citizen's holidays), business days, era (wareki) conversion, kana → romaji, and fictional Japanese test users — as one simple JSON API. English docs, English + Japanese names in responses.

## Quick start

```bash
curl "https://m-japan-api.sannon2026.workers.dev/v1/holidays/next"
# {
#   "date": "2026-11-23",
#   "name": "Labor Thanksgiving Day",
#   "name_ja": "勤労感謝の日",
#   "days_until": 13
# }
```

```js
const r = await fetch("https://m-japan-api.sannon2026.workers.dev/v1/is-business-day?date=2026-01-12");
console.log(await r.json());
// is_business_day: false — Coming of Age Day
```

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /v1/holidays?year=2026` | All national holidays for a year (2020–2030 rules, incl. substitute / citizen's holidays) |
| `GET /v1/holidays/next?from=YYYY-MM-DD` | Next national holiday |
| `GET /v1/is-business-day?date=YYYY-MM-DD` | Weekend / holiday / business-day check + era info |
| `GET /v1/business-days?from=…&to=…` | Count business days in a range |
| `GET /v1/era?date=YYYY-MM-DD` | Gregorian → Japanese era (wareki) |
| `GET /v1/era?era=Reiwa&year=8` | Era + year → Gregorian year |
| `GET /v1/convert?text=トウキョウ&to=romaji` | Kana conversion: `romaji` / `hiragana` / `katakana` |
| `GET /v1/fake/users?count=5&seed=42` | Fictional Japanese test users (deterministic with a seed, example.com emails) |
| `GET /v1/now` | Current JST time with era + business-day status |

## Rules

- No sign-up, no key. Keep usage reasonable; cache holiday responses (they never change for a given year).
- For legal/official use, verify holidays against official sources.
- Fake users are fictional test data.

Made by [@reodesuxz](https://bsky.app/profile/reodesuxz.bsky.social), a student programmer in Japan.
