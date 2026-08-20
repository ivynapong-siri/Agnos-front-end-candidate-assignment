/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Agnos Health palette (sampled from agnos-health.palette.Woblo.png) ---
        brand: {
          DEFAULT: '#1A59C2', // primary — logo mark, wordmark, CTAs
          tint: '#8FB6E8',    // logo back-mark — illustrations, decorative fills
          wash: '#E8EEF9',    // pale blue — surfaces, borders, focus halo
        },
        navy: {
          900: '#001B52',     // headings, staff dashboard chrome
          950: '#081B3A',     // darkest surface
        },
        ink: '#1A202C',       // body copy      — 12.6:1 on paper
        muted: '#9CA3AF',     // borders, placeholders, inactive state
        paper: '#FCFAFA',     // page background
        // --- Added, NOT from the palette ---
        // The palette has no green/amber/red, but encoding validation errors and
        // presence states in blue-and-grey alone fails WCAG 1.4.1 (use of colour).
        // Desaturated so they sit beside the brand blue instead of fighting it.
        // Contrast on #FCFAFA: ok 4.9:1 | warn 4.7:1 | error 5.1:1
        state: { ok: '#0F7B5A', warn: '#B4690E', error: '#C0392B' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto-thai)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 32px -12px rgba(0, 27, 82, 0.18)',
        lift: '0 18px 48px -18px rgba(0, 27, 82, 0.30)',
        ring: '0 0 0 4px rgba(26, 89, 194, 0.12)',
      },
      keyframes: {
        breathe: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.45', transform: 'scale(.82)' } },
        flash: { from: { backgroundColor: '#E8EEF9' }, to: { backgroundColor: 'transparent' } },
        rise: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        breathe: 'breathe 1.8s ease-in-out infinite',
        flash: 'flash 1.4s ease-out',
        rise: 'rise .32s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
