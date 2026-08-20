# Development planning

How this project is put together, and why. Four sections, matching the brief:
project structure, design, component architecture, real-time synchronisation flow.

---

## 1. Project structure

```
agnos-intake/
├── tailwind.config.js         Palette → semantic tokens, plus the type scale.
├── next.config.ts             Redirects bare "/" to the default language.
├── .env.example               The two public Supabase values, documented.
│
├── src/i18n/                  Copy, and only copy.
│   ├── config.ts              Locales, default, self-named language labels.
│   ├── en.ts                  English — and the source of the Dictionary type.
│   ├── th.ts                  Thai, typed as Dictionary.
│   └── index.ts               getDictionary, fill(), plural().
│
├── src/lib/                   Everything that is not a React component.
│   ├── schema.ts              Zod factory + canonical option values.
│   ├── fields.ts              The field manifest. Structure, no copy.
│   ├── realtime.ts            Supabase channel, presence hooks, status rules.
│   ├── export.ts              Excel-safe CSV.
│   ├── schema.test.ts         Validation rules.
│   ├── presence.test.ts       The presence-merge reducer.
│   ├── export.test.ts         CSV escaping, injection, Thai, columns.
│   └── i18n.test.ts           Dictionary parity and completeness.
│
├── src/components/
│   ├── IntakeForm.tsx         The patient form: state, submit, progress, draft.
│   ├── Field.tsx              One control renderer for all seven input shapes.
│   ├── StaffBoard.tsx         The dashboard: subscription, filters, export.
│   ├── SessionCard.tsx        One patient, live.
│   ├── StatusBadge.tsx        The five presence states, as a lookup table.
│   ├── LanguageToggle.tsx     Swaps the first path segment.
│   ├── LiveIndicator.tsx      Connection pill + the missing-credentials notice.
│   ├── Logo.tsx               The Agnos wordmark, inlined.
│   └── Art.tsx                Every illustration and icon.
│
└── src/app/
    ├── globals.css            Tailwind layers, native-control fixes, reduced motion.
    └── [locale]/
        ├── layout.tsx         The root layout. Font, metadata, header, wash.
        ├── page.tsx           Landing: patient or staff.
        ├── patient/page.tsx   Thin shell around IntakeForm.
        └── staff/page.tsx     Thin shell around StaffBoard.
```

### Why it is split this way

**`lib/` holds no JSX.** Validation, the field list, the transport, the status rules
and the CSV writer are all testable without a renderer, which is why `npm test` needs
no DOM, no test framework and no mocking library.

**Three sources of truth, deliberately separate.** `schema.ts` owns *what is valid*,
`fields.ts` owns *how it is laid out*, and `i18n/` owns *what it says*. The
dependencies run one way: `fields.ts` imports the canonical option values from
`schema.ts` so a `<option>` list and the enum it is validated against cannot disagree,
and both read labels from the dictionary. Nothing in `i18n/` knows about fields or
schemas.

**The field manifest is the one abstraction in the project.** Thirteen fields are
consumed three times: as inputs on the patient form, as rows on every staff card, and
as the denominator of the progress bar — now also as CSV columns. Hand-written, that is
thirty-nine declarations that drift apart the first time someone adds a field. As a
manifest holding structure only, adding a field is a data change and adding a language
touches no JSX at all. Nothing else here is abstracted — there is no generic `<Form>`,
no field factory, no config layer.

**There is no `app/layout.tsx`.** `app/[locale]/layout.tsx` *is* the root layout,
because `<html lang>` cannot be written before the language is known. That is also why
the locale is a route segment rather than a client-side toggle: the server renders the
correct language in the first byte of HTML, so there is no flash of the wrong language
and nothing for hydration to disagree about.

**Route files are shells.** Each page resolves `params`, loads a dictionary and renders
one component, so the interesting code is never buried in a route.

---

## 2. Design

### The palette

Nine colours were sampled from the supplied palette image, and `#8FB6E8` was taken
from the logo SVG itself. They map to roles, not names:

