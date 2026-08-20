# Agnos Patient Intake

A responsive patient intake form whose every keystroke appears on a live front-desk
dashboard. Built for the Agnos front-end candidate assignment.

- **Patient form** — `/patient` · thirteen fields, inline validation, works on a phone
- **Front desk** — `/staff` · every form filling in live, with presence status per patient
- **Live demo** — _to be filled in after deployment_

Two interfaces, one shared channel, no database.

---

## Quick start

```bash
npm install
```

Real-time sync needs a Supabase project (free, about two minutes). The app uses
**Realtime Presence only** — it never reads or writes a table, so there is no schema
to create and nothing to migrate.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Project Settings → Data API** and copy the **Project URL** and the
   **anon public** key.
3. Save them locally:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Both values are public by design — they ship to the browser, and the anon key grants
nothing beyond joining a Realtime channel.

```bash
npm run dev
```

Open <http://localhost:3000/patient> and <http://localhost:3000/staff> side by side, or
put the form on your phone and the dashboard on your laptop.

**Without credentials the app still runs.** The form renders, validates and submits;
each page shows a notice explaining that sync is switched off. Nothing crashes and
nothing is silently broken.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, including `react-hooks` and `next/core-web-vitals` |
| `npm test` | 21 unit tests — validation rules and the presence-merge reducer |

---

## Deploying to Vercel

```bash
npx vercel
```

Add the same two variables under **Project → Settings → Environment Variables**
(Production, Preview and Development), then redeploy. No server, no custom runtime —
all four routes are static, and the only moving part is a WebSocket the browser opens
to Supabase.

---

## How the sync works, in one paragraph

Both pages join one Supabase Realtime channel. The patient's tab publishes its whole
form object into **Presence** — debounced 250 ms — under a per-tab session id. Staff
subscribes to the same channel without publishing, so it observes presence without
appearing in it, and receives the full state of every patient the moment it connects.
Presence was chosen over Broadcast because it already solves the three hard parts:
late joins get a complete snapshot, closing a tab removes the entry with no heartbeat
to write, and the payload *is* the shared state, so there is no snapshot
request/response protocol to invent.

`DEVELOPMENT.md` has the full flow, the folder layout, the component map and the
design reasoning.

---

## What is in here beyond the brief

**Presence and status**

- Five statuses rather than three: **actively filling** (typed within 10 s), **paused**
  (10–60 s), **inactive** (over 60 s, may need help), **submitted**, and **left the
  form**. Staff needs to tell "thinking" apart from "stuck" apart from "gone".
- Status ages on the dashboard's own clock, from the moment each update *arrived*.
  Nothing is timed against the patient's clock, so device clock skew cannot read as
  idleness, and a patient going quiet changes status with no message being sent.
- Status counters double as filters — one control instead of a legend plus a dropdown.
- Fields that just changed flash for 1.4 s, so staff can see *what* moved, not only
  that something did.
- A submitted form stays on the board after the patient closes the tab. That is the
  reason the session map is never pruned.

**Form quality**

- Progress indicator counting answered required fields, sticky to the top of the form.
- Positive inline feedback: a green tick on a valid touched field, not only errors.
- Post-submit summary with a reference code and an explanation of what happens next,
  rather than a bare "success".
- An error summary after a failed submit, with each field name as a button that jumps
  focus to it.
- Cross-field validation: an emergency contact needs both a name and a relationship, or
  neither. Half a contact is worse than none.
- Unicode-aware name rules (`\p{L}\p{M}`), so Thai, Chinese and accented Latin names
  are valid — a Latin-only `[A-Za-z]` rule would reject most of this clinic's patients.
- Phone validated by digit count across `+66`, local and international shapes, not by a
  single-country regex.

**Craft**

- Illustrations are hand-authored SVG built from the logo's own geometry — a square
  rotated 45° with rounded corners, which is literally the shape in the logo file. No
  illustration library, no raster assets, and they inherit the Tailwind colour tokens
  so the artwork cannot drift from the palette.
- One field manifest (`src/lib/fields.ts`) drives the form inputs, the staff rows and
  the progress maths. Thirteen fields across three places is thirty-nine declarations
  that drift; this is one list that cannot.
- Native platform features over dependencies throughout: `<input type="date">`,
  `<datalist>` for nationality, `<details>` for collapsing a card on a phone. No date
  picker, no combobox library, no accordion component.
- Accessibility is wired at the single place it can be enforced — real `<label for>`,
  `aria-invalid`, `aria-describedby`, `role="alert"` on errors, `role="progressbar"`,
  48 px minimum hit areas, and `prefers-reduced-motion` switching off every animation.
- Contrast checked: body copy 12.6:1, and the three status colours 4.7–5.1:1.

---

## Known limitations

These are deliberate, and each has an obvious upgrade path.

- **Nothing is persisted.** Sessions live in memory in each browser tab. Reloading the
  dashboard clears the board. For a form that is entirely PII this is the correct
  default and less code than a database; a real deployment would add an encrypted
  store with a retention policy.
- **`/staff` is not authenticated.** Anyone with the URL sees the board. Out of scope
  for the assignment; in production this needs SSO in front of it.
- **The whole form travels in every presence payload** (~500 bytes for these fields).
  If the form grew to hundreds of fields, switch to Broadcast for field-level patches
  and keep Presence for the snapshot. Marked in the source.
- **English UI.** Copy is not internationalised, though Noto Sans Thai is loaded so
  patients typing in Thai get proper glyphs.

---

## Stack

| | |
| --- | --- |
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS 3.4 — palette mapped to semantic tokens in `tailwind.config.js` |
| Forms | React Hook Form + Zod |
| Real-time | Supabase Realtime Presence |
| Tests | `node:test` via `tsx` |

Tailwind is pinned to 3.4 rather than 4.x so the palette lives in
`tailwind.config.js`, as the brief specifies; v4 moves colours into a CSS `@theme`
block. Next.js is on 16.3 because every 15.x release carries a high-severity advisory
patched only in 16.3.
