import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

/**
 * WCAG contrast, asserted against the real stylesheet.
 *
 * The palette lives in globals.css, so that is what this reads — a copy of the
 * values here would drift from the ones actually shipped and the test would
 * pass while the page failed. Three genuine AA failures were found this way
 * (secondary text at 2.44:1, the amber status at 4.07:1, control borders at
 * 1.16:1); this keeps them from coming back.
 */

const CSS = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')

const AA_TEXT = 4.5
/** WCAG 1.4.11: the boundary of an interactive component. */
const AA_NON_TEXT = 3

type Rgb = [number, number, number]

function paletteFor(selector: string): Record<string, Rgb> {
  const block = CSS.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`))
  assert.ok(block, `${selector} block exists in globals.css`)
  const palette: Record<string, Rgb> = {}
  for (const [, name, channels] of block[1].matchAll(/--c-([\w-]+):\s*([\d\s]+);/g)) {
    const parts = channels.trim().split(/\s+/).map(Number)
    assert.equal(parts.length, 3, `--c-${name} is three channels, as Tailwind's opacity modifiers need`)
    palette[name] = parts as Rgb
  }
  return palette
}

const DEFAULT_PALETTE = paletteFor(':root')
// A theme only overrides some variables; the rest cascade from :root.
const HIGH_CONTRAST = { ...DEFAULT_PALETTE, ...paletteFor("\\[data-theme='high-contrast'\\]") }
const WHITE: Rgb = [255, 255, 255]

const luminance = ([r, g, b]: Rgb) =>
  [r, g, b]
    .map((channel) => {
      const c = channel / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Tailwind's `/opacity` modifiers composite onto whatever is behind them. */
const over = (fg: Rgb, bg: Rgb, alpha: number): Rgb =>
  fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as Rgb

/* ------------------------------------------------------------------ */

/** [foreground, background, alpha] — alpha 1 unless the app uses a modifier. */
const TEXT_ON: [string, string, number][] = [
  ['ink', 'paper', 1],
  ['ink', 'white', 1],
  ['ink', 'paper', 0.8], // text-ink/80
  ['ink', 'paper', 0.75], // text-ink/75
  ['ink', 'paper', 0.7], // text-ink/70
  ['navy-900', 'paper', 1],
  ['navy-900', 'white', 1],
  ['muted', 'paper', 1],
  ['muted', 'white', 1],
  ['muted', 'brand-wash', 1],
  ['brand', 'white', 1],
  ['brand', 'paper', 1],
  ['brand', 'brand-wash', 1],
  ['ok', 'paper', 1],
  ['warn', 'paper', 1],
  ['error', 'paper', 1],
]

const THEMES = [
  ['default', DEFAULT_PALETTE],
  ['high-contrast', HIGH_CONTRAST],
] as const

function colour(palette: Record<string, Rgb>, name: string): Rgb {
  if (name === 'white') return WHITE
  const value = palette[name]
  assert.ok(value, `--c-${name} is defined`)
  return value
}

for (const [themeName, palette] of THEMES) {
  test(`${themeName}: every text colour clears 4.5:1`, () => {
    for (const [fg, bg, alpha] of TEXT_ON) {
      const background = colour(palette, bg)
      const foreground = alpha === 1 ? colour(palette, fg) : over(colour(palette, fg), background, alpha)
      const r = ratio(foreground, background)
      const label = alpha === 1 ? `${fg} on ${bg}` : `${fg}/${alpha * 100} on ${bg}`
      assert.ok(r >= AA_TEXT, `${label} is ${r.toFixed(2)}:1, needs ${AA_TEXT}`)
    }
  })

  test(`${themeName}: white reads on every filled surface`, () => {
    // Filled buttons, selected options, the active language pill.
    for (const filled of ['brand', 'navy-900', 'navy-950']) {
      const r = ratio(WHITE, colour(palette, filled))
      assert.ok(r >= AA_TEXT, `white on ${filled} is ${r.toFixed(2)}:1`)
    }
  })

  test(`${themeName}: a status colour reads on its own tinted chip`, () => {
    // Badges are `text-state-x` on `bg-state-x/10`, so the pair moves together.
    for (const status of ['ok', 'warn', 'error']) {
      const fg = colour(palette, status)
      const r = ratio(fg, over(fg, WHITE, 0.1))
      assert.ok(r >= AA_TEXT, `${status} on its own 10% tint is ${r.toFixed(2)}:1`)
    }
  })

  test(`${themeName}: control borders clear 3:1`, () => {
    // The box is what identifies a text input, so WCAG 1.4.11 applies to it.
    for (const bg of ['white', 'paper']) {
      const r = ratio(colour(palette, 'line'), colour(palette, bg))
      assert.ok(r >= AA_NON_TEXT, `line on ${bg} is ${r.toFixed(2)}:1, needs ${AA_NON_TEXT}`)
    }
    // Focus and error borders replace it and must hold up too.
    for (const border of ['brand', 'error']) {
      const r = ratio(colour(palette, border), WHITE)
      assert.ok(r >= AA_NON_TEXT, `${border} border is ${r.toFixed(2)}:1`)
    }
  })

  test(`${themeName}: status dots are distinguishable from the surface`, () => {
    // The dot is decorative next to its text label, but it should not vanish.
    for (const status of ['ok', 'warn', 'error', 'muted']) {
      const r = ratio(colour(palette, status), WHITE)
      assert.ok(r >= AA_NON_TEXT, `${status} dot on white is ${r.toFixed(2)}:1`)
    }
  })
}

test('high contrast is actually higher contrast than the default', () => {
  for (const token of ['ink', 'muted', 'brand', 'line']) {
    const base = ratio(colour(DEFAULT_PALETTE, token), WHITE)
    const high = ratio(colour(HIGH_CONTRAST, token), WHITE)
    assert.ok(high > base, `${token}: ${high.toFixed(2)} should beat ${base.toFixed(2)}`)
  }
})

test('the high-contrast status trio separates by lightness, not just hue', () => {
  // Red and green converge under deuteranopia and protanopia. Colour is never
  // the only signal here — every badge carries its label as text — but the
  // palette should still not depend on hue alone.
  const lums = ['ok', 'warn', 'error'].map((s) => luminance(colour(HIGH_CONTRAST, s)))
  const spread = Math.max(...lums) - Math.min(...lums)
  assert.ok(spread > 0.02, `lightness spread is ${spread.toFixed(4)}, too flat to tell apart`)
})