| Token | Hex | Role |
| --- | --- | --- |
| `brand` | `#1A59C2` | Primary — logo, CTAs, focus, active states |
| `brand-tint` | `#8FB6E8` | The logo's back-mark — illustrations, decorative fills |
| `brand-wash` | `#E8EEF9` | Surfaces, borders, icon plates, the focus halo |
| `navy-900` | `#001B52` | Headings, dashboard chrome |
| `navy-950` | `#081B3A` | Darkest surface |
| `ink` | `#1A202C` | Body copy — 15.7:1 on paper |
| `muted` | `#5F6672` | Secondary text — 5.6:1. Was `#9CA3AF`, which measured 2.44:1 |
| `line` | `#6690CC` | Control borders — 3.3:1 on white, the WCAG 1.4.11 floor |
| `paper` | `#FCFAFA` | Page background |

**One honest deviation.** The palette contains no green, amber or red. Validation
errors and three distinct presence states cannot be encoded in blue-and-grey alone
without failing WCAG 1.4.1. Three desaturated status colours were added — `ok
#0F7B5A`, `warn #96520A`, `error #C0392B`, each 5.1–5.8:1 on paper — kept under a
separate `state.*` key and commented as an addition in `tailwind.config.js` so nobody
mistakes them for brand colours. They are also never the only signal: every status
carries its label as text, and every error carries an icon and a message.

### Contrast, and the three failures in the supplied palette

Every ratio in this project is computed, and `contrast.test.ts` parses
`globals.css` and recomputes them on every run — a copy of the numbers in a doc
would drift from what ships. Writing that test immediately found three genuine
WCAG AA failures that had been in the design from the start:

| | Was | Measured | Now |
| --- | --- | --- | --- |
| Secondary text | `#9CA3AF` | 2.44:1 | `#5F6672`, 5.6:1 |
| Amber status | `#B4690E` | 4.07:1 | `#96520A`, 5.8:1 |
| Control borders | `#E8EEF9` | 1.16:1 | `line` `#6690CC`, 3.3:1 |

The border one is the interesting case. WCAG 1.4.11 asks for 3:1 on anything
required to identify a component, and the box *is* what identifies a text input.
No blue light enough to keep the original airy look gets there — `#7FA5D8` only
reaches 2.54:1 — so the forms are visibly more defined than they were. That is
the rule's cost, not a preference. `brand-wash` stays light and keeps its job as
a *surface*: a filled panel has no contrast requirement, and a card edge is
decorative because the card is also identified by its background and shadow.

The test also caught a fourth, subtler one after the first fix: `#64748B`
secondary text passed on the page background at 4.58:1 but only reached 4.09:1
on the pale wash behind the dropdown's search box. Hence `#5F6672`.

### The high-contrast theme

Colours resolve through CSS variables holding bare RGB channels —
`--c-brand: 26 89 194` — rather than hex, because that is what lets Tailwind's
opacity modifiers (`bg-brand/20`, `text-ink/80`) keep working against a variable.
`tailwind.config.js` references them as `rgb(var(--c-brand) / <alpha-value>)`.

One extra theme does both jobs the brief asked for. Contrast goes up across the
board, and the status trio moves onto the teal/orange axis, which is the pair
that survives deuteranopia and protanopia — red and green converge, blue and
yellow do not. The three are also separated by lightness, so hue is never the
only cue, and a test asserts that separation rather than trusting the choice.

It is stored in `localStorage` and applied by a small inline script at the top of
`<body>`, because a component cannot run early enough to avoid a flash of the
default palette. The toggle reads the live value with `useSyncExternalStore`
rather than an effect: the state lives on the `<html>` element, outside React,
and that hook takes a separate server snapshot so SSR and hydration agree
without a mismatch to suppress.

None of this is load-bearing for comprehension. Colour was never the only signal
in the app — every status badge carries its label as text, every validation error
an icon and a sentence — so the theme is belt and braces rather than the fix.

### Type, and why the line-heights are unusual

One typeface for both scripts: **Anuphan**, a variable Thai/Latin family. Using a
Thai-first face for the Latin text too means the two share metrics — the alternative,
a Latin face with a Thai fallback, gives you two fonts of visibly different apparent
size sitting in the same paragraph.

The type scale is overridden wholesale rather than adjusted per element:

| Size | Value | Line-height |
| --- | --- | --- |
| `xs` | 13px | 1.6 |
| `sm` | 15px | 1.7 |
| `base` | 17px | 1.75 |
| `lg` | 19px | 1.7 |
| `2xl` | 26px | 1.45 |
| `4xl` | 40px | 1.25 |

