import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'

/**
 * The app's button, adapted from the supplied glass-button snippet.
 *
 * Three things changed from that snippet, each for a reason:
 *
 *   - Its CSS was never included. Every class it styled itself with
 *     (.glass-button-wrap, .glass-button, .glass-button-shadow) had no
 *     definition anywhere, so it would have rendered as a bare button. The
 *     glass is written here, in globals.css.
 *   - It used `all-unset`, which is not a Tailwind class — Tailwind ships no
 *     `all-*` utilities, so the string was inert and the button kept its UA
 *     styling. The reset is done properly in CSS instead.
 *   - Its bundled `cn()` was a plain join with no tailwind-merge, so a passed
 *     className could not override a base one. Variants are composed here
 *     instead, and callers only add layout classes.
 *
 * The specular highlight sits behind the label, which means it lightens the
 * very background the text is read against. Measured: on the primary tone a
 * highlight above 0.10 drops a white label under 4.5:1. That is why the tones
 * carry different `--glass-spec` values rather than one shared number — see
 * globals.css.
 */

const button = cva('glass-btn', {
  variants: {
    tone: {
      primary: 'glass-tone-primary',
      secondary: 'glass-tone-secondary',
      ghost: 'glass-tone-ghost',
    },
    size: {
      sm: 'min-h-9 px-4 text-sm font-semibold',
      default: 'min-h-12 px-6 text-base font-bold',
      lg: 'min-h-14 px-8 text-lg font-bold',
      icon: 'h-11 w-11',
    },
  },
  defaultVariants: { tone: 'primary', size: 'default' },
})

type GlassButtonProps = VariantProps<typeof button> & {
  className?: string
  children: React.ReactNode
} & (
    | ({ href: string; external?: boolean } & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href' | 'className'>)
    | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  )

/**
 * Renders an anchor when given an href — several of these are links, and a
 * button that navigates should still be a link for the keyboard and for
 * open-in-new-tab.
 */
export function GlassButton({ tone, size, className, children, ...props }: GlassButtonProps) {
  const inner = (
    <>
      <span className="glass-btn-label">{children}</span>
      <span aria-hidden="true" className="glass-btn-shadow" />
    </>
  )

  const classes = `${button({ tone, size })} ${className ?? ''}`

  if (props.href !== undefined) {
    const { href, external, ...rest } = props as { href: string; external?: boolean }
    if (external) {
      return (
        <a href={href} className={classes} {...rest}>
          {inner}
        </a>
      )
    }
    return (
      <Link href={href} className={classes} {...rest}>
        {inner}
      </Link>
    )
  }

  return (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  )
}
