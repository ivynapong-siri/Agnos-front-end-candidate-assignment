import Link from 'next/link'
import { ArtPatient, ArtStaff, ArtSync } from '@/components/Art'

const CHOICES = [
  {
    href: '/patient',
    art: ArtPatient,
    title: "I'm a patient",
    blurb: 'Fill in your details before you see the doctor. Takes about two minutes on a phone.',
    cta: 'Start the form',
  },
  {
    href: '/staff',
    art: ArtStaff,
    title: "I'm staff",
    blurb: 'Watch every form fill in live, and see at a glance who has finished and who needs a hand.',
    cta: 'Open the front desk',
  },
]

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-4 sm:px-6 sm:pt-8">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Patient intake</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
            Paperwork that the front desk can already see.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-ink/80">
            The patient fills in one form on their own phone. Every answer appears on the staff screen as it is typed —
            so nobody re-reads a clipboard, and nobody waits to find out a field was missed.
          </p>
        </div>
        <ArtSync className="w-full max-w-lg justify-self-center" />
      </section>

      <section className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2">
        {CHOICES.map(({ href, art: Art, title, blurb, cta }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-3xl border border-brand-wash bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:p-8"
          >
            <Art className="h-24 w-24" />
            <h2 className="mt-5 text-xl font-bold text-navy-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/75">{blurb}</p>
            <span className="mt-5 inline-flex items-center gap-2 font-semibold text-brand">
              {cta}
              <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </span>
          </Link>
        ))}
      </section>

      <p className="mt-10 text-center text-xs leading-6 text-muted">
        Open both in two windows — or one on a laptop and one on a phone — to see them sync.
      </p>
    </main>
  )
}