Two reasons. Thai stacks a vowel *and* a tone mark above the base glyph — `เ-ื่-อ` is
three levels tall — and Tailwind's stock 1.25–1.5 line-heights make those marks collide
with the line above or clip outright. And the readers here skew elderly, so a larger
base size with more air is the single highest-value accessibility change available.

Setting it on the `fontSize` scale rather than sprinkling `leading-*` utilities matters:
every piece of text inherits it, including text nobody remembered to annotate. The
explicit `leading-*` classes were removed from the components once the scale carried
them, which also shortened the markup.

### Illustrative direction

The brief asked for an illustrative UI. Rather than pull in an illustration set, every
graphic is built from the logo's own geometry — a square rotated 45° with rounded
corners, which is exactly the shape in `agnos-health.svg`. That one `<Mark>` primitive
appears in the hero, the landing cards, the empty state and the confirmation screen, so
the artwork is recognisably the same family as the logo without anyone drawing a second
style.

Everything else is restraint: `rounded-3xl` cards on a `paper` ground, a single soft
shadow (`0 8px 32px -12px rgba(0,27,82,.18)`) with a lifted variant on hover, two
blurred CSS circles for the background wash, and generous whitespace between the three
sections. Movement is limited to a breathing dot on live indicators, a 1.4 s flash on
changed fields, and a short rise on entry — and `prefers-reduced-motion` switches all
of it off, because none of it carries meaning.

### Responsive behaviour

**Patient form.** Single column on mobile, always — the brief's IxDF reference is
explicit about single-column forms, and the phone is the screen that matters for a
patient in a waiting room. On `sm` and up the section body becomes a six-column grid,
and pairing is used *only* where two inputs read as one question:

| Row | Spans |
| --- | --- |
| First / middle / last name | 2 + 2 + 2 |
| Date of birth / gender | 3 + 3 |
| Phone / email | 3 + 3 |
| Address | 6 |
| Preferred language / nationality | 3 + 3 |
| Religion | 6 |
| Emergency contact name / relationship | 3 + 3 |

Helper text sits *below* the control rather than above it. Above, a hint on one half of
a pair pushes its input down and the two visibly stop lining up — this was a real bug,
caught by measuring the rendered rows. Below, every control in a row starts at the same
height whatever the hints say. `aria-describedby` is unaffected by visual order.

The progress bar and connection status are sticky to the top of the form, bleeding to
the container edge with a negative margin so they read as a bar rather than a floating
card.

**Staff dashboard.** A single column at every width, with the page capped at
`max-w-4xl`. A multi-column grid was tried first and read badly: thirteen field rows
per card makes each one tall, and two or three tall cards side by side leaves the eye
with nowhere to start. Cards rather than a table: a thirteen-column table is unreadable on a phone and forces a horizontal
scroll, while a card degrades to a stack for free. Inside each card the field list is a
native `<details open>`, so staff can collapse patients they are not dealing with on a
small screen without a line of state management. Field rows stack label-over-value on
mobile and go label-beside-value at `sm`.

The header wraps rather than truncates: title, connection pill, export button and the
open-a-patient-form link reflow onto separate lines on a narrow screen, and the filter
chips wrap beneath.

**Touch.** Every interactive control clears 44 px. The two that did not — the language
links and the filter chips — were caught by measuring them, and needed
`inline-flex` before `min-h-11` had any effect on an inline element.

### Form design decisions, against the IxDF guidance

| Guidance | What was done |
| --- | --- |
| Single-column layout | Single column throughout on mobile; only genuine pairs share a desktop row |
| Group related fields | Three titled, illustrated sections |
| Arrange questions wisely | Name first, sensitive last — religion and emergency contact are in section 3 |
| Clear labels and instructions | Real `<label>` on every control, never a placeholder as a label; format hints where the format is not obvious |
| Inline validation | `mode: 'onTouched'` — first check on blur, live afterwards, so nobody is corrected halfway through typing their own name |
| Autofill | An `autoComplete` token on every field, from `given-name` to `street-address` |
| Simplify input methods | Native date input, native `<datalist>` for nationality, selects for closed sets |
| Progress indicators | Sticky bar counting answered required fields |
| Clear CTA | "Submit my information" — a verb and an object, not "Submit" |
| Feedback on submission | A receipt with a reference code and what happens next |
| Communicate privacy | The privacy line sits immediately above the submit button, where the decision is made |
| Whitespace and contrast | Measured, and asserted in a test: 15.7:1 body copy, 4.5:1 minimum on text, 3:1 on control borders |
| Touch-friendly inputs | 44 px minimum, measured |

