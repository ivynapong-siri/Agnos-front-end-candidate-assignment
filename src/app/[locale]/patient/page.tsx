import type { Metadata } from 'next'
import { IntakeForm } from '@/components/IntakeForm'
import { DEFAULT_LOCALE, getDictionary, isLocale } from '@/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)
  return { title: dict.meta.patientTitle, description: dict.meta.patientDescription }
}

export default async function PatientPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE

  return (
    <main className="page-shell pb-20 pt-6 sm:pt-10">
      {/* Full shell width, so both edges line up with the header rather than
          just the left one. Same container as the staff board, which means the
          two pages now sit on exactly the same grid. */}
      <IntakeForm dict={getDictionary(locale)} locale={locale} />
    </main>
  )
}
