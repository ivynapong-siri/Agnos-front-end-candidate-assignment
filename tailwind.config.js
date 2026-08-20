/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Colours resolve through CSS variables so a theme can be swapped at
      // runtime. The variables hold bare RGB channels rather than hex, which is
      // what lets Tailwind's opacity modifiers (bg-brand/20, text-ink/80) keep
      // working — see globals.css for the palettes and their measured ratios.
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)',
          tint: 'rgb(var(--c-brand-tint) / <alpha-value>)',
          wash: 'rgb(var(--c-brand-wash) / <alpha-value>)',
        },
        // The boundary of an interactive control, which WCAG 1.4.11 requires to
        // reach 3:1. Kept separate from brand-wash, which stays light because a
        // surface has no contrast requirement and a card edge is decorative.
        line: 'rgb(var(--c-line) / <alpha-value>)',
        navy: {
          900: 'rgb(var(--c-navy-900) / <alpha-value>)',
          950: 'rgb(var(--c-navy-950) / <alpha-value>)',
        },
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        state: {
          ok: 'rgb(var(--c-ok) / <alpha-value>)',
          warn: 'rgb(var(--c-warn) / <alpha-value>)',
          error: 'rgb(var(--c-error) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-anuphan)', 'system-ui', 'sans-serif'],
      },
      // Larger than Tailwind's defaults, with unitless line-heights well above
      // them. Thai stacks a vowel and a tone mark above the base glyph, and at
      // Tailwind's stock 1.25-1.5 those marks collide or clip. 1.75 on body copy
      // clears them, and the extra size and air help elderly readers in both
      // languages. Set here rather than as leading-* utilities so every piece of
      // text gets it, including text nobody remembered to annotate.
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.6' }],
        sm: ['0.9375rem', { lineHeight: '1.7' }],
        base: ['1.0625rem', { lineHeight: '1.75' }],
        lg: ['1.1875rem', { lineHeight: '1.7' }],
        xl: ['1.375rem', { lineHeight: '1.55' }],
        '2xl': ['1.625rem', { lineHeight: '1.45' }],
        '3xl': ['2rem', { lineHeight: '1.35' }],
        '4xl': ['2.5rem', { lineHeight: '1.25' }],
      },
      boxShadow: {
        card: '0 8px 32px -12px rgba(0, 27, 82, 0.18)',
        lift: '0 18px 48px -18px rgba(0, 27, 82, 0.30)',
        ring: '0 0 0 4px rgba(26, 89, 194, 0.12)',
      },
      keyframes: {
        breathe: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.45', transform: 'scale(.82)' } },
        flash: { from: { backgroundColor: 'rgb(var(--c-brand-wash))' }, to: { backgroundColor: 'transparent' } },
        rise: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        breathe: 'breathe 1.8s ease-in-out infinite',
        flash: 'flash 1.4s ease-out',
        rise: 'rise .32s ease-in-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