Marking is inverted from the common default: **optional fields are labelled, required
ones are not.** On a form where nine of thirteen answers are required, a wall of
asterisks tells the patient nothing.

Deliberately skipped: a multi-step wizard (thirteen fields does not warrant one — the
progress bar covers the intent), CAPTCHA, voice input, and gamification.

### Bilingual design

**The language is in the URL.** `/th/patient`, `/en/staff`. This costs a route
restructure and buys four things a client-side toggle cannot: correct language in the
server-rendered HTML, a correct `<html lang>` for screen readers, a shareable link in a
chosen language, and no hydration mismatch. Thai is the default; `/` redirects to
`/th`.

**Stored values stay English.** A patient who picks `ชาย` has `gender: "Male"` in
state. The dictionary supplies the label. Without that split, switching language
mid-form would leave every chosen answer failing validation against the new language's
option list.

**Switching language keeps what was typed.** A locale change is a real navigation, so
the form remounts and React state is gone. Values are mirrored into a `sessionStorage`
draft on the same debounce that feeds the sync, and read back in the form's
`defaultValues`. It also covers an accidental refresh. The draft is filtered on read to
known field names with string values, so a hand-edited entry cannot inject keys into
the form, and it is cleared on submit — same lifetime as the tab, which is what the
privacy note promises.

**Translation completeness is a test, not a habit.** `th.ts` is typed as
`Dictionary = typeof en`, so a missing key fails the build. `i18n.test.ts` covers what
the type cannot: identical key sets in both directions, no string left as an empty
stub, every `{token}` in a template being one a caller actually fills, and every
selectable option having a label in both languages — plus the reverse, catching labels
left behind for values that no longer exist.

There is no i18n library. With two languages, no date or currency formatting to do and
one plural rule, `fill()` is four lines and `plural()` is two.

---

## 3. Component architecture

### Patient side

**`IntakeForm`** — owns the form. Builds the Zod schema per language (memoised on the
dictionary, because every message the patient reads has to be in theirs), holds the
session id and the submitted receipt, and renders the three sections from the manifest.
On submit it publishes presence directly rather than waiting on the debounce, because
the component that owns the debounce unmounts on the very next render.

**`LiveMirror`** — the only component subscribed to every field. Keeping the
`useWatch` here means a keystroke re-renders thirty lines instead of the whole form
tree, and it puts the progress bar, the outbound sync and the draft on one
subscription: all three want exactly "the current values", so they share it.

**`Field`** — renders all seven input shapes from a manifest entry plus a dictionary
entry, and is the single place the accessibility contract can be enforced: a real
`<label for>`, `aria-invalid`, `aria-describedby` wiring hint and error, `role="alert"`
on the message, a green tick on a valid touched field.

**`ErrorSummary`** — silent until `submitCount > 0`, then lists the failing fields as
buttons that move focus. Ordered by the manifest, not by the error object's key order,
so the list matches the form.

**`ThankYou`** — the receipt. Renders only the answered fields, so a blank middle name
does not appear as an empty row, and translates option values for display.

### Staff side

**`StaffBoard`** — subscribes, ticks a one-second clock, derives each session's status,
lays out the grid, and exports. The status counters are also the filter control, and the
export button exports whatever that filter is showing — so "submitted only" needs no
second control.

**`SessionCard`** — one patient. Entirely derived, with no state and no timer of its
own: the changed-field list arrives with the update, and the board's clock is what
makes the highlight expire.

**`StatusBadge`** — the five states as a lookup table of styles, with labels and
threshold tooltips coming from the dictionary and the thresholds interpolated from the
constants so the copy cannot drift. Adding a state is a table row.

### Shared

