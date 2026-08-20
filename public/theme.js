// Applies the stored palette before the page paints, so a high-contrast user
// never sees a flash of the default one.
//
// A separate file rather than an inline script: React 19 does not render a
// script element's text children on the client, so an inline script's code is
// present in the server HTML and absent after hydration — which React reports
// as a text mismatch and hydration fails outright.
try {
  if (localStorage.getItem('agnos.theme') === 'high-contrast') {
    document.documentElement.dataset.theme = 'high-contrast'
  }
} catch {
  // Private browsing can refuse storage; the default palette is a fine fallback.
}
