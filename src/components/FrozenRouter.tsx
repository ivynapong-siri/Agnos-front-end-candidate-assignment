'use client'

import { useContext, useState } from 'react'
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/**
 * Holds an outgoing page still long enough for it to animate away.
 *
 * The App Router gives no handle on the tree it is unmounting: there is no
 * router.events, and `children` is a LayoutRouter that reads the *live* routing
 * context to decide what to render. So the copy AnimatePresence keeps mounted
 * for the exit would immediately re-render as the incoming page — you would
 * watch the new page fade out over itself.
 *
 * Capturing the context in a ref on first render and re-providing that frozen
 * value pins the outgoing subtree to the route it was rendered for.
 *
 * ponytail: this reaches into `next/dist/shared/lib/...`, a Next internal, and
 * that is the known cost of a true crossfade in the App Router — flagged before
 * it was chosen. If a Next upgrade moves or renames LayoutRouterContext this
 * file breaks loudly at build time, and the fallback is the CSS fade-in, which
 * needs no internals at all.
 */
export function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext)
  // useState, not useRef: the initialiser captures the context on the first
  // render and never updates, which is exactly the freeze we want — and unlike
  // reading ref.current during render, it is legal.
  const [frozen] = useState(context)

  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>
}