**`LanguageToggle`** — swaps the first path segment and keeps the rest, so the visitor
stays on the page they were reading. Plain links, not a router push: the URL *is* the
language, so the choice should be shareable, bookmarkable and reachable with the back
button.

**`LiveIndicator`** / **`SetupNotice`** — connection state, and the explanation shown
when credentials are missing so a keyless checkout is never a silently dead page.

**`Logo`** — the supplied SVG inlined. The source file shipped with
`classname="{className}"`, a lowercase typo React would render as a literal attribute;
fixed here.

**`Art`** — every illustration and icon, all built on the shared `Mark` primitive.

### What was deliberately not built

No design-system package, no `<Button>` or `<Card>` wrapper used once, no state
management library, no context beyond React Hook Form's own `FormProvider`, no i18n
runtime, no CSV library, no API routes, and no server. The app is nine prerendered
routes and one WebSocket.

---

## 4. Real-time synchronisation flow

### The transport choice

The brief allows "WebSockets or any suitable real-time technology", and asks for a
front-end cloud deployment. Vercel cannot host a long-lived WebSocket server, so the
socket has to be someone else's. Of the managed options:

- **Pusher / Ably** — clients cannot publish to a public channel, so every keystroke
  batch would have to pass through a serverless function holding a secret. More code
  and a slower path.
- **Supabase Realtime** — the browser publishes directly with the anon key. No server
  code at all, and it is a real WebSocket (`wss://…/realtime/v1/websocket`), so it
  satisfies the brief even read strictly.

Within Supabase there was a second choice, **Broadcast vs Presence**, and Presence
wins because it already solves three problems Broadcast would leave for us:

| Requirement | Broadcast | Presence |
| --- | --- | --- |
| Staff opening the board mid-form sees existing answers | hand-write a snapshot request/response | free, in the first `sync` |
| Patient closes the tab | hand-write a heartbeat and a timeout | free, the entry disappears |
| Where the current state lives | a reducer over a message stream | the payload *is* the state |

Presence is a shared key-value map that syncs to every subscriber and cleans up on
disconnect. That is the requirement, almost word for word.

### The flow

```
PATIENT TAB                                          STAFF TAB
───────────                                          ─────────
keystroke
   │
   ▼
useWatch (RHF)  ── all 13 values
   │
   ├──▶ sessionStorage draft   (survives a language switch or refresh)
   │
   ▼
250 ms trailing debounce            ~4 msg/s, cap is 10
   │
   ▼
channel.track({ sessionId, data,
                submitted, filled,
                total, startedAt })
   │
   └──────────▶ Supabase Realtime ──────────▶ presence 'sync'
                'agnos-intake-v1'                     │
                                                      ▼
                                             mergePresence(seen, state, now)
                                                      │
                                        ┌─────────────┴──────────────┐
                                        │ diff vs previous → changed │
                                        │ dirty? → stamp lastChangeAt│
                                        │ absent? → online = false   │
                                        │ never delete a row         │
                                        └─────────────┬──────────────┘
                                                      ▼
                                             1 s tick → deriveStatus()
                                                      │
                                                      ▼
                                          SessionCard × N  ·  CSV export
```

**Identity.** Each patient tab generates a `crypto.randomUUID()` and keeps it in
`sessionStorage`, used as the presence key. `sessionStorage` rather than
`localStorage`: a refresh keeps the same identity so staff never sees a duplicate
appear, while a second tab is genuinely a second patient. The first eight characters,
uppercased, become the patient-facing reference code and the CSV's reference column.

**Debounce.** A 250 ms trailing debounce on the patient side. Imperceptible to staff,
and it holds the channel at roughly four messages a second against Supabase's cap of
ten. No separate immediate-on-blur path — at 250 ms it would not be visible.

**Reconnection.** The last payload is held in a ref and re-published on `SUBSCRIBED`,
so a dropped connection never leaves staff looking at a stale form.

**Status, and why it is derived on the staff side.** The first design had the patient
publish its own status on a timer. That was deleted: a backgrounded tab has its timers
throttled to about once a minute, so a patient who switched apps would report the wrong
status. Instead the dashboard stamps `lastChangeAt` on *its own clock* the moment an
update arrives, and derives the status from it against a one-second tick:

