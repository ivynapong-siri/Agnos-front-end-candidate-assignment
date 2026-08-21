# Agnos Patient Intake

A responsive, bilingual patient intake form whose every keystroke appears on a live
front-desk dashboard. Built for the Agnos front-end candidate assignment.

**Live demo — <https://agnos-intake-liart.vercel.app>**
**Source — <https://github.com/ivynapong-siri/Agnos-front-end-candidate-assignment>**

- **Patient form** — [`/th/patient`](https://agnos-intake-liart.vercel.app/th/patient) · thirteen fields, inline validation, works on a phone
- **Front desk** — [`/th/staff`](https://agnos-intake-liart.vercel.app/th/staff) · every form filling in live, with presence status per patient
- **English** — the same pages at `/en/patient` and `/en/staff`

Open the two side by side, or one on a phone and one on a laptop, and watch them sync.
Add `?room=yourname` to both URLs to get a channel to yourself.

Two interfaces, one channel, no database.

---

## Quick start

```bash
npm install
```

Real-time sync needs a Supabase project (free, about two minutes). The app uses
**Realtime Presence only** — it never reads or writes a table, so there is no schema
to create and nothing to migrate.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Project Settings → API Keys** and copy the **Project URL** and the
   **anon public** key (newer accounts label it **Publishable key**; either works).
3. Save them locally:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Both values are public by design — they ship to the browser, and the anon key grants
nothing beyond joining a Realtime channel. Next.js reads env files at boot, so restart
the dev server after editing.

```bash
npm run dev
```

Open <http://localhost:3000/th/patient> and <http://localhost:3000/th/staff> side by
side, or put the form on your phone and the dashboard on your laptop. `/` redirects to
the default language.

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
| `npm test` | 69 unit tests — validation, presence merge, CSV export, translations, date/phone pickers, WCAG contrast |

---

## Deploying to Vercel

```bash
npx vercel
```

Add the same two variables under **Project → Settings → Environment Variables**
(Production, Preview and Development), then redeploy. No server and no custom runtime —
all nine routes are prerendered, and the only moving part is a WebSocket the browser
opens to Supabase.

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

**Staff sign in, registration and password reset**

- Three screens at `/th/staff/login`, `/staff/register` and `/staff/reset`, in both
  languages, sharing one two-column shell with the folder artwork.
- **A tick box that fills the form in for you**, and the sample credentials printed
  under it. The point of these screens is the screens; a reviewer should be one tick
  and one click from the desk view and should never have to guess a password.
  Unticking clears the fields again, which is why it is a checkbox and not a button.
- Validation is real and shares the intake form's approach: Zod schemas built per
  locale, so switching language re-renders the errors in the new one. Registration is
  gated on an invite code, mismatched passwords are reported on the field you can fix,
  and a rejected sign in is announced with `role="alert"`.
- "Keep me signed in" moves the session from `sessionStorage` to `localStorage`, so the
  box does something. A front desk is a shared machine, so not ticking it means closing
  the browser signs you out.
- The reset confirmation says "if an account uses this address" rather than "we sent
  it" — the latter tells anyone who asks which of your staff addresses are real.
- No "Continue with Google" button and no testimonials. There is no OAuth configured,
  so that button could only lie; and inventing three customers and three quotes for a
  clinic's login screen would be fabricated praise. The cards over the artwork say what
  the desk view actually does instead.

**Thai and English, throughout**

- The language is part of the URL — `/th/patient`, `/en/staff` — so the server renders
  the right language in the first byte of HTML. No flash of the wrong language, nothing
  for hydration to disagree about, `<html lang>` correct for screen readers, and a link
  in a specific language is shareable.
- Thai is the default. `/` redirects to `/th`.
- **Switching language mid-form keeps everything typed.** A locale change is a real
  navigation, which would otherwise remount the form and discard it, so values are
  mirrored into a sessionStorage draft. That also survives an accidental refresh.
- Stored values stay English (`gender: "Male"`) while the label reads `ชาย`. Without
  that split, switching language would invalidate every answer already chosen.
- A test asserts the two dictionaries have identical key sets, that no string is an
  empty stub, that every placeholder token is one a caller actually fills, and that
  every selectable option has a label in both languages. A missing translation fails
  the build rather than showing a blank to a patient.

**Typography for older readers**

- One typeface for both scripts: **Anuphan**, drawn as a Thai/Latin pair, so the two
  share metrics instead of being two fonts of different apparent size stacked together.
- The type scale is larger than Tailwind's default and its line-heights are well above
  it — 1.75 on body copy. Thai stacks a vowel *and* a tone mark above the base glyph,
  and at Tailwind's stock 1.25–1.5 those marks collide or clip. Set on the `fontSize`
  scale rather than as `leading-*` utilities, so every piece of text gets it, including
  text nobody remembered to annotate.

**CSV export that Excel opens correctly**

One button on the dashboard exports whatever the filter is currently showing, so
"submitted only" needs no second control. Three things go wrong with a naive CSV, and
all three are handled:

| Problem | Symptom | Fix |
| --- | --- | --- |
| Excel on Windows does not sniff UTF-8 | `สมชาย` becomes `à¸ªà¸¡à¸Šà¸²à¸¢` | a byte-order mark, one character |
| Excel eats a leading zero | `0812345678` becomes `812345678` | wrap the value as `="…"` |
| Excel evaluates formulas from CSV | a patient types `=HYPERLINK(…)` into the address field and it runs on a staff machine | the same wrapper, which resolves to literal text |

The third is a genuine injection path across a trust boundary — the patient is an
untrusted author and staff's spreadsheet is the reader — so it has its own test.
Headers and option values follow the language the dashboard is in; timestamps are
written `2026-08-21 14:32`, which sorts correctly in a spreadsheet and does not switch
to the Buddhist era halfway through the file.

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
- Leaving the form removes the card. It is stamped as departing, animates out over
  320 ms and is then dropped — and `untrack()` fires on unmount and on `pagehide`, so
  the server is told immediately instead of being left to notice the socket died.
- **One exception:** a patient who *submitted* and then closed the tab keeps their row.
  That is the completed intake, the thing staff most needs, and its badge reads
  "submitted" so it presents as a record rather than a stale live session.
- A session with no name at all is not shown. Somebody who opened the page and typed
  nothing is not a patient yet, and an unnamed card is noise. Filtered at the source,
  so the count, the chips, the cards and the export all agree.
- `?room=<name>` on either page opts into a private channel. Without it, everyone on a
  deployment shares one board — right for one clinic's front desk, wrong for a public
  demo where two strangers would watch each other type. The room is remembered for the
  tab, so navigating within the app keeps it.

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
  the progress maths. It holds structure only, no copy, so adding a field is a data
  change and adding a language touches no JSX.
- Native platform features over dependencies throughout: `<input type="date">`,
  `<datalist>` for nationality, `<details>` for collapsing a card on a phone, `Blob`
  for the download. No date picker, no combobox library, no accordion, no CSV package,
  and no i18n runtime — the interpolator is four lines.
- Accessibility is wired at the single place it can be enforced — real `<label for>`,
  `aria-invalid`, `aria-describedby`, `role="alert"` on errors, `role="progressbar"`,
  44 px minimum hit areas, and `prefers-reduced-motion` switching off every animation.
- Contrast is measured, not eyeballed, and asserted in a test that parses
  `globals.css` — so a palette change that breaks AA fails the build. Body copy is
  15.7:1; the status colours 5.1–5.8:1; control borders 3.3:1 against white, which is
  the WCAG 1.4.11 floor for the boundary of an interactive component.
- **Three real AA failures were found this way and fixed.** The supplied palette's
  `#9CA3AF` secondary text was 2.44:1 — used on every hint, placeholder and staff-card
  label. The amber status was 4.07:1. And control borders at `#E8EEF9` were 1.16:1
  against white. Secondary text is now `#5F6672`, amber `#96520A`, and borders a
  separate `line` token at `#6690CC` — the lightest brand-family blue that passes, so
  the form reads more defined than before. That is the cost of the rule, not taste.
- **A high-contrast, colour-blind-safe theme**, toggled from the header and remembered
  across visits. An inline script applies it before first paint, so nobody sees a flash
  of the wrong palette. The status trio moves onto the teal/orange axis, which stays
  distinguishable under deuteranopia and protanopia where red and green converge, and
  is separated by lightness as well so hue is never the only cue. Colour was already
  never the only signal — every badge carries its label as text and every error an
  icon — this is belt and braces.

---

## Known limitations

These are deliberate, and each has an obvious upgrade path.

- **Session replays are recorded, unmasked.** Microsoft Clarity runs on the deployed
  site with nothing masked, because a replay that hides what was typed cannot show
  you the bug that was typed into. That is a choice for a demonstration, not for a
  clinic: the form says so where the patient reads it and asks them not to enter
  anything real. Making this deployable for real means restoring `data-clarity-mask`
  on the form, the receipt and the front desk list — the last one matters most,
  since there the names and phone numbers are page text rather than input values,
  and Clarity's own input masking would not cover them. Analytics is behind
  `NEXT_PUBLIC_CLARITY_ID`, so a clone with no id set records nothing.
- **Nothing is persisted** *by the app itself*. Sessions live in memory in each browser tab, and the
  in-progress draft lives in `sessionStorage`, which dies with the tab. Reloading the
  dashboard clears the board, and the CSV can only export what the open dashboard has
  seen. For a form that is entirely PII this is the correct default and less code than
  a database; keeping records across reloads means adding an encrypted store with
  row-level security and a retention policy — and changing the privacy promise the
  form currently makes.
- **The staff sign-in cannot really authenticate anybody.** The three screens are real
  — real validation, a real session, a real sign out — and `/staff` does redirect to
  the sign-in page without one. But there is no backend in this brief, so the
  credential check compares against one sample account and the reset email is never
  sent. The gate enforces the flow; it is not a security boundary, because the page is
  static and the data arrives over a public channel, so anyone determined can still
  read it. Real enforcement means the board's data coming from a server that checked a
  session first. Every screen says as much on the page rather than in the small print,
  and the sample credentials are printed under the tick box so a reviewer is never
  locked out.
- **The whole form travels in every broadcast** (~500 bytes for these fields). Fine at
  this size; a form of hundreds of fields would want field-level patches instead of a
  full snapshot per keystroke.
- **Two languages, hand-maintained.** No translation-management tooling; the parity
  test is what keeps them honest.

---

## Stack

| | |
| --- | --- |
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS 3.4 — palette mapped to semantic tokens in `tailwind.config.js` |
| Type | Anuphan (Thai + Latin) via `next/font` |
| Forms | React Hook Form + Zod |
| i18n | Route segment + typed dictionaries, no library |
| Real-time | Supabase Realtime Presence |
| Tests | `node:test` via `tsx` |

Tailwind is pinned to 3.4 rather than 4.x so the palette lives in
`tailwind.config.js`, as the brief specifies; v4 moves colours into a CSS `@theme`
block. Next.js is on 16.3 because every 15.x release carries a high-severity advisory
patched only in 16.3.