| Since last change | Status |
| --- | --- |
| < 10 s | Actively filling |
| 10–60 s | Paused |
| > 60 s | Inactive |
| absent from presence | Left the form |
| `submitted: true` | Submitted — terminal, outranks all of the above |

This removed the patient-side timer entirely, and it is immune to clock skew: no
comparison is ever made between two machines' clocks.

**Change highlighting.** The diff between old and new values happens once per update
inside `mergePresence`, not inside each card — this is the one place the new data meets
the old. The resulting field list rides along on the session, and cards highlight it
while `now - lastChangeAt < 1400`. One subtlety worth naming: presence `sync` fires
whenever *anyone* on the channel changes, so a session that did not change must keep
its own `changed` list and timestamp, or one patient typing would wipe another
patient's pending highlight. There is a regression test for exactly that.

**Leaving, and the one thing that outlives it.** An earlier version never pruned: every
session ever seen stayed on the board. That was wrong in practice — a patient who closed
the tab left a card that only a refresh would clear. Now a session absent from presence
is stamped `leavingAt` rather than deleted, so the card can animate out, and
`pruneDeparted` drops it once the 320 ms exit has run. One timer for the whole board,
not one per card.

A patient who *submitted* and then closed the tab is the exception and stays. That row
is the completed intake — the thing staff most needs to keep — and its badge reads
"submitted", so it presents as a record rather than a stale live session. Deleting a
completed submission to tidy the board would be the worse bug.

Two details make the removal prompt rather than eventual. `untrack()` is called before
unsubscribing, because `removeChannel` alone only unsubscribes this client and leaves
the server to work out that the presence entry is stale. And a `pagehide` listener
untracks too, because a tab closed outright runs no React cleanup at all.

**Departing is animated, not abrupt.** The card sits in a wrapper that transitions
`grid-template-rows` from `1fr` to `0fr` alongside opacity and a slight scale, all
`ease-in-out` over 320 ms, so the list closes up instead of snapping. The container
carries no gap — the spacing lives inside each collapsing wrapper, so a departing card
takes its own gap with it rather than leaving a hole behind while it animates. Entry
uses the same easing via a keyframe, because a transition cannot run on mount.

**Unnamed sessions are not shown.** Somebody who opened the page and typed nothing
identifying is not a patient yet, and an unnamed card is pure noise on a triage board.
Filtered once at the source in `StaffBoard`, so the count, the filter chips, the cards
and the CSV export cannot disagree about who is on the board.

**Rooms.** Everyone on a deployment shares one channel by default, which is right for
one clinic's front desk and wrong for a public demo link — two strangers trying it
would watch each other type their name in. `?room=<name>` on either page opts into a
private channel. The room comes from the URL, so it is untrusted input: stripped to word
characters and capped before it becomes a channel name. It is then remembered for the
tab, which means in-app navigation keeps it and no component needs `useSearchParams` —
a hook that cannot be prerendered, and which broke the build when it was tried.

**Staff never publishes.** It subscribes without calling `track()`, so it observes
presence without appearing in it. No role flag, no filtering. Any entry without a
`sessionId` is ignored regardless, so a stray subscriber cannot corrupt the board.

### Testing the part that cannot be clicked

`mergePresence` is a pure function — `(previousMap, presenceSnapshot, now) → nextMap` —
exported specifically so the core of the dashboard can be tested without live
credentials or a network. `presence.test.ts` covers first sighting, a field edit, a
no-op sync not resetting the clock, one patient not clobbering another's highlight,
departure being stamped once rather than refreshed by every later sync, the row being
pruned only after its exit animation, a returning patient not being pruned mid-form, a
submission surviving both tab close and the sweep, submission counting as activity,
non-patient entries being ignored, a rejoin reusing its own row, and the room name
being sanitised.

Alongside it: `schema.test.ts` for the validation rules, `export.test.ts` for CSV
escaping, formula injection, the BOM and the localised columns, and `i18n.test.ts` for
dictionary parity. `pickers.test.ts` covers the date grid and the phone rules, and
`contrast.test.ts` parses `globals.css` and recomputes every WCAG ratio, so a palette
edit that breaks AA fails the build rather than shipping. Sixty-nine tests on
`node:test` through `tsx` — no framework, no
fixtures, no mocks.
